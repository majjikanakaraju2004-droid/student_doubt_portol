"""Centralized semantic similarity engine for doubts and knowledge base."""

from django.conf import settings
from sentence_transformers import SentenceTransformer, util

_model = None


def get_embedding_model():
    global _model
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def similarity_threshold():
    return float(getattr(settings, 'AI_SIMILARITY_THRESHOLD', 0.6))


def encode_text(text):
    model = get_embedding_model()
    return model.encode(text or '', convert_to_tensor=True)


def encode_batch(texts):
    model = get_embedding_model()
    return model.encode(list(texts), convert_to_tensor=True)


def embedding_to_list(tensor):
    return tensor.cpu().tolist()


def find_best_match(query_text, candidates):
    """
    candidates: list of dicts with keys question, answer, id, embedding (optional list)
  Returns match dict or None.
    """
    if not candidates:
        return None

    query_embedding = encode_text(query_text)
    questions = [c['question'] for c in candidates]
    corpus_embeddings = encode_batch(questions)

    scores = util.cos_sim(query_embedding, corpus_embeddings)[0]
    best_idx = int(scores.argmax().item())
    best_score = float(scores[best_idx].item())

    if best_score < similarity_threshold():
        return None

    match = candidates[best_idx]
    return {
        'id': match.get('id'),
        'question': match['question'],
        'answer': match.get('answer', ''),
        'score': best_score,
        'subject': match.get('subject'),
        'topic': match.get('topic'),
    }


def search_ranked(query_text, candidates, min_score=0.2):
    """Return candidates sorted by relevance score."""
    if not query_text or not query_text.strip() or not candidates:
        return [(1.0, c) for c in candidates]

    query_embedding = encode_text(query_text)
    questions = [c['question'] for c in candidates]
    corpus_embeddings = encode_batch(questions)
    scores = util.cos_sim(query_embedding, corpus_embeddings)[0]

    ranked = []
    for idx, score in enumerate(scores):
        s = float(score.item())
        if s >= min_score:
            ranked.append((s, candidates[idx]))

    ranked.sort(key=lambda x: x[0], reverse=True)
    return ranked

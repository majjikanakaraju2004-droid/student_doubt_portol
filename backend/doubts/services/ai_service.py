"""Centralized semantic similarity engine for doubts and knowledge base."""

import os
import re
import math
from difflib import SequenceMatcher
from django.conf import settings

# Detect if we should use lightweight pure-Python matching (enabled by default to prevent OOM on Render)
USE_LIGHTWEIGHT = os.getenv('USE_LIGHTWEIGHT_AI', 'True').lower() in ('true', '1', 'yes')

if not USE_LIGHTWEIGHT:
    try:
        from sentence_transformers import SentenceTransformer, util
        _model = None
    except ImportError:
        USE_LIGHTWEIGHT = True

def get_embedding_model():
    global _model
    if USE_LIGHTWEIGHT:
        return None
    if _model is None:
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def similarity_threshold():
    # A slightly lower threshold for the hybrid Python parser works best
    default_thresh = 0.45 if USE_LIGHTWEIGHT else 0.6
    return float(getattr(settings, 'AI_SIMILARITY_THRESHOLD', default_thresh))

def encode_text(text):
    if USE_LIGHTWEIGHT:
        return None
    model = get_embedding_model()
    return model.encode(text or '', convert_to_tensor=True)

def encode_batch(texts):
    if USE_LIGHTWEIGHT:
        return None
    model = get_embedding_model()
    return model.encode(list(texts), convert_to_tensor=True)

def embedding_to_list(tensor):
    if USE_LIGHTWEIGHT or tensor is None:
        return []
    return tensor.cpu().tolist()

def clean_and_tokenize(text):
    text = (text or '').lower()
    text = re.sub(r'[^\w\s]', '', text)
    return [w for w in text.split() if w]

def calculate_similarity(text1, text2):
    tokens1 = clean_and_tokenize(text1)
    tokens2 = clean_and_tokenize(text2)
    if not tokens1 or not tokens2:
        return 0.0
    
    # 1. Cosine similarity of term frequencies
    all_tokens = set(tokens1 + tokens2)
    vector1 = [tokens1.count(t) for t in all_tokens]
    vector2 = [tokens2.count(t) for t in all_tokens]
    
    dot_product = sum(v1 * v2 for v1, v2 in zip(vector1, vector2))
    magnitude1 = math.sqrt(sum(v ** 2 for v in vector1))
    magnitude2 = math.sqrt(sum(v ** 2 for v in vector2))
    
    if not magnitude1 or not magnitude2:
        cosine_sim = 0.0
    else:
        cosine_sim = dot_product / (magnitude1 * magnitude2)
    
    # 2. SequenceMatcher ratio (character-level matching)
    seq_ratio = SequenceMatcher(None, text1.lower(), text2.lower()).ratio()
    
    # Hybrid score (combination of semantic word-overlap and character-level likeness)
    return 0.7 * cosine_sim + 0.3 * seq_ratio

def find_best_match(query_text, candidates):
    """
    candidates: list of dicts with keys question, answer, id, embedding (optional list)
    Returns match dict or None.
    """
    if not candidates:
        return None

    if USE_LIGHTWEIGHT:
        best_match = None
        best_score = -1.0
        for c in candidates:
            score = calculate_similarity(query_text, c['question'])
            if score > best_score:
                best_score = score
                best_match = c
        
        if best_score < similarity_threshold():
            return None
            
        return {
            'id': best_match.get('id'),
            'question': best_match['question'],
            'answer': best_match.get('answer', ''),
            'score': best_score,
            'subject': best_match.get('subject'),
            'topic': best_match.get('topic'),
        }

    # SentenceTransformers fallback
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

    if USE_LIGHTWEIGHT:
        ranked = []
        for c in candidates:
            score = calculate_similarity(query_text, c['question'])
            if score >= min_score:
                ranked.append((score, c))
        ranked.sort(key=lambda x: x[0], reverse=True)
        return ranked

    # SentenceTransformers fallback
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

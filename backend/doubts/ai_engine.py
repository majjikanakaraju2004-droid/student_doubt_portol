"""Backward-compatible wrapper — use doubts.services.ai_service instead."""

from doubts.services.ai_service import find_best_match, similarity_threshold


def find_similar_doubt(new_question):
    from doubts.models import Doubt

    resolved = Doubt.objects.filter(status='solved')
    candidates = [
        {
            'id': d.id,
            'question': d.question,
            'answer': d.answer or '',
        }
        for d in resolved
    ]
    match = find_best_match(new_question, candidates)
    if not match:
        return None
    return {
        'question': match['question'],
        'answer': match['answer'],
        'score': match['score'],
    }

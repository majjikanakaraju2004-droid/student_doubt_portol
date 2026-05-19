from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Count, Q
from django.utils import timezone
import threading

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from notifications.models import Notification
from responses.models import Response as DoubtResponse
from users.models import User

from .models import Doubt
from .permissions import IsTeacherOrAdmin
from .serializers import DoubtSerializer
from .services.ai_service import (
    embedding_to_list,
    encode_text,
    find_best_match,
    search_ranked,
)
from .services.sla_service import compute_sla_deadline, refresh_sla_flags, sla_summary

RESOLVED_STATUSES = ('solved', 'answered')


def resolved_doubts_queryset():
    return Doubt.objects.filter(status__in=RESOLVED_STATUSES)


def generate_tags(subject, topic, question, answer=''):
    words = []
    for part in (subject, topic, question, answer):
        words.extend((part or '').lower().split())
    unique = list({w for w in words if len(w) > 3})
    return unique[:12]


def doubt_to_candidate(doubt):
    return {
        'id': doubt.id,
        'question': doubt.question,
        'answer': doubt.answer or '',
        'subject': doubt.subject,
        'topic': doubt.topic,
    }


def serialize_kb_entry(doubt, request, score=None):
    data = {
        'id': doubt.id,
        'subject': doubt.subject,
        'topic': doubt.topic,
        'question': doubt.question,
        'answer': doubt.answer,
        'tags': doubt.tags,
        'resolved_at': doubt.resolved_at,
    }
    if score is not None:
        data['relevance_score'] = round(score, 4)
    if doubt.answer_attachment:
        try:
            data['answer_attachment'] = (
                request.build_absolute_uri(doubt.answer_attachment.url)
                if request else doubt.answer_attachment.url
            )
        except Exception:
            data['answer_attachment'] = doubt.answer_attachment.url
    return data


def notify_teachers_for_doubt(doubt):
    subject_lower = doubt.subject.lower()
    teachers = User.objects.filter(role='teacher', account_status='Active')

    def teacher_matches_subject(teacher):
        expertise = (teacher.subject_expertise or '').lower()
        if not expertise:
            return False
        expertise_keywords = [k.strip() for k in expertise.replace(',', ' ').split() if k.strip()]
        return any(
            kw in subject_lower or subject_lower in kw
            for kw in expertise_keywords
        ) or any(
            ek in subject_lower or subject_lower in ek
            for ek in expertise_keywords
        )

    matched = [t for t in teachers if teacher_matches_subject(t)]
    recipients = matched if matched else list(teachers)

    for teacher in recipients:
        Notification.objects.create(
            user=teacher,
            title='New doubt requires attention',
            message=f'[{doubt.subject}] {doubt.topic}: {doubt.question[:120]}…',
        )
        email = teacher.contact_email or teacher.email
        if email and settings.EMAIL_HOST_USER:
            def send_teacher_email(to_email):
                try:
                    send_mail(
                        'New Student Doubt — Synycs',
                        f'Subject: {doubt.subject}\nTopic: {doubt.topic}\n\n{doubt.question}',
                        settings.DEFAULT_FROM_EMAIL,
                        [to_email],
                        fail_silently=True,
                    )
                except Exception as e:
                    print(f"Failed to send email to teacher: {e}")
            threading.Thread(target=send_teacher_email, args=(email,)).start()


def doubts_queryset_for_user(user):
    refresh_sla_flags()
    qs = Doubt.objects.select_related('student', 'answered_by')

    if user.is_staff:
        return qs
    if user.role == 'student':
        return qs.filter(student=user)
    if user.role == 'teacher':
        # Faculty see the full doubt feed; subject_expertise is used for notifications only.
        return qs
    return qs.none()


class DoubtListCreateView(generics.ListCreateAPIView):
    serializer_class = DoubtSerializer

    def get_queryset(self):
        qs = doubts_queryset_for_user(self.request.user)
        status_filter = self.request.query_params.get('status')
        subject_filter = self.request.query_params.get('subject')
        if status_filter:
            qs = qs.filter(status=status_filter)
        if subject_filter:
            qs = qs.filter(subject__icontains=subject_filter)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        subject = self.request.data.get('subject', '')
        topic = self.request.data.get('topic', '')
        question = self.request.data.get('question', '')
        priority = self.request.data.get('priority', 'medium')

        if user.role == 'student':
            student = user
        elif user.is_staff:
            student_id = self.request.data.get('student')
            if not student_id:
                raise PermissionDenied('Admin must specify student id.')
            student = User.objects.get(pk=student_id, role='student')
        else:
            raise PermissionDenied('Only students can submit doubts.')
        tags = generate_tags(subject, topic, question)
        sla_deadline = compute_sla_deadline()

        doubt = serializer.save(
            student=student,
            tags=tags,
            priority=priority,
            sla_deadline=sla_deadline,
        )
        notify_teachers_for_doubt(doubt)


class DoubtDetailView(generics.RetrieveUpdateAPIView):
    serializer_class = DoubtSerializer

    def get_queryset(self):
        return doubts_queryset_for_user(self.request.user)


@api_view(['POST'])
@permission_classes([IsTeacherOrAdmin])
def submit_answer(request, pk):
    try:
        doubt = doubts_queryset_for_user(request.user).get(pk=pk)
    except Doubt.DoesNotExist:
        return Response({'error': 'Doubt not found'}, status=status.HTTP_404_NOT_FOUND)

    answer = request.data.get('answer', '').strip()
    if not answer:
        return Response({'error': 'Answer is required'}, status=status.HTTP_400_BAD_REQUEST)

    answer_attachment = request.FILES.get('answer_attachment')
    now = timezone.now()

    doubt.answer = answer
    doubt.status = 'solved'
    doubt.resolved_at = now
    doubt.answered_by = request.user
    doubt.tags = generate_tags(doubt.subject, doubt.topic, doubt.question, answer)
    doubt.question_embedding = embedding_to_list(encode_text(doubt.question))
    doubt.is_overdue = False

    if answer_attachment:
        doubt.answer_attachment = answer_attachment

    doubt.save()

    DoubtResponse.objects.update_or_create(
        doubt=doubt,
        teacher=request.user,
        defaults={'answer': answer},
    )

    student_user = doubt.student
    Notification.objects.create(
        user=student_user,
        title='Your doubt has been resolved',
        message=f'[{doubt.subject}] {doubt.topic} — view the answer in your dashboard.',
    )
    email = student_user.contact_email or student_user.email
    if email and settings.EMAIL_HOST_USER:
        def send_notification_email():
            try:
                send_mail(
                    'Doubt Resolved — Synycs',
                    f'Hello {student_user.full_name or student_user.username},\n\n'
                    f'Your doubt on "{doubt.topic}" has been answered.\n\n{answer}',
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=True,
                )
            except Exception as e:
                print(f"Failed to send email: {e}")
                
        threading.Thread(target=send_notification_email).start()

    return Response({
        'message': 'Answer submitted successfully',
        'doubt': DoubtSerializer(doubt, context={'request': request}).data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_similarity(request):
    question = request.data.get('question', '').strip()
    if len(question) < 10:
        return Response({'similar_found': False})

    try:
        resolved = resolved_doubts_queryset()
        candidates = [doubt_to_candidate(d) for d in resolved]
        match = find_best_match(question, candidates)
    except Exception as exc:
        return Response(
            {'similar_found': False, 'error': 'Semantic search temporarily unavailable.'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    if not match:
        return Response({'similar_found': False})

    return Response({
        'similar_found': True,
        'matched_question': match['question'],
        'matched_answer': match['answer'],
        'matched_subject': match.get('subject'),
        'matched_topic': match.get('topic'),
        'similarity_score': match['score'],
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def knowledge_base(request):
    query = request.GET.get('query', '').strip()
    subject = request.GET.get('subject', '').strip()
    topic = request.GET.get('topic', '').strip()

    doubts = resolved_doubts_queryset().select_related('answered_by')

    if subject:
        doubts = doubts.filter(subject__icontains=subject)
    if topic:
        doubts = doubts.filter(topic__icontains=topic)

    doubt_list = list(doubts)
    candidates = [doubt_to_candidate(d) for d in doubt_list]

    try:
        if query:
            ranked = search_ranked(query, candidates)
            by_id = {d.id: d for d in doubt_list}
            data = [
                serialize_kb_entry(by_id[c['id']], request, score)
                for score, c in ranked
                if c['id'] in by_id
            ]
        else:
            data = [serialize_kb_entry(d, request) for d in doubt_list]
    except Exception:
        if query:
            doubts = doubts.filter(
                Q(question__icontains=query)
                | Q(answer__icontains=query)
                | Q(topic__icontains=query)
                | Q(subject__icontains=query)
            )
            data = [serialize_kb_entry(d, request) for d in doubts]
        else:
            data = [serialize_kb_entry(d, request) for d in doubt_list]

    return Response(data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def knowledge_base_browse(request):
    """Hierarchical browse: subjects → topics → count of resolved entries."""
    rows = (
        resolved_doubts_queryset()
        .values('subject', 'topic')
        .annotate(count=Count('id'))
        .order_by('subject', 'topic')
    )

    tree = {}
    for row in rows:
        subj = row['subject']
        tree.setdefault(subj, {'topics': [], 'total': 0})
        tree[subj]['topics'].append({
            'topic': row['topic'],
            'count': row['count'],
        })
        tree[subj]['total'] += row['count']

    return Response({
        'subjects': [
            {
                'subject': name,
                'total': meta['total'],
                'topics': meta['topics'],
            }
            for name, meta in sorted(tree.items())
        ]
    })


@api_view(['GET'])
@permission_classes([IsTeacherOrAdmin])
def teacher_analytics(request):
    refresh_sla_flags()
    qs = doubts_queryset_for_user(request.user)

    pending_count = qs.filter(status='pending').count()
    resolved_count = qs.filter(status__in=RESOLVED_STATUSES).count()
    overdue_count = qs.filter(status='pending', is_overdue=True).count()

    avg_minutes = 0
    resolved_with_time = qs.filter(status='solved', resolved_at__isnull=False)
    if resolved_with_time.exists():
        durations = []
        for d in resolved_with_time:
            durations.append((d.resolved_at - d.created_at).total_seconds() / 60)
        avg_minutes = round(sum(durations) / len(durations), 1)

    common_topics = list(
        qs.values('topic')
        .annotate(count=Count('topic'))
        .order_by('-count')[:8]
    )

    common_subjects = list(
        qs.values('subject')
        .annotate(count=Count('subject'))
        .order_by('-count')[:8]
    )

    # Last 7 days resolution trend (real data)
    today = timezone.now().date()
    resolution_by_day = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        count = qs.filter(
            status='solved',
            resolved_at__date=day,
        ).count()
        resolution_by_day.append({
            'day': day.strftime('%a'),
            'date': day.isoformat(),
            'resolved': count,
        })

    return Response({
        'pending_count': pending_count,
        'resolved_count': resolved_count,
        'overdue_count': overdue_count,
        'total_count': qs.count(),
        'average_resolution_minutes': avg_minutes,
        'resolution_rate_percent': round(
            (resolved_count / qs.count()) * 100, 1
        ) if qs.count() else 0,
        'common_topics': common_topics,
        'common_subjects': common_subjects,
        'resolution_by_day': resolution_by_day,
        'sla': sla_summary(),
    })


# Backward-compatible aliases
CreateDoubtView = DoubtListCreateView
UpdateDoubtView = DoubtDetailView

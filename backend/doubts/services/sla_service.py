from datetime import timedelta

from django.conf import settings
from django.utils import timezone

from doubts.models import Doubt


def sla_hours():
    return int(getattr(settings, 'DOUBT_SLA_HOURS', 24))


def compute_sla_deadline(created_at=None):
    created_at = created_at or timezone.now()
    return created_at + timedelta(hours=sla_hours())


def refresh_sla_flags():
    """Mark pending doubts past SLA as overdue."""
    now = timezone.now()
    cutoff = now - timedelta(hours=sla_hours())

    Doubt.objects.filter(
        status='pending',
        created_at__lte=cutoff,
    ).update(is_overdue=True)

    Doubt.objects.filter(
        status='pending',
        created_at__gt=cutoff,
    ).update(is_overdue=False)


def sla_summary():
    refresh_sla_flags()
    pending = Doubt.objects.filter(status='pending').count()
    overdue = Doubt.objects.filter(status='pending', is_overdue=True).count()
    return {
        'sla_hours': sla_hours(),
        'pending_count': pending,
        'overdue_count': overdue,
        'within_sla_count': max(pending - overdue, 0),
    }

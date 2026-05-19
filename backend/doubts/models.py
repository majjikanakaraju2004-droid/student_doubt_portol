from django.conf import settings
from django.db import models


class Doubt(models.Model):

    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('solved', 'Solved'),
    )

    PRIORITY_CHOICES = (
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
    )

    student = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='doubts',
        limit_choices_to={'role': 'student'},
    )

    answered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='resolved_doubts',
        limit_choices_to={'role': 'teacher'},
    )

    subject = models.CharField(max_length=100, db_index=True)
    topic = models.CharField(max_length=100, db_index=True)
    tags = models.JSONField(default=list, blank=True)

    question = models.TextField()
    question_embedding = models.JSONField(null=True, blank=True)

    attachment = models.FileField(
        upload_to='doubt_attachments/',
        blank=True,
        null=True,
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        db_index=True,
    )

    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
    )

    answer = models.TextField(blank=True, null=True)
    answer_attachment = models.FileField(
        upload_to='answer_attachments/',
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    sla_deadline = models.DateTimeField(blank=True, null=True)

    is_overdue = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status', 'subject'], name='doubts_doub_status_8a1f2a_idx'),
            models.Index(fields=['status', 'created_at'], name='doubts_doub_status_4b2c91_idx'),
        ]

    def __str__(self):
        return f'{self.subject} — {self.topic}'

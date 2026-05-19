from rest_framework import serializers

from .models import Doubt


class DoubtSerializer(serializers.ModelSerializer):

    attachment_url = serializers.SerializerMethodField()
    answer_attachment_url = serializers.SerializerMethodField()
    student_name = serializers.SerializerMethodField()
    answered_by_name = serializers.SerializerMethodField()
    resolution_minutes = serializers.SerializerMethodField()

    class Meta:
        model = Doubt
        fields = [
            'id',
            'student',
            'student_name',
            'answered_by',
            'answered_by_name',
            'subject',
            'topic',
            'question',
            'answer',
            'status',
            'priority',
            'tags',
            'attachment',
            'answer_attachment',
            'attachment_url',
            'answer_attachment_url',
            'created_at',
            'resolved_at',
            'sla_deadline',
            'is_overdue',
            'resolution_minutes',
        ]
        read_only_fields = [
            'answered_by',
            'resolved_at',
            'sla_deadline',
            'is_overdue',
            'tags',
        ]

    def get_attachment_url(self, obj):
        request = self.context.get('request')
        if obj.attachment and request:
            return request.build_absolute_uri(obj.attachment.url)
        return None

    def get_answer_attachment_url(self, obj):
        request = self.context.get('request')
        if obj.answer_attachment and request:
            return request.build_absolute_uri(obj.answer_attachment.url)
        return None

    def get_student_name(self, obj):
        return getattr(obj.student, 'full_name', None) or getattr(obj.student, 'username', '')

    def get_answered_by_name(self, obj):
        if not obj.answered_by:
            return None
        return obj.answered_by.full_name or obj.answered_by.username

    def get_resolution_minutes(self, obj):
        if obj.resolved_at and obj.created_at:
            delta = obj.resolved_at - obj.created_at
            return round(delta.total_seconds() / 60, 1)
        return None

from django.shortcuts import render

# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Notification
from .serializers import NotificationSerializer


@api_view(['GET'])
def get_notifications(request, user_id):

    notifications = Notification.objects.filter(
        user_id=user_id
    ).order_by('-created_at')

    serializer = NotificationSerializer(
        notifications,
        many=True
    )

    return Response(serializer.data)


@api_view(['POST'])
def mark_as_read(request, notification_id):
    notification = Notification.objects.get(id=notification_id)
    notification.is_read = True
    notification.save()
    return Response({
        'message': 'Notification marked as read'
    })


@api_view(['POST'])
def mark_all_as_read(request, user_id):
    Notification.objects.filter(user_id=user_id, is_read=False).update(is_read=True)
    return Response({
        'message': 'All notifications marked as read'
    })
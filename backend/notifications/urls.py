from django.urls import path
from .views import get_notifications, mark_as_read, mark_all_as_read


urlpatterns = [
    path('<int:user_id>/', get_notifications),
    path('read/<int:notification_id>/', mark_as_read),
    path('read-all/<int:user_id>/', mark_all_as_read),
]
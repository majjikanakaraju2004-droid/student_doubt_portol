from django.urls import path
from .views import ResponseView

urlpatterns = [
    path('', ResponseView.as_view()),
]
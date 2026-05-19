from django.urls import path

from .views import (
    DoubtDetailView,
    DoubtListCreateView,
    check_similarity,
    knowledge_base,
    knowledge_base_browse,
    submit_answer,
    teacher_analytics,
)

urlpatterns = [
    path('', DoubtListCreateView.as_view()),
    path('analytics/', teacher_analytics),
    path('knowledge-base/', knowledge_base),
    path('knowledge-base/browse/', knowledge_base_browse),
    path('check-similarity/', check_similarity),
    path('<int:pk>/', DoubtDetailView.as_view()),
    path('<int:pk>/answer/', submit_answer),
]

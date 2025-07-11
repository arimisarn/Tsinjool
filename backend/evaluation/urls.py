from django.urls import path
from .views import EvaluationView

urlpatterns = [
    path('evaluation/', EvaluationView.as_view(), name='evaluation'),
    # path("evaluation/last/", latest_evaluation),
]

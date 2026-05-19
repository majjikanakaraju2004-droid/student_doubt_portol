from django.db import models
from doubts.models import Doubt
from users.models import User

class Response(models.Model):
    doubt = models.ForeignKey(Doubt, on_delete=models.CASCADE)
    teacher = models.ForeignKey(User, on_delete=models.CASCADE)
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
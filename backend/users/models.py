from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):

    ROLE_CHOICES = (
        ('student', 'Student'),
        ('teacher', 'Teacher'),
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE_CHOICES,
        default='student'
    )

    full_name = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    roll_number = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    employee_id = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    department = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    year_of_study = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    section = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )

    designation = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )

    subject_expertise = models.CharField(
        max_length=200,
        blank=True,
        null=True
    )

    mobile = models.CharField(
        max_length=15,
        blank=True,
        null=True
    )

    notification_preference = models.CharField(
        max_length=100,
        default='Dashboard + Email'
    )

    contact_email = models.EmailField(
        blank=True,
        null=True
    )

    last_active = models.DateTimeField(
        auto_now=True
    )

    account_status = models.CharField(
        max_length=20,
        default='Active'
    )

    def __str__(self):
        return self.username
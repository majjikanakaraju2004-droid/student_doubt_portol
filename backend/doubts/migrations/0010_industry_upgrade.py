import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('doubts', '0009_alter_doubt_status'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name='doubt',
            name='answered_by',
            field=models.ForeignKey(
                blank=True,
                limit_choices_to={'role': 'teacher'},
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='resolved_doubts',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
        migrations.AddField(
            model_name='doubt',
            name='priority',
            field=models.CharField(
                choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')],
                default='medium',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='doubt',
            name='question_embedding',
            field=models.JSONField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='doubt',
            name='sla_deadline',
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='doubt',
            name='student',
            field=models.ForeignKey(
                limit_choices_to={'role': 'student'},
                on_delete=django.db.models.deletion.CASCADE,
                related_name='doubts',
                to=settings.AUTH_USER_MODEL,
            ),
            preserve_default=False,
        ),
        migrations.AddIndex(
            model_name='doubt',
            index=models.Index(fields=['status', 'subject'], name='doubts_doub_status_8a1f2a_idx'),
        ),
        migrations.AddIndex(
            model_name='doubt',
            index=models.Index(fields=['status', 'created_at'], name='doubts_doub_status_4b2c91_idx'),
        ),
    ]

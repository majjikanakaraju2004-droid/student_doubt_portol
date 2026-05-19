from rest_framework import serializers
from .models import User


def serialize_user(user):
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'role': 'admin' if user.is_superuser else user.role,
        'is_superuser': user.is_superuser,
        'full_name': user.full_name,
        'department': user.department,
        'mobile': user.mobile,
        'notification_preference': user.notification_preference,
        'contact_email': user.contact_email,
        'account_status': user.account_status,
        'roll_number': user.roll_number,
        'year_of_study': user.year_of_study,
        'section': user.section,
        'employee_id': user.employee_id,
        'designation': user.designation,
        'subject_expertise': user.subject_expertise,
        'last_active': user.last_active,
        'date_joined': user.date_joined,
    }


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'full_name',
            'email',
            'mobile',
            'department',
            'notification_preference',
            'contact_email',
            'roll_number',
            'year_of_study',
            'section',
            'employee_id',
            'designation',
            'subject_expertise',
        ]

    def validate_email(self, value):
        if not value:
            return value
        qs = User.objects.filter(email__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This email is already in use.')
        return value

    def validate_contact_email(self, value):
        if not value:
            return value
        qs = User.objects.filter(contact_email__iexact=value).exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('This contact email is already in use.')
        return value


class RegisterSerializer(serializers.ModelSerializer):

    class Meta:

        model = User

        fields = [
            'id',
            'username',
            'email',
            'password',
            'role',

            # Common fields
            'full_name',
            'department',
            'mobile',
            'notification_preference',
            'contact_email',
            'account_status',
            'last_active',
            'date_joined',

            # Student fields
            'roll_number',
            'year_of_study',
            'section',

            # Faculty fields
            'employee_id',
            'designation',
            'subject_expertise',
        ]

        extra_kwargs = {
            'password': {'write_only': True},
            'last_active': {'read_only': True},
            'date_joined': {'read_only': True},
        }

    def create(self, validated_data):

        password = validated_data.pop('password')

        user = User(**validated_data)

        user.set_password(password)

        user.save()

        return user
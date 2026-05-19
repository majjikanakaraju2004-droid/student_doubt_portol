from django.db import migrations

def seed_users(apps, schema_editor):
    User = apps.get_model('users', 'User')
    users_data = [
        {"username": "Pandu", "password": "pbkdf2_sha256$1200000$wjRflbnwESIATQx024327d$SC6+dLYamTS7xvLXEkYSUzZ3Lnt3CrxSLtTztvoq+7g=", "email": "Pandu@gmail.com", "contact_email": None, "role": "", "full_name": None, "mobile": None, "is_superuser": True, "is_staff": True, "is_active": True},
        {"username": "Kanakaraju", "password": "pbkdf2_sha256$1200000$o5cziQCXuqgAJUp9qgz4QH$QsuHb5nEQm1Ghb6yxFgo2sF8jDmdn9Q5hdVvSrVOA5g=", "email": "", "contact_email": None, "role": "student", "full_name": None, "mobile": None, "is_superuser": False, "is_staff": False, "is_active": True},
        {"username": "Jayarama", "password": "pbkdf2_sha256$1200000$a87Z3hmO537uwjvyxZwXgb$QpmcTJk2duFWqtWbk7fMP/GhrljzNI7l/pA5iYnNVA8=", "email": "majjikanakaraju2004@gmail.com", "contact_email": "majjikanakaraju2004@gmail.com", "role": "student", "full_name": "Jaya Ramakrishna", "mobile": "7330935859", "is_superuser": False, "is_staff": False, "is_active": True},
        {"username": "Karthik", "password": "pbkdf2_sha256$1200000$lt8MVUyp8EFfvNwOZYxdfS$mUcNH4QeIwWqexbmqu2giovNw/mZkUtmOWicLSNJc5g=", "email": "karthikreddybodapati@gmail.com", "contact_email": "karthikreddybodapati@gmail.com", "role": "teacher", "full_name": "Karthik", "mobile": "7330935859", "is_superuser": False, "is_staff": False, "is_active": True},
        {"username": "sai", "password": "pbkdf2_sha256$1200000$294geVGJgnDCY46j8tU2yk$9ec5ZL75apUwgLZIQrQERLWIT1c0A3v3S7iVRhchkFU=", "email": "saiteja@gmail.com", "contact_email": "saiteja@gmail.com", "role": "student", "full_name": "saiteja", "mobile": "6932458925", "is_superuser": False, "is_staff": False, "is_active": True},
        {"username": "Harish", "password": "pbkdf2_sha256$1200000$UjXXyTxZuEenbBQnukbmEW$d9uLsKE4ut9QyAPvJw9uM4TF2xSTnkgbpfdleH1yaec=", "email": "majjikanakaraju2004@gmail.com", "contact_email": "majjikanakaraju2004@gmail.com", "role": "student", "full_name": "Harish Reddy", "mobile": "903589462", "is_superuser": False, "is_staff": False, "is_active": True},
        {"username": "Prudhvi", "password": "pbkdf2_sha256$1200000$zwKxpRX30GqnyolYEL8bl1$NFfbHejawZx82v7G1Y+L8QslejNCpt525M0nDkpNPbc=", "email": "majjikanakaraju2004@gmail.com", "contact_email": "majjikanakaraju2004@gmail.com", "role": "student", "full_name": "Prudhvi", "mobile": "9951012619", "is_superuser": False, "is_staff": False, "is_active": True},
        {"username": "Tejasai", "password": "pbkdf2_sha256$1200000$HjpxS2OxYwpwPn6QivfT5t$E7JLGdXao/KWF/IQAiOmyFFfpL4xahR0MfHauZsv078=", "email": "saitejaputtapaka79@gmail.com", "contact_email": "saitejaputtapaka79@gmail.com", "role": "student", "full_name": "Tejasai", "mobile": "6825885423", "is_superuser": False, "is_staff": False, "is_active": True},
        {"username": "Lokesh", "password": "pbkdf2_sha256$1200000$EaT6vxysLZ6VBsNhmfbkZQ$mzfU9sbpbdPm47/+MLliRl2ZTVlcA12053pHE7bDLUE=", "email": "lokeshworld488@gmail.com", "contact_email": "lokeshworld488@gmail.com", "role": "student", "full_name": "Lokesh", "mobile": "7337563479", "is_superuser": False, "is_staff": False, "is_active": True}
    ]
    for u in users_data:
        User.objects.update_or_create(
            username=u["username"],
            defaults=u
        )

def unseed_users(apps, schema_editor):
    User = apps.get_model('users', 'User')
    usernames = ["Pandu", "Kanakaraju", "Jayarama", "Karthik", "sai", "Harish", "Prudhvi", "Tejasai", "Lokesh"]
    User.objects.filter(username__in=usernames).delete()

class Migration(migrations.Migration):

    dependencies = [
        ('users', '0005_user_designation_user_employee_id_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_users, unseed_users),
    ]

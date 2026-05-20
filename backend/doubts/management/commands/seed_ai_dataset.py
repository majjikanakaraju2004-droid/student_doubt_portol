import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from users.models import User
from doubts.models import Doubt
from doubts.views import generate_tags
from doubts.services.ai_service import encode_text, embedding_to_list

DATASET = {
    "Python": [
        {"q": "What is Python?", "a": "Python is a high-level interpreted programming language."},
        {"q": "What is a list?", "a": "A list is a mutable ordered collection."},
        {"q": "What is a tuple?", "a": "A tuple is an immutable collection."},
        {"q": "What is a dictionary?", "a": "Dictionary stores key-value pairs."},
        {"q": "What is OOP?", "a": "Object-Oriented Programming using classes and objects."}
    ],
    "Java": [
        {"q": "What is Java?", "a": "Java is an object-oriented programming language."},
        {"q": "What is JVM?", "a": "Java Virtual Machine executes bytecode."},
        {"q": "What is JDK?", "a": "Java Development Kit for development."},
        {"q": "What is inheritance?", "a": "Acquiring properties from parent class."},
        {"q": "What is polymorphism?", "a": "Ability to take multiple forms."}
    ],
    "Django": [
        {"q": "What is Django?", "a": "Django is a Python web framework."},
        {"q": "What is MVT?", "a": "Model-View-Template architecture."},
        {"q": "What is ORM?", "a": "Object Relational Mapping."},
        {"q": "What is migration?", "a": "Updating database schema."},
        {"q": "What is middleware?", "a": "Processes requests and responses."}
    ],
    "UI Development": [
        {"q": "What is HTML?", "a": "Markup language for web pages."},
        {"q": "What is CSS?", "a": "Styles web pages."},
        {"q": "What is JavaScript?", "a": "Programming language for interactivity."},
        {"q": "What is React?", "a": "JavaScript library for UI."},
        {"q": "What is responsive design?", "a": "Adapts UI to screen sizes."}
    ],
    "Database": [
        {"q": "What is DBMS?", "a": "Database Management System."},
        {"q": "What is SQL?", "a": "Language for database operations."},
        {"q": "What is primary key?", "a": "Unique identifier in table."},
        {"q": "What is JOIN?", "a": "Combines multiple tables."},
        {"q": "What is normalization?", "a": "Reduces data redundancy."}
    ],
    "CSE - Data Structures": [
        {"q": "What is a stack?", "a": "Stack follows LIFO principle."},
        {"q": "What is queue?", "a": "Queue follows FIFO principle."},
        {"q": "What is tree?", "a": "Hierarchical data structure."},
        {"q": "What is graph?", "a": "Collection of vertices and edges."},
        {"q": "What is recursion?", "a": "Function calling itself."}
    ],
    "CSE - Operating Systems": [
        {"q": "What is OS?", "a": "Software managing hardware and software."},
        {"q": "What is process?", "a": "Program in execution."},
        {"q": "What is thread?", "a": "Smallest execution unit."},
        {"q": "What is deadlock?", "a": "Processes waiting indefinitely."},
        {"q": "What is virtual memory?", "a": "Uses disk as RAM extension."}
    ],
    "ECE - Digital Electronics": [
        {"q": "What is logic gate?", "a": "Basic digital circuit component."},
        {"q": "What is AND gate?", "a": "Outputs 1 when all inputs are 1."},
        {"q": "What is OR gate?", "a": "Outputs 1 if any input is 1."},
        {"q": "What is flip-flop?", "a": "Memory storage element."},
        {"q": "What is Boolean algebra?", "a": "Math for logic circuits."}
    ],
    "ECE - Microprocessors & Microcontrollers": [
        {"q": "What is microprocessor?", "a": "CPU on a chip."},
        {"q": "What is microcontroller?", "a": "Chip with processor and peripherals."},
        {"q": "What is interrupt?", "a": "Signal pausing execution."},
        {"q": "What is register?", "a": "Temporary CPU storage."},
        {"q": "What is embedded system?", "a": "Dedicated computer system."}
    ],
    "EEE - Power Electronics": [
        {"q": "What is power electronics?", "a": "Control of electric power."},
        {"q": "What is rectifier?", "a": "Converts AC to DC."},
        {"q": "What is inverter?", "a": "Converts DC to AC."},
        {"q": "What is converter?", "a": "Changes electrical power form."},
        {"q": "What is thyristor?", "a": "Semiconductor switching device."}
    ],
    "EEE - Electrical Machines": [
        {"q": "What is motor?", "a": "Converts electrical to mechanical energy."},
        {"q": "What is generator?", "a": "Converts mechanical to electrical energy."},
        {"q": "What is transformer?", "a": "Transfers electrical energy."},
        {"q": "What is rotor?", "a": "Rotating machine part."},
        {"q": "What is stator?", "a": "Stationary machine part."}
    ],
    "IT - Computer Networks": [
        {"q": "What is LAN?", "a": "Local Area Network."},
        {"q": "What is WAN?", "a": "Wide Area Network."},
        {"q": "What is IP address?", "a": "Unique network identifier."},
        {"q": "What is router?", "a": "Routes network traffic."},
        {"q": "What is firewall?", "a": "Protects network."}
    ],
    "IT - Database Management Systems": [
        {"q": "What is DBMS?", "a": "Software managing databases."},
        {"q": "What is transaction?", "a": "Set of database operations."},
        {"q": "What is ACID?", "a": "Reliable transaction properties."},
        {"q": "What is view?", "a": "Virtual database table."},
        {"q": "What is stored procedure?", "a": "Precompiled SQL program."}
    ],
    "Mechanical - Thermodynamics": [
        {"q": "What is thermodynamics?", "a": "Study of heat and energy."},
        {"q": "What is entropy?", "a": "Measure of disorder."},
        {"q": "What is enthalpy?", "a": "Total heat content."},
        {"q": "What is boiler?", "a": "Produces steam."},
        {"q": "What is turbine?", "a": "Converts fluid energy."}
    ],
    "Mechanical - Manufacturing Processes": [
        {"q": "What is casting?", "a": "Pouring molten metal into molds."},
        {"q": "What is welding?", "a": "Joining materials using heat."},
        {"q": "What is CNC?", "a": "Computer-controlled machining."},
        {"q": "What is forging?", "a": "Shaping metal using force."},
        {"q": "What is drilling?", "a": "Creating holes in material."}
    ],
    "Civil - Strength of Materials": [
        {"q": "What is stress?", "a": "Force per unit area."},
        {"q": "What is strain?", "a": "Deformation per unit length."},
        {"q": "What is elasticity?", "a": "Regaining original shape."},
        {"q": "What is toughness?", "a": "Ability to absorb energy."},
        {"q": "What is buckling?", "a": "Sudden deformation."}
    ],
    "Civil - Structural Analysis": [
        {"q": "What is structural analysis?", "a": "Study of structures under load."},
        {"q": "What is beam?", "a": "Structural load-carrying member."},
        {"q": "What is truss?", "a": "Framework of connected members."},
        {"q": "What is deflection?", "a": "Displacement of member."},
        {"q": "What is equilibrium?", "a": "Balanced force condition."}
    ]
}

class Command(BaseCommand):
    help = 'Seeds AI dataset from predefined questions and answers'

    def handle(self, *args, **kwargs):
        # Create a dummy student and teacher if they don't exist
        ai_student, _ = User.objects.get_or_create(
            username='ai_student',
            defaults={
                'role': 'student',
                'full_name': 'AI Dummy Student',
                'email': 'ai_student@synycs.edu'
            }
        )

        ai_teacher, _ = User.objects.get_or_create(
            username='ai_teacher',
            defaults={
                'role': 'teacher',
                'full_name': 'AI Dataset Teacher',
                'email': 'ai_teacher@synycs.edu'
            }
        )

        now = timezone.now()

        created_count = 0
        for subject, qas in DATASET.items():
            for qa in qas:
                q_text = qa['q']
                a_text = qa['a']

                # Check if it already exists
                if Doubt.objects.filter(question=q_text, subject=subject).exists():
                    continue

                tags = generate_tags(subject, "General", q_text, a_text)
                
                # Optional embedding, based on lightweight config
                emb = embedding_to_list(encode_text(q_text))

                Doubt.objects.create(
                    student=ai_student,
                    answered_by=ai_teacher,
                    subject=subject,
                    topic="General",
                    question=q_text,
                    answer=a_text,
                    status='solved',
                    priority='medium',
                    created_at=now,
                    resolved_at=now,
                    tags=tags,
                    question_embedding=emb
                )
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'Successfully created {created_count} AI training doubts.'))

from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from .models import Response
from .serializers import ResponseSerializer

class ResponseView(generics.ListCreateAPIView):
    queryset = Response.objects.all()
    serializer_class = ResponseSerializer
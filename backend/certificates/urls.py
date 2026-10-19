from django.urls import path

from . import views

urlpatterns = [
    path('', views.create_certificate, name='create_certificate'),
    path('<str:cert_id>/', views.get_certificate, name='get_certificate'),
]

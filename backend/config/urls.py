"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path
from django.http import JsonResponse
import time
from .turso import query_turso

def api_status(request):
    db_connected = False
    db_latency_ms = None
    try:
        t0 = time.time()
        res = query_turso("SELECT 1 as ping")
        db_latency_ms = round((time.time() - t0) * 1000, 2)
        db_connected = True
    except Exception as e:
        db_error = str(e)

    return JsonResponse({
        "status": "online",
        "service": "Meridian API",
        "framework": "Django 6.1.2",
        "database": {
            "engine": "Turso (libSQL)",
            "url": "libsql://usemeridian-usemeridian.aws-us-east-1.turso.io",
            "connected": db_connected,
            "latency_ms": db_latency_ms,
        },
        "environment": "active"
    })

def api_db_check(request):
    try:
        t0 = time.time()
        res = query_turso("SELECT datetime('now') as server_time, sqlite_version() as sqlite_ver")
        latency = round((time.time() - t0) * 1000, 2)
        tables = query_turso("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
        return JsonResponse({
            "success": True,
            "engine": "Turso libSQL Cloud",
            "cluster": "aws-us-east-1",
            "latency_ms": latency,
            "server_time": res.rows[0][0] if res.rows else None,
            "sqlite_version": res.rows[0][1] if res.rows else None,
            "tables": [row[0] for row in tables.rows]
        })
    except Exception as e:
        return JsonResponse({"success": False, "error": str(e)}, status=500)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/status/', api_status, name='api_status'),
    path('api/db/', api_db_check, name='api_db_check'),
]


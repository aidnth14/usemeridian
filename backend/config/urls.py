"""
URL configuration for config project.
"""
import time

from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path

from .turso import query_turso


def api_status(request):
    db_connected = False
    db_latency_ms = None
    try:
        t0 = time.time()
        query_turso("SELECT 1 as ping")
        db_latency_ms = round((time.time() - t0) * 1000, 2)
        db_connected = True
    except Exception:
        pass

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
    path('api/certificates/', include('certificates.urls')),
]

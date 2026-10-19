import os
from django.conf import settings
import libsql_client

_client = None

def get_turso_client():
    global _client
    if _client is None:
        url = getattr(settings, 'TURSO_DATABASE_URL', os.getenv('TURSO_DATABASE_URL'))
        token = getattr(settings, 'TURSO_AUTH_TOKEN', os.getenv('TURSO_AUTH_TOKEN'))
        _client = libsql_client.create_client_sync(url=url, auth_token=token)
    return _client

def query_turso(sql: str, params=None):
    client = get_turso_client()
    return client.execute(sql, params)

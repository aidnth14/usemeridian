import json
import os
import secrets
import string

from cryptography.fernet import Fernet, InvalidToken
from django.conf import settings

PERSON_FIELDS = [
    'legal-name', 'sex', 'birthdate', 'nationality', 'religion', 'father-name',
    'email', 'phone', 'address-1', 'address-2', 'postal-code', 'signature',
]


def _fernet() -> Fernet:
    key = getattr(settings, 'CERTIFICATE_ENCRYPTION_KEY', None) or os.getenv('CERTIFICATE_ENCRYPTION_KEY')
    if not key:
        raise RuntimeError(
            'CERTIFICATE_ENCRYPTION_KEY is not set. Generate one with '
            '`python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"` '
            'and set it in the environment.'
        )
    return Fernet(key.encode() if isinstance(key, str) else key)


def encrypt_person(data: dict) -> str:
    payload = {k: data.get(k, '') for k in PERSON_FIELDS}
    return _fernet().encrypt(json.dumps(payload).encode()).decode()


def decrypt_person(token: str) -> dict:
    try:
        return json.loads(_fernet().decrypt(token.encode()).decode())
    except InvalidToken as exc:
        raise ValueError('certificate data could not be decrypted') from exc


def generate_key() -> str:
    """6 random digits + 4 random uppercase letters, cryptographically random."""
    digits = ''.join(secrets.choice(string.digits) for _ in range(6))
    letters = ''.join(secrets.choice(string.ascii_uppercase) for _ in range(4))
    return digits + letters


def generate_id() -> str:
    """A random prefix followed by the key, so the full id is the bearer token
    used in share links - high entropy, not enumerable, no separate secret needed."""
    prefix = ''.join(secrets.choice(string.digits) for _ in range(10))
    return prefix + generate_key()


def client_ip(request) -> str:
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '0.0.0.0')

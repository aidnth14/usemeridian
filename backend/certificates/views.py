import json
import re

from django.core.cache import cache
from django.db import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Certificate, CertificateOrigin
from . import services
from .throttle import is_rate_limited

# 10 digits + 6 digits + 4 uppercase letters, matching generateCertificateId() in crypto.ts
CERT_ID_RE = re.compile(r'^\d{16}[A-Z]{4}$')

# A single opaque field shouldn't exceed this; stops someone bloating the DB.
MAX_CIPHER_LEN = 20_000
MAX_IMAGE_CIPHER_LEN = 4_500_000  # ~3MB webp + encryption/base64 overhead


@csrf_exempt
@require_http_methods(['POST'])
def create_certificate(request):
    if is_rate_limited(request, 'create', limit=20, window_seconds=600):
        return JsonResponse({'error': 'Too many certificates created recently. Please try again later.'}, status=429)

    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'invalid JSON body'}, status=400)

    groom_cipher = payload.get('groomCipher')
    bride_cipher = payload.get('brideCipher')
    seal = payload.get('seal') or {}
    image_cipher = payload.get('imageCipher')
    client_id = payload.get('id')

    if not isinstance(groom_cipher, str) or not isinstance(bride_cipher, str):
        return JsonResponse({'error': 'groomCipher and brideCipher strings are required'}, status=400)
    if len(groom_cipher) > MAX_CIPHER_LEN or len(bride_cipher) > MAX_CIPHER_LEN:
        return JsonResponse({'error': 'encrypted payload too large'}, status=400)
    if not isinstance(seal, dict):
        return JsonResponse({'error': 'seal must be an object'}, status=400)
    if image_cipher is not None:
        if not isinstance(image_cipher, str):
            return JsonResponse({'error': 'imageCipher must be a string'}, status=400)
        if len(image_cipher) > MAX_IMAGE_CIPHER_LEN:
            return JsonResponse({'error': 'image too large'}, status=400)
    if client_id is not None and not CERT_ID_RE.match(client_id):
        return JsonResponse({'error': 'invalid id format'}, status=400)

    try:
        seal_values = {
            'seal_x': float(seal.get('x', 0)),
            'seal_y': float(seal.get('y', 0)),
            'seal_scale': float(seal.get('scale', 1)),
            'seal_rotation': float(seal.get('rotation', 0)),
        }
    except (TypeError, ValueError):
        return JsonResponse({'error': 'seal values must be numbers'}, status=400)

    cert = None
    attempts = 1 if client_id else 5
    for _ in range(attempts):
        # The client pre-generates the id so it can bake the correct QR code/key
        # number into the snapshot before the certificate exists server-side.
        cert_id = client_id or services.generate_id()
        try:
            cert = Certificate.objects.create(
                id=cert_id,
                cert_key=cert_id[-10:],
                groom_data=groom_cipher,
                bride_data=bride_cipher,
                image_data=image_cipher,
                is_client_encrypted=True,
                **seal_values,
            )
            break
        except IntegrityError:
            if client_id:
                return JsonResponse({'error': 'id already exists, please retry'}, status=409)
            continue

    if cert is None:
        return JsonResponse({'error': 'could not allocate a unique certificate id'}, status=500)

    CertificateOrigin.objects.create(certificate=cert, ip_address=services.client_ip(request))

    return JsonResponse(
        {'id': cert.id, 'key': cert.cert_key, 'createdAt': cert.created_at.isoformat()},
        status=201,
    )


@require_http_methods(['GET'])
def get_certificate(request, cert_id):
    if is_rate_limited(request, 'read', limit=120, window_seconds=60):
        return JsonResponse({'error': 'Too many requests. Please slow down.'}, status=429)

    clean_id = cert_id.removeprefix('id.')
    if not CERT_ID_RE.match(clean_id):
        return JsonResponse({'error': 'certificate not found'}, status=404)

    # Certificates are immutable once created. For client-encrypted ones the
    # cached payload is pure ciphertext (no plaintext ever touches the cache),
    # so caching it is safe and spares Postgres a lookup on every view/download.
    cache_key = f'cert:{clean_id}'
    cached = cache.get(cache_key)
    if cached is not None:
        return JsonResponse(cached)

    try:
        cert = Certificate.objects.get(id=clean_id)
    except Certificate.DoesNotExist:
        return JsonResponse({'error': 'certificate not found'}, status=404)

    base = {
        'id': cert.id,
        'key': cert.cert_key,
        'certificateTemplate': cert.certificate_template,
        'sealTemplate': cert.seal_template,
        'seal': {
            'x': cert.seal_x,
            'y': cert.seal_y,
            'scale': cert.seal_scale,
            'rotation': cert.seal_rotation,
        },
        'createdAt': cert.created_at.isoformat(),
    }

    if cert.is_client_encrypted:
        # The server never had the key and cannot decrypt this - hand back
        # the raw ciphertext for the client to decrypt with the fragment key.
        payload = {
            **base,
            'encrypted': True,
            'groomCipher': cert.groom_data,
            'brideCipher': cert.bride_data,
            'imageCipher': cert.image_data,
        }
        cache.set(cache_key, payload, 86400)  # ciphertext only - safe to cache
        return JsonResponse(payload)

    # Legacy certificates created before client-side encryption existed. These
    # decrypt to plaintext server-side, so they are deliberately NOT cached.
    try:
        groom = services.decrypt_person(cert.groom_data)
        bride = services.decrypt_person(cert.bride_data)
    except ValueError as exc:
        return JsonResponse({'error': str(exc)}, status=500)

    return JsonResponse({
        **base,
        'encrypted': False,
        'groom': groom,
        'bride': bride,
        'imageData': cert.image_data,
    })

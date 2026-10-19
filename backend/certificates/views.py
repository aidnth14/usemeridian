import json
import re

from django.db import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Certificate, CertificateOrigin
from . import services

# 10 digits + 6 digits + 4 uppercase letters, matching generateCertificateId() in crypto.ts
CERT_ID_RE = re.compile(r'^\d{16}[A-Z]{4}$')


@csrf_exempt
@require_http_methods(['POST'])
def create_certificate(request):
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
    if image_cipher is not None:
        if not isinstance(image_cipher, str):
            return JsonResponse({'error': 'imageCipher must be a string'}, status=400)
        if len(image_cipher) > 3_000_000:
            return JsonResponse({'error': 'image too large'}, status=400)
    if client_id is not None and not CERT_ID_RE.match(client_id):
        return JsonResponse({'error': 'invalid id format'}, status=400)

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
                seal_x=float(seal.get('x', 0)),
                seal_y=float(seal.get('y', 0)),
                seal_scale=float(seal.get('scale', 1)),
                seal_rotation=float(seal.get('rotation', 0)),
                groom_data=groom_cipher,
                bride_data=bride_cipher,
                image_data=image_cipher,
                is_client_encrypted=True,
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
    clean_id = cert_id.removeprefix('id.')
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
        return JsonResponse({
            **base,
            'encrypted': True,
            'groomCipher': cert.groom_data,
            'brideCipher': cert.bride_data,
            'imageCipher': cert.image_data,
        })

    # Legacy certificates created before client-side encryption existed.
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

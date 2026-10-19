import json

from django.db import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .models import Certificate, CertificateOrigin
from . import services


@csrf_exempt
@require_http_methods(['POST'])
def create_certificate(request):
    try:
        payload = json.loads(request.body or '{}')
    except json.JSONDecodeError:
        return JsonResponse({'error': 'invalid JSON body'}, status=400)

    groom = payload.get('groom')
    bride = payload.get('bride')
    seal = payload.get('seal') or {}
    if not isinstance(groom, dict) or not isinstance(bride, dict):
        return JsonResponse({'error': 'groom and bride objects are required'}, status=400)

    cert = None
    for _ in range(5):
        cert_id = services.generate_id()
        try:
            cert = Certificate.objects.create(
                id=cert_id,
                cert_key=cert_id[-10:],
                seal_x=float(seal.get('x', 0)),
                seal_y=float(seal.get('y', 0)),
                seal_scale=float(seal.get('scale', 1)),
                seal_rotation=float(seal.get('rotation', 0)),
                groom_data=services.encrypt_person(groom),
                bride_data=services.encrypt_person(bride),
            )
            break
        except IntegrityError:
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

    try:
        groom = services.decrypt_person(cert.groom_data)
        bride = services.decrypt_person(cert.bride_data)
    except ValueError as exc:
        return JsonResponse({'error': str(exc)}, status=500)

    return JsonResponse({
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
        'groom': groom,
        'bride': bride,
        'createdAt': cert.created_at.isoformat(),
    })

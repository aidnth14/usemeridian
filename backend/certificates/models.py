from django.db import models


class Certificate(models.Model):
    """Container 1: everything needed to redraw a certificate on demand.

    No rendered image is ever stored - only asset references, the seal's
    transform on the certificate, and the (encrypted) bride/groom data.
    The client reassembles the visual from this at view time.
    """

    id = models.CharField(primary_key=True, max_length=32, editable=False)
    cert_key = models.CharField(max_length=10, db_index=True)

    certificate_template = models.CharField(max_length=64, default='meridian-v1')
    seal_template = models.CharField(max_length=64, default='meridian-seal-v1')

    seal_x = models.FloatField(default=0)
    seal_y = models.FloatField(default=0)
    seal_scale = models.FloatField(default=1)
    seal_rotation = models.FloatField(default=0)

    # Fernet-encrypted JSON blobs of the groom/bride fields.
    groom_data = models.TextField()
    bride_data = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'certificates'


class CertificateOrigin(models.Model):
    """Container 2: provenance only, kept separate from certificate content."""

    certificate = models.ForeignKey(Certificate, on_delete=models.CASCADE, related_name='origins')
    ip_address = models.GenericIPAddressField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'certificate_origins'

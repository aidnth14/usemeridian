from django.core.cache import cache

from . import services


def is_rate_limited(request, bucket: str, limit: int, window_seconds: int) -> bool:
    """Fixed-window per-IP rate limiter backed by the cache (Redis in prod,
    local memory otherwise). Returns True when the caller has exceeded `limit`
    requests for `bucket` within `window_seconds`.

    Fail-open: if the cache backend is unavailable we allow the request rather
    than lock everyone out over an infrastructure hiccup.
    """
    ip = services.client_ip(request)
    key = f'rl:{bucket}:{ip}'
    try:
        cache.add(key, 0, window_seconds)  # only sets if absent; preserves TTL
        try:
            count = cache.incr(key)
        except ValueError:
            # Key expired between add and incr - start a fresh window.
            cache.set(key, 1, window_seconds)
            count = 1
        return count > limit
    except Exception:
        return False

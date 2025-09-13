from __future__ import annotations

import time
import json
from functools import lru_cache
from typing import Any, Dict
import requests
from jose import jwt
from fastapi import HTTPException, status, Depends
from ..settings import get_settings


_JWKS_CACHE: Dict[str, Dict[str, Any]] = {}
_JWKS_LAST_FETCH = 0.0
_JWKS_TTL = 60 * 10  # 10 minutes


def _fetch_jwks(url: str) -> Dict[str, Any]:
    global _JWKS_LAST_FETCH
    resp = requests.get(url, timeout=5)
    resp.raise_for_status()
    data = resp.json()
    _JWKS_LAST_FETCH = time.time()
    return {k['kid']: k for k in data.get('keys', [])}


def _get_key(kid: str, url: str) -> Dict[str, Any]:
    now = time.time()
    if not _JWKS_CACHE or now - _JWKS_LAST_FETCH > _JWKS_TTL:
        _JWKS_CACHE.clear()
        _JWKS_CACHE.update(_fetch_jwks(url))
    if kid not in _JWKS_CACHE:
        # refetch once
        _JWKS_CACHE.clear()
        _JWKS_CACHE.update(_fetch_jwks(url))
    key = _JWKS_CACHE.get(kid)
    if not key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token kid")
    return key


def verify_jwt(token: str) -> str:  # returns user_id (sub)
    settings = get_settings()
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        header_b64 = token.split('.')[0]
        header_json = json.loads(jwt.utils.base64url_decode(header_b64).decode())
        kid = header_json.get('kid')
        if not kid:
            raise HTTPException(status_code=401, detail="Missing kid")
        jwk_key = _get_key(kid, settings.SUPABASE_JWKS_URL)
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(jwk_key))  # type: ignore[attr-defined]
        payload = jwt.decode(token, public_key, audience=settings.SUPABASE_AUDIENCE, algorithms=[jwk_key.get('alg', 'RS256')])
        exp = payload.get('exp')
        if exp and exp < int(time.time()):
            raise HTTPException(status_code=401, detail="Token expired")
        sub = payload.get('sub')
        if not sub:
            raise HTTPException(status_code=401, detail="Missing sub")
        return sub
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


def get_current_user_id(authorization: str | None = None) -> str:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split()[1]
    return verify_jwt(token)

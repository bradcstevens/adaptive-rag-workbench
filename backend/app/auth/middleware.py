import os, httpx
from fastapi import Request, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, jwk
from typing import Optional

TENANT_ID = os.getenv("TENANT_ID")
JWKS_URI = os.getenv("JWKS_URI")
AUDIENCE = os.getenv("API_AUDIENCE")

_keys = None
async def _get_keys():
    global _keys
    if _keys is None:
        async with httpx.AsyncClient() as c:
            _keys = (await c.get(JWKS_URI)).json()["keys"]
    return _keys

security = HTTPBearer()

async def require_user(request: Request):
    header = request.headers.get("authorization", "")
    try:
        scheme, token = header.split()
        assert scheme.lower() == "bearer"
        
        # Check for demo token
        if token == "demo-token":
            return {
                "preferred_username": "demo@demo.com",
                "name": "Demo User",
                "sub": "demo-user-id",
                "email": "demo@demo.com"
            }
        
        head = jwt.get_unverified_header(token)
        key = next(k for k in await _get_keys() if k["kid"] == head["kid"])
        claims = jwt.decode(token,
                           jwk.construct(key),
                           algorithms=[key["alg"]],
                           audience=AUDIENCE)
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    if not claims["preferred_username"].lower().endswith("@microsoft.com"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
                           detail="Domain not allowed")
    return claims

async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    
    # Check for demo token
    if token == "demo-token":
        return {
            "preferred_username": "demo@demo.com",
            "name": "Demo User",
            "sub": "demo-user-id",
            "email": "demo@demo.com"
        }
    
    try:
        head = jwt.get_unverified_header(token)
        key = next(k for k in await _get_keys() if k["kid"] == head["kid"])
        claims = jwt.decode(token,
                           jwk.construct(key),
                           algorithms=[key["alg"]],
                           audience=AUDIENCE)
        
        email = claims.get("email") or claims.get("preferred_username", "")
        if not email.endswith("@microsoft.com"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted to Microsoft domain accounts"
            )
        
        return claims
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token"
        )

async def get_current_user(token_data: dict = Depends(verify_token)) -> dict:
    return {
        "email": token_data.get("email") or token_data.get("preferred_username"),
        "name": token_data.get("name"),
        "sub": token_data.get("sub")
    }

async def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False))
) -> Optional[dict]:
    if not credentials:
        return None
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None

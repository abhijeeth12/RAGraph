import httpx
from typing import Optional
from loguru import logger
from app.config import settings

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"

def get_google_auth_url(state: str) -> str:
    base_url = "https://accounts.google.com/o/oauth2/v2/auth"
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "access_type": "offline",
        "prompt": "select_account"
    }
    qs = "&".join(f"{k}={v}" for k, v in params.items())
    return f"{base_url}?{qs}"

async def exchange_code(code: str) -> Optional[dict]:
    async with httpx.AsyncClient() as client:
        # 1. Exchange code for token
        try:
            token_res = await client.post(GOOGLE_TOKEN_URL, data={
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_redirect_uri
            })
            token_res.raise_for_status()
            access_token = token_res.json()["access_token"]
        except Exception as e:
            logger.error(f"Google token exchange failed: {e}")
            return None

        # 2. Get user info
        try:
            user_res = await client.get(GOOGLE_USERINFO_URL, headers={
                "Authorization": f"Bearer {access_token}"
            })
            user_res.raise_for_status()
            # Returns dict with 'email', 'name', 'picture', 'sub' (google_id)
            return user_res.json()
        except Exception as e:
            logger.error(f"Google user info fetch failed: {e}")
            return None

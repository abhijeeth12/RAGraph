from jose import jwt, JWTError, ExpiredSignatureError
from datetime import datetime, timedelta, UTC
from typing import Optional
import hashlib
import uuid
from loguru import logger
from app.config import settings

ALGORITHM = "HS256"

def get_token_hash(token: str) -> str:
    """Hash a token for secure storage in the blacklist."""
    return hashlib.sha256(token.encode()).hexdigest()

def create_access_token(user_id: str, email: str) -> str:
    """Short-lived access token (15 mins by default)"""
    expire = datetime.now(UTC) + timedelta(minutes=settings.jwt_access_expire_minutes)
    to_encode = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(UTC)
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    """Long-lived refresh token (7 days by default)"""
    expire = datetime.now(UTC) + timedelta(days=settings.jwt_refresh_expire_days)
    to_encode = {
        "sub": user_id,
        "type": "refresh",
        "jti": str(uuid.uuid4()),
        "exp": expire,
        "iat": datetime.now(UTC)
    }
    return jwt.encode(to_encode, settings.secret_key, algorithm=ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    """Decode a token, handling expiration gracefully."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
        return payload
    except ExpiredSignatureError:
        logger.debug("Token expired")
        return None
    except JWTError as e:
        logger.debug(f"Invalid token: {e}")
        return None

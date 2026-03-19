import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

import models
import database


# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY               = os.getenv("SECRET_KEY", "change-this-to-a-long-random-secret")
ALGORITHM                = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ── Password hashing (bcrypt direct — works with bcrypt 4.x+) ────────────────

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False


# ── JWT ───────────────────────────────────────────────────────────────────────

def create_access_token(user_id: int) -> str:
    expire = _utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ── OAuth2 schemes ────────────────────────────────────────────────────────────

oauth2_scheme          = OAuth2PasswordBearer(tokenUrl="/auth/email/login")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/email/login", auto_error=False)


# ── Shared decode helper ──────────────────────────────────────────────────────

def _decode_user_id(token: str) -> int:
    """Decode JWT and return user_id, raises ValueError on failure."""
    payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = payload.get("sub")
    if user_id is None:
        raise ValueError("No sub in token")
    return int(user_id)


# ── Dependencies ──────────────────────────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db:    Session = Depends(database.get_db),
) -> models.User:
    """Require a valid logged-in user. Raises 401 if missing or invalid."""
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        user_id = _decode_user_id(token)
    except (JWTError, ValueError):
        raise exc

    user = db.query(models.User).filter(models.User.id == user_id).first()
    if user is None:
        raise exc
    return user


def get_optional_user(
    token: Optional[str] = Depends(oauth2_scheme_optional),
    db:    Session = Depends(database.get_db),
) -> Optional[models.User]:
    """Return user if token is valid, else None. Never raises 401."""
    if not token:
        return None
    try:
        user_id = _decode_user_id(token)
        return db.query(models.User).filter(models.User.id == user_id).first()
    except (JWTError, ValueError):
        return None
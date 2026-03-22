from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str  = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    email:    EmailStr
    password: str  = Field(..., min_length=8)

    @field_validator('email')
    @classmethod
    def validate_email(cls, v):
        if not v.endswith('@gmail.com'):
            raise ValueError('Only Gmail addresses are allowed')
        return v

    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        pattern = r'^[A-Z][a-z]+@[0-9]+$'
        if not re.match(pattern, v):
            raise ValueError('Password format: Uppercase + lowercase + @ + numbers (e.g. Raja@123)')
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters')
        return v


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         "UserOut"


class UserOut(BaseModel):
    id:          int
    username:    str
    email:       str
    avatar_url:  Optional[str]
    is_verified: bool
    created_at:  datetime

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    username:   Optional[str] = Field(None, min_length=3, max_length=30)
    avatar_url: Optional[str] = None


# ── Rating ────────────────────────────────────────────────────────────────────

class RatingIn(BaseModel):
    tmdb_id: int
    score:   float = Field(..., ge=1, le=5)


class RatingOut(BaseModel):
    id:         int
    tmdb_id:    int
    score:      float
    created_at: datetime
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True


class MovieRatingSummary(BaseModel):
    tmdb_id:    int
    average:    Optional[float]
    count:      int
    user_score: Optional[float]


# ── Comment ───────────────────────────────────────────────────────────────────

class CommentIn(BaseModel):
    tmdb_id: int
    body:    str = Field(..., min_length=1, max_length=1000)


class CommentOut(BaseModel):
    id:         int
    tmdb_id:    int
    body:       str
    created_at: datetime
    username:   str
    avatar_url: Optional[str]
    is_mine:    bool = False

    class Config:
        from_attributes = True


# ── Watch History ─────────────────────────────────────────────────────────────

class HistoryIn(BaseModel):
    tmdb_id:     int
    movie_title: str
    poster_path: Optional[str] = None


class HistoryOut(BaseModel):
    id:          int
    tmdb_id:     int
    movie_title: str
    poster_path: Optional[str]
    watched_at:  datetime

    class Config:
        from_attributes = True


# ── Search History ────────────────────────────────────────────────────────────

class SearchHistoryIn(BaseModel):
    query: str = Field(..., min_length=1, max_length=200)


class SearchHistoryOut(BaseModel):
    id:          int
    query:       str
    searched_at: datetime

    class Config:
        from_attributes = True


# ── Profile ───────────────────────────────────────────────────────────────────

class ProfileOut(BaseModel):
    user:           UserOut
    ratings_count:  int
    comments_count: int
    history_count:  int
    recent_history: List[HistoryOut]
    recent_ratings: List[RatingOut]


TokenOut.model_rebuild()
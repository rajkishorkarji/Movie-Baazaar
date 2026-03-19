from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from datetime import datetime


# ── Auth ──────────────────────────────────────────────────────────────────────

class UserRegister(BaseModel):
    username: str  = Field(..., min_length=3, max_length=30, pattern=r"^[a-zA-Z0-9_]+$")
    email:    EmailStr
    password: str  = Field(..., min_length=6)


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user:         "UserOut"          # returned on login/register so frontend gets user immediately


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
    updated_at: Optional[datetime]   # added in updated models

    class Config:
        from_attributes = True


class MovieRatingSummary(BaseModel):
    tmdb_id:    int
    average:    Optional[float]      # None if no ratings yet
    count:      int
    user_score: Optional[float]      # None if user hasn't rated


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
    is_mine:    bool = False          # True when the requesting user owns this comment

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


# ── Profile ───────────────────────────────────────────────────────────────────

class ProfileOut(BaseModel):
    user:           UserOut
    ratings_count:  int
    comments_count: int
    history_count:  int
    recent_history: List[HistoryOut]
    recent_ratings: List[RatingOut]


# required because TokenOut references UserOut before it's fully defined
TokenOut.model_rebuild()
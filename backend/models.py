from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, UniqueConstraint, Boolean
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base


def _utcnow():
    return datetime.now(timezone.utc)


class Movie(Base):
    __tablename__ = "movies"
    id            = Column(Integer, primary_key=True, index=True)
    title         = Column(String, index=True)
    genres        = Column(String)
    poster_url    = Column(String)
    description   = Column(Text)
    rating        = Column(Float)
    backdrop_path = Column(String)
    tmdb_id       = Column(Integer, nullable=True, unique=True)


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    username        = Column(String(40), unique=True, index=True, nullable=False)
    email           = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_url      = Column(String, nullable=True)
    is_verified     = Column(Boolean, default=True)
    created_at      = Column(DateTime, default=_utcnow)

    ratings  = relationship("Rating",       back_populates="user", cascade="all, delete-orphan")
    comments = relationship("Comment",      back_populates="user", cascade="all, delete-orphan")
    history  = relationship("WatchHistory", back_populates="user", cascade="all, delete-orphan")


class Rating(Base):
    __tablename__ = "ratings"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tmdb_id    = Column(Integer, nullable=False, index=True)
    score      = Column(Float, nullable=False)
    created_at = Column(DateTime, default=_utcnow)
    updated_at = Column(DateTime, default=_utcnow, onupdate=_utcnow)

    __table_args__ = (
        UniqueConstraint("user_id", "tmdb_id", name="unique_user_movie_rating"),
    )

    user = relationship("User", back_populates="ratings")


class Comment(Base):
    __tablename__ = "comments"
    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tmdb_id    = Column(Integer, nullable=False, index=True)
    body       = Column(Text, nullable=False)
    created_at = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="comments")


class WatchHistory(Base):
    __tablename__ = "watch_history"
    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    tmdb_id     = Column(Integer, nullable=False, index=True)
    movie_title = Column(String)
    poster_path = Column(String, nullable=True)
    watched_at  = Column(DateTime, default=_utcnow)

    user = relationship("User", back_populates="history")
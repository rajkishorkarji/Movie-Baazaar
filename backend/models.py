from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Movie(Base):
    __tablename__ = "movies"
    id          = Column(Integer, primary_key=True, index=True)
    tmdb_id     = Column(Integer, unique=True, index=True)
    title       = Column(String, index=True)
    poster_path = Column(String)
    ratings     = relationship("Rating", back_populates="movie", cascade="all, delete")
    reviews     = relationship("Review", back_populates="movie", cascade="all, delete")

class Rating(Base):
    __tablename__ = "ratings"
    id         = Column(Integer, primary_key=True, index=True)
    movie_id   = Column(Integer, ForeignKey("movies.id"), nullable=False)
    session_id = Column(String, nullable=False)
    rating     = Column(Integer, nullable=False)  # 1-5
    created_at = Column(DateTime, default=datetime.utcnow)
    movie      = relationship("Movie", back_populates="ratings")

class Review(Base):
    __tablename__ = "reviews"
    id         = Column(Integer, primary_key=True, index=True)
    movie_id   = Column(Integer, ForeignKey("movies.id"), nullable=False)
    session_id = Column(String, nullable=False)
    comment    = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    movie      = relationship("Movie", back_populates="reviews")
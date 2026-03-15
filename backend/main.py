import os
import requests
from fastapi import FastAPI, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Optional
import models
import database

load_dotenv()
TMDB_KEY  = os.getenv("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"

api = FastAPI(title="Movie Baazaar API", version="1.0.0")

api.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

models.Base.metadata.create_all(bind=database.engine)

# ─── Pydantic Schemas ────────────────────────────────────────────────────────

class RatingIn(BaseModel):
    tmdb_id:    int
    title:      str
    poster_path: Optional[str] = None
    session_id: str
    rating:     int = Field(..., ge=1, le=5)

class ReviewIn(BaseModel):
    tmdb_id:    int
    title:      str
    poster_path: Optional[str] = None
    session_id: str
    comment:    str = Field(..., min_length=1, max_length=500)

class ReviewOut(BaseModel):
    id:         int
    session_id: str
    comment:    str
    created_at: str

    class Config:
        from_attributes = True

# ─── Helper ──────────────────────────────────────────────────────────────────
import traceback

@api.exception_handler(Exception)
async def global_exception_handler(request, exc):
    traceback.print_exc()
    from fastapi.responses import JSONResponse
    return JSONResponse(status_code=500, content={"detail": str(exc)})

def tmdb_get(path: str, params: dict = {}):
    params["api_key"] = TMDB_KEY
    try:
        r = requests.get(f"{TMDB_BASE}{path}", params=params, timeout=5)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"TMDB Error: {e}")
        return None

def get_or_create_movie(db: Session, tmdb_id: int, title: str, poster_path: str):
    movie = db.query(models.Movie).filter(models.Movie.tmdb_id == tmdb_id).first()
    if not movie:
        movie = models.Movie(tmdb_id=tmdb_id, title=title, poster_path=poster_path)
        db.add(movie)
        db.commit()
        db.refresh(movie)
    return movie

# ─── TMDB Routes ─────────────────────────────────────────────────────────────

@api.get("/")
def home():
    return {"status": "Movie Baazaar API is running 🎬"}

@api.get("/trending")
def get_trending():
    data = tmdb_get("/trending/movie/week")
    return data.get("results", []) if data else []

@api.get("/popular")
def get_popular():
    data = tmdb_get("/movie/popular")
    return data.get("results", []) if data else []

@api.get("/top-rated")
def get_top_rated():
    data = tmdb_get("/movie/top_rated")
    return data.get("results", []) if data else []

@api.get("/genre/{genre_id}")
def get_by_genre(genre_id: int):
    data = tmdb_get("/discover/movie", {"with_genres": genre_id, "sort_by": "popularity.desc"})
    return data.get("results", []) if data else []

@api.get("/search")
def search_movies(q: str = Query(..., min_length=1)):
    data = tmdb_get("/search/movie", {"query": q})
    return data.get("results", []) if data else []

@api.get("/recommend/{movie_id}")
def get_recommendations(movie_id: int):
    data = tmdb_get(f"/movie/{movie_id}/recommendations")
    return data.get("results", []) if data else []

@api.get("/movie/{movie_id}")
def get_movie_detail(movie_id: int):
    data = tmdb_get(f"/movie/{movie_id}", {"append_to_response": "videos,credits"})
    if not data:
        raise HTTPException(status_code=404, detail="Movie not found")
    return data

# ─── Rating Routes ────────────────────────────────────────────────────────────

@api.post("/rate")
def rate_movie(body: RatingIn, db: Session = Depends(database.get_db)):
    movie = get_or_create_movie(db, body.tmdb_id, body.title, body.poster_path)

    # Update existing rating or create new
    existing = db.query(models.Rating).filter(
        models.Rating.movie_id   == movie.id,
        models.Rating.session_id == body.session_id
    ).first()

    if existing:
        existing.rating = body.rating
    else:
        db.add(models.Rating(
            movie_id=movie.id,
            session_id=body.session_id,
            rating=body.rating
        ))
    db.commit()
    return {"message": "Rating saved", "rating": body.rating}

@api.get("/rating/{tmdb_id}")
def get_rating(tmdb_id: int, session_id: str, db: Session = Depends(database.get_db)):
    movie = db.query(models.Movie).filter(models.Movie.tmdb_id == tmdb_id).first()
    if not movie:
        return {"avg_rating": None, "user_rating": None, "total": 0}

    avg = db.query(func.avg(models.Rating.rating)).filter(
        models.Rating.movie_id == movie.id
    ).scalar()

    user_rating = db.query(models.Rating).filter(
        models.Rating.movie_id   == movie.id,
        models.Rating.session_id == session_id
    ).first()

    total = db.query(models.Rating).filter(models.Rating.movie_id == movie.id).count()

    return {
        "avg_rating":  round(float(avg), 1) if avg else None,
        "user_rating": user_rating.rating if user_rating else None,
        "total":       total
    }

# ─── Review Routes ────────────────────────────────────────────────────────────

@api.post("/review")
def add_review(body: ReviewIn, db: Session = Depends(database.get_db)):
    movie = get_or_create_movie(db, body.tmdb_id, body.title, body.poster_path)

    review = models.Review(
        movie_id=movie.id,
        session_id=body.session_id,
        comment=body.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return {"message": "Review added", "id": review.id}

@api.get("/reviews/{tmdb_id}")
def get_reviews(tmdb_id: int, db: Session = Depends(database.get_db)):
    movie = db.query(models.Movie).filter(models.Movie.tmdb_id == tmdb_id).first()
    if not movie:
        return []

    reviews = db.query(models.Review).filter(
        models.Review.movie_id == movie.id
    ).order_by(models.Review.created_at.desc()).all()

    return [
        {
            "id":         r.id,
            "session_id": r.session_id,
            "comment":    r.comment,
            "created_at": r.created_at.strftime("%d %b %Y, %I:%M %p")
        }
        for r in reviews
    ]

@api.delete("/review/{review_id}")
def delete_review(review_id: int, session_id: str, db: Session = Depends(database.get_db)):
    review = db.query(models.Review).filter(
        models.Review.id         == review_id,
        models.Review.session_id == session_id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found or not yours")
    db.delete(review)
    db.commit()
    return {"message": "Review deleted"}
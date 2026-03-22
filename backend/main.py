import os
import requests
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from dotenv import load_dotenv

import models
import database
import auth
import schemas

load_dotenv()

TMDB_KEY  = os.getenv("TMDB_API_KEY")
TMDB_BASE = "https://api.themoviedb.org/3"

api = FastAPI(title="Movie Baazaar API", version="2.0.0")

@api.on_event("startup")
def startup():
    try:
        models.Base.metadata.create_all(bind=database.engine)
        print("✅ Database tables ready")
    except Exception as e:
        print(f"⚠ DB init warning: {e}")

api.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://movie-baazaar-zw3k.vercel.app",
        "https://movie-baazaar12.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def tmdb_get(path: str, params: dict = {}) -> Optional[dict]:
    p = dict(params)
    p["api_key"] = TMDB_KEY
    try:
        r = requests.get(f"{TMDB_BASE}{path}", params=p, timeout=15)
        r.raise_for_status()
        return r.json()
    except Exception as e:
        print(f"TMDB Error on {path}: {e}")
        return None


# ── Health ────────────────────────────────────────────────────────────────────
@api.get("/")
def home():
    return {"status": "Movie Baazaar API v2 🎬"}

@api.get("/ping")
def ping():
    return {"pong": True}


# ── Auth ──────────────────────────────────────────────────────────────────────
@api.post("/auth/email/register", response_model=schemas.TokenOut, status_code=201)
def register(body: schemas.UserRegister, db: Session = Depends(database.get_db)):
    if db.query(models.User).filter(models.User.email == body.email).first():
        raise HTTPException(400, "Email already registered")
    if db.query(models.User).filter(models.User.username == body.username).first():
        raise HTTPException(400, "Username already taken")
    user = models.User(
        username=body.username,
        email=body.email,
        hashed_password=auth.hash_password(body.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    token = auth.create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@api.post("/auth/email/login", response_model=schemas.TokenOut)
def login(body: schemas.UserLogin, db: Session = Depends(database.get_db)):
    user = db.query(models.User).filter(models.User.email == body.email).first()
    if not user or not auth.verify_password(body.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    token = auth.create_access_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user": user}


@api.get("/auth/me", response_model=schemas.UserOut)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@api.patch("/auth/me", response_model=schemas.UserOut)
def update_me(
    body: schemas.UserUpdate,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    if body.username and body.username != current_user.username:
        if db.query(models.User).filter(models.User.username == body.username).first():
            raise HTTPException(400, "Username already taken")
        current_user.username = body.username
    if body.avatar_url is not None:
        current_user.avatar_url = body.avatar_url
    db.commit()
    db.refresh(current_user)
    return current_user


# ── Profile ───────────────────────────────────────────────────────────────────
@api.get("/profile", response_model=schemas.ProfileOut)
def get_profile(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    ratings = (
        db.query(models.Rating)
        .filter_by(user_id=current_user.id)
        .order_by(models.Rating.updated_at.desc())
        .limit(10).all()
    )
    return {
        "user":           current_user,
        "ratings_count":  db.query(models.Rating).filter_by(user_id=current_user.id).count(),
        "comments_count": db.query(models.Comment).filter_by(user_id=current_user.id).count(),
        "recent_ratings": ratings,
    }


# ── Ratings ───────────────────────────────────────────────────────────────────
@api.post("/ratings", response_model=schemas.RatingOut)
def rate_movie(
    body: schemas.RatingIn,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    existing = db.query(models.Rating).filter_by(
        user_id=current_user.id, tmdb_id=body.tmdb_id
    ).first()
    if existing:
        existing.score = body.score
        db.commit()
        db.refresh(existing)
        return existing
    rating = models.Rating(
        user_id=current_user.id,
        tmdb_id=body.tmdb_id,
        score=body.score,
    )
    db.add(rating)
    db.commit()
    db.refresh(rating)
    return rating


@api.get("/ratings/{tmdb_id}", response_model=schemas.MovieRatingSummary)
def get_movie_ratings(
    tmdb_id: int,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    ratings = db.query(models.Rating).filter_by(tmdb_id=tmdb_id).all()
    avg = round(sum(r.score for r in ratings) / len(ratings), 1) if ratings else None
    user_score = None
    if current_user:
        mine = next((r for r in ratings if r.user_id == current_user.id), None)
        user_score = mine.score if mine else None
    return {"tmdb_id": tmdb_id, "average": avg, "count": len(ratings), "user_score": user_score}


@api.delete("/ratings/{tmdb_id}", status_code=204)
def delete_rating(
    tmdb_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    rating = db.query(models.Rating).filter_by(
        user_id=current_user.id, tmdb_id=tmdb_id
    ).first()
    if not rating:
        raise HTTPException(404, "Rating not found")
    db.delete(rating)
    db.commit()


# ── My Ratings with movie info ─────────────────────────────────────────────────
@api.get("/my-ratings")
def get_my_ratings(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    ratings = (
        db.query(models.Rating)
        .filter_by(user_id=current_user.id)
        .order_by(models.Rating.updated_at.desc())
        .all()
    )
    result = []
    for r in ratings:
        movie_info = tmdb_get(f"/movie/{r.tmdb_id}")
        result.append({
            "id":          r.id,
            "tmdb_id":     r.tmdb_id,
            "score":       r.score,
            "created_at":  r.created_at,
            "updated_at":  r.updated_at,
            "movie_title": movie_info.get("title", f"Movie #{r.tmdb_id}") if movie_info else f"Movie #{r.tmdb_id}",
            "poster_path": movie_info.get("poster_path") if movie_info else None,
        })
    return result


# ── Comments ──────────────────────────────────────────────────────────────────
@api.post("/comments", response_model=schemas.CommentOut, status_code=201)
def add_comment(
    body: schemas.CommentIn,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    # ✅ Check if user already reviewed this movie
    existing = db.query(models.Comment).filter_by(
        user_id=current_user.id, tmdb_id=body.tmdb_id
    ).first()
    if existing:
        raise HTTPException(400, "You have already reviewed this movie")

    comment = models.Comment(
        user_id=current_user.id,
        tmdb_id=body.tmdb_id,
        body=body.body,
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return {
        "id":         comment.id,
        "tmdb_id":    comment.tmdb_id,
        "body":       comment.body,
        "created_at": comment.created_at,
        "username":   current_user.username,
        "avatar_url": current_user.avatar_url,
        "is_mine":    True,
    }


@api.get("/comments/{tmdb_id}", response_model=List[schemas.CommentOut])
def get_comments(
    tmdb_id: int,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    rows = (
        db.query(models.Comment, models.User)
        .join(models.User, models.Comment.user_id == models.User.id)
        .filter(models.Comment.tmdb_id == tmdb_id)
        .order_by(models.Comment.created_at.desc())
        .all()
    )
    return [
        {
            "id":         c.id,
            "tmdb_id":    c.tmdb_id,
            "body":       c.body,
            "created_at": c.created_at,
            "username":   u.username,
            "avatar_url": u.avatar_url,
            "is_mine":    bool(current_user and current_user.id == c.user_id),
        }
        for c, u in rows
    ]


@api.delete("/comments/{comment_id}", status_code=204)
def delete_comment(
    comment_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    comment = db.query(models.Comment).filter_by(id=comment_id).first()
    if not comment:
        raise HTTPException(404, "Comment not found")
    if comment.user_id != current_user.id:
        raise HTTPException(403, "Not your comment")
    db.delete(comment)
    db.commit()


# ── My Reviews with movie info ─────────────────────────────────────────────────
@api.get("/my-reviews")
def get_my_reviews(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    comments = (
        db.query(models.Comment)
        .filter_by(user_id=current_user.id)
        .order_by(models.Comment.created_at.desc())
        .all()
    )
    result = []
    for c in comments:
        movie_info = tmdb_get(f"/movie/{c.tmdb_id}")
        result.append({
            "id":          c.id,
            "tmdb_id":     c.tmdb_id,
            "body":        c.body,
            "created_at":  c.created_at,
            "movie_title": movie_info.get("title", f"Movie #{c.tmdb_id}") if movie_info else f"Movie #{c.tmdb_id}",
            "poster_path": movie_info.get("poster_path") if movie_info else None,
        })
    return result


# ── Favourites ────────────────────────────────────────────────────────────────
@api.post("/favourites", status_code=201)
def add_favourite(
    body: schemas.FavouriteIn,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    existing = db.query(models.Favourite).filter_by(
        user_id=current_user.id, tmdb_id=body.tmdb_id
    ).first()
    if existing:
        return {"status": "already_favourited", "is_favourite": True}
    entry = models.Favourite(
        user_id=current_user.id,
        tmdb_id=body.tmdb_id,
        movie_title=body.movie_title,
        poster_path=body.poster_path,
    )
    db.add(entry)
    db.commit()
    return {"status": "added", "is_favourite": True}


@api.delete("/favourites/{tmdb_id}", status_code=200)
def remove_favourite(
    tmdb_id: int,
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    db.query(models.Favourite).filter_by(
        user_id=current_user.id, tmdb_id=tmdb_id
    ).delete()
    db.commit()
    return {"status": "removed", "is_favourite": False}


@api.get("/favourites")
def get_favourites(
    db: Session = Depends(database.get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return (
        db.query(models.Favourite)
        .filter_by(user_id=current_user.id)
        .order_by(models.Favourite.added_at.desc())
        .all()
    )


@api.get("/favourites/check/{tmdb_id}")
def check_favourite(
    tmdb_id: int,
    db: Session = Depends(database.get_db),
    current_user: Optional[models.User] = Depends(auth.get_optional_user),
):
    if not current_user:
        return {"is_favourite": False}
    exists = db.query(models.Favourite).filter_by(
        user_id=current_user.id, tmdb_id=tmdb_id
    ).first()
    return {"is_favourite": bool(exists)}


# ── TMDB Routes ───────────────────────────────────────────────────────────────
@api.get("/trending")
def get_trending(page: int = 1):
    data = tmdb_get("/trending/movie/week", {"page": page})
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}


@api.get("/popular")
def get_popular(page: int = 1):
    data = tmdb_get("/movie/popular", {"page": page})
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}


@api.get("/top-rated")
def get_top_rated(page: int = 1):
    data = tmdb_get("/movie/top_rated", {"page": page})
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}


@api.get("/genre/{genre_id}")
def get_by_genre(genre_id: int, page: int = 1):
    data = tmdb_get("/discover/movie", {
        "with_genres": genre_id,
        "sort_by": "popularity.desc",
        "page": page,
    })
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}


@api.get("/search")
def search_movies(q: str = Query(..., min_length=1), page: int = 1):
    data = tmdb_get("/search/movie", {"query": q, "page": page})
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}


@api.get("/recommend/{movie_id}")
def get_recommendations(movie_id: int):
    data = tmdb_get(f"/movie/{movie_id}/recommendations")
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": 1}


@api.get("/movie/{movie_id}")
def get_movie_detail(movie_id: int):
    data = tmdb_get(f"/movie/{movie_id}", {"append_to_response": "videos,credits"})
    if not data:
        raise HTTPException(404, "Movie not found")
    return data


@api.get("/discover/bollywood")
def get_bollywood(page: int = 1):
    data = tmdb_get("/discover/movie", {"with_original_language": "hi", "sort_by": "popularity.desc", "page": page})
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}


@api.get("/discover/hollywood")
def get_hollywood(page: int = 1):
    data = tmdb_get("/discover/movie", {"with_original_language": "en", "sort_by": "popularity.desc", "page": page})
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}


@api.get("/discover/south-indian")
def get_south_indian(page: int = 1):
    data = tmdb_get("/discover/movie", {"with_original_language": "ta", "sort_by": "popularity.desc", "page": page})
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}


@api.get("/discover/hindi-dubbed")
def get_hindi_dubbed(page: int = 1):
    data = tmdb_get("/discover/movie", {"with_original_language": "hi", "sort_by": "vote_count.desc", "page": page})
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}


@api.get("/discover/web-series")
def get_web_series(page: int = 1):
    data = tmdb_get("/discover/tv", {"sort_by": "popularity.desc", "page": page})
    if not data:
        return {"results": [], "total_pages": 1}
    return {"results": data.get("results", []), "total_pages": data.get("total_pages", 1)}
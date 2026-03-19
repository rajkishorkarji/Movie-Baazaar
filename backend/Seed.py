"""
seed.py — Populate PostgreSQL with test data for local practice
Run: python seed.py

What this creates:
  - 5 test users (with hashed passwords)
  - ratings for popular movies
  - comments/reviews
  - watch history entries
  - verifies everything was stored correctly
"""

import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from database import SessionLocal, engine
import models
from auth import hash_password

# ── Colour helpers for terminal output ───────────────────────────────────────
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):  print(f"  {GREEN}✓{RESET} {msg}")
def err(msg): print(f"  {RED}✗{RESET} {msg}")
def info(msg): print(f"  {BLUE}→{RESET} {msg}")
def header(msg): print(f"\n{BOLD}{YELLOW}{msg}{RESET}")


# ── Test users ────────────────────────────────────────────────────────────────
TEST_USERS = [
    {
        "username": "rajkishor",
        "email":    "rajkishor@example.com",
        "password": "password123",
    },
    {
        "username": "priya_movies",
        "email":    "priya@example.com",
        "password": "test1234",
    },
    {
        "username": "film_buff_42",
        "email":    "filmbuff@example.com",
        "password": "movies99",
    },
    {
        "username": "cinephile",
        "email":    "cinephile@example.com",
        "password": "cinema2024",
    },
    {
        "username": "reel_talk",
        "email":    "reeltalk@example.com",
        "password": "popcorn1",
    },
]

# ── Popular TMDB movie IDs with titles (for test data) ───────────────────────
TEST_MOVIES = [
    {"tmdb_id": 550,    "title": "Fight Club",           "poster": "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg"},
    {"tmdb_id": 238,    "title": "The Godfather",         "poster": "/3bhkrj58Vtu7enYsLLeWorxmqad.jpg"},
    {"tmdb_id": 278,    "title": "The Shawshank Redemption", "poster": "/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg"},
    {"tmdb_id": 424,    "title": "Schindler's List",      "poster": "/sF1U4EUQS8YHUYjNl3pMGNIQyr0.jpg"},
    {"tmdb_id": 155,    "title": "The Dark Knight",       "poster": "/qJ2tW6WMUDux911r6m7haRef0WH.jpg"},
    {"tmdb_id": 13,     "title": "Forrest Gump",          "poster": "/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg"},
    {"tmdb_id": 769,    "title": "GoodFellas",            "poster": "/aKuFiU82s5ISJpGZp7YkIr3kCUd.jpg"},
    {"tmdb_id": 680,    "title": "Pulp Fiction",          "poster": "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg"},
    {"tmdb_id": 122,    "title": "The Lord of the Rings", "poster": "/rCzpDGLbOoPwLjy3OAm5NUPOTrC.jpg"},
    {"tmdb_id": 27205,  "title": "Inception",             "poster": "/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg"},
]

# ── Ratings per user (user_index → list of (movie_index, score)) ─────────────
TEST_RATINGS = {
    0: [(0,5),(1,5),(2,4),(3,4),(4,5),(9,5)],   # rajkishor
    1: [(0,3),(1,4),(4,5),(5,4),(6,3),(7,5)],   # priya
    2: [(1,5),(2,5),(3,5),(4,4),(8,4),(9,4)],   # film_buff
    3: [(0,4),(5,5),(6,5),(7,4),(8,3),(9,3)],   # cinephile
    4: [(2,3),(3,4),(4,5),(5,3),(6,4),(7,5)],   # reel_talk
}

# ── Comments per user ─────────────────────────────────────────────────────────
TEST_COMMENTS = [
    # (user_index, movie_index, comment)
    (0, 0,  "Absolute masterpiece. The twist at the end still blows my mind every rewatch."),
    (0, 4,  "Heath Ledger as Joker is the greatest villain performance in cinema history. Period."),
    (0, 9,  "Nolan at his absolute best. The layered dream sequences are mind-bending."),
    (1, 1,  "The Godfather is not just a movie, it's a cultural landmark. Marlon Brando is perfection."),
    (1, 7,  "Tarantino's dialogue writing is unmatched. Every scene crackles with energy."),
    (1, 4,  "The practical effects and the chase sequences hold up even today. Iconic."),
    (2, 2,  "This movie taught me that hope is the best thing in the world. Morgan Freeman narrating = perfection."),
    (2, 1,  "The restaurant scene with Pacino is worth watching the entire film just for that moment."),
    (2, 9,  "The zero gravity hallway fight scene is cinema history."),
    (3, 5,  "Tom Hanks deserved every award for this. Simple, beautiful, emotional storytelling."),
    (3, 6,  "Scorsese and De Niro make every scene feel dangerous and alive."),
    (3, 7,  "The non-linear storytelling was revolutionary in 1994 and still feels fresh."),
    (4, 8,  "The Fellowship of the Ring perfectly sets up one of the greatest trilogies ever made."),
    (4, 4,  "Why so serious? One of my most rewatched films ever."),
    (4, 3,  "A difficult but necessary film. Spielberg's direction is impeccable throughout."),
]

# ── Watch history per user (user_index → list of movie_indexes) ──────────────
TEST_HISTORY = {
    0: [0, 1, 4, 9, 2],
    1: [1, 7, 4, 5, 6],
    2: [2, 3, 8, 1, 9],
    3: [5, 6, 7, 0, 3],
    4: [8, 4, 2, 3, 7],
}


def seed():
    header("=" * 50)
    header("  Movie Baazaar — Database Seed Script")
    header("=" * 50)

    db: Session = SessionLocal()

    try:
        # ── Step 1: Create tables ─────────────────────────────────────────────
        header("STEP 1: Creating tables")
        models.Base.metadata.create_all(bind=engine)
        ok("All tables created / verified")

        # ── Step 2: Seed users ────────────────────────────────────────────────
        header("STEP 2: Creating test users")
        created_users = []
        for u in TEST_USERS:
            existing = db.query(models.User).filter_by(email=u["email"]).first()
            if existing:
                info(f"User '{u['username']}' already exists — skipping")
                created_users.append(existing)
                continue
            user = models.User(
                username=u["username"],
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                is_verified=True,
            )
            db.add(user)
            db.flush()   # get the ID without committing
            created_users.append(user)
            ok(f"Created user: {u['username']} ({u['email']}) / password: {u['password']}")

        db.commit()
        # refresh all to get IDs
        for u in created_users:
            db.refresh(u)

        # ── Step 3: Seed ratings ──────────────────────────────────────────────
        header("STEP 3: Creating ratings")
        rating_count = 0
        for user_idx, movie_ratings in TEST_RATINGS.items():
            user = created_users[user_idx]
            for movie_idx, score in movie_ratings:
                movie = TEST_MOVIES[movie_idx]
                existing = db.query(models.Rating).filter_by(
                    user_id=user.id, tmdb_id=movie["tmdb_id"]
                ).first()
                if existing:
                    continue
                db.add(models.Rating(
                    user_id=user.id,
                    tmdb_id=movie["tmdb_id"],
                    score=score,
                ))
                rating_count += 1
        db.commit()
        ok(f"Created {rating_count} ratings across {len(TEST_MOVIES)} movies")

        # ── Step 4: Seed comments ─────────────────────────────────────────────
        header("STEP 4: Creating comments")
        comment_count = 0
        for user_idx, movie_idx, body in TEST_COMMENTS:
            user  = created_users[user_idx]
            movie = TEST_MOVIES[movie_idx]
            existing = db.query(models.Comment).filter_by(
                user_id=user.id, tmdb_id=movie["tmdb_id"]
            ).first()
            if existing:
                continue
            db.add(models.Comment(
                user_id=user.id,
                tmdb_id=movie["tmdb_id"],
                body=body,
            ))
            comment_count += 1
        db.commit()
        ok(f"Created {comment_count} comments")

        # ── Step 5: Seed watch history ────────────────────────────────────────
        header("STEP 5: Creating watch history")
        history_count = 0
        for user_idx, movie_indexes in TEST_HISTORY.items():
            user = created_users[user_idx]
            for movie_idx in movie_indexes:
                movie = TEST_MOVIES[movie_idx]
                existing = db.query(models.WatchHistory).filter_by(
                    user_id=user.id, tmdb_id=movie["tmdb_id"]
                ).first()
                if existing:
                    continue
                db.add(models.WatchHistory(
                    user_id=user.id,
                    tmdb_id=movie["tmdb_id"],
                    movie_title=movie["title"],
                    poster_path=movie["poster"],
                ))
                history_count += 1
        db.commit()
        ok(f"Created {history_count} watch history entries")

        # ── Step 6: Verify everything in DB ──────────────────────────────────
        header("STEP 6: Verification")
        u_count = db.query(models.User).count()
        r_count = db.query(models.Rating).count()
        c_count = db.query(models.Comment).count()
        h_count = db.query(models.WatchHistory).count()

        print(f"\n  {'Table':<20} {'Rows':>6}")
        print(f"  {'-'*28}")
        print(f"  {'users':<20} {u_count:>6}")
        print(f"  {'ratings':<20} {r_count:>6}")
        print(f"  {'comments':<20} {c_count:>6}")
        print(f"  {'watch_history':<20} {h_count:>6}")

        # ── Step 7: Show login credentials ───────────────────────────────────
        header("STEP 7: Test Login Credentials")
        print(f"\n  {'Email':<35} {'Password':<15} {'Username'}")
        print(f"  {'-'*65}")
        for u in TEST_USERS:
            print(f"  {u['email']:<35} {u['password']:<15} {u['username']}")

        print(f"\n{GREEN}{BOLD}✅ Seed complete! Your database is ready for testing.{RESET}")
        print(f"\n  Start your backend:  {YELLOW}uvicorn main:api --reload{RESET}")
        print(f"  API docs:            {YELLOW}http://localhost:8000/docs{RESET}\n")

    except Exception as e:
        db.rollback()
        err(f"Seed failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    seed()
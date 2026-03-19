"""
inspect_db.py — See everything stored in your PostgreSQL database
Run: python inspect_db.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv
load_dotenv()

from sqlalchemy.orm import Session
from sqlalchemy import func
from database import SessionLocal
import models

GREEN  = "\033[92m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"
DIM    = "\033[2m"

def header(msg):
    print(f"\n{BOLD}{YELLOW}{'─'*55}{RESET}")
    print(f"{BOLD}{YELLOW}  {msg}{RESET}")
    print(f"{BOLD}{YELLOW}{'─'*55}{RESET}")

def row(label, value):
    print(f"  {DIM}{label:<22}{RESET} {value}")


def inspect():
    db: Session = SessionLocal()

    try:
        # ── Users ─────────────────────────────────────────────────────────────
        header("USERS")
        users = db.query(models.User).order_by(models.User.id).all()
        if not users:
            print("  No users found. Run: python seed.py")
        else:
            print(f"  {'ID':<5} {'Username':<20} {'Email':<35} {'Verified'}")
            print(f"  {'-'*70}")
            for u in users:
                verified = f"{GREEN}✓{RESET}" if u.is_verified else "✗"
                joined   = u.created_at.strftime("%d %b %Y") if u.created_at else "—"
                print(f"  {u.id:<5} {u.username:<20} {u.email:<35} {verified}  joined {joined}")

        # ── Ratings ───────────────────────────────────────────────────────────
        header("RATINGS")
        ratings = (
            db.query(models.Rating, models.User)
            .join(models.User)
            .order_by(models.Rating.tmdb_id, models.Rating.score.desc())
            .all()
        )
        if not ratings:
            print("  No ratings found.")
        else:
            print(f"  {'TMDB ID':<12} {'User':<20} {'Score':<8} {'Rated On'}")
            print(f"  {'-'*55}")
            for r, u in ratings:
                stars = "★" * int(r.score) + "☆" * (5 - int(r.score))
                dated = r.created_at.strftime("%d %b %Y") if r.created_at else "—"
                print(f"  {r.tmdb_id:<12} {u.username:<20} {stars}  {r.score}/5  {dated}")

        # ── Per-movie rating averages ─────────────────────────────────────────
        header("RATING AVERAGES PER MOVIE")
        avgs = (
            db.query(
                models.Rating.tmdb_id,
                func.round(func.avg(models.Rating.score).cast(
                    __import__('sqlalchemy').Numeric(10, 2)), 2
                ).label("avg"),
                func.count(models.Rating.id).label("count"),
            )
            .group_by(models.Rating.tmdb_id)
            .order_by(func.avg(models.Rating.score).desc())
            .all()
        )
        if not avgs:
            print("  No ratings yet.")
        else:
            print(f"  {'TMDB ID':<12} {'Avg Score':<12} {'# Ratings'}")
            print(f"  {'-'*35}")
            for tmdb_id, avg, count in avgs:
                bar = "█" * int(float(avg)) + "░" * (5 - int(float(avg)))
                print(f"  {tmdb_id:<12} {bar} {avg}/5  ({count} ratings)")

        # ── Comments ──────────────────────────────────────────────────────────
        header("COMMENTS")
        comments = (
            db.query(models.Comment, models.User)
            .join(models.User)
            .order_by(models.Comment.created_at.desc())
            .all()
        )
        if not comments:
            print("  No comments found.")
        else:
            print(f"  {'ID':<6} {'TMDB ID':<10} {'User':<18} Comment")
            print(f"  {'-'*75}")
            for c, u in comments:
                body_preview = c.body[:55] + "..." if len(c.body) > 55 else c.body
                print(f"  {c.id:<6} {c.tmdb_id:<10} {u.username:<18} {body_preview}")

        # ── Watch History ─────────────────────────────────────────────────────
        header("WATCH HISTORY")
        history = (
            db.query(models.WatchHistory, models.User)
            .join(models.User)
            .order_by(models.WatchHistory.watched_at.desc())
            .all()
        )
        if not history:
            print("  No watch history found.")
        else:
            print(f"  {'User':<20} {'TMDB ID':<10} {'Movie Title':<30} {'Watched'}")
            print(f"  {'-'*75}")
            for h, u in history:
                watched = h.watched_at.strftime("%d %b %Y") if h.watched_at else "—"
                print(f"  {u.username:<20} {h.tmdb_id:<10} {h.movie_title:<30} {watched}")

        # ── Per-user summary ──────────────────────────────────────────────────
        header("PER-USER SUMMARY")
        print(f"  {'Username':<20} {'Ratings':<10} {'Comments':<12} {'History'}")
        print(f"  {'-'*55}")
        for u in users:
            rc = db.query(models.Rating).filter_by(user_id=u.id).count()
            cc = db.query(models.Comment).filter_by(user_id=u.id).count()
            hc = db.query(models.WatchHistory).filter_by(user_id=u.id).count()
            print(f"  {u.username:<20} {rc:<10} {cc:<12} {hc}")

        # ── Totals ────────────────────────────────────────────────────────────
        header("TOTALS")
        print(f"  Users:         {db.query(models.User).count()}")
        print(f"  Ratings:       {db.query(models.Rating).count()}")
        print(f"  Comments:      {db.query(models.Comment).count()}")
        print(f"  Watch history: {db.query(models.WatchHistory).count()}")
        print()

    except Exception as e:
        print(f"\n  Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    inspect()
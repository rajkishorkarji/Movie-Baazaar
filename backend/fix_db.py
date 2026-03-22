import psycopg2

DB_URL = "postgresql://movie_baazaar_db_user:giziK0RTjZHHOHKVRef04pB2kVZKgxX4@dpg-d6rdfck50q8c73c0nsf0-a.oregon-postgres.render.com/movie_baazaar_db"

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

cur.execute("""
CREATE TABLE IF NOT EXISTS favourites (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id     INTEGER NOT NULL,
    movie_title VARCHAR,
    poster_path VARCHAR,
    added_at    TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_user_favourite UNIQUE (user_id, tmdb_id)
);
""")

conn.commit()
cur.close()
conn.close()
print("Favourites table created!")
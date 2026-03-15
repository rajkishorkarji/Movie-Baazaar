import requests

TMDB_API_KEY = "19752fb21d9c9448fe7e4ecfe88a7d8d"

def get_recommendations(movie_id):
    try:
        response = requests.get(
            f"https://api.themoviedb.org/3/movie/{movie_id}/recommendations",
            params={"api_key": TMDB_API_KEY},
            timeout=5
        )
        response.raise_for_status()
        return response.json().get('results', [])
    except Exception as e:
        print(f"Recommendation failed: {e}")
        return []


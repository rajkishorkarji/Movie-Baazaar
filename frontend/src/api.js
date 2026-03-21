import axios from 'axios';

const TMDB_KEY = '19752fb21d9c9448fe7e4ecfe88a7d8d';

// ✅ Increased timeout to 20s for slow mobile networks
const TMDB = axios.create({
  baseURL: 'https://api.themoviedb.org/3',
  timeout: 20000,
  params: { api_key: TMDB_KEY },
});

// ✅ Uses VITE_API_URL in production (Render), falls back to localhost for local dev
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

// Restore token on page load
const savedToken = localStorage.getItem('mb_token');
if (savedToken) {
  API.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

// ✅ Add response interceptor to handle token expiry
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('mb_token');
      delete API.defaults.headers.common['Authorization'];
    }
    return Promise.reject(error);
  }
);

export default API;

export const getTrending        = (page = 1) => TMDB.get('/trending/movie/week', { params: { page } });
export const getPopular         = (page = 1) => TMDB.get('/movie/popular',        { params: { page } });
export const getTopRated        = (page = 1) => TMDB.get('/movie/top_rated',      { params: { page } });
export const getByGenre         = (id, page = 1) => TMDB.get('/discover/movie',   { params: { with_genres: id, sort_by: 'popularity.desc', page } });
export const searchMovies       = (q,  page = 1) => TMDB.get('/search/movie',     { params: { query: q, page } });
export const getBollywood       = (page = 1) => TMDB.get('/discover/movie',       { params: { with_original_language: 'hi', sort_by: 'popularity.desc', page } });
export const getHollywood       = (page = 1) => TMDB.get('/discover/movie',       { params: { with_original_language: 'en', sort_by: 'popularity.desc', page } });
export const getSouthIndian     = (page = 1) => TMDB.get('/discover/movie',       { params: { with_original_language: 'ta', sort_by: 'popularity.desc', page } });
export const getHindiDubbed     = (page = 1) => TMDB.get('/discover/movie',       { params: { with_original_language: 'hi', sort_by: 'vote_count.desc',  page } });
export const getWebSeries       = (page = 1) => TMDB.get('/discover/tv',          { params: { sort_by: 'popularity.desc', page } });
export const getRecommendations = (movieId)  => TMDB.get(`/movie/${movieId}/recommendations`);
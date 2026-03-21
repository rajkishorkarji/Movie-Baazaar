import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ✅ ONE axios instance — all calls go through YOUR backend
const API = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

// Restore token on page load
const savedToken = localStorage.getItem('mb_token');
if (savedToken) {
  API.defaults.headers.common['Authorization'] = `Bearer ${savedToken}`;
}

// Clear token on 401
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

// ✅ All TMDB calls now go through your Render backend
export const getTrending        = (page = 1) => API.get('/trending', { params: { page } });
export const getPopular         = (page = 1) => API.get('/popular', { params: { page } });
export const getTopRated        = (page = 1) => API.get('/top-rated', { params: { page } });
export const getByGenre         = (id, page = 1) => API.get(`/genre/${id}`, { params: { page } });
export const searchMovies       = (q, page = 1) => API.get('/search', { params: { q, page } });
export const getRecommendations = (movieId) => API.get(`/recommend/${movieId}`);

// ⚠️ These 4 don't have backend routes yet — need to add them
export const getBollywood       = (page = 1) => API.get('/discover/bollywood', { params: { page } });
export const getHollywood       = (page = 1) => API.get('/discover/hollywood', { params: { page } });
export const getSouthIndian     = (page = 1) => API.get('/discover/south-indian', { params: { page } });
export const getHindiDubbed     = (page = 1) => API.get('/discover/hindi-dubbed', { params: { page } });
export const getWebSeries       = (page = 1) => API.get('/discover/web-series', { params: { page } });
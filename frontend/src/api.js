import axios from 'axios';

const API = axios.create({
  baseURL: 'https://movie-baazaar.onrender.com',
  timeout: 15000,
});

export const getTrending        = (page = 1) => API.get('/trending',      { params: { page } });
export const getPopular         = (page = 1) => API.get('/popular',       { params: { page } });
export const getTopRated        = (page = 1) => API.get('/top-rated',     { params: { page } });
export const getByGenre         = (id, page = 1) => API.get(`/genre/${id}`, { params: { page } });
export const searchMovies       = (q, page = 1)  => API.get('/search',    { params: { q, page } });
export const getBollywood       = (page = 1) => API.get('/bollywood',     { params: { page } });
export const getHollywood       = (page = 1) => API.get('/hollywood',     { params: { page } });
export const getSouthIndian     = (page = 1) => API.get('/south-indian',  { params: { page } });
export const getHindiDubbed     = (page = 1) => API.get('/hindi-dubbed',  { params: { page } });
export const getWebSeries       = (page = 1) => API.get('/web-series',    { params: { page } });
export const getRecommendations = (movieId)  => API.get(`/recommend/${movieId}`);

export default API;
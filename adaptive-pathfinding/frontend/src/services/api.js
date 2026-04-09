import axios from 'axios';
const API = axios.create({ baseURL: 'http://127.0.0.1:5000/api' });

export const trainRL = (scenario) => API.post('/train', { scenario });
export const runPathfind = (payload) => API.post('/pathfind', payload);
export const runComparison = (payload) => API.post('/compare', payload);
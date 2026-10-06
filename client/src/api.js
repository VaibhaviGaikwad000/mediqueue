import axios from 'axios';

export const apiBaseURL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api';
const api = axios.create({ baseURL: apiBaseURL });
api.interceptors.request.use(config => {
  const token = localStorage.getItem('mq_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
export function errorMessage(error) {
  if (axios.isAxiosError(error) && !error.response) {
    return `Can't reach the MediQueue API at ${apiBaseURL}. Start the server with "npm run dev" in the server folder, then try again.`;
  }
  return error.response?.data?.message || error.message || 'Something went wrong';
}
export default api;

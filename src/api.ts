import axios from "axios";

const APU_URL = 'https://shift-intensive.ru';

export const api = axios.create({
  baseURL: APU_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if(token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
})
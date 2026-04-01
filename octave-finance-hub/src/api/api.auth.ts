// src/api/auth.api.ts
// Your custom axios instance
import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1/";

export const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Add a request interceptor to inject the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("octave_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export type AppRole = "SUPER_ADMIN" | "FINANCE_ADMIN" | "EXPENSE_VIEWER";

export interface SendOtpPayload {
  email: string;
  role: AppRole;
}

export const sendOtpRequest = async (payload: SendOtpPayload) => {
  // Axios automatically prepends the baseURL ("/api/v1/")
  const response = await api.post("auth/login/otp/send", payload);
  return response.data;
};

export interface VerifyOtpPayload {
  email: string;
  role: AppRole;
  otp: string;
}

export const verifyOtpRequest = async (payload: VerifyOtpPayload) => {
  const response = await api.post("auth/login/otp/verify", payload);
  return response.data;
};

import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  withCredentials: true,
});

// Attach Clerk token to every request
api.interceptors.request.use(async (config) => {
  if (typeof window !== "undefined") {
    // Dynamic import to avoid SSR issues
    const { getToken } = await import("@clerk/nextjs");
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;

      let sanitizedMessage = "Request failed. Please try again.";
      if (status === 400) sanitizedMessage = "Invalid request.";
      else if (status === 401) sanitizedMessage = "Authentication required.";
      else if (status === 403) sanitizedMessage = "You are not allowed to perform this action.";
      else if (status === 404) sanitizedMessage = "Resource not found.";
      else if (status === 409) sanitizedMessage = "Request conflict. Refresh and try again.";
      else if (status === 429) sanitizedMessage = "Too many requests. Please wait and retry.";
      else if (status === 503) sanitizedMessage = "Service temporarily unavailable. Try again shortly.";

      if (error.response?.data && typeof error.response.data === "object") {
        (error.response.data as { message?: string }).message = sanitizedMessage;
      }
    }

    return Promise.reject(error);
  }
);

export { api };

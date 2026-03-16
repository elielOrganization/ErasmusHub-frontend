/**
 * Base API URL for browser requests (client-side).
 * Uses "/api" which is proxied by Next.js rewrites to the real backend.
 * This works in both development and production (Vercel).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/**
 * Base API URL for server requests (SSR / server components).
 * In production it points directly to the Vercel backend.
 * In local development it uses "http://127.0.0.1:8000".
 */
export const SERVER_API_URL = process.env.SERVER_API_URL || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

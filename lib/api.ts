/**
 * URL base de la API para peticiones del navegador (client-side).
 * Usa "/api" que es proxied por Next.js rewrites al backend real.
 * Esto funciona tanto en desarrollo como en producción (Vercel).
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api";

/**
 * URL base de la API para peticiones del servidor (SSR / server components).
 * En producción apunta directamente al backend de Vercel.
 * En desarrollo local usa "http://127.0.0.1:8000".
 */
export const SERVER_API_URL = process.env.SERVER_API_URL || process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

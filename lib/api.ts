/**
 * URL base de la API para peticiones del navegador (client-side).
 * En produccion usa "/api" (proxied por Next.js rewrites).
 * En desarrollo local usa "http://127.0.0.1:8000".
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * URL base de la API para peticiones del servidor (SSR / server components).
 * En produccion apunta directamente al backend de Vercel.
 * En desarrollo local usa "http://127.0.0.1:8000".
 */
export const SERVER_API_URL = process.env.SERVER_API_URL || "http://127.0.0.1:8000";

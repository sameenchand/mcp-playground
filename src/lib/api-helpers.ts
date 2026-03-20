/**
 * Shared helpers for Public API v1 routes.
 * Handles CORS, consistent response format, and versioning metadata.
 */

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

/** Standard JSON response with CORS headers and API version metadata. */
export function apiResponse<T>(
  data: T,
  status = 200,
): Response {
  return Response.json(
    {
      ok: status >= 200 && status < 300,
      ...data,
      _meta: {
        api: "v1",
        docs: "https://mcpplayground.tech/docs/api",
      },
    },
    { status, headers: CORS_HEADERS },
  );
}

/** Error response with consistent shape. */
export function apiError(
  error: string,
  code: string,
  status: number,
): Response {
  return apiResponse({ error, code }, status);
}

/** Handle CORS preflight OPTIONS requests. */
export function corsOptions(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

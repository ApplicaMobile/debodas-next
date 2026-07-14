const DEFAULT_API_URL = "http://localhost/wp-json/debodas/v1";

export function getApiBaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
  return url.replace(/\/$/, "");
}

export class ApiRequestError extends Error {
  status: number;
  code: string;

  constructor(message: string, status: number, code = "api_error") {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const baseUrl = getApiBaseUrl();
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const response = await fetch(url, {
    ...init,
    headers: {
      Accept: "application/json",
      ...init?.headers,
    },
    next: init?.next ?? { revalidate: 60 },
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = payload as { code?: string; message?: string } | null;
    throw new ApiRequestError(
      error?.message ?? `Error HTTP ${response.status}`,
      response.status,
      error?.code ?? "http_error",
    );
  }

  return payload as T;
}

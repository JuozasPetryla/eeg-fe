const API_BASE_URL = "/api";
const TOKEN_STORAGE_KEYS = ["access_token", "auth_token", "token"] as const;
const DEV_DEFAULT_EMAIL =
	import.meta.env.VITE_DEV_DEFAULT_EMAIL ?? "john.doe@example.com";
const DEV_DEFAULT_PASSWORD =
	import.meta.env.VITE_DEV_DEFAULT_PASSWORD ?? "password123";

let autoLoginPromise: Promise<string | null> | null = null;

export function getStoredAccessToken(): string | null {
	for (const key of TOKEN_STORAGE_KEYS) {
		const token = window.localStorage.getItem(key);
		if (token) {
			return token;
		}
	}

	return null;
}

function storeAccessToken(token: string): void {
	window.localStorage.setItem("access_token", token);
}

async function tryAutoLogin(): Promise<string | null> {
	if (autoLoginPromise) {
		return autoLoginPromise;
	}

	autoLoginPromise = (async () => {
		const response = await fetch(`${API_BASE_URL}/auth/login`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				email: DEV_DEFAULT_EMAIL,
				password: DEV_DEFAULT_PASSWORD,
			}),
		});

		if (!response.ok) {
			return null;
		}

		const data = (await response.json()) as { access_token?: string };
		if (!data.access_token) {
			return null;
		}

		storeAccessToken(data.access_token);
		return data.access_token;
	})();

	try {
		return await autoLoginPromise;
	} finally {
		autoLoginPromise = null;
	}
}

export async function apiRequest(
	path: string,
	options?: RequestInit
): Promise<Response> {
	const executeRequest = (token: string | null) =>
		fetch(`${API_BASE_URL}${path}`, {
			headers: {
				...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...(options?.headers ?? {}),
			},
			...options,
		});

	let response = await executeRequest(getStoredAccessToken());

	if (response.status === 401 && path !== "/auth/login") {
		const refreshedToken = await tryAutoLogin();
		if (refreshedToken) {
			response = await executeRequest(refreshedToken);
		}
	}

	return response;
}

export async function apiFetch<T>(
	path: string,
	options?: RequestInit
): Promise<T> {
	const response = await apiRequest(path, options);

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`API error ${response.status}: ${text}`);
	}

	if (response.status === 204) {
		return undefined as T;
	}

	return response.json() as Promise<T>;
}

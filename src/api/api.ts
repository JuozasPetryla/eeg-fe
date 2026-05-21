const API_BASE_URL = "/api";
const TOKEN_STORAGE_KEYS = ["access_token", "auth_token", "token"] as const;
const USER_ID_STORAGE_KEY = "uploaded_by_user_id";
const DEV_AUTH_BYPASS_EMAIL = import.meta.env.VITE_DEV_AUTH_BYPASS_EMAIL;

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
	const userId = parseUserIdFromJwt(token);
	if (userId) {
		window.localStorage.setItem(USER_ID_STORAGE_KEY, String(userId));
	}
}

function getStoredUserId(): string | null {
	return window.localStorage.getItem(USER_ID_STORAGE_KEY);
}

function parseUserIdFromJwt(token: string): string | null {
	try {
		const parts = token.split(".");
		if (parts.length !== 3) return null;
		const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const padded = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
		const decoded = atob(padded);
		const parsed = JSON.parse(decoded) as Record<string, unknown>;
		if (typeof parsed.user_id === "string" || typeof parsed.user_id === "number") {
			return String(parsed.user_id);
		}
		if (typeof parsed.sub === "string" || typeof parsed.sub === "number") {
			return String(parsed.sub);
		}
		if (typeof parsed.id === "string" || typeof parsed.id === "number") {
			return String(parsed.id);
		}
	} catch {
		return null;
	}

	return null;
}

export async function apiRequest(
	path: string,
	options?: RequestInit
): Promise<Response> {
	const token = getStoredAccessToken();
	if (options?.body instanceof FormData) {
		const formData = options.body;
		if (!formData.has("uploaded_by_user_id")) {
			const token = getStoredAccessToken();
			const userId = getStoredUserId() ?? (token ? parseUserIdFromJwt(token) : null);
			if (userId) {
				formData.append("uploaded_by_user_id", userId);
			}
		}
	}

	return fetch(`${API_BASE_URL}${path}`, {
		headers: {
			...(options?.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
			...(DEV_AUTH_BYPASS_EMAIL ? { "X-Dev-User-Email": DEV_AUTH_BYPASS_EMAIL } : {}),
			...(options?.headers ?? {}),
		},
		...options,
	});
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

export async function login(email: string, password: string): Promise<{ access_token: string }> {
	const response = await apiRequest("/auth/login", {
		method: "POST",
		body: JSON.stringify({ email, password }),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`API error ${response.status}: ${text}`);
	}

	const data = (await response.json()) as { access_token: string };
	storeAccessToken(data.access_token);
	return data;
}

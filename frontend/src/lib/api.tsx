const API_URL = process.env.NEXT_PUBLIC_API_URL;

type ApiOptions = {
  method?: string;
  body?: object;
  token?: string;
  idempotencyKey?: string;
  skipRefresh?: boolean; // internal — retry-loop ko dobara refresh try karne se rokta hai
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function rawApiCall<T = any>(path: string, options: ApiOptions): Promise<{ status: number; data: T }> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;
  if (options.idempotencyKey) headers['Idempotency-Key'] = options.idempotencyKey;

  const res = await fetch(`${API_URL}${path}`, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: 'no-store'
  });

  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function clearAuthStorage() {
  localStorage.removeItem('amrutam_token');
  localStorage.removeItem('amrutam_role');
  localStorage.removeItem('amrutam_refresh_token');
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiCall<T = any>(path: string, options: ApiOptions = {}): Promise<{ status: number; data: T }> {
  const result = await rawApiCall<T>(path, options);

  const isUnauthorized = result.status === 401;
  // Sirf browser mein, authenticated request thi, aur yeh already ek retry nahi hai — tabhi refresh try karo
  const canRetry = typeof window !== 'undefined' && options.token && !options.skipRefresh;

  if (isUnauthorized && canRetry) {
    const storedRefreshToken = localStorage.getItem('amrutam_refresh_token');
    if (!storedRefreshToken) {
      clearAuthStorage();
      return result;
    }

    const refreshResult = await rawApiCall<{ data?: { accessToken: string; refreshToken: string } }>(
      '/auth/refresh',
      { method: 'POST', body: { refreshToken: storedRefreshToken }, skipRefresh: true }
    );

    if (refreshResult.status === 200 && refreshResult.data.data) {
      const { accessToken, refreshToken } = refreshResult.data.data;
      localStorage.setItem('amrutam_token', accessToken);
      localStorage.setItem('amrutam_refresh_token', refreshToken);
      // Original request ko naye token ke saath ek hi baar retry karo
      return rawApiCall<T>(path, { ...options, token: accessToken, skipRefresh: true });
    }

    clearAuthStorage(); // refresh bhi fail — session sach mein khatam
  }

  return result;
}
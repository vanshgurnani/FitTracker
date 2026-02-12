import type {
  ExerciseIntensity,
  ExerciseLog,
  ExerciseType,
  FoodLog,
  MealType,
  UserProfile,
} from "@/lib/types";

const BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:3000";

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

function toQuery(params: Record<string, string | number | boolean | undefined>) {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue;
    usp.set(k, String(v));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type BackendResponse<T extends object> = { success?: boolean } & T;

async function requestJson<T extends object>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    token?: string | null;
    body?: unknown;
  } = {}
): Promise<BackendResponse<T>> {
  const url = joinUrl(BASE_URL, path);
  const headers: Record<string, string> = {};
  if (opts.token) headers.Authorization = `Bearer ${opts.token}`;

  const hasBody = opts.body !== undefined && opts.method !== "GET";
  if (hasBody) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: hasBody ? JSON.stringify(opts.body) : undefined,
  });

  const text = await res.text();
  let json: any = undefined;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = {};
  }

  const ok =
    res.ok &&
    (json?.success === undefined || json?.success === true) &&
    (json?.error === undefined || json?.error === null);

  if (!ok) {
    const message =
      json?.message ||
      json?.error ||
      (res.status === 401 ? "Unauthorized" : res.statusText) ||
      "Request failed";
    throw new ApiError(message, res.status);
  }

  return json as BackendResponse<T>;
}

// ---- Auth token storage ----

const TOKEN_KEY = "fittracker.jwt";
const PROFILE_KEY = "fittracker.profile";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getStoredProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: UserProfile | null) {
  if (!profile) {
    localStorage.removeItem(PROFILE_KEY);
    return;
  }
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function decodeJwtPayload(token: string): { id?: string; email?: string } {
  try {
    const [, payload] = token.split(".");
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(atob(normalized));
    return { id: json?.id, email: json?.email };
  } catch {
    return {};
  }
}

// ---- API methods ----

export async function login(email: string, password: string) {
  const res = await requestJson<{ accessToken: string }>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
  return res.accessToken;
}

export async function sendOtp(email: string, type: "register" | "forgot-password") {
  await requestJson<{ message: string }>("/api/auth/send-otp", {
    method: "POST",
    body: { email, type },
  });
}

export async function register(payload: {
  email: string;
  password: string;
  fullName?: string;
  otp: string;
}) {
  // backend accepts extra fields; keep it minimal
  const res = await requestJson<{ accessToken: string; email?: string }>(
    "/api/auth/register",
    {
      method: "POST",
      body: payload,
    }
  );
  return res.accessToken;
}

export async function getMyProfile(token: string) {
  // backend returns { userProfile, qrCode, type, ... }
  const res = await requestJson<{ userProfile: UserProfile }>("/api/auth/profile", {
    method: "GET",
    token,
  });
  return res.userProfile;
}

export async function updateMyProfile(
  token: string,
  updates: Partial<UserProfile>
): Promise<UserProfile> {
  // backend returns { type, message, data } (data = posted updates)
  await requestJson<{ message?: string }>("/api/auth/profile", {
    method: "PUT",
    token,
    body: updates,
  });
  // re-fetch canonical profile
  return await getMyProfile(token);
}

function normalizeFoodLog(raw: any): FoodLog {
  return {
    id: String(raw._id ?? raw.id),
    description: raw.description,
    mealType: raw.mealType,
    calories: raw.calories,
    protein: raw.protein,
    carbs: raw.carbs,
    fat: raw.fat,
    fiber: raw.fiber,
    sugar: raw.sugar,
    sodium: raw.sodium,
    aiAnalysis: raw.aiAnalysis,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
  };
}

function normalizeExerciseLog(raw: any): ExerciseLog {
  return {
    id: String(raw._id ?? raw.id),
    description: raw.description,
    exerciseType: raw.exerciseType,
    durationMinutes: raw.durationMinutes,
    intensity: raw.intensity,
    caloriesBurned: raw.caloriesBurned,
    aiAnalysis: raw.aiAnalysis,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : new Date().toISOString(),
  };
}

export async function getFoodLogs(
  token: string,
  params: { startDate?: string; endDate?: string; mealType?: MealType }
) {
  const res = await requestJson<{ foodLogs: any[] }>(
    `/api/food/user/logs${toQuery(params)}`,
    { method: "GET", token }
  );
  return (res.foodLogs ?? []).map(normalizeFoodLog);
}

export async function createFoodLog(
  token: string,
  payload: {
    description: string;
    mealType: MealType;
    calories: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    aiAnalysis?: string;
    createdAt?: string;
  }
) {
  const body = { ...payload } as any;
  delete body.createdAt;
  delete body.created_at;

  const res = await requestJson<{ foodLog: any }>("/api/food", {
    method: "POST",
    token,
    body,
  });
  return normalizeFoodLog(res.foodLog);
}

export async function deleteFoodLog(token: string, id: string) {
  await requestJson<{ message: string }>("/api/food", {
    method: "DELETE",
    token,
    body: { id },
  });
}

export async function getExerciseLogs(
  token: string,
  params: {
    startDate?: string;
    endDate?: string;
    exerciseType?: ExerciseType;
    intensity?: ExerciseIntensity;
  }
) {
  const res = await requestJson<{ exerciseLogs: any[] }>(
    `/api/exercise/user/logs${toQuery(params)}`,
    { method: "GET", token }
  );
  return (res.exerciseLogs ?? []).map(normalizeExerciseLog);
}

export async function createExerciseLog(
  token: string,
  payload: {
    description: string;
    exerciseType: ExerciseType;
    durationMinutes: number;
    intensity: ExerciseIntensity;
    caloriesBurned: number;
    aiAnalysis?: string;
    createdAt?: string;
  }
) {
  const body = { ...payload } as any;
  delete body.createdAt;
  delete body.created_at;

  const res = await requestJson<{ exerciseLog: any }>("/api/exercise", {
    method: "POST",
    token,
    body,
  });
  return normalizeExerciseLog(res.exerciseLog);
}

export async function deleteExerciseLog(token: string, id: string) {
  await requestJson<{ message: string }>("/api/exercise", {
    method: "DELETE",
    token,
    body: { id },
  });
}


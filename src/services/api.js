// src/services/api.js
// REST client for the Synelix Spring Boot backend (:8080).
//
// Every call carries the bearer token from login. Failures are surfaced as
// thrown ApiError objects rather than silently swapped for mock data: a
// dashboard showing invented numbers because the backend was unreachable is
// worse than one showing an error, particularly for a placement prediction.

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

const TOKEN_KEY = "synelix.token";
const USER_KEY = "synelix.user";

export class ApiError extends Error {
  constructor(message, status, fieldErrors) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors || null;
  }
}

// --- token storage -------------------------------------------------------

export const tokenStore = {
  get() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private browsing: the session simply does not persist */
    }
  },
  getUser() {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser(user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch {
      /* ignore */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch {
      /* ignore */
    }
  },
};

// --- core fetch wrapper --------------------------------------------------

let onUnauthorized = null;

/** Registered by AuthContext so a 401 anywhere can force a clean sign-out. */
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(endpoint, options = {}) {
  const token = tokenStore.get();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs || 15000);

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === "AbortError") {
      throw new ApiError("The server took too long to respond.", 0);
    }
    // A blocked CORS response and a dead server are indistinguishable to
    // fetch - both reject with the same opaque TypeError. Naming both causes
    // beats blaming the server, which sent people restarting a backend that
    // was running fine.
    const origin = window.location.origin;
    const sameHost = API_BASE_URL.includes(window.location.hostname);
    throw new ApiError(
      sameHost
        ? `Could not reach the Synelix backend at ${API_BASE_URL}. Is it running on port 8080?`
        : `Could not reach the Synelix backend at ${API_BASE_URL}. The page is open ` +
          `at ${origin}, which the backend may not allow. Try http://localhost:5173 ` +
          `instead, or check that the backend is running on port 8080.`,
      0
    );
  }
  clearTimeout(timeout);

  if (response.status === 204) return null;

  let body = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (!response.ok) {
    if (response.status === 401 && onUnauthorized) {
      onUnauthorized();
    }
    throw new ApiError(
      body?.message || `Request failed (${response.status})`,
      response.status,
      body?.fieldErrors
    );
  }

  return body;
}

const get = (endpoint) => request(endpoint);
const post = (endpoint, body) =>
  request(endpoint, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
const put = (endpoint, body) =>
  request(endpoint, { method: "PUT", body: JSON.stringify(body) });

const query = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.append(key, String(value));
    }
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
};

// --- authentication ------------------------------------------------------

export const authApi = {
  register: (name, email, password, role) =>
    post("/auth/register", { name, email, password, role }),

  login: (email, password) => post("/auth/login", { email, password }),

  me: () => get("/auth/me"),
};

// --- student -------------------------------------------------------------

export const studentApi = {
  getProfile: (email) => get(`/students/profile${query({ email })}`),

  saveProfile: (profile) => put("/students/profile", profile),

  getSkillGap: (targetRole, email) =>
    get(`/students/skill-gap${query({ targetRole, email })}`),

  analyzeResume: (resumeText, fileName, targetRole) =>
    post("/students/resume/analyze", { resumeText, fileName, targetRole }),

  getMatchedCompanies: (limit = 8, email) =>
    get(`/students/matched-companies${query({ limit, email })}`),
};

// --- prediction ----------------------------------------------------------

export const predictionApi = {
  evaluate: (params) => post("/prediction/evaluate", params),

  getHistory: (email) => get(`/prediction/history${query({ email })}`),

  modelInfo: () => get("/prediction/model-info"),
};

// --- roadmap -------------------------------------------------------------

export const roadmapApi = {
  getRoadmap: (targetRole, email) =>
    get(`/students/roadmap${query({ targetRole, email })}`),

  toggleTask: (taskId, done, email) =>
    post(`/students/roadmap/toggle${query({ taskId, done, email })}`),
};

// --- recruiter -----------------------------------------------------------

export const companyApi = {
  getCandidates: (search = "", department = "All", minScore) =>
    get(
      `/companies/candidates${query({
        search,
        department: department === "All" ? "" : department,
        minScore,
      })}`
    ),

  getCandidateById: (id) => get(`/companies/candidates/${id}`),

  toggleShortlist: (id) => post(`/companies/candidates/${id}/shortlist`),

  getShortlisted: () => get("/companies/shortlisted"),
};

// --- institution ---------------------------------------------------------

export const institutionApi = {
  getStats: () => get("/institution/stats"),
  getDepartments: () => get("/institution/departments"),
  getStudents: () => get("/institution/students"),
  getDrives: () => get("/institution/drives"),
  scheduleDrive: (drive) => post("/institution/drives", drive),
  getAuditReport: () => get("/institution/audit-report"),
};

// --- copilot -------------------------------------------------------------

export const copilotApi = {
  chat: (queryText, role = "student") =>
    post("/copilot/chat", { query: queryText, role }),
};

const API_TIMEOUT_MS = 10000;

/**
 * Notes API client with graceful in-memory fallback when backend isn't configured.
 * Backend base URL is resolved from:
 * - REACT_APP_API_BASE (preferred)
 * - REACT_APP_BACKEND_URL
 */
const resolvedBaseUrl =
  (process.env.REACT_APP_API_BASE || process.env.REACT_APP_BACKEND_URL || "").trim();

/** @typedef {{ id: string, title: string, content: string, updatedAt?: string, createdAt?: string }} Note */

let memoryNotes = /** @type {Note[]} */ ([
  {
    id: "welcome",
    title: "Welcome",
    content:
      "Create a note, edit it, and delete it.\n\nTip: Set REACT_APP_API_BASE or REACT_APP_BACKEND_URL to connect to the backend.",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeId() {
  // Good enough for a demo app; backend will provide IDs when connected.
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

async function request(path, options = {}) {
  if (!resolvedBaseUrl) {
    const err = new Error("Backend URL not configured");
    err.code = "NO_BACKEND";
    throw err;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const res = await fetch(`${resolvedBaseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      },
      signal: controller.signal
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(
        `API error ${res.status}${text ? `: ${text}` : ""}`
      );
      err.status = res.status;
      throw err;
    }

    // Some endpoints may return 204
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Attempts an API call; if the backend is missing/unreachable, runs fallback.
 * @template T
 * @param {() => Promise<T>} apiCall
 * @param {() => Promise<T>} fallbackCall
 * @returns {Promise<{ data: T, mode: 'api' | 'memory' }>}
 */
async function withFallback(apiCall, fallbackCall) {
  try {
    const data = await apiCall();
    return { data, mode: "api" };
  } catch (e) {
    // Network or missing backend -> fallback to memory.
    // If backend exists but errors, still fallback to keep app usable.
    await sleep(200);
    const data = await fallbackCall();
    return { data, mode: "memory" };
  }
}

// PUBLIC_INTERFACE
export async function listNotes() {
  /** Returns {data, mode} */
  return withFallback(
    async () => {
      // Expecting GET /notes -> Note[]
      return await request("/notes", { method: "GET" });
    },
    async () => {
      // Return newest updated first
      return [...memoryNotes].sort((a, b) =>
        (b.updatedAt || "").localeCompare(a.updatedAt || "")
      );
    }
  );
}

// PUBLIC_INTERFACE
export async function createNote(payload) {
  /** @type {{ title: string, content: string }} */
  const { title, content } = payload;

  return withFallback(
    async () => {
      // Expecting POST /notes {title, content} -> Note
      return await request("/notes", {
        method: "POST",
        body: JSON.stringify({ title, content })
      });
    },
    async () => {
      const now = new Date().toISOString();
      const newNote = {
        id: makeId(),
        title,
        content,
        createdAt: now,
        updatedAt: now
      };
      memoryNotes = [newNote, ...memoryNotes];
      return newNote;
    }
  );
}

// PUBLIC_INTERFACE
export async function updateNote(noteId, payload) {
  /** @type {{ title: string, content: string }} */
  const { title, content } = payload;

  return withFallback(
    async () => {
      // Expecting PUT /notes/:id {title, content} -> Note
      return await request(`/notes/${encodeURIComponent(noteId)}`, {
        method: "PUT",
        body: JSON.stringify({ title, content })
      });
    },
    async () => {
      const now = new Date().toISOString();
      memoryNotes = memoryNotes.map((n) =>
        n.id === noteId ? { ...n, title, content, updatedAt: now } : n
      );
      const updated = memoryNotes.find((n) => n.id === noteId);
      if (!updated) {
        const err = new Error("Note not found");
        err.code = "NOT_FOUND";
        throw err;
      }
      return updated;
    }
  );
}

// PUBLIC_INTERFACE
export async function deleteNote(noteId) {
  return withFallback(
    async () => {
      // Expecting DELETE /notes/:id -> 204/OK
      await request(`/notes/${encodeURIComponent(noteId)}`, { method: "DELETE" });
      return { ok: true };
    },
    async () => {
      memoryNotes = memoryNotes.filter((n) => n.id !== noteId);
      return { ok: true };
    }
  );
}

// PUBLIC_INTERFACE
export function getBackendConfig() {
  /** Exposes API URL for UI diagnostics. */
  return {
    apiBaseUrl: resolvedBaseUrl || "",
    hasBackendConfigured: Boolean(resolvedBaseUrl)
  };
}

import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import { createNote, deleteNote, getBackendConfig, listNotes, updateNote } from "./api/notesApi";
import { Button } from "./components/Button";
import { NoteEditor } from "./components/NoteEditor";
import { NoteList } from "./components/NoteList";

/**
 * @typedef {{ id: string, title: string, content: string, updatedAt?: string, createdAt?: string }} Note
 */

// PUBLIC_INTERFACE
function App() {
  const backend = useMemo(() => getBackendConfig(), []);
  const [notes, setNotes] = useState(/** @type {Note[]} */ ([]));
  const [selectedId, setSelectedId] = useState(/** @type {string | null} */ (null));
  const [filterText, setFilterText] = useState("");
  const [mode, setMode] = useState(/** @type {'api'|'memory'} */ ("memory"));

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState(/** @type {{ type: 'info'|'error', message: string } | null} */ (null));

  const selectedNote = useMemo(() => {
    if (selectedId === "new") {
      return { id: "new", title: "", content: "" };
    }
    if (!selectedId) return null;
    return notes.find((n) => n.id === selectedId) || null;
  }, [notes, selectedId]);

  async function refresh() {
    setIsLoading(true);
    setBanner(null);

    try {
      const res = await listNotes();
      setNotes(res.data || []);
      setMode(res.mode);

      // Select first note by default if none selected
      if (!selectedId && (res.data || []).length > 0) {
        setSelectedId(res.data[0].id);
      }
    } catch (e) {
      setBanner({ type: "error", message: e?.message || "Failed to load notes." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(payload) {
    setIsSaving(true);
    setBanner(null);

    try {
      const res = await createNote(payload);
      setMode(res.mode);

      const created = res.data;
      setNotes((prev) => [created, ...prev]);
      setSelectedId(created.id);
    } catch (e) {
      setBanner({ type: "error", message: e?.message || "Failed to create note." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleUpdate(noteId, payload) {
    setIsSaving(true);
    setBanner(null);

    // Optimistic update for responsiveness
    const previous = notes;
    const optimisticNow = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) => (n.id === noteId ? { ...n, ...payload, updatedAt: optimisticNow } : n))
    );

    try {
      const res = await updateNote(noteId, payload);
      setMode(res.mode);

      const updated = res.data;
      setNotes((prev) => prev.map((n) => (n.id === noteId ? updated : n)));
    } catch (e) {
      setNotes(previous);
      setBanner({ type: "error", message: e?.message || "Failed to save note." });
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(note) {
    const confirmed = window.confirm(`Delete "${note.title?.trim() || "Untitled"}"?`);
    if (!confirmed) return;

    setBanner(null);

    // Optimistic remove
    const previous = notes;
    setNotes((prev) => prev.filter((n) => n.id !== note.id));

    // If we deleted the selected note, choose another
    if (selectedId === note.id) {
      const remaining = previous.filter((n) => n.id !== note.id);
      setSelectedId(remaining[0]?.id || null);
    }

    try {
      const res = await deleteNote(note.id);
      setMode(res.mode);
      if (!res.data?.ok) {
        throw new Error("Delete failed.");
      }
    } catch (e) {
      setNotes(previous);
      setBanner({ type: "error", message: e?.message || "Failed to delete note." });
    }
  }

  function handleNewNote() {
    setSelectedId("new");
  }

  return (
    <div className="App">
      <header className="topbar">
        <div className="topbar-left">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              N
            </span>
            <div className="brand-text">
              <div className="brand-title">Notes</div>
              <div className="brand-subtitle">Simple, fast, and clean</div>
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className={`badge ${mode === "api" ? "badge-api" : "badge-memory"}`}>
            {mode === "api" ? "Connected" : "Local mode"}
          </div>

          <Button variant="primary" onClick={handleNewNote}>
            + New note
          </Button>
        </div>
      </header>

      {banner ? (
        <div className={`banner ${banner.type === "error" ? "banner-error" : "banner-info"}`}>
          <div className="banner-message">{banner.message}</div>
          <button className="banner-close" onClick={() => setBanner(null)} aria-label="Dismiss">
            ×
          </button>
        </div>
      ) : null}

      {!backend.hasBackendConfigured ? (
        <div className="banner banner-info">
          <div className="banner-message">
            Backend is not configured. Set <code>REACT_APP_API_BASE</code> (or{" "}
            <code>REACT_APP_BACKEND_URL</code>) to enable REST API sync.
          </div>
        </div>
      ) : null}

      <main className="shell">
        <NoteList
          notes={notes}
          selectedId={selectedId}
          filterText={filterText}
          onFilterTextChange={setFilterText}
          onSelect={setSelectedId}
          onDelete={handleDelete}
        />

        <div className="content">
          {isLoading ? (
            <section className="panel">
              <div className="panel-header">
                <div className="panel-title">Loading…</div>
                <div className="panel-subtitle muted">Fetching notes</div>
              </div>
              <div className="skeleton">
                <div className="skeleton-line" />
                <div className="skeleton-line" />
                <div className="skeleton-line" />
              </div>
            </section>
          ) : (
            <NoteEditor note={selectedNote} isSaving={isSaving} onCreate={handleCreate} onUpdate={handleUpdate} />
          )}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-left muted">
          API base:{" "}
          <span className="mono">{backend.apiBaseUrl ? backend.apiBaseUrl : "(not set)"}</span>
        </div>
        <div className="footer-right muted">Simple Notes App</div>
      </footer>
    </div>
  );
}

export default App;

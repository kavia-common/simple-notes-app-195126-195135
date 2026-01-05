import React, { useMemo } from "react";
import { Button } from "./Button";

/**
 * @typedef {{ id: string, title: string, content: string, updatedAt?: string, createdAt?: string }} Note
 */

/**
 * @param {{
 *  notes: Note[],
 *  selectedId: string | null,
 *  filterText: string,
 *  onFilterTextChange: (v: string) => void,
 *  onSelect: (id: string) => void,
 *  onDelete: (note: Note) => void
 * }} props
 */
// PUBLIC_INTERFACE
export function NoteList({
  notes,
  selectedId,
  filterText,
  onFilterTextChange,
  onSelect,
  onDelete
}) {
  const filtered = useMemo(() => {
    const q = filterText.trim().toLowerCase();
    if (!q) return notes;
    return notes.filter((n) => {
      const hay = `${n.title}\n${n.content}`.toLowerCase();
      return hay.includes(q);
    });
  }, [notes, filterText]);

  return (
    <aside className="sidebar" aria-label="Notes sidebar">
      <div className="sidebar-top">
        <div className="sidebar-title">Notes</div>

        <label className="search" aria-label="Search notes">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <input
            className="search-input"
            value={filterText}
            onChange={(e) => onFilterTextChange(e.target.value)}
            placeholder="Search…"
          />
        </label>
      </div>

      <div className="note-list" role="list">
        {filtered.length === 0 ? (
          <div className="empty muted">No notes found.</div>
        ) : (
          filtered.map((note) => {
            const isActive = note.id === selectedId;
            const title = note.title?.trim() || "Untitled";
            const preview = (note.content || "").trim().slice(0, 80);

            return (
              <div
                key={note.id}
                className={`note-item ${isActive ? "active" : ""}`.trim()}
                role="listitem"
              >
                <button
                  type="button"
                  className="note-item-main"
                  onClick={() => onSelect(note.id)}
                  aria-current={isActive ? "true" : "false"}
                >
                  <div className="note-item-title">{title}</div>
                  <div className="note-item-preview">{preview || "—"}</div>
                </button>

                <Button
                  variant="ghost"
                  size="sm"
                  title="Delete note"
                  className="note-item-delete"
                  onClick={() => onDelete(note)}
                >
                  Delete
                </Button>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}

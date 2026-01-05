import React, { useEffect, useMemo, useState } from "react";
import { Button } from "./Button";
import { Input } from "./Input";
import { Textarea } from "./Textarea";

/**
 * @typedef {{ id: string, title: string, content: string, updatedAt?: string, createdAt?: string }} Note
 */

/**
 * @param {{
 *  note: Note | null,
 *  isSaving: boolean,
 *  onCreate: (payload: {title: string, content: string}) => Promise<void>,
 *  onUpdate: (noteId: string, payload: {title: string, content: string}) => Promise<void>,
 * }} props
 */
// PUBLIC_INTERFACE
export function NoteEditor({ note, isSaving, onCreate, onUpdate }) {
  const isNew = useMemo(() => !note || note.id === "new", [note]);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setDirty(false);
  }, [note?.id]); // only reset when switching notes

  const canSave = useMemo(() => {
    const t = title.trim();
    const c = content.trim();
    if (!t && !c) return false;
    if (isNew) return true;
    return dirty;
  }, [title, content, dirty, isNew]);

  async function handleSubmit(e) {
    e.preventDefault();
    const payload = { title: title.trim(), content: content.trim() };

    if (isNew) {
      await onCreate(payload);
      return;
    }

    if (!note) return;
    await onUpdate(note.id, payload);
  }

  function handleCancelEdits() {
    setTitle(note?.title || "");
    setContent(note?.content || "");
    setDirty(false);
  }

  if (!note) {
    return (
      <section className="panel" aria-label="Editor panel">
        <div className="panel-header">
          <div className="panel-title">Select a note</div>
          <div className="panel-subtitle muted">
            Choose a note from the list, or create a new one.
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="panel" aria-label="Note editor">
      <div className="panel-header">
        <div className="panel-title">{isNew ? "New note" : "Edit note"}</div>
        <div className="panel-subtitle muted">
          {isNew ? "Create a note with a title and content." : "Update your note."}
        </div>
      </div>

      <form className="editor" onSubmit={handleSubmit}>
        <Input
          label="Title"
          value={title}
          onChange={(v) => {
            setTitle(v);
            setDirty(true);
          }}
          placeholder="Untitled"
          name="title"
          maxLength={120}
          autoFocus
        />

        <Textarea
          label="Content"
          value={content}
          onChange={(v) => {
            setContent(v);
            setDirty(true);
          }}
          placeholder="Write something…"
          name="content"
          rows={12}
          maxLength={5000}
        />

        <div className="editor-actions">
          <Button type="submit" variant="primary" isLoading={isSaving} disabled={!canSave}>
            {isNew ? "Create" : "Save"}
          </Button>

          {!isNew ? (
            <Button
              type="button"
              variant="secondary"
              disabled={isSaving || !dirty}
              onClick={handleCancelEdits}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>
    </section>
  );
}

import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { TextArea } from "../components/TextArea";
import {
  createConcern,
  deleteConcern,
  getConcerns,
  SOFT_ERROR_MESSAGE,
  updateConcern,
} from "../lib/api";
import type { Concern } from "../types";

export function ConcernNotesPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [newConcern, setNewConcern] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadConcerns() {
    try {
      const data = await getConcerns();
      setConcerns(data);
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadConcerns();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = newConcern.trim();

    if (!text || concerns.length >= 5) {
      return;
    }

    try {
      await createConcern(text);
      setNewConcern("");
      await loadConcerns();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = editingText.trim();

    if (!editingId || !text) {
      setError("متن نگرانی را بنویس.");
      return;
    }

    try {
      await updateConcern(editingId, text);
      setEditingId(null);
      setEditingText("");
      await loadConcerns();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    }
  }

  async function handleDelete(concernId: number) {
    const confirmed = window.confirm("این نگرانی حذف شود؟");
    if (!confirmed) {
      return;
    }

    try {
      await deleteConcern(concernId);
      await loadConcerns();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    }
  }

  return (
    <AppLayout title="نگرانی‌های من">
      <section className="card">
        <h1>نگرانی‌های من</h1>
        <p className="description">می‌توانی مسیرت را سبک‌تر کنی.</p>

        {isLoading ? <p className="muted">در حال آوردن یادداشت‌ها...</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}

        {!isLoading && concerns.length === 0 ? (
          <EmptyState
            title="اینجا هنوز خالی است."
            description="یک جمله کوتاه هم برای شروع کافی است."
          />
        ) : null}

        <div className="notes-list">
          {concerns.map((concern) => (
            <article className="note-card" key={concern.id}>
              {editingId === concern.id ? (
                <form className="stack" onSubmit={handleUpdate}>
                  <TextArea
                    label="ویرایش نگرانی"
                    rows={4}
                    value={editingText}
                    onChange={(event) => setEditingText(event.target.value)}
                  />
                  <div className="button-row">
                    <Button type="submit">ذخیره</Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditingId(null)}
                    >
                      بی‌خیال
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <p>{concern.text}</p>
                  <div className="button-row">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingId(concern.id);
                        setEditingText(concern.text);
                      }}
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDelete(concern.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>

        {concerns.length < 5 ? (
          <form className="soft-panel stack" onSubmit={handleAdd}>
            <TextArea
              label="افزودن نگرانی"
              rows={3}
              value={newConcern}
              onChange={(event) => setNewConcern(event.target.value)}
              placeholder="چیزی که بهتر است از ذهنت بیرون بیاید..."
            />
            <Button type="submit" disabled={!newConcern.trim()}>
              افزودن
            </Button>
          </form>
        ) : (
          <p className="muted">فعلاً همین چند مورد برای شروع کافی است.</p>
        )}
      </section>
    </AppLayout>
  );
}

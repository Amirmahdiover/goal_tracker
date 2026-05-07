import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { TextArea } from "../components/TextArea";
import {
  createConcern,
  deleteConcern,
  getConcerns,
  SOFT_ERROR_MESSAGE,
  updateConcern,
} from "../lib/api";
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";
import type { Concern } from "../types";

export function ConcernNotesPage() {
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [newConcern, setNewConcern] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingText, setEditingText] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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

    if (!text) {
      setError("یک جمله کوتاه هم برای شروع کافی است.");
      return;
    }

    if (isOverTextLimit(text, TEXT_LIMITS.concern)) {
      setError(TEXT_LIMIT_MESSAGE);
      return;
    }

    if (concerns.length >= 5) {
      setError("فعلاً همین چند مورد برای شروع کافی است.");
      return;
    }

    try {
      setIsAdding(true);
      setError("");
      await createConcern(text);
      setNewConcern("");
      await loadConcerns();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsAdding(false);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = editingText.trim();

    if (!editingId || !text) {
      setError("این قسمت را خالی نگذار. کوتاه هم باشد کافی است.");
      return;
    }

    if (isOverTextLimit(text, TEXT_LIMITS.concern)) {
      setError(TEXT_LIMIT_MESSAGE);
      return;
    }

    try {
      setIsSaving(true);
      setError("");
      await updateConcern(editingId, text);
      setEditingId(null);
      setEditingText("");
      await loadConcerns();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(concernId: number) {
    const confirmed = window.confirm("مطمئنی می‌خواهی این یادداشت را برداری؟");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(concernId);
      setError("");
      await deleteConcern(concernId);
      await loadConcerns();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppLayout title="یادداشت‌های من">
      <section className="page-section notepad-card">
        <PageHeader
          eyebrow="جایی برای خالی‌تر شدن ذهن"
          title="یادداشت‌های من"
          description="اینجا لازم نیست چیزی را حل کنی. فقط می‌توانی بنویسی و هر وقت آماده بودی برگردی."
        />

        {isLoading ? <LoadingState text="داریم یادداشت‌هایت را می‌آوریم..." /> : null}
        <ErrorMessage message={error} />

        {!isLoading && concerns.length === 0 ? (
          <EmptyState
            title="اینجا هنوز خلوت است."
            description="اگر چیزی توی ذهنت مانده، یک جمله کوتاه هم کافی است."
          />
        ) : null}

        <div className="notes-list">
          {concerns.map((concern) => (
            <Card as="article" className="note-card" key={concern.id}>
              {editingId === concern.id ? (
                <form className="stack" onSubmit={handleUpdate}>
                  <TextArea
                    label="این یادداشت را کمی عوض کن"
                    rows={4}
                    value={editingText}
                    maxLength={TEXT_LIMITS.concern}
                    onChange={(event) => setEditingText(event.target.value)}
                  />
                  <div className="button-row">
                    <Button type="submit" isLoading={isSaving}>
                      نگه داشتن تغییر
                    </Button>
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
                      isLoading={deletingId === concern.id}
                      onClick={() => handleDelete(concern.id)}
                    >
                      برداشتن
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>

        {concerns.length < 5 ? (
          <form className="soft-panel stack" onSubmit={handleAdd}>
            <TextArea
              label="یادداشت تازه"
              rows={3}
              value={newConcern}
              maxLength={TEXT_LIMITS.concern}
              onChange={(event) => setNewConcern(event.target.value)}
              placeholder="هر چیزی که بهتر است از ذهنت بیرون بیاید..."
            />
            <Button type="submit" disabled={!newConcern.trim()} isLoading={isAdding}>
              اضافه کن
            </Button>
          </form>
        ) : (
          <p className="muted">فعلاً همین چند مورد برای شروع کافی است.</p>
        )}
      </section>
    </AppLayout>
  );
}

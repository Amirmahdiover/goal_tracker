import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { TextArea } from "../components/TextArea";
import { TextInput } from "../components/TextInput";
import {
  deleteTracking,
  getTrackingHistory,
  SOFT_ERROR_MESSAGE,
  updateTracking,
} from "../lib/api";
import type { TrackingRecord } from "../types";

type EditState = {
  id: number;
  amount: string;
  date: string;
  note: string;
};

export function TrackingHistoryPage() {
  const [records, setRecords] = useState<TrackingRecord[]>([]);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadHistory() {
    try {
      const data = await getTrackingHistory();
      setRecords(data);
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const timerId = window.setTimeout(() => {
      void loadHistory();
    }, 0);

    return () => window.clearTimeout(timerId);
  }, []);

  async function handleDelete(recordId: number) {
    const confirmed = window.confirm("این ثبت حذف شود؟");
    if (!confirmed) {
      return;
    }

    try {
      await deleteTracking(recordId);
      await loadHistory();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editState || Number(editState.amount) <= 0 || !editState.date) {
      setError("مقدار و تاریخ را کامل کن.");
      return;
    }

    try {
      await updateTracking(editState.id, {
        amount: Number(editState.amount),
        date: editState.date,
        note: editState.note.trim() || null,
      });
      setEditState(null);
      await loadHistory();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    }
  }

  return (
    <AppLayout title="تاریخچه">
      <section className="card">
        <h1>تاریخچه پیشرفت</h1>
        {isLoading ? <p className="muted">در حال آوردن ثبت‌ها...</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}

        {!isLoading && records.length === 0 ? (
          <EmptyState
            title="هنوز پیشرفتی ثبت نکرده‌ای."
            description="قدم کوچک هم مهم است."
          />
        ) : null}

        <div className="history-list">
          {records.map((record) => (
            <article className="history-card" key={record.id}>
              {editState?.id === record.id ? (
                <form className="stack" onSubmit={handleUpdate}>
                  <TextInput
                    label="مقدار"
                    type="number"
                    min="0"
                    step="0.1"
                    inputMode="decimal"
                    value={editState.amount}
                    onChange={(event) =>
                      setEditState({ ...editState, amount: event.target.value })
                    }
                  />
                  <TextInput
                    label="تاریخ"
                    type="date"
                    value={editState.date}
                    onChange={(event) =>
                      setEditState({ ...editState, date: event.target.value })
                    }
                  />
                  <TextArea
                    label="یادداشت"
                    rows={3}
                    value={editState.note}
                    onChange={(event) =>
                      setEditState({ ...editState, note: event.target.value })
                    }
                  />
                  <div className="button-row">
                    <Button type="submit">ذخیره</Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setEditState(null)}
                    >
                      بی‌خیال
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <strong>
                    {record.amount} {record.unit} — {record.step_title}
                  </strong>
                  <span>{record.date}</span>
                  {record.note ? <p>{record.note}</p> : null}
                  <div className="button-row">
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        setEditState({
                          id: record.id,
                          amount: record.amount.toString(),
                          date: record.date,
                          note: record.note ?? "",
                        })
                      }
                    >
                      ویرایش
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => handleDelete(record.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </>
              )}
            </article>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

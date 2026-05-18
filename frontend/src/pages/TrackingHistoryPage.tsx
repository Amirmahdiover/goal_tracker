import { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { TextArea } from "../components/TextArea";
import { TextInput } from "../components/TextInput";
import {
  deleteTracking,
  getTrackingHistory,
  SOFT_ERROR_MESSAGE,
  updateTracking,
} from "../lib/api";
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";
import type { TrackingRecord } from "../types";

type EditState = {
  id: number;
  amount: string;
  date: string;
  note: string;
};

function formatDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);

  return new Intl.DateTimeFormat("fa-IR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function TrackingHistoryPage() {
  const [records, setRecords] = useState<TrackingRecord[]>([]);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
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
    const confirmed = window.confirm("مطمئنی می‌خواهی این یادداشت حذف شود؟");
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(recordId);
      setError("");
      await deleteTracking(recordId);
      await loadHistory();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleUpdate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editState || Number(editState.amount) <= 0 || !editState.date) {
      setError("مقدار و تاریخ را خالی نگذار؛ همین دو مورد کافی است.");
      return;
    }

    if (isOverTextLimit(editState.note.trim(), TEXT_LIMITS.trackingNote)) {
      setError(TEXT_LIMIT_MESSAGE);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await updateTracking(editState.id, {
        amount: Number(editState.amount),
        date: editState.date,
        note: editState.note.trim() || null,
      });
      setEditState(null);
      await loadHistory();
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout title="تاریخچه پیشرفت">
      <section className="page-section">
        <PageHeader
          eyebrow="مسیرت تا اینجا"
          title="پیشرفت‌های ثبت‌شده"
          description="اینجا مقدارهایی را می‌بینی که برای قدم‌هایت ثبت کرده‌ای."
        />

        {isLoading ? <LoadingState text="داریم تاریخچه پیشرفتت را می‌آوریم..." /> : null}
        <ErrorMessage message={error} />

        {!isLoading && records.length === 0 ? (
          <EmptyState
            title="هنوز پیشرفتی ثبت نکرده‌ای."
            description="هر وقت چیزی انجام دادی، می‌توانی اینجا ثبتش کنی."
          />
        ) : null}

        <div className="history-list">
          {records.map((record) => (
            <Card as="article" className="history-card" key={record.id}>
              {editState?.id === record.id ? (
                <form className="stack" onSubmit={handleUpdate}>
                  <TextInput
                    label={`چقدر جلو رفتی؟ (${record.unit})`}
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
                    label="برای چه روزی؟"
                    type="date"
                    value={editState.date}
                    onChange={(event) =>
                      setEditState({ ...editState, date: event.target.value })
                    }
                  />
                  <TextArea
                    label="یادداشت کوچک، اگر دوست داشتی"
                    rows={3}
                    value={editState.note}
                    maxLength={TEXT_LIMITS.trackingNote}
                    onChange={(event) =>
                      setEditState({ ...editState, note: event.target.value })
                    }
                  />
                  <div className="button-row">
                    <Button type="submit" isLoading={isSubmitting}>
                      نگه داشتن تغییر
                    </Button>
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
                  <div className="history-main">
                    <strong>
                      {record.amount} {record.unit}
                    </strong>
                    <span>{record.step_title}</span>
                  </div>
                  <time dateTime={record.date}>{formatDate(record.date)}</time>
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
                      isLoading={deletingId === record.id}
                      onClick={() => handleDelete(record.id)}
                    >
                      حذف
                    </Button>
                  </div>
                </>
              )}
            </Card>
          ))}
        </div>
      </section>
    </AppLayout>
  );
}

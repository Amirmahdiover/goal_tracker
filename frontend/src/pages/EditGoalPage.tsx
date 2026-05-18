import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { TextInput } from "../components/TextInput";
import {
  deleteGoal,
  getGoal,
  isNotFoundError,
  SOFT_ERROR_MESSAGE,
  updateGoal,
} from "../lib/api";
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";
import type { Goal } from "../types";

export function EditGoalPage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadGoal() {
      try {
        const data = await getGoal();
        setGoal(data);
        setTitle(data.title);
      } catch (caughtError) {
        if (isNotFoundError(caughtError)) {
          setGoal(null);
        } else {
          setError(SOFT_ERROR_MESSAGE);
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadGoal();
  }, []);

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError("این قسمت را خالی نگذار. یک جمله ساده کافی است.");
      return;
    }

    if (isOverTextLimit(cleanTitle, TEXT_LIMITS.goalTitle)) {
      setError(TEXT_LIMIT_MESSAGE);
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      await updateGoal(cleanTitle);
      navigate("/dashboard");
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteGoal() {
    const confirmed = window.confirm(
      "مطمئنی می‌خواهی این مسیر را حذف کنی؟ قدم‌ها و پیشرفت‌های ثبت‌شده‌اش هم حذف می‌شوند.",
    );
    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      setError("");
      await deleteGoal();
      navigate("/dashboard");
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <AppLayout title="ویرایش مسیر">
      <section className="page-section">
        <PageHeader
          eyebrow="کمی تنظیمش کن"
          title="ویرایش مسیر"
          description="اگر جمله مسیرت بهتر شده، همین‌جا آرام‌تر و روشن‌ترش کن."
        />

        {isLoading ? <LoadingState text="داریم مسیرت را می‌آوریم..." /> : null}
        <ErrorMessage message={error} />

        {!isLoading && !goal ? (
          <EmptyState
            title="هنوز مسیر فعالی نداری."
            description="هر وقت آماده بودی، می‌توانی یک مسیر کوچک بسازی."
            action={
              <Button type="button" onClick={() => navigate("/concerns/select")}>
                یک مسیر کوچک بساز
              </Button>
            }
          />
        ) : null}

        {!isLoading && goal ? (
          <div className="stack">
            <form className="stack" onSubmit={handleSave}>
              <TextInput
                label="جمله مسیر"
                value={title}
                maxLength={TEXT_LIMITS.goalTitle}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Button type="submit" isLoading={isSubmitting}>
                {isSubmitting ? "داریم نگهش می‌داریم..." : "نگه داشتن تغییر"}
              </Button>
            </form>

            <Card variant="danger" className="danger-panel">
              <h2>حذف این مسیر</h2>
              <p>
                اگر می‌خواهی از نو شروع کنی، می‌توانی این مسیر را حذف کنی. قبلش
                یک بار دیگر از تو می‌پرسیم.
              </p>
              <Button
                type="button"
                variant="danger"
                isLoading={isDeleting}
                onClick={handleDeleteGoal}
              >
                حذف این مسیر
              </Button>
            </Card>
          </div>
        ) : null}
      </section>
    </AppLayout>
  );
}

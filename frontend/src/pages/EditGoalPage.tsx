import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { TextInput } from "../components/TextInput";
import {
  deleteGoal,
  getGoal,
  isNotFoundError,
  SOFT_ERROR_MESSAGE,
  updateGoal,
} from "../lib/api";
import type { Goal } from "../types";

export function EditGoalPage() {
  const navigate = useNavigate();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      setError("عنوان هدف را بنویس.");
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
      "با حذف هدف، قدم‌ها و پیشرفت‌های ثبت‌شده هم حذف می‌شوند.",
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteGoal();
      navigate("/dashboard");
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    }
  }

  return (
    <AppLayout title="ویرایش هدف">
      <section className="card">
        <h1>ویرایش هدف</h1>

        {isLoading ? <p className="muted">در حال آماده‌سازی...</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}

        {!isLoading && !goal ? (
          <EmptyState
            title="هنوز هدف فعالی نداری."
            description="هر زمان آماده بودی می‌توانی یک مسیر کوچک بسازی."
            action={
              <Button type="button" onClick={() => navigate("/concerns/select")}>
                ساخت هدف
              </Button>
            }
          />
        ) : null}

        {!isLoading && goal ? (
          <div className="stack">
            <form className="stack" onSubmit={handleSave}>
              <TextInput
                label="عنوان هدف"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </Button>
            </form>

            <section className="danger-panel">
              <h2>حذف هدف</h2>
              <p>با حذف هدف، قدم‌ها و پیشرفت‌های ثبت‌شده هم حذف می‌شوند.</p>
              <Button type="button" variant="danger" onClick={handleDeleteGoal}>
                حذف هدف
              </Button>
            </section>
          </div>
        ) : null}
      </section>
    </AppLayout>
  );
}

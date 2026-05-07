import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { createGoal, SOFT_ERROR_MESSAGE } from "../lib/api";

export function CreateGoalPage() {
  const navigate = useNavigate();
  const selectedConcernText = useMemo(
    () => sessionStorage.getItem("selectedConcernText"),
    [],
  );
  const [title, setTitle] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();

    if (!cleanTitle) {
      setError("عنوان هدف را بنویس.");
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await createGoal(cleanTitle);
      navigate("/steps/new");
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout title="هدف تازه">
      <section className="card">
        {selectedConcernText ? (
          <div className="selected-note">
            <span>برای این مورد:</span>
            <strong>{selectedConcernText}</strong>
          </div>
        ) : null}

        <h1>برای این نگرانی، چه مسیر کوچکی را می‌خواهی شروع کنی؟</h1>
        <p className="description">
          لازم نیست بزرگ یا کامل باشد. فقط یک مسیر ساده برای شروع بنویس.
        </p>

        <form className="stack" onSubmit={handleSubmit}>
          <TextInput
            label="عنوان هدف"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="از پوستم مراقبت کنم"
          />
          <div className="hint-list">
            <span>یادگیری ماشین لرنینگ را شروع کنم</span>
            <span>خوابم را کمی بهتر کنم</span>
          </div>

          {error ? <p className="error-banner">{error}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "در حال ساخت..." : "ادامه"}
          </Button>
        </form>
      </section>
    </AppLayout>
  );
}

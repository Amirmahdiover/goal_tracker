import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { PageHeader } from "../components/PageHeader";
import { TextArea } from "../components/TextArea";
import { createConcern, SOFT_ERROR_MESSAGE } from "../lib/api";
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";

const CONCERN_SUGGESTIONS = [
  "خوابم این روزها آرام نیست",
  "کارهای خانه ذهنم را شلوغ کرده",
  "دوست دارم دوباره کمی مطالعه کنم",
];

export function ConcernInputPage() {
  const navigate = useNavigate();
  const [concerns, setConcerns] = useState([""]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function applySuggestion(text: string) {
    setConcerns((current) => {
      const firstEmptyIndex = current.findIndex((concern) => !concern.trim());
      const targetIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : 0;

      return current.map((concern, index) =>
        index === targetIndex ? text : concern,
      );
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const texts = concerns.map((item) => item.trim()).filter(Boolean);

    if (texts.length === 0) {
      setError("برای شروع، یک جمله کوتاه هم کافی است.");
      return;
    }

    if (texts.some((text) => isOverTextLimit(text, TEXT_LIMITS.concern))) {
      setError(TEXT_LIMIT_MESSAGE);
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await Promise.all(texts.map((text) => createConcern(text)));
      navigate("/concerns/select");
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout title="یادداشت‌های ذهن">
      <Card>
        <PageHeader
          eyebrow="آرام بنویس"
          title="چه چیزهایی این روزها توی ذهنت مانده؟"
          description="این فقط یک یادداشت برای خالی‌تر شدن ذهن توست. لازم نیست دقیق یا مرتب باشد."
        />

        <div className="hint-list examples-list" aria-label="نمونه یادداشت‌ها">
          {CONCERN_SUGGESTIONS.map((suggestion) => (
            <button
              className={`suggestion-chip ${
                concerns.includes(suggestion) ? "is-selected" : ""
              }`}
              key={suggestion}
              type="button"
              onClick={() => applySuggestion(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>

        <form className="stack spacious-form" onSubmit={handleSubmit}>
          {concerns.map((concern, index) => (
            <div className="field-card" key={index}>
              <TextArea
                label={`یادداشت ${index + 1}`}
                value={concern}
                maxLength={TEXT_LIMITS.concern}
                rows={3}
                onChange={(event) => {
                  const nextConcerns = [...concerns];
                  nextConcerns[index] = event.target.value;
                  setConcerns(nextConcerns);
                }}
                placeholder="هر چیزی که بهتر است از ذهنت بیرون بیاید..."
              />
              {concerns.length > 1 ? (
                <button
                  className="text-action text-action-danger"
                  type="button"
                  onClick={() =>
                    setConcerns((current) =>
                      current.filter((_, concernIndex) => concernIndex !== index),
                    )
                  }
                >
                  برداشتن این یکی
                </button>
              ) : null}
            </div>
          ))}

          {concerns.length < 5 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setConcerns((current) => [...current, ""])}
            >
              یک یادداشت دیگر هم دارم
            </Button>
          ) : (
            <p className="muted">فعلاً همین چند مورد برای شروع کافی است.</p>
          )}

          <ErrorMessage message={error} />

          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "داریم نگهش می‌داریم..." : "ادامه بده"}
          </Button>
        </form>
      </Card>
    </AppLayout>
  );
}

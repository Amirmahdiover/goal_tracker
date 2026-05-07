import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { PageHeader } from "../components/PageHeader";
import { TextInput } from "../components/TextInput";
import { createGoal, SOFT_ERROR_MESSAGE } from "../lib/api";
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";

const GOAL_SUGGESTIONS = [
  "هر روز چند صفحه بخوانم",
  "کمی بیشتر مراقب بدنم باشم",
  "حرکتم را آرام‌آرام بیشتر کنم",
];

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
      setError("این قسمت را خالی نگذار. یک جمله ساده کافی است.");
      return;
    }

    if (isOverTextLimit(cleanTitle, TEXT_LIMITS.goalTitle)) {
      setError(TEXT_LIMIT_MESSAGE);
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
    <AppLayout title="مسیر تازه">
      <Card>
        {selectedConcernText ? (
          <div className="selected-note">
            <span>از این یادداشت شروع می‌کنیم:</span>
            <strong>{selectedConcernText}</strong>
          </div>
        ) : null}

        <PageHeader
          eyebrow="یک مسیر کوچک"
          title="دوست داری از اینجا به کدام سمت بروی؟"
          description="یک جمله ساده کافی است. قرار نیست برنامه کامل بنویسی؛ فقط جهت را کمی روشن‌تر می‌کنی."
        />

        <form className="stack" onSubmit={handleSubmit}>
          <TextInput
            label="مسیر من"
            value={title}
            maxLength={TEXT_LIMITS.goalTitle}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="مثلاً خوابم را کمی آرام‌تر کنم"
            hint="همان‌طور بنویس که با خودت حرف می‌زنی."
          />

          <div className="hint-list examples-list" aria-label="نمونه مسیرها">
            {GOAL_SUGGESTIONS.map((suggestion) => (
              <button
                className={`suggestion-chip ${
                  title === suggestion ? "is-selected" : ""
                }`}
                key={suggestion}
                type="button"
                onClick={() => setTitle(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>

          <ErrorMessage message={error} />

          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "داریم مسیرت را می‌سازیم..." : "قدم‌های کوچک را ببینیم"}
          </Button>
        </form>
      </Card>
    </AppLayout>
  );
}

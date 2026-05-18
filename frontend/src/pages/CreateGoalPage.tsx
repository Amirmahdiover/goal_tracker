import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { TextInput } from "../components/TextInput";
import { createGoal, SOFT_ERROR_MESSAGE, suggestGoals } from "../lib/api";
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";

export function CreateGoalPage() {
  const navigate = useNavigate();
  const selectedConcernText = useMemo(
    () => sessionStorage.getItem("selectedConcernText"),
    [],
  );
  const [title, setTitle] = useState("");
  const [goalSuggestions, setGoalSuggestions] = useState<string[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(
    Boolean(selectedConcernText),
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const concernText = selectedConcernText;
    if (!concernText) {
      return;
    }

    let isMounted = true;

    async function loadSuggestions(concern: string) {
      try {
        const response = await suggestGoals(concern);
        const titles = response.suggestions
          .map((suggestion) => suggestion.title.trim())
          .filter(Boolean);

        if (isMounted) {
          setGoalSuggestions(titles);
        }
      } catch {
        // Static suggestions keep the page usable when AI suggestions are unavailable.
      } finally {
        if (isMounted) {
          setIsLoadingSuggestions(false);
        }
      }
    }

    void loadSuggestions(concernText);

    return () => {
      isMounted = false;
    };
  }, [selectedConcernText]);

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

          {goalSuggestions.length > 0 ? (
            <>
              <p className="muted">لازم نیست از این پیشنهاد ها استفاده کنی دوست گل گلیم.</p>
              <div className="hint-list examples-list" aria-label="نمونه مسیرها">
                {goalSuggestions.map((suggestion) => (
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
            </>
          ) : null}

          {isLoadingSuggestions ? (
            <LoadingState text="در حال دریافت پیشنهادها..." />
          ) : null}

          <ErrorMessage message={error} />

          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "داریم مسیرت را می‌سازیم..." : "قدم‌های کوچک را ببینیم"}
          </Button>
        </form>
      </Card>
    </AppLayout>
  );
}

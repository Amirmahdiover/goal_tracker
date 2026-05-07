import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { EmptyState } from "../components/EmptyState";
import { ErrorMessage } from "../components/ErrorMessage";
import { LoadingState } from "../components/LoadingState";
import { PageHeader } from "../components/PageHeader";
import { TextArea } from "../components/TextArea";
import { createConcern, getConcerns, SOFT_ERROR_MESSAGE } from "../lib/api";
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";
import type { Concern } from "../types";

export function SelectConcernPage() {
  const navigate = useNavigate();
  const [concerns, setConcerns] = useState<Concern[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newConcern, setNewConcern] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadConcerns() {
    try {
      const data = await getConcerns();
      setConcerns(data);
      setSelectedId(data[0]?.id ?? null);
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

  async function handleAddConcern() {
    const text = newConcern.trim();
    if (!text) {
      setError("اگر چیزی به ذهنت آمد، همین‌جا کوتاه بنویس.");
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
      setError("");
      setIsSubmitting(true);
      const created = await createConcern(text);
      setConcerns((current) => [...current, created]);
      setSelectedId(created.id);
      setNewConcern("");
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleContinue() {
    const selectedConcern = concerns.find((concern) => concern.id === selectedId);
    if (!selectedConcern) {
      setError("یکی از یادداشت‌ها را انتخاب کن؛ هر کدام که امروز سبک‌تر است.");
      return;
    }

    sessionStorage.setItem("selectedConcernText", selectedConcern.text);
    navigate("/goal/new");
  }

  return (
    <AppLayout title="انتخاب یک مورد">
      <Card>
        <PageHeader
          eyebrow="فقط یکی برای امروز"
          title="دوست داری فعلاً کدام یادداشت را سبک‌تر کنیم؟"
          description="لازم نیست همه چیز را یک‌جا حل کنی. یکی را انتخاب کن و آرام جلو برو."
        />

        {isLoading ? <LoadingState text="داریم یادداشت‌هایت را می‌آوریم..." /> : null}
        <ErrorMessage message={error} />

        {!isLoading && concerns.length === 0 ? (
          <EmptyState
            title="هنوز چیزی ننوشته‌ای."
            description="یک جمله کوتاه هم برای شروع کافی است."
            action={
              <Button type="button" onClick={() => navigate("/concerns/new")}>
                اولین یادداشت را بنویس
              </Button>
            }
          />
        ) : null}

        <div className="choice-list">
          {concerns.map((concern) => (
            <button
              className={`choice-card ${
                selectedId === concern.id ? "is-selected" : ""
              }`}
              key={concern.id}
              type="button"
              onClick={() => setSelectedId(concern.id)}
            >
              <span>{concern.text}</span>
            </button>
          ))}
        </div>

        {concerns.length < 5 ? (
          <div className="soft-panel stack">
            <TextArea
              label="یادداشت تازه"
              value={newConcern}
              maxLength={TEXT_LIMITS.concern}
              rows={3}
              onChange={(event) => setNewConcern(event.target.value)}
              placeholder="اگر چیز دیگری هم توی ذهنت هست..."
            />
            <Button
              type="button"
              variant="secondary"
              isLoading={isSubmitting}
              disabled={!newConcern.trim()}
              onClick={handleAddConcern}
            >
              اضافه کن
            </Button>
          </div>
        ) : (
          <p className="muted">فعلاً همین چند مورد برای شروع کافی است.</p>
        )}

        <Button type="button" disabled={!selectedId} onClick={handleContinue}>
          یک مسیر کوچک بساز
        </Button>
      </Card>
    </AppLayout>
  );
}

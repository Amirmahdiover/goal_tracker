import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { EmptyState } from "../components/EmptyState";
import { TextArea } from "../components/TextArea";
import {
  createConcern,
  getConcerns,
  SOFT_ERROR_MESSAGE,
} from "../lib/api";
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
    if (!text || concerns.length >= 5) {
      return;
    }

    try {
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
      setError("یک مورد را انتخاب کن.");
      return;
    }

    sessionStorage.setItem("selectedConcernText", selectedConcern.text);
    navigate("/goal/new");
  }

  return (
    <AppLayout title="انتخاب مسیر">
      <section className="card">
        <h1>فعلاً دوست داری برای کدام مورد یک قدم کوچک بسازیم؟</h1>

        {isLoading ? <p className="muted">در حال آوردن نگرانی‌ها...</p> : null}
        {error ? <p className="error-banner">{error}</p> : null}

        {!isLoading && concerns.length === 0 ? (
          <EmptyState
            title="هنوز چیزی ننوشته‌ای."
            description="برای شروع همین کافی است که فقط یک جمله کوتاه بنویسی."
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
              {concern.text}
            </button>
          ))}
        </div>

        {concerns.length < 5 ? (
          <div className="soft-panel">
            <TextArea
              label="افزودن نگرانی تازه"
              value={newConcern}
              rows={3}
              onChange={(event) => setNewConcern(event.target.value)}
              placeholder="اگر مورد دیگری هم هست، اینجا بنویس..."
            />
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting || !newConcern.trim()}
              onClick={handleAddConcern}
            >
              افزودن
            </Button>
          </div>
        ) : (
          <p className="muted">فعلاً همین چند مورد برای شروع کافی است.</p>
        )}

        <Button type="button" disabled={!selectedId} onClick={handleContinue}>
          ساخت هدف
        </Button>
      </section>
    </AppLayout>
  );
}

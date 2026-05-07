import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { ErrorMessage } from "../components/ErrorMessage";
import { PageHeader } from "../components/PageHeader";
import { TextInput } from "../components/TextInput";
import { createSteps, SOFT_ERROR_MESSAGE } from "../lib/api";
import { TEXT_LIMITS, TEXT_LIMIT_MESSAGE, isOverTextLimit } from "../lib/textLimits";
import type { StepPayload } from "../types";

const UNIT_OPTIONS = [
  "بار",
  "دقیقه",
  "ساعت",
  "درس",
  "تمرین",
  "صفحه",
  "ویدیو",
  "لیوان",
  "جلسه",
  "مورد دیگر",
];

type StepForm = {
  title: string;
  targetValue: string;
  unit: string;
  customUnit: string;
};

const emptyStep: StepForm = {
  title: "",
  targetValue: "",
  unit: "بار",
  customUnit: "",
};

function toStepPayload(step: StepForm, index: number): StepPayload {
  return {
    title: step.title.trim(),
    target_value: Number(step.targetValue),
    unit: step.unit === "مورد دیگر" ? step.customUnit.trim() : step.unit,
    order_index: index + 1,
  };
}

function hasStartedStep(step: StepForm) {
  return Boolean(step.title.trim() || step.targetValue || step.customUnit.trim());
}

export function CreateStepsPage() {
  const navigate = useNavigate();
  const [steps, setSteps] = useState<StepForm[]>([{ ...emptyStep }]);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateStepForm(index: number, nextStep: StepForm) {
    setSteps((current) =>
      current.map((step, stepIndex) => (stepIndex === index ? nextStep : step)),
    );
  }

  function validate(payloads: StepPayload[]) {
    if (payloads.length === 0) {
      return "برای شروع، یک قدم کوچک بنویس. همین کافی است.";
    }

    const hasInvalidStep = payloads.some(
      (step) => !step.title || step.target_value <= 0 || !step.unit,
    );

    if (hasInvalidStep) {
      return "برای قدم‌هایی که نوشتی، عنوان، مقدار و واحد را خالی نگذار.";
    }

    const hasLongText = payloads.some(
      (step) =>
        isOverTextLimit(step.title, TEXT_LIMITS.stepTitle) ||
        isOverTextLimit(step.unit, TEXT_LIMITS.customUnit),
    );

    return hasLongText ? TEXT_LIMIT_MESSAGE : "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payloads = steps.filter(hasStartedStep).map(toStepPayload);
    const validationError = validate(payloads);

    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      setError("");
      setIsSubmitting(true);
      await createSteps(payloads);
      navigate("/dashboard");
    } catch {
      setError(SOFT_ERROR_MESSAGE);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppLayout title="قدم‌های کوچک">
      <Card>
        <PageHeader
          eyebrow="آرام و قابل انجام"
          title="برای این مسیر، چه قدم کوچکی می‌شود برداشت؟"
          description="یک قدم هم برای شروع کافی است. هر وقت آماده بودی، می‌توانی قدم‌های دیگری اضافه کنی."
        />

        <form className="stack" onSubmit={handleSubmit}>
          {steps.map((step, index) => (
            <div className="step-form" key={index}>
              <div className="step-form-title">
                <strong>قدم {index + 1}</strong>
                {steps.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setSteps((current) =>
                        current.filter((_, stepIndex) => stepIndex !== index),
                      )
                    }
                  >
                    برداشتن
                  </button>
                ) : null}
              </div>

              <TextInput
                label="اسم این قدم"
                value={step.title}
                maxLength={TEXT_LIMITS.stepTitle}
                onChange={(event) =>
                  updateStepForm(index, { ...step, title: event.target.value })
                }
                placeholder="مثلاً ۱۰ دقیقه تمرین آرام"
              />

              <TextInput
                label="مقدار سبک برای شروع"
                type="number"
                min="0"
                step="0.1"
                inputMode="decimal"
                value={step.targetValue}
                onChange={(event) =>
                  updateStepForm(index, {
                    ...step,
                    targetValue: event.target.value,
                  })
                }
                placeholder="مثلاً ۵"
              />

              <div className="field">
                <span>با چه واحدی بسنجیم؟</span>
                <div className="chip-grid" role="group" aria-label="انتخاب واحد قدم">
                  {UNIT_OPTIONS.map((unit) => (
                    <button
                      className={`unit-chip ${step.unit === unit ? "is-selected" : ""}`}
                      key={unit}
                      type="button"
                      onClick={() => updateStepForm(index, { ...step, unit })}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
              </div>

              {step.unit === "مورد دیگر" ? (
                <TextInput
                  label="واحد خودت"
                  value={step.customUnit}
                  maxLength={TEXT_LIMITS.customUnit}
                  onChange={(event) =>
                    updateStepForm(index, {
                      ...step,
                      customUnit: event.target.value,
                    })
                  }
                  placeholder="مثلاً فصل"
                />
              ) : null}
            </div>
          ))}

          {steps.length < 5 ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setSteps((current) => [...current, { ...emptyStep }])}
            >
              یک قدم دیگر هم اضافه کن
            </Button>
          ) : (
            <p className="muted">فعلاً همین چند قدم برای شروع کافی است.</p>
          )}

          <ErrorMessage message={error} />

          <Button type="submit" isLoading={isSubmitting}>
            {isSubmitting ? "داریم قدم‌ها را نگه می‌داریم..." : "برو به خانه مسیر"}
          </Button>
        </form>
      </Card>
    </AppLayout>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { TextInput } from "../components/TextInput";
import { createSteps, SOFT_ERROR_MESSAGE } from "../lib/api";
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
  "قرص",
  "جلسه",
  "تسک",
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
      return "حداقل یک قدم را بنویس.";
    }

    const hasInvalidStep = payloads.some(
      (step) => !step.title || step.target_value <= 0 || !step.unit,
    );

    return hasInvalidStep ? "عنوان، مقدار و واحد هر قدم را کامل کن." : "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const payloads = steps
      .map(toStepPayload)
      .filter((step) => step.title || step.target_value || step.unit);
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
    <AppLayout title="قدم‌ها">
      <section className="card">
        <h1>این مسیر را به چند قدم کوچک تقسیم کن.</h1>
        <p className="description">برای شروع، یک قدم هم کافی است.</p>

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
                    حذف
                  </button>
                ) : null}
              </div>

              <TextInput
                label="عنوان قدم"
                value={step.title}
                onChange={(event) =>
                  updateStepForm(index, { ...step, title: event.target.value })
                }
                placeholder="مثلاً ۱۰ دقیقه تمرین آرام"
              />

              <TextInput
                label="مقدار هدف"
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

              <label className="field">
                <span>واحد</span>
                <select
                  value={step.unit}
                  onChange={(event) =>
                    updateStepForm(index, { ...step, unit: event.target.value })
                  }
                >
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>

              {step.unit === "مورد دیگر" ? (
                <TextInput
                  label="واحد دلخواه"
                  value={step.customUnit}
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
              اضافه کردن قدم
            </Button>
          ) : (
            <p className="muted">فعلاً همین چند قدم برای شروع کافی است.</p>
          )}

          {error ? <p className="error-banner">{error}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "در حال ثبت..." : "رفتن به داشبورد"}
          </Button>
        </form>
      </section>
    </AppLayout>
  );
}

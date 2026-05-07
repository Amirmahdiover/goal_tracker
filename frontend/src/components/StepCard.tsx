import type { Step } from "../types";
import { Button } from "./Button";
import { Card } from "./Card";
import { ProgressBar } from "./ProgressBar";

type StepCardProps = {
  step: Step;
  onTrack: (stepId: number) => void;
  onDelete?: (stepId: number) => void;
};

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

export function StepCard({ step, onTrack, onDelete }: StepCardProps) {
  return (
    <Card as="article" className="step-card">
      <div className="step-card-top">
        <h3>{step.title}</h3>
        <span>{Math.round(step.progress_percent)}٪</span>
      </div>

      <ProgressBar value={step.progress_percent} />

      <p className="step-meta">
        {formatNumber(step.current_progress)} از {formatNumber(step.target_value)}{" "}
        {step.unit}
      </p>

      <div className="button-row">
        <Button type="button" onClick={() => onTrack(step.id)}>
          ثبت پیشرفت
        </Button>
        {onDelete ? (
          <Button
            type="button"
            variant="ghost"
            onClick={() => onDelete(step.id)}
            aria-label="برداشتن این قدم"
          >
            برداشتن
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

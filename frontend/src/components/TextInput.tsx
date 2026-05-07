import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
  limitMessage?: string;
  showCounter?: boolean;
};

export function TextInput({
  label,
  error,
  hint,
  id,
  limitMessage = "کمی کوتاه‌ترش کن تا راحت‌تر بتوانی دنبالش کنی.",
  showCounter = true,
  ...props
}: TextInputProps) {
  const inputId = id ?? props.name;
  const valueLength =
    typeof props.value === "string" || typeof props.value === "number"
      ? props.value.toString().length
      : 0;
  const showLimit = showCounter && typeof props.maxLength === "number";
  const hasReachedLimit = showLimit && valueLength >= Number(props.maxLength);

  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <input id={inputId} className={error ? "field-error" : ""} {...props} />
      {showLimit ? (
        <span className="field-meta">
          <small>{`${valueLength} / ${props.maxLength}`}</small>
          {hasReachedLimit ? <small>{limitMessage}</small> : null}
        </span>
      ) : null}
      {hint ? <small className="field-hint">{hint}</small> : null}
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  );
}

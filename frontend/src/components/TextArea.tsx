import type { TextareaHTMLAttributes } from "react";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
};

export function TextArea({ label, error, id, ...props }: TextAreaProps) {
  const inputId = id ?? props.name;

  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <textarea id={inputId} className={error ? "field-error" : ""} {...props} />
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  );
}

import type { InputHTMLAttributes } from "react";

type TextInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

export function TextInput({ label, error, id, ...props }: TextInputProps) {
  const inputId = id ?? props.name;

  return (
    <label className="field" htmlFor={inputId}>
      {label ? <span>{label}</span> : null}
      <input id={inputId} className={error ? "field-error" : ""} {...props} />
      {error ? <small className="error-text">{error}</small> : null}
    </label>
  );
}

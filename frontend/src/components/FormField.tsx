import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}

export function FormField({ label, name, error, hint, children }: FormFieldProps) {
  return (
    <div className="form-field">
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
      {error && (
        <p id={`${name}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

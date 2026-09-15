import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from "react";

interface FieldWrapperProps {
  label: string;
  hint?: string;
  error?: string;
}

const baseInput =
  "w-full rounded-lg border hairline bg-ink-soft px-4 py-3 text-sm text-paper placeholder:text-ash-soft outline-none focus:border-red transition-colors";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldWrapperProps
>(({ label, hint, error, id, ...props }, ref) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={inputId} className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.12em] text-ash">{label}</span>
      <input ref={ref} id={inputId} className={baseInput} {...props} />
      {hint && !error && <span className="text-xs text-ash-soft">{hint}</span>}
      {error && <span className="text-xs text-red-bright">{error}</span>}
    </label>
  );
});
Input.displayName = "Input";

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldWrapperProps
>(({ label, hint, error, id, ...props }, ref) => {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={inputId} className="flex flex-col gap-2">
      <span className="text-xs uppercase tracking-[0.12em] text-ash">{label}</span>
      <textarea ref={ref} id={inputId} className={baseInput} rows={4} {...props} />
      {hint && !error && <span className="text-xs text-ash-soft">{hint}</span>}
      {error && <span className="text-xs text-red-bright">{error}</span>}
    </label>
  );
});
Textarea.displayName = "Textarea";

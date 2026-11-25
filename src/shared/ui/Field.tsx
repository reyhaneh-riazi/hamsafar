import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/shared/lib/cn";

const CONTROL =
  "w-full rounded-xl border bg-surface text-ink placeholder:text-ink-soft transition-colors outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-500/12 disabled:bg-surface-muted disabled:text-ink-soft";

function controlClasses(invalid: boolean, extra?: string) {
  return cn(
    CONTROL,
    invalid
      ? "border-danger focus:border-danger focus:ring-danger/15"
      : "border-line",
    extra,
  );
}

interface FieldShellProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-bold text-ink">
          {label}
          {required && (
            <span className="ms-0.5 text-coral-600" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-xs font-medium text-danger"
        >
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-ink-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
  wrapperClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      hint,
      error,
      icon,
      id,
      className,
      wrapperClassName,
      required,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <FieldShell
        id={fieldId}
        label={label}
        hint={hint}
        error={error}
        required={required}
        className={wrapperClassName}
      >
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-ink-soft">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={fieldId}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={
              error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
            }
            className={controlClasses(
              Boolean(error),
              cn("h-12 px-4 text-sm", icon ? "ps-11" : undefined, className),
            )}
            {...rest}
          />
        </div>
      </FieldShell>
    );
  },
);

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    { label, hint, error, id, className, required, ...rest },
    ref,
  ) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <FieldShell
        id={fieldId}
        label={label}
        hint={hint}
        error={error}
        required={required}
      >
        <textarea
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          className={controlClasses(
            Boolean(error),
            cn("min-h-28 px-4 py-3 text-sm leading-7", className),
          )}
          {...rest}
        />
      </FieldShell>
    );
  },
);

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}

export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  function SelectField(
    {
      label,
      hint,
      error,
      id,
      className,
      options,
      placeholder,
      required,
      ...rest
    },
    ref,
  ) {
    const autoId = useId();
    const fieldId = id ?? autoId;
    return (
      <FieldShell
        id={fieldId}
        label={label}
        hint={hint}
        error={error}
        required={required}
      >
        <select
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          className={controlClasses(
            Boolean(error),
            cn("h-12 appearance-none px-4 text-sm", className),
          )}
          {...rest}
        >
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </FieldShell>
    );
  },
);

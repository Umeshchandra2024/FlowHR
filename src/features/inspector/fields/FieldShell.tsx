import type { ReactNode } from 'react'

type Props = {
  label: string
  htmlFor?: string
  required?: boolean
  helpText?: string
  error?: string | null
  children: ReactNode
}

/** Shared chrome around every form control: label, required marker, help text, error. */
export function FieldShell({ label, htmlFor, required, helpText, error, children }: Props) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-rose-500">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-rose-600">{error}</p>
      ) : helpText ? (
        <p className="mt-1 text-xs text-slate-400">{helpText}</p>
      ) : null}
    </div>
  )
}

export const INPUT_CLASS =
  'w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 placeholder:text-slate-300 focus:border-accent-500 focus:ring-2 focus:ring-accent-100 focus:outline-none'

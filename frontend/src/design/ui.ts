/** Shared visual language for controls and semantic state across the application. */
export const ui = {
  field: 'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0053a0] focus:ring-2 focus:ring-[#0053a0]/20',
  label: 'block text-xs font-semibold uppercase tracking-wide text-slate-700',
  primaryButton: 'min-h-11 rounded-xl bg-[#0053a0] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#004783] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0053a0] disabled:cursor-not-allowed disabled:opacity-50',
  secondaryButton: 'min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0053a0] disabled:cursor-not-allowed disabled:opacity-50',
  dangerButton: 'min-h-11 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 disabled:cursor-not-allowed disabled:opacity-50',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  attention: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-rose-200 bg-rose-50 text-rose-800',
} as const

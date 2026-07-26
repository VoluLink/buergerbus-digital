import { Bus } from 'lucide-react'

export function AppLoadingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6 text-slate-900" aria-busy="true" aria-live="polite">
      <div className="flex flex-col items-center rounded-3xl border border-[#0053a0]/15 bg-white px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,83,160,0.12)]">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0053a0]/10 text-[#0053a0]">
          <Bus className="h-7 w-7" aria-hidden="true" />
        </div>
        <p className="mt-5 text-lg font-semibold">Bürgerbus Digital wird geladen</p>
        <p className="mt-1 text-sm text-slate-500">Einen Moment bitte …</p>
      </div>
    </main>
  )
}

import type { ReactNode } from 'react'

type AuthLayoutProps = {
  children: ReactNode
}

function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(0,83,160,0.12),_transparent_38%),linear-gradient(180deg,#f8fbff_0%,#ffffff_60%)] px-5 py-8 text-slate-900 sm:px-6 lg:px-8">
      <div className="relative flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center">
        {children}
      </div>
    </main>
  )
}

export default AuthLayout
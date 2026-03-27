'use client'

import { cn } from '@/lib/utils'

export default function TopBar() {
  return (
    <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/50 shadow-sm transition-all duration-200 ease-in-out">
      {/* Título + Nav */}
      <div className="flex items-center gap-8">
        <h2 className="text-xl font-extrabold text-primary font-headline tracking-tight">
          SUBGESEGER Portal
        </h2>
        <nav className="hidden lg:flex items-center gap-6">
          <a className="text-primary font-semibold border-b-2 border-primary py-1 transition-all cursor-pointer">
            Documents
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-all cursor-pointer">
            Procedures
          </a>
          <a className="text-on-surface-variant hover:text-primary transition-all cursor-pointer">
            Compliance
          </a>
        </nav>
      </div>

      {/* Busca + Ícones + Perfil */}
      <div className="flex items-center gap-6">
        {/* Busca */}
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>
            search
          </span>
          <input
            className="pl-10 pr-4 py-2 bg-surface-container-highest border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary focus:bg-white transition-all placeholder:text-on-surface-variant/60"
            placeholder="Global search..."
            type="text"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Notificações */}
          <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>

          {/* Apps */}
          <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">apps</span>
          </button>

          <div className="h-8 w-px bg-outline-variant mx-1" />

          {/* Avatar */}
          <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm bg-surface-container-high flex items-center justify-center overflow-hidden cursor-pointer">
            <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>
              account_circle
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}

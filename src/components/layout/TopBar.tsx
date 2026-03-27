'use client'

import { Bell, Grid, Search, ChevronDown, User } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function TopBar() {
  return (
    <header className="flex justify-between items-center w-full px-8 py-4 sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/50 shadow-sm transition-all duration-200">
      {/* Título + Nav */}
      <div className="flex items-center gap-8">
        <h2 className="text-2xl font-extrabold text-primary font-headline tracking-tight">
          GPP Plataforma
        </h2>
        <nav className="hidden lg:flex items-center gap-6">
          <a className="text-primary font-semibold border-b-2 border-primary py-1 px-2 transition-all">Dashboard</a>
          <a className="text-on-surface-variant hover:text-primary font-medium py-1 px-2 transition-all hover:border-b-2 hover:border-primary">Projetos</a>
          <a className="text-on-surface-variant hover:text-primary font-medium py-1 px-2 transition-all hover:border-b-2 hover:border-primary">Processos</a>
        </nav>
      </div>

      {/* Busca + Ícones + Perfil */}
      <div className="flex items-center gap-4">
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-outline-variant h-4 w-4 pointer-events-none" />
          <input className="pl-10 pr-4 py-2.5 bg-surface-container-high border border-outline-variant rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-surface-container-lowest transition-all placeholder:text-on-surface-variant" placeholder="Busca global..." type="search" />
        </div>

        {/* Notificações */}
        <button className="relative w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary rounded-full p-2 transition-all">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full animate-pulse" />
        </button>

        {/* Apps */}
        <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary rounded-full p-2 transition-all">
          <Grid className="h-5 w-5" />
        </button>

        <div className="h-6 w-px bg-outline-variant" />

        {/* Perfil — Avatar INLINE */}
        <div className="flex items-center gap-3 p-2 -m-2 rounded-full hover:bg-surface-container transition-colors cursor-pointer">
          <div className="w-10 h-10 bg-primary-container rounded-full flex items-center justify-center shadow-sm border-2 border-surface-container-lowest">
            <User className="h-5 w-5 text-on-primary" />
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-medium text-primary truncate max-w-[140px]">Alexandre Mohamad</div>
            <div className="text-xs text-on-surface-variant">Admin</div>
          </div>
          <ChevronDown className="h-4 w-4 text-on-surface-variant" />
        </div>
      </div>
    </header>
  )
}

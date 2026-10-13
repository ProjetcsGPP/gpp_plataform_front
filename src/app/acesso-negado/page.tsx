// src/app/acesso-negado/page.tsx
// Tela pública de acesso negado — destino padrão do RouteGuard.
// Não requer autenticação. Acessível de qualquer app_context.
'use client'

import Link from 'next/link'

export default function AcessoNegadoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-app-gradient">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-10 max-w-md w-full text-center text-white shadow-xl">
        <span
          className="material-symbols-outlined text-6xl text-red-300 mb-4 block"
          aria-hidden="true"
        >
          lock
        </span>

        <h1 className="text-2xl font-bold mb-2">Acesso negado</h1>

        <p className="text-white/70 mb-8">
          Você não possui permissão para acessar esta página.
          Se acredita que isso é um erro, entre em contato com o administrador do sistema.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/portal/dashboard"
            className="bg-white text-gray-800 font-semibold py-2 px-6 rounded-lg hover:bg-white/90 transition"
          >
            Voltar ao Portal
          </Link>

          <button
            type="button"
            onClick={() => window.history.back()}
            className="text-white/70 hover:text-white text-sm underline transition"
          >
            Voltar à página anterior
          </button>
        </div>
      </div>
    </div>
  )
}

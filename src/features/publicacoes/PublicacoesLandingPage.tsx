export function PublicacoesLandingPage() {
  return (
    <section className="w-full py-8" aria-labelledby="publicacoes-title">
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
        <span
          className="material-symbols-outlined text-5xl text-app-primary"
          aria-hidden="true"
        >
          library_books
        </span>
        <h1
          id="publicacoes-title"
          className="mt-3 text-2xl font-bold tracking-tight text-slate-900"
        >
          Publicações Institucionais
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
          Selecione no menu um recurso disponível para o seu acesso. Os recursos
          exibidos são definidos pelas capabilities e permissões recebidas do
          backend.
        </p>
      </div>
    </section>
  );
}

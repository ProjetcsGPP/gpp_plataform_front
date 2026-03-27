'use client'

export function ImpactMap() {
  return (
    <div className="bg-surface-container-lowest rounded-lg overflow-hidden shadow-sm flex flex-col h-[500px]">
      <div className="p-6 flex justify-between items-center border-b border-surface-container">
        <div>
          <h4 className="text-lg font-bold font-outfit text-primary">
            Mapa de Impacto Governamental
          </h4>
          <p className="text-sm text-on-surface-variant">
            Visualização geoespacial de investimentos ativos
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-1.5 text-xs font-bold bg-surface-container text-on-surface rounded-md hover:bg-surface-container-high transition-colors">
            Estado
          </button>
          <button className="px-4 py-1.5 text-xs font-bold bg-primary text-on-primary rounded-md">
            Federal
          </button>
        </div>
      </div>

      <div className="flex-1 relative bg-slate-100">
        <div
          className="absolute inset-0 grayscale contrast-125 opacity-40 mix-blend-multiply"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuA4OIshMGk8kFgMxPt1POP8m8BrbaiaLm1Uwl6GAXRiWVAJsAYIqe25tsrwf-aMybavu-WGyVOsAhb483gsoWrmVO2OAedz8V6Kx28cmisRR8S6m0whGUqip475acVKE71RLzGNGIISQVaZsp-CsQ8nxVUj8nmiJu_Vl_J8S_qJizQk-N_mzOF3rCOjyv2Mc--rggO5tSW5KEFQ0rkLrDm1c9hZMhKZFlBHEZPo-VwTLSkoTuNhUOR2wxGFrifN0UcDZ0liavWdbE4')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
        <div className="absolute top-1/4 left-1/3 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-primary rounded-full border-2 border-white shadow-xl" />
        <div className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-blue-400 rounded-full border-2 border-white shadow-xl" />
        <div className="absolute top-[20%] left-[36%] glass-card p-3 rounded-lg shadow-lg border border-white/20 z-10">
          <p className="text-[10px] font-bold text-primary uppercase">Infraestrutura</p>
          <p className="text-xs font-bold mt-1">Complexo Solar Norte</p>
          <p className="text-[10px] text-green-600 font-bold">R$ 4.2B em execução</p>
        </div>
      </div>

      <div className="p-4 bg-surface-container-low flex items-center justify-between text-xs text-on-surface-variant">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary" /> Alta Prioridade
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-400" /> Monitoramento
          </span>
        </div>
        <span>Última atualização: Hoje, 14:32</span>
      </div>
    </div>
  )
}

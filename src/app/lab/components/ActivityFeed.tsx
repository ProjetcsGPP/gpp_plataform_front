'use client'

const activities = [
  {
    id: 1,
    icon: 'description',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    fill: false,
    time: 'Há 12 min',
    title: 'Relatório de Impacto Social aprovado pela Controladoria.',
    meta: 'ID: #DOC-9842-X',
  },
  {
    id: 2,
    icon: 'update',
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    fill: false,
    time: 'Há 45 min',
    title: "Cronograma do projeto 'Comando Solar' atualizado.",
    metaLabel: 'Alterado por',
    metaBold: 'Dr. Henrique Silva',
  },
  {
    id: 3,
    icon: 'check_circle',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    fill: true,
    time: 'Há 2 horas',
    title: 'Novo nó de integração finalizado: SINFRA-NET.',
  },
  {
    id: 4,
    icon: 'warning',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    fill: true,
    time: 'Há 4 horas',
    title: 'Falha crítica na API de Compliance detectada.',
    action: 'Resolver agora',
  },
]

export function ActivityFeed() {
  return (
    <div className="bg-surface-container-lowest rounded-lg shadow-sm h-[500px] flex flex-col">
      <div className="p-6 border-b border-surface-container">
        <h4 className="text-lg font-bold font-outfit text-primary">
          Atividades Recentes
        </h4>
        <p className="text-sm text-on-surface-variant">
          Log de operações em tempo real
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
        {activities.map((item, index) => (
          <div key={item.id} className="flex gap-4 relative">
            {index < activities.length - 1 && (
              <div className="absolute left-4 top-8 bottom-[-16px] w-[1px] bg-slate-100" />
            )}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${item.iconBg}`}>
              <span
                className={`material-symbols-outlined ${item.iconColor}`}
                style={{
                  fontSize: '18px',
                  fontVariationSettings: item.fill ? "'FILL' 1" : "'FILL' 0",
                }}
              >
                {item.icon}
              </span>
            </div>
            <div>
              <p className="text-xs text-on-surface-variant">{item.time}</p>
              <p className="text-sm font-semibold mt-0.5 text-on-surface">{item.title}</p>
              {'meta' in item && item.meta && (
                <p className="text-[10px] text-blue-900 font-medium mt-1">{item.meta}</p>
              )}
              {'metaLabel' in item && item.metaLabel && (
                <p className="text-[10px] text-on-surface-variant mt-1">
                  {item.metaLabel} <span className="font-bold text-on-surface">{item.metaBold}</span>
                </p>
              )}
              {'action' in item && item.action && (
                <button className="mt-2 text-xs font-bold text-on-primary bg-error px-3 py-1 rounded hover:bg-error/90 transition-colors">
                  {item.action}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 text-center border-t border-surface-container-low">
        <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1 mx-auto">
          Ver histórico completo
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>arrow_forward</span>
        </button>
      </div>
    </div>
  )
}

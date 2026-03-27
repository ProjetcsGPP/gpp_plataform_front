'use client'

// =============================================================================
// StatCard — pixel-perfect baseado em visao-Google.html
// Uso:
//   <StatCard label="Projetos Ativos" value="248" trend="+12%"    icon="rocket_launch" variant="proj" />
//   <StatCard label="Processos"       value="1,429" trend="94% Comp." icon="account_tree"  variant="proc" />
//   <StatCard label="Alertas"         value="07" subtext="Require immediate action" icon="report_problem" variant="alert" />
//   <StatCard label="Eficiência"      value="88.5%" icon="speed" variant="efi" progress={88.5} />
// =============================================================================

interface StatCardProps {
  label: string
  value: string | number
  /** Badge de tendência (proj/proc) */
  trend?: string
  /** Subtexto simples sem badge (alert) */
  subtext?: string
  /** Nome do Material Symbol: 'rocket_launch' | 'account_tree' | 'report_problem' | 'speed' */
  icon: string
  variant?: 'proj' | 'proc' | 'alert' | 'efi'
  /** Percentual da barra de progresso — apenas variant="efi" */
  progress?: number
}

export function StatCard({
  label,
  value,
  trend,
  subtext,
  icon,
  variant = 'proj',
  progress,
}: StatCardProps) {

  const progressValue =
    variant === 'efi'
      ? (progress ?? (typeof value === 'string' ? parseFloat(value) : (value as number)))
      : null

  // -------------------------------------------------------------------------
  // PROJ — Projetos Ativos
  // -------------------------------------------------------------------------
  if (variant === 'proj') {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-primary group hover:bg-primary-container hover:text-white transition-all duration-300 cursor-pointer">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-blue-100">
            {label}
          </span>
          <span className="material-symbols-outlined text-primary group-hover:text-blue-200">
            {icon}
          </span>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-extrabold font-outfit tracking-tight">{value}</span>
          {trend && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full group-hover:bg-green-600 group-hover:text-white transition-colors">
                {trend}
              </span>
              <span className="text-[10px] text-on-surface-variant group-hover:text-blue-200">
                vs. last month
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // PROC — Processos Mapeados
  // -------------------------------------------------------------------------
  if (variant === 'proc') {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-blue-400 group hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-blue-100">
            {label}
          </span>
          <span className="material-symbols-outlined text-blue-500 group-hover:text-blue-100">
            {icon}
          </span>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-extrabold font-outfit tracking-tight">{value}</span>
          {trend && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full group-hover:bg-blue-400 group-hover:text-white transition-colors">
                {trend}
              </span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // ALERT — Alertas Críticos
  // -------------------------------------------------------------------------
  if (variant === 'alert') {
    return (
      <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-error group hover:bg-error hover:text-white transition-all duration-300 cursor-pointer">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-white">
            {label}
          </span>
          <span
            className="material-symbols-outlined text-error group-hover:text-white"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-extrabold font-outfit tracking-tight">{value}</span>
          {subtext && (
            <div className="flex items-center gap-2 mt-2 text-on-error-container group-hover:text-white">
              <span className="text-[10px] font-bold">{subtext}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // EFI — Eficiência Geral
  // -------------------------------------------------------------------------
  return (
    <div className="bg-surface-container-lowest p-6 rounded-lg shadow-sm border-l-4 border-tertiary-container group hover:bg-on-tertiary-container hover:text-white transition-all duration-300 cursor-pointer">
      <div className="flex justify-between items-start">
        <span className="text-xs font-bold uppercase tracking-wider text-on-surface-variant group-hover:text-white">
          {label}
        </span>
        <span className="material-symbols-outlined text-tertiary-container group-hover:text-white">
          {icon}
        </span>
      </div>
      <div className="mt-4">
        <span className="text-3xl font-extrabold font-outfit tracking-tight">{value}</span>
        {progressValue !== null && (
          <div className="flex items-center gap-2 mt-2">
            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="bg-tertiary-container h-full group-hover:bg-white transition-all"
                style={{ width: `${progressValue}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

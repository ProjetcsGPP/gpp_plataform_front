// src/components/common/MaintenanceMode.tsx
// Componente de aviso de manutencao programada.
//
// Usado diretamente pela pagina /portal/manutencao/page.tsx
// e pode ser reutilizado em qualquer modulo.

interface MaintenanceModeProps {
  /** Nome do sistema ou modulo em manutencao */
  systemName?: string
  /** Previsao de retorno ex: "17/04/2026 as 18h" */
  returnForecast?: string
  /** Mensagem adicional da equipe tecnica */
  message?: string
}

export function MaintenanceMode({
  systemName = 'GPP Plataforma',
  returnForecast,
  message,
}: MaintenanceModeProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="flex flex-col items-center gap-6 text-center max-w-md">
        <span
          className="material-symbols-outlined text-7xl text-slate-300"
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 200" }}
        >
          engineering
        </span>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-slate-800">
            {systemName} em manutenção
          </h1>
          <p className="text-sm text-slate-500">
            {message ??
              'Estamos realizando uma manutenção programada para melhorar o sistema.'}
          </p>
          {returnForecast && (
            <p className="text-sm text-slate-600">
              Previsão de retorno:{' '}
              <span className="font-semibold">{returnForecast}</span>
            </p>
          )}
        </div>
        <p className="text-xs text-slate-400">
          Se você precisar de ajuda urgente, entre em contato com a equipe de TI da SEGER.
        </p>
      </div>
    </div>
  )
}

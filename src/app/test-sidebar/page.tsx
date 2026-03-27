'use client'

import Sidebar from '@/components/layout/Sidebar'
import TopBar from '@/components/layout/TopBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ImpactMap } from '@/components/dashboard/ImpactMap'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import { Rocket, FolderTree, AlertCircle, Gauge, PlusCircle, FileText, BarChart3 } from 'lucide-react'

export default function TestSidebar() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      
      <div className="flex flex-col flex-1 ml-20 md:ml-64 min-h-screen">
        <TopBar />
        
        <main className="px-8 py-8 space-y-10 max-w-[1600px] mx-auto">
          
          {/* === 1. PageHeader === */}
          <PageHeader
            eyebrow="Comando Solar (Sóbrio)"
            title="Dashboard Completo"
            subtitle="Template 100% pronto para uso. Copie os componentes para qualquer página."
            action={
              <button className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Nova Solicitação
              </button>
            }
          />

          {/* === 2. StatCards === */}
          <section>
            <h3 className="text-lg font-bold text-primary mb-6 font-headline">Métricas Principais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard
                label="Projetos Ativos"
                value="248"
                trend="+12%"
                icon={<Rocket />} 
                variant="proj"
              />
              <StatCard
                label="Processos Mapeados"
                value="1,429"
                trend="94% Comp."
                icon={<FolderTree />} 
                variant="proc"
              />
              <StatCard
                label="Alertas Críticos"
                value="07"
                icon={<AlertCircle />} 
                variant="alert"
              />
              <StatCard
                label="Eficiência Geral"
                value="88.5%"
                icon={<Gauge />} 
                variant="efi"
              />
            </div>
          </section>

          {/* === 3. StatusBadge Demo === */}
          <section className="space-y-4">
            <h3 className="text-lg font-bold text-primary font-headline">StatusBadge (copie este!)</h3>
            <div className="flex flex-wrap gap-3 items-center">
              <StatusBadge status="Em Dia" />
              <StatusBadge status="Atenção" />
              <StatusBadge status="Atrasado" />
              <div className="text-sm text-on-surface-variant">
                Uso: <code className="bg-surface-container-high px-1.5 py-0.5 rounded text-xs font-mono">
                  {'<StatusBadge status="Em Dia" />'}
                </code>
              </div>
            </div>
          </section>

          {/* === 4. Dashboard Layout Completo === */}
          <section>
            <h3 className="text-lg font-bold text-primary mb-6 font-headline">Layout Dashboard (Mapa + Feed)</h3>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 pb-12">
              <div className="xl:col-span-2">
                <ImpactMap />
              </div>
              <div>
                <ActivityFeed />
              </div>
            </div>
          </section>

          {/* === 5. Sidebar + TopBar sempre visíveis === */}
          <div className="p-6 bg-surface-container-high rounded-lg text-sm text-on-surface-variant space-y-2">
            <strong>✅ Template pronto para copiar:</strong>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Sidebar flexível (`ml-20 md:ml-64`)</li>
              <li>TopBar sticky (`z-40 sticky top-0`)</li>
              <li>PageHeader responsivo</li>
              <li>StatCard com hover perfeito</li>
              <li>StatusBadge tipado TypeScript</li>
              <li>ImpactMap com tooltip + pins</li>
              <li>ActivityFeed timeline completa</li>
            </ul>
            <div className="mt-4 p-3 bg-primary-container text-on-primary rounded-lg text-xs">
              Copie qualquer seção para sua página real!
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

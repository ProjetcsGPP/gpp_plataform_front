// Status de projeto seguindo a lógica RAG (Red-Amber-Green)
export type ProjectStatus = 'Em Dia' | 'Atenção' | 'Atrasado';

export interface Project {
  id: string;
  name: string;
  department: string;
  progress: number; // 0 a 100
  status: ProjectStatus;
  leader: {
    name: string;
    avatarUrl?: string;
    initials: string;
  };
  lastUpdate: string;
}

export interface MetricCard {
  label: string;
  value: string | number;
  trend?: string;
  icon: string;
}

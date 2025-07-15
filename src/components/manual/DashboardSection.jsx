import React from 'react';
import { LayoutDashboard, BarChart, AlertTriangle, Calendar, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DashboardSection() {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold border-b-2 border-teal-500 pb-2 mb-6">2. Dashboard Principal</h2>
      <p className="text-lg mb-6">
        O Dashboard é a sua tela inicial e centro de comando. Ele fornece uma visão geral e em tempo real de tudo o que está acontecendo.
      </p>
      
      <div className="border p-4 rounded-lg bg-gray-50 mb-6">
        <div className="text-center text-gray-500 py-8">
          <LayoutDashboard className="h-16 w-16 mx-auto mb-4" />
          <p>Visualização do Dashboard</p>
          <p className="text-sm">Interface principal com cards de resumo, progresso dos projetos e alertas</p>
        </div>
      </div>

      <h3 className="text-2xl font-semibold mb-4">Componentes Principais</h3>
      <ul className="space-y-4">
        <li className="flex items-start gap-4">
          <LayoutDashboard className="h-6 w-6 text-blue-500 mt-1" />
          <div>
            <h4 className="font-bold">Cards de Resumo</h4>
            <p className="text-gray-600">No topo, você encontra um resumo rápido com números importantes: <Badge>Projetos Ativos</Badge>, <Badge>Tarefas Pendentes</Badge>, <Badge>Tarefas Atrasadas</Badge> e <Badge>Próximas Reuniões</Badge>. Clique em "Ver detalhes" para ir para a página correspondente.</p>
          </div>
        </li>
        <li className="flex items-start gap-4">
          <BarChart className="h-6 w-6 text-green-500 mt-1" />
          <div>
            <h4 className="font-bold">Progresso dos Projetos</h4>
            <p className="text-gray-600">Uma lista dos seus projetos ativos com uma barra de progresso visual, responsável e prazo. Permite acompanhar rapidamente o andamento de cada iniciativa.</p>
          </div>
        </li>
        <li className="flex items-start gap-4">
          <AlertTriangle className="h-6 w-6 text-red-500 mt-1" />
          <div>
            <h4 className="font-bold">Listas de Alerta</h4>
            <p className="text-gray-600">Duas colunas destacam o que precisa de atenção imediata: <strong>Tarefas Atrasadas</strong> e <strong>Próximas Reuniões</strong>. Isso ajuda a priorizar seu dia.</p>
          </div>
        </li>
        <li className="flex items-start gap-4">
          <Plus className="h-6 w-6 text-teal-500 mt-1" />
          <div>
            <h4 className="font-bold">Ações Rápidas</h4>
            <p className="text-gray-600">Use os botões na parte superior para criar rapidamente uma nova tarefa, projeto, reunião ou interagir com o Assistente de IA.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
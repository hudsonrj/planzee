import React from 'react';
import { Calendar, PenSquare, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function MeetingsSection() {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold border-b-2 border-teal-500 pb-2 mb-6">6. Reuniões e Colaboração</h2>
      <p className="text-lg mb-6">
        A gestão eficiente de reuniões é crucial. A plataforma ajuda a agendar, documentar e extrair ações de cada encontro.
      </p>

      <h3 className="text-2xl font-semibold mb-4">Agendando uma Reunião</h3>
      <ol className="list-decimal pl-6 space-y-2 mb-8">
        <li>Acesse a página de <strong>Reuniões</strong>.</li>
        <li>Clique em <Badge variant="secondary">Agendar Reunião</Badge>.</li>
        <li>Associe a um projeto, defina o título, a data e adicione os participantes.</li>
        <li>Clique em "Salvar" para agendar.</li>
      </ol>

      <h3 className="text-2xl font-semibold mb-4">O Poder das Anotações Inteligentes</h3>
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <PenSquare className="h-8 w-8 text-blue-500 mt-1" />
          <div>
            <h4 className="font-bold text-lg">Registre Tudo</h4>
            <p className="text-gray-600">Durante a reunião, acesse a página de detalhes e adicione as anotações no editor de texto. Registre as decisões, pontos discutidos e próximos passos.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Sparkles className="h-8 w-8 text-purple-500 mt-1" />
          <div>
            <h4 className="font-bold text-lg">Melhore com IA</h4>
            <p className="text-gray-600">Depois de anotar, clique no botão <Badge>Melhorar Texto com IA</Badge>. A IA irá automaticamente corrigir erros, melhorar a clareza e formatar suas anotações em uma ata profissional.</p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <Sparkles className="h-8 w-8 text-amber-500 mt-1" />
          <div>
            <h4 className="font-bold text-lg">Gere Tarefas Automaticamente</h4>
            <p className="text-gray-600">Clique em <Badge>Gerar Tarefas da Reunião</Badge>. A IA lerá a ata e identificará itens de ação, sugerindo novas tarefas com descrição e responsável, prontas para serem adicionadas ao projeto.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
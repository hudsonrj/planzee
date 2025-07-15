import React from 'react';
import { ListTodo, PlusCircle, Kanban, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function TasksSection() {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold border-b-2 border-teal-500 pb-2 mb-6">4. Gestão de Tarefas</h2>
      <p className="text-lg mb-6">
        As tarefas são os blocos de construção dos seus projetos. A página de Tarefas permite que você gerencie todo o trabalho a ser feito de forma organizada.
      </p>

      <h3 className="text-2xl font-semibold mb-4">Visualizações de Tarefas</h3>
      <p className="mb-6">Você pode alternar entre três modos de visualização para melhor se adaptar ao seu fluxo de trabalho:</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-4 border rounded-lg text-center">
          <ListTodo className="h-8 w-8 text-blue-500 mx-auto mb-2" />
          <h4 className="font-bold text-lg">Lista</h4>
          <p className="text-gray-600 text-sm">Uma visão detalhada e vertical de todas as tarefas, ideal para revisões e atualizações em massa.</p>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <Kanban className="h-8 w-8 text-purple-500 mx-auto mb-2" />
          <h4 className="font-bold text-lg">Quadro Kanban</h4>
          <p className="text-gray-600 text-sm">Visualize as tarefas em colunas por status (Pendente, Em Andamento, etc.). Arraste e solte para atualizar o status.</p>
        </div>
        <div className="p-4 border rounded-lg text-center">
          <Filter className="h-8 w-8 text-amber-500 mx-auto mb-2" />
          <h4 className="font-bold text-lg">Filtros</h4>
          <p className="text-gray-600 text-sm">Filtre tarefas por projeto, status ou responsável para focar no que é mais importante.</p>
        </div>
      </div>
      
      <h3 className="text-2xl font-semibold mb-4">Como Criar e Atualizar uma Tarefa</h3>
      <ol className="list-decimal pl-6 space-y-3 mb-8">
        <li>
          <strong>Clique em "Nova Tarefa":</strong> Na página de Tarefas, use o botão <Badge variant="secondary"><PlusCircle className="inline h-4 w-4 mr-1" /> Nova Tarefa</Badge>.
        </li>
        <li>
          <strong>Preencha os Detalhes:</strong> Associe a tarefa a um <Badge>Projeto</Badge>, dê um <Badge>Título</Badge>, descreva o trabalho, defina <Badge>Prioridade</Badge>, <Badge>Prazo</Badge> e atribua a um <Badge>Responsável</Badge>.
        </li>
        <li>
          <strong>Atualize o Status:</strong> Na visualização em lista, você pode clicar no ícone de status para alterá-lo. No quadro Kanban, basta arrastar o card da tarefa para a coluna desejada.
        </li>
        <li>
          <strong>Edite ou Exclua:</strong> Use os ícones em cada tarefa para editar todos os seus detalhes ou para excluí-la.
        </li>
      </ol>
    </section>
  );
}
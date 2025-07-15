import React from 'react';
import { Briefcase, PlusCircle, Filter, Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProjectsSection() {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold border-b-2 border-teal-500 pb-2 mb-6">3. Gestão de Projetos</h2>
      <p className="text-lg mb-6">
        A seção de Projetos é onde você pode visualizar, criar e gerenciar todas as iniciativas da equipe.
      </p>

      <h3 className="text-2xl font-semibold mb-4">Como Criar um Novo Projeto</h3>
      <ol className="list-decimal pl-6 space-y-3 mb-8">
        <li>
          <strong>Acesse a Página de Projetos:</strong> No menu principal, clique em "Projetos".
        </li>
        <li>
          <strong>Clique em "Novo Projeto":</strong> Você verá um botão <Badge variant="secondary"><PlusCircle className="inline h-4 w-4 mr-1" /> Novo Projeto</Badge>.
        </li>
        <li>
          <strong>Preencha os Detalhes:</strong> Um formulário aparecerá. Preencha os campos essenciais:
          <ul className="list-disc pl-6 mt-2">
            <li><strong>Título:</strong> Um nome claro e objetivo para o projeto.</li>
            <li><strong>Descrição:</strong> Um resumo do que se trata o projeto.</li>
            <li><strong>Responsável:</strong> A pessoa que lidera o projeto.</li>
            <li><strong>Datas:</strong> Defina a data de início e o prazo final.</li>
            <li><strong>Status e Prioridade:</strong> Classifique o projeto adequadamente.</li>
          </ul>
        </li>
        <li>
          <strong>Salvar:</strong> Clique em "Salvar Projeto" para criá-lo. O projeto agora aparecerá na sua lista.
        </li>
      </ol>
      
      <div className="border-l-4 border-purple-500 bg-purple-50 p-4 rounded-md mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Bot className="h-6 w-6 text-purple-700" />
          <h4 className="font-bold text-lg text-purple-800">Dica de IA: Criação Rápida</h4>
        </div>
        <p className="text-purple-700">
          Você também pode clicar em <Badge variant="secondary"><Bot className="inline h-4 w-4 mr-1"/>Gerar com IA</Badge>. Apenas descreva sua ideia de projeto em texto simples, e a IA preencherá o formulário para você, sugerindo título, descrição, datas e até tarefas iniciais!
        </p>
      </div>

      <h3 className="text-2xl font-semibold mb-4">Visualizando e Filtrando Projetos</h3>
      <ul className="space-y-4">
        <li className="flex items-start gap-4">
          <Briefcase className="h-6 w-6 text-blue-500 mt-1" />
          <div>
            <h4 className="font-bold">Visualização de Projetos</h4>
            <p className="text-gray-600">Os projetos são exibidos em cards, mostrando informações-chave como título, progresso, responsável e prazo. Clique em qualquer card para ver a página de detalhes completa do projeto.</p>
          </div>
        </li>
        <li className="flex items-start gap-4">
          <Filter className="h-6 w-6 text-amber-500 mt-1" />
          <div>
            <h4 className="font-bold">Filtros e Pesquisa</h4>
            <p className="text-gray-600">Use a barra de pesquisa para encontrar um projeto pelo nome. Utilize os filtros para visualizar projetos por <Badge>Status</Badge> (ex: Em desenvolvimento, Concluído) ou por <Badge>Responsável</Badge>.</p>
          </div>
        </li>
      </ul>
    </section>
  );
}
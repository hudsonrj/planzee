import React from 'react';
import { DollarSign, Server, ClipboardCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function FinancialSection() {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold border-b-2 border-teal-500 pb-2 mb-6">7. Gestão Financeira</h2>
      <p className="text-lg mb-6">
        Controle os aspectos financeiros dos seus projetos, desde a criação de orçamentos até o planejamento de custos de infraestrutura.
      </p>
      
      <h3 className="text-2xl font-semibold mb-4">Orçamentos</h3>
      <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg mb-8">
        <DollarSign className="h-8 w-8 text-green-600 mt-1 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-lg">Criação e Gestão de Orçamentos</h4>
          <p className="text-gray-700 mb-2">
            Acesse a seção de <Badge>Orçamentos</Badge> para criar propostas detalhadas para clientes. Você pode adicionar itens, definir condições comerciais e exportar para PDF.
          </p>
          <p className="text-gray-700">
            <strong>Dica de IA:</strong> Use o botão <Badge>Gerar com IA</Badge> para criar um orçamento completo a partir de uma simples descrição dos requisitos do cliente.
          </p>
        </div>
      </div>
      
      <h3 className="text-2xl font-semibold mb-4">Custos de Infraestrutura</h3>
      <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
        <Server className="h-8 w-8 text-blue-600 mt-1 flex-shrink-0" />
        <div>
          <h4 className="font-bold text-lg">Planejamento de Infraestrutura</h4>
          <p className="text-gray-700 mb-2">
            Na seção <Badge>Infraestrutura</Badge>, você pode planejar os recursos técnicos necessários para seu projeto.
          </p>
          <ul className="list-disc pl-5 text-gray-700">
            <li><strong>Modo IA:</strong> Responda a algumas perguntas sobre seu projeto e a IA recomendará a melhor infraestrutura (AWS, Azure, etc.) com uma estimativa de custo.</li>
            <li><strong>Modo Manual:</strong> Se você já sabe o que precisa, pode montar seu plano de infraestrutura manualmente, adicionando cada recurso e seu custo.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
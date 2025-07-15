import React from 'react';
import { Bot, Lightbulb, Zap } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AIAssistantSection() {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold border-b-2 border-teal-500 pb-2 mb-6">5. Gabih (Assistente IA)</h2>
      <p className="text-lg mb-6">
        A Gabih é sua copiloto inteligente para gerenciamento de projetos. Ela pode ajudar a automatizar tarefas, gerar conteúdo e fornecer insights valiosos.
      </p>

      <div className="border p-4 rounded-lg bg-gray-50 mb-6">
        <div className="text-center text-gray-500 py-8">
          <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" alt="Gabih" className="h-16 w-16 mx-auto mb-4 rounded-full"/>
          <p>Interface da Gabih</p>
          <p className="text-sm">Chat inteligente com contexto de projetos e geração automática de conteúdo</p>
        </div>
      </div>

      <h3 className="text-2xl font-semibold mb-4">O que você pode pedir?</h3>
      <div className="space-y-4">
        <div className="flex items-start gap-4 p-4 bg-blue-50 rounded-lg">
          <Zap className="h-6 w-6 text-blue-500 mt-1" />
          <div>
            <h4 className="font-bold">Criar e Planejar</h4>
            <p className="text-gray-600">Peça para a Gabih criar um novo projeto, gerar uma lista de tarefas, ou elaborar um plano de testes. <br/>
            <strong>Exemplo:</strong> <Badge variant="outline">"Crie um projeto para o lançamento de um novo app mobile, com prazo de 3 meses."</Badge></p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 bg-green-50 rounded-lg">
          <Lightbulb className="h-6 w-6 text-green-500 mt-1" />
          <div>
            <h4 className="font-bold">Analisar e Resumir</h4>
            <p className="text-gray-600">Peça um resumo de um projeto, a identificação de riscos, ou uma análise de custos. <br/>
            <strong>Exemplo:</strong> <Badge variant="outline">"Quais são os principais riscos do projeto 'Website Redesign'? Sugira um plano de mitigação."</Badge></p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 bg-amber-50 rounded-lg">
          <Bot className="h-6 w-6 text-amber-500 mt-1" />
          <div>
            <h4 className="font-bold">Gerar Conteúdo</h4>
            <p className="text-gray-600">Peça para a Gabih escrever o escopo de um orçamento, uma ata de reunião, ou um e-mail de status para um cliente. <br/>
            <strong>Exemplo:</strong> <Badge variant="outline">"Escreva um e-mail para o cliente sobre o andamento do projeto X, destacando as últimas entregas."</Badge></p>
          </div>
        </div>
      </div>

      <h3 className="text-2xl font-semibold mt-8 mb-4">Contexto é Tudo</h3>
      <p>
        Use o seletor <Badge>Contexto do Projeto</Badge> para focar a conversa em um projeto específico. Isso torna as respostas da Gabih muito mais precisas e relevantes. Quando definido como "Geral", a Gabih considera todos os projetos.
      </p>
    </section>
  );
}
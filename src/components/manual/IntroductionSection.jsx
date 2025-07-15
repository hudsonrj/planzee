
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Users, Bot, Zap } from 'lucide-react';

export default function IntroductionSection() {
  return (
    <section className="mb-12">
      <h2 className="text-3xl font-bold border-b-2 border-teal-500 pb-2 mb-6">1. Introdução</h2>
      <p className="text-lg mb-6">
        Bem-vindo ao <strong>Planzee</strong>, a plataforma inteligente de gerenciamento de projetos da Allied IT. Este manual foi projetado para ser seu guia completo, ajudando você a aproveitar ao máximo todas as funcionalidades, desde o básico até os recursos avançados de IA.
      </p>

      <Card className="bg-teal-50 border-teal-200 mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-teal-800">
            <Target className="h-6 w-6" />
            Nosso Objetivo
          </CardTitle>
        </CardHeader>
        <CardContent className="text-teal-700">
          <p>
            Nosso objetivo é transformar a maneira como gerenciamos projetos, tornando os processos mais eficientes, transparentes e inteligentes. A plataforma foi criada para centralizar informações, automatizar tarefas repetitivas e fornecer insights valiosos que ajudam na tomada de decisão.
          </p>
        </CardContent>
      </Card>
      
      <h3 className="text-2xl font-semibold mb-4">Principais Benefícios</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 border rounded-lg">
          <Users className="h-8 w-8 text-blue-500 mb-2" />
          <h4 className="font-bold text-lg">Centralização e Colaboração</h4>
          <p className="text-gray-600">Todos os projetos, tarefas, reuniões e documentos em um único lugar, facilitando a colaboração e o acesso à informação.</p>
        </div>
        <div className="p-4 border rounded-lg">
          <Bot className="h-8 w-8 text-purple-500 mb-2" />
          <h4 className="font-bold text-lg">Assistência com IA</h4>
          <p className="text-gray-600">Utilize nosso assistente de IA para criar projetos, gerar tarefas, analisar riscos e obter recomendações personalizadas.</p>
        </div>
        <div className="p-4 border rounded-lg">
          <Zap className="h-8 w-8 text-amber-500 mb-2" />
          <h4 className="font-bold text-lg">Automação e Eficiência</h4>
          <p className="text-gray-600">Automatize a criação de atas de reunião, o acompanhamento de tarefas e a geração de relatórios, economizando tempo valioso.</p>
        </div>
        <div className="p-4 border rounded-lg">
          <Target className="h-8 w-8 text-green-500 mb-2" />
          <h4 className="font-bold text-lg">Visibilidade e Controle</h4>
          <p className="text-gray-600">Tenha uma visão clara do progresso, custos e saúde de todos os projetos através de dashboards e relatórios detalhados.</p>
        </div>
      </div>
    </section>
  );
}

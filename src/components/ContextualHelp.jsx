
import React, { useState } from 'react';
import { HelpCircle, Bot, Send, Loader2, X } from 'lucide-react';
import { InvokeLLM } from "@/api/integrations";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ContextualHelp({ currentPageName }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('tips');

  const getContextualHelp = () => {
    switch (currentPageName) {
      case 'Dashboard':
        return {
          title: 'Visão Geral',
          content: [
            'Aqui você encontra um resumo de todos os seus projetos e atividades',
            'Use os filtros para visualizar dados específicos',
            'Clique nos cards para ver mais detalhes'
          ]
        };
      case 'Projects':
        return {
          title: 'Gestão de Projetos',
          content: [
            'Visualize e gerencie todos os seus projetos',
            'Crie novos projetos usando o botão "Novo Projeto"',
            'Acompanhe o progresso e status de cada projeto'
          ]
        };
      case 'Tasks':
        return {
          title: 'Gestão de Tarefas',
          content: [
            'Crie e gerencie tarefas dos projetos',
            'Arraste as tarefas entre colunas para atualizar seu status',
            'Use os filtros para encontrar tarefas específicas',
            'Visualize em lista, grid ou kanban'
          ]
        };
      // ... outros casos
      default:
        return {
          title: 'Ajuda',
          content: [
            'Selecione uma seção para ver dicas específicas',
            'Use a Gabih para ajuda mais detalhada'
          ]
        };
    }
  };

  const getContextForAI = () => {
    const contextMap = {
      'Dashboard': `
        O Dashboard é a página principal do sistema que mostra:
        - Visão geral de projetos ativos
        - Tarefas pendentes e atrasadas
        - Próximas reuniões
        - Indicadores de performance (KPIs)
        - Atalhos para ações principais
        Usuários podem filtrar dados, criar novos itens e acessar detalhes.
      `,
      'Projects': `
        A página de Projetos permite:
        - Criar, editar e gerenciar projetos
        - Visualizar status e progresso
        - Atribuir responsáveis e participantes
        - Definir prazos e orçamentos
        - Gerar relatórios
        - Usar IA para criar projetos automaticamente
      `,
      'Tasks': `
        A página de Tarefas oferece:
        - Criação e gestão de tarefas
        - Visualização em lista, grid ou kanban
        - Filtros por projeto, status, responsável
        - Drag & drop para atualizar status
        - Estimativas de tempo e custo
        - Atribuição de responsáveis
      `,
      // ... outros contextos
    };

    return contextMap[currentPageName] || '';
  };

  const handleAskQuestion = async () => {
    if (!question.trim()) return;

    setLoading(true);
    try {
      const prompt = `
        Como assistente especializado em gerenciamento de projetos, ajude o usuário com a seguinte dúvida sobre a página ${currentPageName}:
        
        Contexto da página atual:
        ${getContextForAI()}
        
        Pergunta do usuário: "${question}"
        
        Forneça uma resposta clara, objetiva e prática, focando especificamente na funcionalidade perguntada.
        Se a pergunta for sobre como fazer algo, inclua os passos necessários.
      `;

      const response = await InvokeLLM({
        prompt: prompt,
      });

      setAnswer(response);
    } catch (error) {
      console.error('Erro ao processar pergunta:', error);
      setAnswer('Desculpe, não consegui processar sua pergunta. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const help = getContextualHelp();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="text-gray-400 hover:text-gray-600"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96">
        <Tabs defaultValue="tips" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="tips">Dicas Rápidas</TabsTrigger>
            <TabsTrigger value="ask">Perguntar</TabsTrigger>
          </TabsList>

          <TabsContent value="tips" className="space-y-4">
            <h3 className="font-medium text-lg">{help.title}</h3>
            <ul className="space-y-2">
              {help.content.map((tip, index) => (
                <li key={index} className="text-sm flex items-start gap-2">
                  <span className="text-indigo-500">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </TabsContent>

          <TabsContent value="ask" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder={`Pergunte algo sobre ${currentPageName}...`}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="min-h-[80px]"
                />
                <Button 
                  onClick={handleAskQuestion}
                  disabled={loading || !question.trim()}
                  className="self-end"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Perguntar
                    </>
                  )}
                </Button>
              </div>

              {answer && (
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="h-4 w-4 text-indigo-500" />
                      <span className="text-sm font-medium">Resposta</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setAnswer('')}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{answer}</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}

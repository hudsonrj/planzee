import React from 'react';
import { Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function SmartHelp({ currentPageName }) {
  const getContextualHelp = () => {
    switch (currentPageName) {
      case 'Projects':
        return 'Posso ajudar você a gerenciar seus projetos, criar novas tasks ou analisar o progresso';
      case 'Tasks':
        return 'Precisa de ajuda para criar tarefas, atualizar status ou gerar relatórios?';
      case 'Dashboard':
        return 'Posso ajudar você a entender melhor suas métricas e KPIs';
      case 'AIAssistant':
        return 'Como posso ajudar você hoje?';
      case 'Analytics':
        return 'Precisa de ajuda para analisar dados ou gerar insights?';
      default:
        return 'Olá! Como posso ajudar você hoje?';
    }
  };

  return (
    <Link
      to={createPageUrl("AIAssistant")}
      className="fixed bottom-6 right-6 z-50"
    >
      <Button 
        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-4 shadow-lg flex items-center gap-2"
      >
        <Bot className="h-5 w-5" />
        <span className="hidden sm:inline">{getContextualHelp()}</span>
      </Button>
    </Link>
  );
}
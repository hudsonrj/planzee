
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer, BookOpen, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import IntroductionSection from '@/components/manual/IntroductionSection';
import DashboardSection from '@/components/manual/DashboardSection';
import ProjectsSection from '@/components/manual/ProjectsSection';
import TasksSection from '@/components/manual/TasksSection';
import AIAssistantSection from '@/components/manual/AIAssistantSection';
import MeetingsSection from '@/components/manual/MeetingsSection';
import FinancialSection from '@/components/manual/FinancialSection';

export default function UserManual() {
  const printRef = useRef(null);

  const handlePrint = () => {
    window.print();
  };

  const sections = [
    { id: 'introduction', title: 'Introdução', component: <IntroductionSection /> },
    { id: 'dashboard', title: 'Dashboard Principal', component: <DashboardSection /> },
    { id: 'projects', title: 'Gestão de Projetos', component: <ProjectsSection /> },
    { id: 'tasks', title: 'Gestão de Tarefas', component: <TasksSection /> },
    { id: 'ai-assistant', title: 'Assistente de IA', component: <AIAssistantSection /> },
    { id: 'meetings', title: 'Reuniões e Colaboração', component: <MeetingsSection /> },
    { id: 'financial', title: 'Gestão Financeira', component: <FinancialSection /> },
  ];

  return (
    <div className="bg-white">
      <style>
        {`
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none !important;
            }
            .print-container {
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
            }
            .page-break {
              page-break-before: always;
            }
          }
        `}
      </style>

      <header className="bg-gray-800 text-white p-6 no-print">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            <h1 className="text-2xl font-bold">Manual do Usuário - Planzee</h1>
          </div>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Exportar para PDF
          </Button>
        </div>
      </header>

      <div className="container mx-auto flex gap-8 py-8 px-4">
        <aside className="w-1/4 sticky top-8 self-start no-print">
          <nav className="space-y-2">
            <h2 className="text-lg font-semibold mb-3">Navegação</h2>
            {sections.map(section => (
              <a 
                key={section.id} 
                href={`#${section.id}`}
                className="block p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors"
              >
                {section.title}
              </a>
            ))}
          </nav>
        </aside>

        <main ref={printRef} className="w-3/4 print-container prose prose-lg max-w-none">
          <div className="p-8 border rounded-lg shadow-sm">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center mb-4">
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/0e30c9_Allied-IT-colorido.png"
                  alt="AlliedIT Logo"
                  className="h-16 mr-3"
                />
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/fe46a2dcc_planzee.png"
                  alt="Planzee Logo"
                  className="h-48"
                />
              </div>
              <h2 className="text-2xl font-bold text-gray-600 mb-2">Guia Completo da Plataforma</h2>
              <p className="text-lg text-gray-500 mt-2">
                Seu manual para dominar o gerenciamento de projetos com inteligência artificial.
              </p>
              <p className="text-sm text-gray-400 mt-1">Versão 1.0 - {new Date().toLocaleDateString()}</p>
            </div>
            
            {sections.map((section, index) => (
              <div key={section.id} id={section.id} className={index > 0 ? 'page-break' : ''}>
                {section.component}
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

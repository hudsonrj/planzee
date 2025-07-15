
import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { HelpCircle, BookOpen, GitMerge, CircleHelp, ArrowRight } from 'lucide-react';

export default function Help() {
  const helpSections = [
    {
      title: 'Guia Rápido',
      description: 'Aprenda o básico e comece a usar a plataforma rapidamente.',
      link: createPageUrl('QuickGuide'),
      icon: <BookOpen className="h-8 w-8 text-blue-500" />,
    },
    {
      title: 'Manual do Usuário',
      description: 'Um guia completo e detalhado de todas as funcionalidades.',
      link: createPageUrl('UserManual'),
      icon: <BookOpen className="h-8 w-8 text-indigo-500" />,
    },
    {
      title: 'Diagrama da Plataforma',
      description: 'Entenda a arquitetura técnica e os componentes do sistema.',
      link: createPageUrl('PlatformDiagram'),
      icon: <GitMerge className="h-8 w-8 text-green-500" />,
    },
    {
      title: 'Perguntas Frequentes (FAQ)',
      description: 'Encontre respostas para as dúvidas mais comuns.',
      link: createPageUrl('FAQ'),
      icon: <CircleHelp className="h-8 w-8 text-amber-500" />,
    },
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="text-center mb-12">
        <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
        <h1 className="text-4xl font-bold mt-4">Central de Ajuda</h1>
        <p className="mt-2 text-lg text-gray-600">
          Encontre os recursos que você precisa para dominar o Planzee.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {helpSections.map((section, index) => (
          <Link to={section.link} key={index} className="group">
            <Card className="h-full hover:shadow-lg hover:border-teal-500 transition-all duration-300">
              <CardHeader className="flex flex-row items-center gap-4">
                {section.icon}
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-end text-sm font-semibold text-teal-600 group-hover:underline">
                  Acessar <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

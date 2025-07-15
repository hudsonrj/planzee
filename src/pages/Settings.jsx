import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Settings as SettingsIcon,
  Users,
  Building,
  Book,
  Trash2,
  Database,
  Shield,
  Bell,
  Palette,
  Globe,
  HelpCircle
} from 'lucide-react';

export default function Settings() {
  const settingsCategories = [
    {
      title: 'Gestão de Usuários',
      description: 'Gerencie usuários, permissões e áreas da organização',
      icon: <Users className="h-6 w-6 text-blue-500" />,
      items: [
        { title: 'Usuários', description: 'Adicionar, editar e gerenciar usuários', link: createPageUrl('Users') },
        { title: 'Áreas', description: 'Configurar áreas e departamentos', link: createPageUrl('Areas') }
      ]
    },
    {
      title: 'Documentação e Ajuda',
      description: 'Acesse manuais, guias e documentação técnica',
      icon: <Book className="h-6 w-6 text-green-500" />,
      items: [
        { title: 'Documentação', description: 'Documentação técnica da plataforma', link: createPageUrl('Documentation') },
        { title: 'Central de Ajuda', description: 'Guias, FAQ e suporte', link: createPageUrl('Help') }
      ]
    },
    {
      title: 'Manutenção do Sistema',
      description: 'Ferramentas de administração e limpeza de dados',
      icon: <Database className="h-6 w-6 text-red-500" />,
      items: [
        { title: 'Limpeza de Dados', description: 'Remover dados órfãos e inconsistências', link: createPageUrl('DataCleanup') }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8" />
          Configurações
        </h1>
        <p className="text-gray-500 mt-2">
          Gerencie as configurações da plataforma, usuários e sistema.
        </p>
      </div>

      <div className="grid gap-8">
        {settingsCategories.map((category, index) => (
          <Card key={index} className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {category.icon}
                {category.title}
              </CardTitle>
              <CardDescription>{category.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {category.items.map((item, itemIndex) => (
                  <Link key={itemIndex} to={item.link}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500">
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900">{item.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
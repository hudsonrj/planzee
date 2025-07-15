
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Home,
  ListTodo,
  MessageSquare,
  Calendar,
  BarChart,
  Bot,
  Clock,
  DollarSign,
  Briefcase,
  Server,
  FileCheck,
  AlertTriangle,
  UserCheck,
  Brain,
  Zap,
  Lightbulb,
  Users,
  CheckCircle,
  PieChart,
  FileText
} from "lucide-react";

export default function QuickGuide() {
  const modules = [
    {
      id: "dashboard",
      name: "Dashboard",
      icon: <Home className="h-5 w-5 text-blue-500" />,
      description: "Visão geral de projetos e atividades",
      features: [
        {
          title: "Projetos Ativos",
          description: "Exibe o número total de projetos ativos no momento e permite acesso rápido a detalhes de cada uno. Um projeto é considerado ativo quando seu status não é 'concluído'."
        },
        {
          title: "Tarefas Pendentes",
          description: "Mostra todas as tarefas que ainda não foram concluídas, permitindo rápida visualização do que precisa ser feito."
        },
        {
          title: "Tarefas Atrasadas",
          description: "Destaca tarefas cujo prazo já expirou, mas que ainda não foram concluídas. Um indicador crítico para gestão de projetos."
        },
        {
          title: "Próximas Reuniões",
          description: "Lista as reuniões agendadas para os próximos dias, facilitando o planejamento da agenda."
        },
        {
          title: "Progresso dos Projetos",
          description: "Mostra barras de progresso visuais para cada projeto ativo, permitindo acompanhar rapidamente o andamento geral."
        }
      ]
    },
    {
      id: "projects",
      name: "Projetos",
      icon: <Briefcase className="h-5 w-5 text-indigo-500" />,
      description: "Gestão completa de projetos",
      features: [
        {
          title: "Criação de Projetos",
          description: "Interface para criação de novos projetos com definição de título, descrição, datas, responsáveis e participantes."
        },
        {
          title: "Visualização em Lista/Kanban",
          description: "Diferentes formas de visualizar os projetos, seja em lista detalhada ou em quadros Kanban organizados por status."
        },
        {
          title: "Filtros Avançados",
          description: "Opções para filtrar projetos por status, responsável, data ou tags personalizadas."
        },
        {
          title: "Progresso Automático",
          description: "Cálculo automático de progresso baseado na conclusão de tarefas associadas ao projeto."
        },
        {
          title: "Cronograma e Prazos",
          description: "Gestão visual de prazos e marcos importantes do projeto."
        }
      ]
    },
    {
      id: "tasks",
      name: "Tarefas",
      icon: <ListTodo className="h-5 w-5 text-purple-500" />,
      description: "Gerenciamento de tarefas e atividades",
      features: [
        {
          title: "Criação e Atribuição",
          description: "Criação de tarefas com título, descrição, prazo, prioridade e atribuição a responsáveis."
        },
        {
          title: "Quadro Kanban",
          description: "Visualização de tarefas em quadro Kanban com colunas personalizáveis (pendente, em andamento, concluída, etc.)."
        },
        {
          title: "Geração por IA",
          description: "Criação automática de tarefas sugeridas pela IA com base em anotações de reuniões ou descrições de projetos."
        },
        {
          title: "Dependências",
          description: "Definição de dependências entre tarefas, criando sequências lógicas de trabalho e precedências."
        },
        {
          title: "Estimativas",
          description: "Registro de estimativas de horas para conclusão, permitindo melhor planejamento e alocação de recursos."
        }
      ]
    },
    {
      id: "meetings",
      name: "Reuniões",
      icon: <MessageSquare className="h-5 w-5 text-green-500" />,
      description: "Gestão de reuniões e atas",
      features: [
        {
          title: "Agendamento",
          description: "Criação de reuniões com título, data, horário, participantes e pauta."
        },
        {
          title: "Anotações",
          description: "Registro de anotações durante ou após as reuniões para documentar discussões e decisões."
        },
        {
          title: "Melhoria de Texto por IA",
          description: "Função que utiliza IA para melhorar automaticamente as anotações, tornando-as mais claras e estruturadas."
        },
        {
          title: "Geração de Tarefas",
          description: "Detecção automática de tarefas mencionadas nas anotações e criação de itens de ação."
        },
        {
          title: "Itens de Ação",
          description: "Registro de itens de ação com responsáveis e prazos definidos durante a reunião."
        }
      ]
    },
    {
      id: "analytics",
      name: "Análises",
      icon: <BarChart className="h-5 w-5 text-amber-500" />,
      description: "Métricas e insights sobre projetos",
      features: [
        {
          title: "Dashboards Personalizáveis",
          description: "Criação de dashboards com widgets e métricas relevantes para seu contexto."
        },
        {
          title: "Relatórios de Desempenho",
          description: "Geração de relatórios sobre desempenho de projetos, equipes e indivíduos."
        },
        {
          title: "Previsões",
          description: "Uso de machine learning para prever prazos, custos e riscos com base em dados históricos."
        },
        {
          title: "Análise de Tendências",
          description: "Visualização de tendências ao longo do tempo para métricas-chave de projetos."
        },
        {
          title: "Insights por IA",
          description: "Sugestões automáticas de melhorias e otimizações baseadas na análise de dados."
        }
      ]
    },
    {
      id: "calendar",
      name: "Calendário",
      icon: <Calendar className="h-5 w-5 text-red-500" />,
      description: "Visualização de agenda e eventos",
      features: [
        {
          title: "Visualização Mensal/Semanal/Diária",
          description: "Diferentes modos de visualização do calendário para planejamento eficiente."
        },
        {
          title: "Reuniões",
          description: "Exibição de todas as reuniões agendadas no calendário, com detalhes ao passar o mouse."
        },
        {
          title: "Prazos de Tarefas",
          description: "Marcação visual de prazos de tarefas no calendário."
        },
        {
          title: "Marcos de Projetos",
          description: "Exibição de datas importantes e marcos de projetos."
        },
        {
          title: "Exportação/Sincronização",
          description: "Opções para exportar eventos para outros calendários ou sincronizar com Google Calendar."
        }
      ]
    },
    {
      id: "dailies",
      name: "Daily",
      icon: <Clock className="h-5 w-5 text-cyan-500" />,
      description: "Registro de atividades diárias",
      features: [
        {
          title: "O que foi feito",
          description: "Registro do que foi realizado no dia anterior para cada projeto."
        },
        {
          title: "O que será feito",
          description: "Planejamento das atividades para o dia atual."
        },
        {
          title: "Impedimentos",
          description: "Registro de bloqueios e impedimentos que estão atrasando o progresso."
        },
        {
          title: "Resumo Automático",
          description: "Geração automática de resumos para relatórios e reuniões de acompanhamento."
        },
        {
          title: "Histórico",
          description: "Acesso ao histórico completo de registros diários para análise e referência."
        }
      ]
    },
    {
      id: "budgets",
      name: "Orçamentos",
      icon: <DollarSign className="h-5 w-5 text-emerald-500" />,
      description: "Gestão financeira de projetos",
      features: [
        {
          title: "Criação de Orçamentos",
          description: "Interface para criar orçamentos detalhados para projetos e clientes."
        },
        {
          title: "Itens Orçamentários",
          description: "Adição de itens ao orçamento com descrição, quantidade, valor unitário e total."
        },
        {
          title: "Condições Comerciais",
          description: "Definição de prazos, formas de pagamento, validade e outras condições."
        },
        {
          title: "Exportação para PDF",
          description: "Geração de documentos de orçamento formatados para envio a clientes."
        },
        {
          title: "Acompanhamento",
          description: "Registro do status dos orçamentos (enviado, aprovado, reprovado) e follow-up."
        }
      ]
    },
    {
      id: "infrastructure",
      name: "Infraestrutura",
      icon: <Server className="h-5 w-5 text-blue-600" />,
      description: "Planejamento de infraestrutura técnica",
      features: [
        {
          title: "Definição de Requisitos",
          description: "Especificação de requisitos técnicos para a infraestrutura do projeto."
        },
        {
          title: "Comparação de Provedores",
          description: "Análise comparativa entre diferentes provedores de nuvem (AWS, Azure, GCP, VPS)."
        },
        {
          title: "Estimativa de Custos",
          description: "Cálculo dos custos mensais estimados para cada configuração de infraestrutura."
        },
        {
          title: "Recomendações por IA",
          description: "Sugestões de configuração otimizada baseadas nos requisitos do projeto."
        },
        {
          title: "Diagramas de Arquitetura",
          description: "Geração de diagramas visuais da arquitetura de infraestrutura planejada."
        }
      ]
    },
    {
      id: "qa",
      name: "Qualidade & Testes",
      icon: <FileCheck className="h-5 w-5 text-violet-500" />,
      description: "Gestão de qualidade e testes",
      features: [
        {
          title: "Planos de Teste",
          description: "Criação de planos de teste estruturados para projetos."
        },
        {
          title: "Casos de Teste",
          description: "Definição de casos de teste detalhados com passos e resultados esperados."
        },
        {
          title: "Execução de Testes",
          description: "Registro da execução de testes com status (passou, falhou) e observações."
        },
        {
          title: "Rastreamento de Bugs",
          description: "Cadastro e acompanhamento de bugs identificados durante os testes."
        },
        {
          title: "Métricas de Qualidade",
          description: "Visualização de métricas como cobertura de testes, taxa de defeitos e tempo médio de correção."
        }
      ]
    },
    {
      id: "costs",
      name: "Custos",
      icon: <PieChart className="h-5 w-5 text-orange-500" />,
      description: "Análise e controle de custos",
      features: [
        {
          title: "Monitoramento de Custos",
          description: "Acompanhamento de custos reais versus planejados em tempo real."
        },
        {
          title: "Breakdown de Custos",
          description: "Visualização detalhada dos custos por categoria, função ou fase do projeto."
        },
        {
          title: "Análise de Eficiência",
          description: "Identificação de áreas onde os recursos estão sendo sub ou superutilizados."
        },
        {
          title: "Previsões de Gastos",
          description: "Projeções de gastos futuros baseadas nas tendências atuais e histórico."
        },
        {
          title: "Recomendações de Otimização",
          description: "Sugestões geradas por IA para redução de custos e melhor alocação de recursos."
        }
      ]
    },
    {
      id: "ai-agents",
      name: "Agentes Inteligentes",
      icon: <Brain className="h-5 w-5 text-pink-500" />,
      description: "Assistentes de IA especializados",
      features: [
        {
          title: "Antecipador de Riscos",
          description: "Identifica proativamente possíveis riscos em projetos com base em padrões históricos e contexto atual."
        },
        {
          title: "Otimização de Recursos",
          description: "Sugere a melhor alocação de pessoas e recursos para maximizar eficiência e reduzir custos."
        },
        {
          title: "Comunicação Contextual",
          description: "Gera comunicações personalizadas com base no contexto do projeto e perfil dos stakeholders."
        },
        {
          title: "Simulador de Cenários",
          description: "Permite simular diferentes cenários de projeto para avaliar impactos de mudanças e decisões."
        },
        {
          title: "GerêncIA de Projetos",
          description: "Assistente inteligente que responde perguntas e oferece insights sobre seus projetos."
        }
      ]
    },
    {
      id: "idea-lab",
      name: "Laboratório de Ideias",
      icon: <Lightbulb className="h-5 w-5 text-yellow-500" />,
      description: "Análise e desenvolvimento de ideias",
      features: [
        {
          title: "Análise de Viabilidade",
          description: "Avaliação detalhada da viabilidade técnica, financeira e mercadológica de uma ideia."
        },
        {
          title: "SWOT Automático",
          description: "Geração de análise SWOT (Forças, Fraquezas, Oportunidades, Ameaças) para cada ideia."
        },
        {
          title: "Plano de MVP",
          description: "Sugestão de abordagem para desenvolvimento de um MVP (Produto Mínimo Viável)."
        },
        {
          title: "Análise de Mercado",
          description: "Pesquisa automática de mercado, concorrentes e tendências relacionadas à ideia."
        },
        {
          title: "Conversão para Projeto",
          description: "Transformação direta de uma ideia aprovada em um projeto estruturado."
        }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Guia Rápido</h1>
      <p className="text-gray-500 mb-8">Aprenda a utilizar todas as funcionalidades da plataforma Planzee</p>

      <Tabs defaultValue="modules" className="mb-8">
        <TabsList>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="functions">Indicadores</TabsTrigger>
          <TabsTrigger value="workflows">Fluxos de Trabalho</TabsTrigger>
        </TabsList>

        <TabsContent value="modules" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {modules.map((module) => (
                <Card key={module.id} className="overflow-hidden">
                  <CardHeader className="bg-gray-50 flex flex-row items-center gap-3">
                    <div className="p-2 rounded-full bg-white shadow-sm">
                      {module.icon}
                    </div>
                    <div>
                      <CardTitle>{module.name}</CardTitle>
                      <CardDescription>{module.description}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Accordion type="single" collapsible className="w-full">
                      {module.features.map((feature, index) => (
                        <AccordionItem key={index} value={`${module.id}-${index}`}>
                          <AccordionTrigger className="text-left font-medium">
                            {feature.title}
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pt-2 pb-3 px-1 text-gray-600">
                              {feature.description}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="functions" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Indicadores-Chave</h2>
              <p className="text-gray-600 mb-6">
                Os seguintes indicadores são utilizados em toda a plataforma para fornecer insights sobre o andamento dos projetos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-full">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle className="text-lg">Progresso do Projeto</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Mede a porcentagem de conclusão de um projeto em relação ao escopo total.
                    </p>
                    <p className="text-gray-600 mb-2 font-medium">Como é calculado:</p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      <li>Modo automático: Baseado na proporção de tarefas concluídas (com ponderação por estimativa de horas)</li>
                      <li>Modo manual: Definido pelo gerente do projeto</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-100 rounded-full">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <CardTitle className="text-lg">SPI (Índice de Desempenho de Prazo)</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Compara o progresso realizado versus o progresso planejado.
                    </p>
                    <p className="text-gray-600 mb-2 font-medium">Como é calculado:</p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      <li>SPI = Progresso Atual / Progresso Planejado</li>
                      <li>SPI &gt; 1: Projeto adiantado</li>
                      <li>SPI = 1: Projeto no prazo</li>
                      <li>SPI &lt; 1: Projeto atrasado</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-full">
                        <DollarSign className="h-5 w-5 text-blue-600" />
                      </div>
                      <CardTitle className="text-lg">CPI (Índice de Desempenho de Custo)</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Compara o valor planejado versus o custo real incorrido.
                    </p>
                    <p className="text-gray-600 mb-2 font-medium">Como é calculado:</p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      <li>CPI = Valor Planejado / Custo Real</li>
                      <li>CPI &gt; 1: Custo abaixo do orçamento</li>
                      <li>CPI = 1: Custo conforme orçamento</li>
                      <li>CPI &lt; 1: Custo acima do orçamento</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-full">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      </div>
                      <CardTitle className="text-lg">Índice de Risco</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Avalia a probabilidade e impacto de riscos identificados.
                    </p>
                    <p className="text-gray-600 mb-2 font-medium">Como é calculado:</p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      <li>Combinação de análise de fatores de risco históricos</li>
                      <li>Ponderação por probabilidade e impacto</li>
                      <li>Algoritmo preditivo baseado em projetos anteriores similares</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-full">
                        <UserCheck className="h-5 w-5 text-purple-600" />
                      </div>
                      <CardTitle className="text-lg">Taxa de Utilização de Recursos</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Mede a eficiência na alocação e uso de recursos humanos.
                    </p>
                    <p className="text-gray-600 mb-2 font-medium">Como é calculado:</p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      <li>Horas alocadas / Capacidade total disponível</li>
                      <li>Análise de distribuição de tarefas por pessoa</li>
                      <li>Detecção de sobrecarga ou subutilização de recursos</li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-pink-100 rounded-full">
                        <Zap className="h-5 w-5 text-pink-600" />
                      </div>
                      <CardTitle className="text-lg">Índice de Qualidade</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Avalia a qualidade das entregas baseado em testes e feedbacks.
                    </p>
                    <p className="text-gray-600 mb-2 font-medium">Como é calculado:</p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-600">
                      <li>Taxa de aprovação em testes</li>
                      <li>Número de bugs por entrega</li>
                      <li>Tempo médio de resolução de problemas</li>
                      <li>Feedback dos stakeholders</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="workflows" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Fluxos de Trabalho Principais</h2>
                <p className="text-gray-600 mb-6">
                  Guias passo a passo para os principais processos na plataforma.
                </p>
                
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                      <Briefcase className="h-5 w-5 text-indigo-500" />
                      Criação e Gestão de um Projeto
                    </h3>
                    <ol className="space-y-3 pl-6 list-decimal">
                      <li className="text-gray-700">
                        <span className="font-medium">Criar Projeto</span>: Acesse "Projetos" e clique em "Novo Projeto". Preencha as informações básicas como título, descrição, datas e responsável.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Definir Participantes</span>: Adicione os membros da equipe que participarão do projeto.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Planejar Tarefas</span>: Crie tarefas iniciais ou use a IA para sugerir uma estrutura básica de tarefas.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Definir Infraestrutura</span>: Configure as necessidades de infraestrutura técnica, se aplicável.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Monitorar Progresso</span>: Acompanhe o andamento através do dashboard e atualize o status das tarefas regularmente.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Realizar Reuniões</span>: Agende e registre reuniões periódicas para acompanhamento.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Gerar Relatórios</span>: Utilize a função de geração de relatórios para stakeholders externos.
                      </li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-green-500" />
                      Conduzir uma Reunião Eficiente
                    </h3>
                    <ol className="space-y-3 pl-6 list-decimal">
                      <li className="text-gray-700">
                        <span className="font-medium">Agendar Reunião</span>: Crie uma nova reunião com data, horário e participantes.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Preparar Pauta</span>: Adicione os tópicos a serem discutidos antecipadamente.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Registrar Anotações</span>: Durante a reunião, registre as principais discussões e decisões.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Melhorar com IA</span>: Use o recurso "Melhorar Anotações" para estruturar o texto de forma clara.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Gerar Tarefas</span>: Utilize "Detectar Tarefas" para criar automaticamente as tarefas discutidas.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Distribuir Ata</span>: Compartilhe a ata final com todos os participantes.
                      </li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                      <Bot className="h-5 w-5 text-pink-500" />
                      Utilizando os Agentes de IA
                    </h3>
                    <ol className="space-y-3 pl-6 list-decimal">
                      <li className="text-gray-700">
                        <span className="font-medium">Acessar GerêncIA</span>: Entre na seção "IA & Automação" e selecione "GerêncIA de Projetos".
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Selecionar Contexto</span>: Escolha um projeto específico ou mantenha o escopo aberto.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Formular Perguntas</span>: Digite suas dúvidas ou solicite análises específicas.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Receber Sugestões</span>: Analise as respostas e recomendações fornecidas.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Implementar Ações</span>: Aplique as sugestões diretamente usando os atalhos fornecidos.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Feedback</span>: Forneça feedback para melhorar as próximas recomendações.
                      </li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      Gerando Relatórios para Clientes
                    </h3>
                    <ol className="space-y-3 pl-6 list-decimal">
                      <li className="text-gray-700">
                        <span className="font-medium">Acessar Relatórios</span>: Entre na seção "IA & Automação" e selecione "Report ao Cliente".
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Selecionar Projeto</span>: Escolha o projeto para o qual deseja gerar o relatório.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Definir Período</span>: Especifique o período que o relatório deve cobrir.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Ajustar Conteúdo</span>: Personalize quais seções e métricas devem ser incluídas.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Revisar</span>: Verifique a prévia do relatório gerado automaticamente.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Editar</span>: Faça ajustes manuais conforme necessário.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Exportar</span>: Gere o PDF final ou envie diretamente por email para os stakeholders.
                      </li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-medium mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      Gerenciamento de Riscos
                    </h3>
                    <ol className="space-y-3 pl-6 list-decimal">
                      <li className="text-gray-700">
                        <span className="font-medium">Acessar Agente de Riscos</span>: Entre na seção "Agentes Inteligentes" e selecione "Antecipador de Riscos".
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Selecionar Projeto</span>: Escolha o projeto que deseja analisar.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Analisar Riscos</span>: Revise os riscos identificados automaticamente.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Avaliar Impacto</span>: Para cada risco, verifique a probabilidade e impacto estimados.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Definir Mitigações</span>: Estabeleça ações preventivas para os riscos de maior impacto.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Criar Tarefas</span>: Transforme as ações de mitigação em tarefas concretas no projeto.
                      </li>
                      <li className="text-gray-700">
                        <span className="font-medium">Monitorar</span>: Acompanhe periodicamente a evolução dos riscos identificados.
                      </li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

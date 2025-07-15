
import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Info, GitMerge, Database, Server, Layers, Bot } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Documentation() {
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [showUpdatedAlert, setShowUpdatedAlert] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [documents, setDocuments] = useState([]);

  // Function to simulate auto-update when app changes
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if any app data has been updated since last documentation update
      // This is a placeholder for a real update detection mechanism
      const hasUpdates = false; // In a real situation, this would check app state

      if (hasUpdates) {
        setLastUpdated(new Date());
        setShowUpdatedAlert(true);
        
        // Hide alert after 5 seconds
        setTimeout(() => {
          setShowUpdatedAlert(false);
        }, 5000);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  const handleManualUpdate = () => {
    setLastUpdated(new Date());
    setShowUpdatedAlert(true);
    
    // Hide alert after 5 seconds
    setTimeout(() => {
      setShowUpdatedAlert(false);
    }, 5000);
  };

    // Filter function with safety checks
    const filteredDocuments = documents.filter(doc => {
      const title = (doc.title || "").toLowerCase();
      const content = (doc.content || "").toLowerCase();
      const search = (searchQuery || "").toLowerCase();
      
      return title.includes(search) || content.includes(search);
    });

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-bold">Planzee - Documentação Técnica</h1>
          <p className="text-gray-500 mt-1">
            Última atualização: {lastUpdated.toLocaleDateString()} às {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleManualUpdate}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {showUpdatedAlert && (
        <Alert className="mb-6 border-green-500 bg-green-50">
          <Info className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">
            A documentação foi atualizada automaticamente para refletir as mudanças recentes no sistema.
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="tech">Stack Técnico</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="ai">IA e Machine Learning</TabsTrigger>
          <TabsTrigger value="architecture">Arquitetura</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="p-4 border rounded-md mt-4">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Visão Geral</h2>
              <p>
                Planzee é uma plataforma avançada de gerenciamento de projetos que integra inteligência 
                artificial para otimizar processos, prever riscos e automatizar tarefas. O sistema foi desenvolvido 
                utilizando tecnologias modernas e arquitetura escalável.
              </p>
              
              <div className="my-8 border p-4 rounded-lg bg-gray-50">
                <h3 className="text-xl font-semibold mb-3">Diagrama da Plataforma</h3>
                <p className="mb-4">Visão de alto nível dos principais componentes do sistema:</p>
                
                <div className="flex justify-center mb-4">
                  <img 
                    src="https://miro.medium.com/max/1400/1*CIHazLUXhBCxN2jnr3-kzQ.png" 
                    alt="Diagrama de Arquitetura do Sistema" 
                    className="max-w-full rounded-md border shadow-sm"
                  />
                </div>
                
                <div className="mt-4 text-center">
                  <Button variant="link" onClick={() => window.location.href = "/PlatformDiagram"}>
                    <GitMerge className="h-4 w-4 mr-2" />
                    Ver Diagramas Detalhados
                  </Button>
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mt-8 mb-4">Objetivos Principais</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Automatizar tarefas repetitivas e de baixo valor no gerenciamento de projetos</li>
                <li>Fornecer insights preditivos para antecipação de riscos e oportunidades</li>
                <li>Integrar todos os aspectos do ciclo de vida de projetos em uma plataforma unificada</li>
                <li>Facilitar comunicação e colaboração entre equipes e stakeholders</li>
                <li>Otimizar a alocação de recursos e custos através de algoritmos inteligentes</li>
              </ul>
              
              <h3 className="text-xl font-semibold mt-8 mb-4">Diferenciação</h3>
              <p>
                O diferencial da plataforma Planzee está na sua abordagem centrada em IA,
                integrando algoritmos avançados de machine learning em cada aspecto do gerenciamento
                de projetos. Isso permite não apenas automatizar processos, mas também oferecer
                recomendações proativas, detecção precoce de riscos e otimização contínua.
              </p>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="tech" className="p-4 border rounded-md mt-4">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Stack Tecnológico</h2>

              <h3 className="text-xl font-semibold mt-6 mb-3">Frontend</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Framework</strong>: React.js 18</li>
                <li><strong>Linguagem</strong>: JavaScript/TypeScript</li>
                <li><strong>UI Components</strong>:
                  <ul className="list-disc pl-6 mt-2">
                    <li>Shadcn/UI (baseado em Radix UI)</li>
                    <li>Tailwind CSS para estilização</li>
                    <li>Lucide React para ícones</li>
                    <li>Framer Motion para animações</li>
                  </ul>
                </li>
                <li><strong>Gerenciamento de Estado</strong>: React Hooks + Context API</li>
                <li><strong>Bibliotecas Principais</strong>:
                  <ul className="list-disc pl-6 mt-2">
                    <li>date-fns: Manipulação de datas</li>
                    <li>react-hook-form: Gerenciamento de formulários</li>
                    <li>recharts: Visualização de dados</li>
                    <li>react-quill: Editor de texto rico</li>
                    <li>@hello-pangea/dnd: Drag and drop</li>
                    <li>three.js: Visualizações 3D</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Backend (Base44 Platform)</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Linguagem</strong>: Python</li>
                <li><strong>Framework</strong>: FastAPI</li>
                <li><strong>Banco de Dados</strong>:
                  <ul className="list-disc pl-6 mt-2">
                    <li>PostgreSQL para dados estruturados</li>
                    <li>Redis para cache e filas</li>
                  </ul>
                </li>
                <li><strong>Autenticação</strong>: OAuth2 + JWT</li>
                <li><strong>API</strong>: RESTful com OpenAPI/Swagger</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Infraestrutura Cloud</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Cloud</strong>: AWS</li>
                <li><strong>Serviços Principais</strong>:
                  <ul className="list-disc pl-6 mt-2">
                    <li>ECS para containers</li>
                    <li>RDS para PostgreSQL</li>
                    <li>ElastiCache para Redis</li>
                    <li>S3 para armazenamento</li>
                    <li>CloudFront para CDN</li>
                  </ul>
                </li>
                <li><strong>Monitoramento</strong>:
                  <ul className="list-disc pl-6 mt-2">
                    <li>CloudWatch</li>
                    <li>Datadog</li>
                    <li>Sentry para error tracking</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">CI/CD</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>GitHub Actions</li>
                <li>Docker para containerização</li>
                <li>AWS CodePipeline</li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Segurança</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Autenticação OAuth2</li>
                <li>Autorização baseada em funções (RBAC)</li>
                <li>Criptografia end-to-end</li>
                <li>Logs de auditoria</li>
                <li>Conformidade com LGPD</li>
              </ul>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="features" className="p-4 border rounded-md mt-4">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Funcionalidades do Sistema</h2>

              <h3 className="text-xl font-semibold mt-6 mb-3">Gestão de Projetos</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Dashboard Interativo</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Visão geral de projetos</li>
                    <li>KPIs em tempo real</li>
                    <li>Gráficos e métricas</li>
                    <li>Alertas inteligentes</li>
                  </ul>
                </li>
                <li><strong>Projetos</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Criação e gestão de projetos</li>
                    <li>Definição de escopo</li>
                    <li>Cronograma inteligente</li>
                    <li>Alocação de recursos</li>
                    <li>Gestão de custos</li>
                    <li>Documentação</li>
                    <li>Análise de riscos</li>
                    <li>Relatórios automatizados</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Gestão de Tarefas</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Tarefas Inteligentes</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Criação manual e automática</li>
                    <li>Detecção por IA em reuniões</li>
                    <li>Priorização automática</li>
                    <li>Dependências e sequenciamento</li>
                    <li>Estimativas de tempo</li>
                    <li>Alocação inteligente</li>
                  </ul>
                </li>
                <li><strong>Kanban Board</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Visualização customizável</li>
                    <li>Drag and drop</li>
                    <li>Filtros avançados</li>
                    <li>Tags e categorias</li>
                    <li>Busca global</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Reuniões e Comunicação</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Gestão de Reuniões</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Agendamento</li>
                    <li>Atas automáticas</li>
                    <li>Melhoria de texto por IA</li>
                    <li>Geração de tarefas</li>
                    <li>Follow-up automático</li>
                  </ul>
                </li>
                <li><strong>Comunicação</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Chat integrado</li>
                    <li>Notificações inteligentes</li>
                    <li>Compartilhamento de arquivos</li>
                    <li>Menções e referências</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Análise e Insights</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Analytics</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Métricas de projeto</li>
                    <li>Análise de desempenho</li>
                    <li>Previsões e tendências</li>
                    <li>Relatórios customizáveis</li>
                  </ul>
                </li>
                <li><strong>IA Assistant (Gabih)</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Sugestões proativas</li>
                    <li>Análise de riscos</li>
                    <li>Otimização de recursos</li>
                    <li>Geração de documentação</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Gestão de Qualidade</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Testes e QA</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Planos de teste</li>
                    <li>Casos de teste</li>
                    <li>Rastreamento de bugs</li>
                    <li>Métricas de qualidade</li>
                  </ul>
                </li>
                <li><strong>Documentação</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Wiki integrada</li>
                    <li>Versionamento</li>
                    <li>Templates inteligentes</li>
                    <li>Exportação em múltiplos formatos</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Gestão Financeira</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Orçamentos</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Criação de orçamentos</li>
                    <li>Controle de custos</li>
                    <li>Previsões financeiras</li>
                    <li>Relatórios financeiros</li>
                  </ul>
                </li>
                <li><strong>Recursos</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Alocação de recursos</li>
                    <li>Custos por função</li>
                    <li>Análise de capacidade</li>
                    <li>Otimização de custos</li>
                  </ul>
                </li>
              </ul>

              <h3 className="text-xl font-semibold mt-6 mb-3">Infraestrutura</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Gestão de Ambiente</strong>
                  <ul className="list-disc pl-6 mt-2">
                    <li>Configuração de ambientes</li>
                    <li>Monitoramento</li>
                    <li>Custos de infraestrutura</li>
                    <li>Recomendações de otimização</li>
                  </ul>
                </li>
              </ul>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="ai" className="p-4 border rounded-md mt-4">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Inteligência Artificial e Machine Learning</h2>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Modelos de IA</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-50 to-indigo-50">
                    <h4 className="text-lg font-semibold text-purple-700 mb-2">Assistente de Projetos (Gabih)</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Base: GPT-4</li>
                      <li>Fine-tuning específico para gerenciamento de projetos</li>
                      <li>Contexto aprimorado com dados históricos</li>
                      <li>Capacidade de acessar e processar dados de múltiplas fontes</li>
                      <li>Tecnologia de RAG (Retrieval Augmented Generation)</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-gradient-to-br from-amber-50 to-orange-50">
                    <h4 className="text-lg font-semibold text-amber-700 mb-2">Análise de Riscos</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Modelo: Random Forest + XGBoost</li>
                      <li>Features:
                        <ul className="list-disc pl-5">
                          <li>Histórico de projetos</li>
                          <li>Métricas de desempenho</li>
                          <li>Variáveis de contexto</li>
                        </ul>
                      </li>
                      <li>Precisão: ~85%</li>
                      <li>Atualização: Retreinamento mensal com novos dados</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-cyan-50">
                    <h4 className="text-lg font-semibold text-blue-700 mb-2">Previsão de Prazos e Custos</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Modelo: LSTM (Long Short-Term Memory)</li>
                      <li>Entrada:
                        <ul className="list-disc pl-5">
                          <li>Histórico de projetos similares</li>
                          <li>Complexidade</li>
                          <li>Equipe alocada</li>
                        </ul>
                      </li>
                      <li>Saída:
                        <ul className="list-disc pl-5">
                          <li>Estimativa de prazo</li>
                          <li>Intervalo de confiança</li>
                          <li>Custo previsto</li>
                        </ul>
                      </li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                    <h4 className="text-lg font-semibold text-green-700 mb-2">Geração de Tarefas</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Modelo: GPT-4 com fine-tuning</li>
                      <li>Análise de contexto de reuniões</li>
                      <li>Identificação de dependências</li>
                      <li>Sugestão de ordem de execução</li>
                      <li>Estimativa de esforço e recursos necessários</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Fluxo de Processamento de IA</h3>
                
                <div className="my-4 border rounded-lg overflow-hidden shadow-sm">
                  <img 
                    src="https://miro.medium.com/max/1400/1*0fLVc6GzwMR1XS_U1qTxZg.png" 
                    alt="Fluxo de processamento de IA" 
                    className="w-full object-contain"
                  />
                </div>
                
                <ol className="list-decimal pl-6 space-y-2">
                  <li><strong>Coleta de Dados</strong>: Informações de projetos, reuniões, tarefas e histórico</li>
                  <li><strong>Processamento e Enriquecimento</strong>: Normalização, agregação e contextualização</li>
                  <li><strong>Análise por Modelos Específicos</strong>: Diferentes modelos para diferentes funções</li>
                  <li><strong>Geração de Insights</strong>: Recomendações, previsões e sugestões</li>
                  <li><strong>Apresentação</strong>: Interface visual adaptada ao contexto</li>
                  <li><strong>Feedback e Aprendizado</strong>: Melhoria contínua dos modelos com feedback</li>
                </ol>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-3">Capacidades por Área</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Processamento de Linguagem Natural</h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>Análise de texto de reuniões e comentários</li>
                      <li>Extração de informações-chave</li>
                      <li>Resumo automático de documentos</li>
                      <li>Geração de relatórios estruturados</li>
                      <li>Respostas contextualizadas em chat</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Análise Preditiva</h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>Estimativa de prazos e custos</li>
                      <li>Previsão de atrasos e desvios</li>
                      <li>Identificação precoce de riscos</li>
                      <li>Tendências de desempenho de equipe</li>
                      <li>Projeção de resultados financeiros</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Otimização</h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>Alocação eficiente de recursos</li>
                      <li>Sequenciamento inteligente de tarefas</li>
                      <li>Balanceamento de carga de trabalho</li>
                      <li>Redução de custos operacionais</li>
                      <li>Otimização de caminhos críticos</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">Reconhecimento de Padrões</h4>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>Detecção de gargalos recorrentes</li>
                      <li>Identificação de fatores de sucesso</li>
                      <li>Correlação entre variáveis de projeto</li>
                      <li>Análise de desempenho por tipo de projeto</li>
                      <li>Perfis de comportamento de equipe</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="architecture" className="p-4 border rounded-md mt-4">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <div className="prose prose-slate max-w-none">
              <h2 className="text-2xl font-semibold mb-4">Arquitetura do Sistema</h2>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">Visão Geral da Arquitetura</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-indigo-50 flex flex-row items-center gap-3">
                      <div className="p-2 rounded-full bg-white shadow-sm">
                        <Layers className="h-5 w-5 text-indigo-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Sistema</CardTitle>
                        <CardDescription>Arquitetura do Sistema</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => window.location.href = "/PlatformDiagram?tab=system"}
                      >
                        Ver Diagrama
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-green-50 flex flex-row items-center gap-3">
                      <div className="p-2 rounded-full bg-white shadow-sm">
                        <Database className="h-5 w-5 text-green-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Dados</CardTitle>
                        <CardDescription>Modelo de Dados</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => window.location.href = "/PlatformDiagram?tab=data"}
                      >
                        Ver Diagrama
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-purple-50 flex flex-row items-center gap-3">
                      <div className="p-2 rounded-full bg-white shadow-sm">
                        <Bot className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">IA</CardTitle>
                        <CardDescription>Arquitetura de IA</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => window.location.href = "/PlatformDiagram?tab=ai"}
                      >
                        Ver Diagrama
                      </Button>
                    </CardContent>
                  </Card>
                  
                  <Card className="overflow-hidden">
                    <CardHeader className="bg-amber-50 flex flex-row items-center gap-3">
                      <div className="p-2 rounded-full bg-white shadow-sm">
                        <Server className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Cloud</CardTitle>
                        <CardDescription>Infraestrutura Cloud</CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4">
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={() => window.location.href = "/PlatformDiagram?tab=cloud"}
                      >
                        Ver Diagrama
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">Princípios de Arquitetura</h3>
                
                <ul className="list-disc pl-6 space-y-3">
                  <li><strong>Microserviços</strong>: Arquitetura baseada em microserviços para isolamento de responsabilidades e escalonabilidade independente.</li>
                  <li><strong>API-First</strong>: Design orientado a API, permitindo integrações flexíveis e extensibilidade.</li>
                  <li><strong>Cloud-Native</strong>: Desenvolvido para aproveitar ao máximo os recursos de nuvem elástica.</li>
                  <li><strong>Segurança por Design</strong>: Considerações de segurança incorporadas desde o início do processo de desenvolvimento.</li>
                  <li><strong>Observabilidade</strong>: Monitoramento abrangente, logging e rastreamento para facilitar o diagnóstico de problemas.</li>
                  <li><strong>DevOps</strong>: Integração contínua e entrega contínua para implantações rápidas e confiáveis.</li>
                </ul>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">Componentes Principais</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-blue-700 mb-2">Frontend</h4>
                    <p className="text-gray-600 mb-3">
                      Aplicação React SPA (Single Page Application) servida através de CDN para performance global.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>Componentes reutilizáveis com Shadcn/UI</li>
                      <li>Estilização com Tailwind CSS</li>
                      <li>Gestão de estado com React Context</li>
                      <li>Roteamento com React Router</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-green-700 mb-2">API Backend</h4>
                    <p className="text-gray-600 mb-3">
                      API RESTful construída com FastAPI, servindo como gateway para os microserviços.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>Validação de entrada com Pydantic</li>
                      <li>Autenticação JWT/OAuth2</li>
                      <li>Documentação automática com Swagger/OpenAPI</li>
                      <li>Rate limiting e proteção contra abusos</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-purple-700 mb-2">Serviços de IA</h4>
                    <p className="text-gray-600 mb-3">
                      Conjunto de serviços especializados para processamento de IA/ML.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>Serviço de processamento de linguagem natural</li>
                      <li>Serviço de previsão e análise preditiva</li>
                      <li>Serviço de otimização e recomendação</li>
                      <li>Serviço de detecção de anomalias</li>
                    </ul>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-amber-700 mb-2">Camada de Dados</h4>
                    <p className="text-gray-600 mb-3">
                      Persistência e gerenciamento de dados.
                    </p>
                    <ul className="list-disc pl-5 space-y-1 text-gray-600">
                      <li>PostgreSQL para dados relacionais</li>
                      <li>Redis para cache e dados temporários</li>
                      <li>S3 para armazenamento de objetos</li>
                      <li>Serviço de agregação para analytics</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="text-xl font-semibold mb-3">Escalabilidade e Performance</h3>
                
                <p className="text-gray-600 mb-4">
                  A arquitetura foi projetada para escalar horizontalmente, permitindo lidar com crescimento
                  do volume de dados e número de usuários, mantendo a performance consistente.
                </p>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Auto Scaling</strong>: Configuração de auto scaling baseada em demanda para todos os serviços críticos.</li>
                  <li><strong>Caching em Múltiplas Camadas</strong>: Estratégia de cache para reduzir a carga no banco de dados e melhorar tempo de resposta.</li>
                  <li><strong>CDN Global</strong>: Distribuição de conteúdo estático através de rede global para reduzir latência.</li>
                  <li><strong>Otimização de Consultas</strong>: Queries otimizadas e indexação apropriada para operações de banco de dados.</li>
                  <li><strong>Processamento Assíncrono</strong>: Tarefas pesadas processadas assincronamente para não bloquear o fluxo principal.</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Integração com Sistemas Externos</h3>
                
                <p className="text-gray-600 mb-4">
                  O sistema oferece pontos de integração bem definidos para interoperabilidade com sistemas externos:
                </p>
                
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>API RESTful</strong>: Endpoints públicos documentados para integração por terceiros.</li>
                  <li><strong>Webhooks</strong>: Notificações push para eventos importantes do sistema.</li>
                  <li><strong>Importação/Exportação</strong>: Suporte a formatos padrão (CSV, Excel, JSON) para intercâmbio de dados.</li>
                  <li><strong>SSO</strong>: Suporte a Single Sign-On para integração com sistemas de autenticação corporativos.</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
}

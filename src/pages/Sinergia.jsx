
import React, { useState, useEffect } from 'react';
import { Project, Task, User, Area } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  Network,
  Zap,
  Users,
  ArrowRight,
  Clock,
  Target,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  TrendingUp,
  GitMerge,
  Shuffle,
  Calendar,
  Building,
  Activity,
  BarChart3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlanzeeInlineLoader, PlanzeeButtonLoader } from '../components/PlanzeeLoader';

export default function Sinergia() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [synergyAnalysis, setSynergyAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastAnalysisDate, setLastAnalysisDate] = useState(null);

  useEffect(() => {
    loadData();
    loadLastAnalysis();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, tasksData, usersData, areasData] = await Promise.all([
        Project.list(),
        Task.list(),
        User.list(),
        Area.list()
      ]);
      
      setProjects(projectsData.filter(p => p.status !== 'concluído' && p.status !== 'arquivado'));
      setTasks(tasksData.filter(t => t.status !== 'concluída'));
      setUsers(usersData);
      setAreas(areasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadLastAnalysis = () => {
    const saved = localStorage.getItem('synergyAnalysis');
    const savedDate = localStorage.getItem('synergyAnalysisDate');
    
    if (saved && savedDate) {
      setSynergyAnalysis(JSON.parse(saved));
      setLastAnalysisDate(new Date(savedDate));
    }
  };

  const saveAnalysis = (analysis) => {
    const now = new Date();
    localStorage.setItem('synergyAnalysis', JSON.stringify(analysis));
    localStorage.setItem('synergyAnalysisDate', now.toISOString());
    setLastAnalysisDate(now);
  };

  const generateSynergyAnalysis = async () => {
    setLoading(true);
    try {
      const today = new Date();
      
      // Preparar dados dos projetos com suas tarefas
      const projectsWithTasks = projects.map(project => {
        const projectTasks = tasks.filter(t => t.project_id === project.id);
        const area = areas.find(a => a.id === project.area_id);
        
        return {
          id: project.id,
          title: project.title,
          description: project.description,
          status: project.status,
          progress: project.progress,
          deadline: project.deadline,
          area: area?.name || 'Sem área',
          area_id: project.area_id,
          participants: project.participants || [],
          tasks: projectTasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            assigned_to: t.assigned_to,
            estimated_hours: t.estimated_hours,
            skills_required: t.role_id
          })),
          tags: project.tags || []
        };
      });

      // Preparar dados das áreas com estatísticas
      const areasWithStats = areas.map(area => {
        const areaProjects = projects.filter(p => p.area_id === area.id);
        const areaTasks = tasks.filter(t => areaProjects.some(p => p.id === t.project_id));
        const overdueTasks = areaTasks.filter(t => {
          if (!t.deadline) return false;
          return new Date(t.deadline) < today && t.status !== 'concluída';
        });
        
        return {
          id: area.id,
          name: area.name,
          responsible: area.responsible_email,
          projects_count: areaProjects.length,
          tasks_count: areaTasks.length,
          overdue_tasks: overdueTasks.length,
          workload_score: areaTasks.length > 0 ? Math.round((overdueTasks.length / areaTasks.length) * 100) : 0
        };
      });

      const prompt = `
        Você é um especialista em análise organizacional e otimização de recursos. Analise os projetos e áreas abaixo para identificar sinergias, oportunidades de colaboração e otimizações.

        PROJETOS ATIVOS:
        ${JSON.stringify(projectsWithTasks, null, 2)}

        ÁREAS COM ESTATÍSTICAS:
        ${JSON.stringify(areasWithStats, null, 2)}

        Data atual: ${today.toISOString().split('T')[0]}

        ANÁLISE SOLICITADA:
        1. **Sinergias entre Projetos**: Identifique atividades/tarefas similares entre projetos que podem ser consolidadas ou reutilizadas
        2. **Oportunidades de Colaboração**: Projetos que podem se beneficiar trabalhando juntos
        3. **Transferência de Conhecimento**: O que foi aprendido/desenvolvido em um projeto pode acelerar outro
        4. **Redistribuição de Recursos**: Áreas com menor carga que podem ajudar áreas sobrecarregadas
        5. **Sinergias entre Áreas**: Como diferentes áreas podem colaborar melhor
        6. **Otimizações de Cronograma**: Oportunidades para acelerar entregas através de colaboração

        Para cada oportunidade identificada, forneça:
        - Descrição clara da sinergia
        - Projetos/áreas envolvidos
        - Benefício potencial (tempo, custo, qualidade)
        - Complexidade de implementação
        - Ações específicas recomendadas
        - Prazo estimado para implementação

        Retorne um JSON estruturado com esta análise:
        {
          "summary": {
            "total_synergies": 0,
            "high_impact_opportunities": 0,
            "estimated_time_savings": "X semanas",
            "estimated_cost_savings": "X%",
            "collaboration_score": 85
          },
          "project_synergies": [
            {
              "title": "Título da Sinergia",
              "description": "Descrição detalhada",
              "projects_involved": ["projeto1", "projeto2"],
              "synergy_type": "atividade_comum|conhecimento|recurso|tecnologia",
              "potential_benefit": "Benefício específico",
              "time_savings": "X dias/semanas",
              "complexity": "baixa|média|alta",
              "priority": "alta|média|baixa",
              "actions": ["ação1", "ação2"],
              "implementation_timeline": "prazo estimado"
            }
          ],
          "area_synergies": [
            {
              "title": "Título da Colaboração entre Áreas",
              "description": "Como as áreas podem colaborar",
              "areas_involved": ["área1", "área2"],
              "current_workload_imbalance": "descrição do desequilíbrio",
              "proposed_collaboration": "proposta específica",
              "expected_outcome": "resultado esperado",
              "resources_to_share": ["recurso1", "recurso2"],
              "timeline": "prazo para implementar"
            }
          ],
          "knowledge_transfer": [
            {
              "from_project": "projeto origem",
              "to_project": "projeto destino",
              "knowledge_type": "técnico|processo|ferramenta|experiência",
              "description": "o que pode ser transferido",
              "acceleration_potential": "quanto pode acelerar",
              "transfer_method": "como fazer a transferência"
            }
          ],
          "resource_optimization": [
            {
              "title": "Otimização de Recursos",
              "description": "Descrição da otimização",
              "overloaded_areas": ["área sobrecarregada"],
              "available_areas": ["área com capacidade"],
              "resource_type": "pessoas|conhecimento|ferramentas|tempo",
              "proposal": "proposta específica",
              "impact": "impacto esperado"
            }
          ],
          "quick_wins": [
            {
              "title": "Ganho Rápido",
              "description": "Oportunidade de resultado rápido",
              "effort": "baixo|médio|alto",
              "impact": "baixo|médio|alto",
              "timeline": "prazo curto",
              "stakeholders": ["envolvidos"]
            }
          ],
          "recommendations": [
            {
              "priority": "alta|média|baixa",
              "category": "sinergia|colaboração|otimização",
              "recommendation": "recomendação específica",
              "rationale": "justificativa",
              "next_steps": ["passo1", "passo2"]
            }
          ]
        }
      `;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                total_synergies: { type: "number" },
                high_impact_opportunities: { type: "number" },
                estimated_time_savings: { type: "string" },
                estimated_cost_savings: { type: "string" },
                collaboration_score: { type: "number" }
              }
            },
            project_synergies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  projects_involved: { type: "array", items: { type: "string" } },
                  synergy_type: { type: "string" },
                  potential_benefit: { type: "string" },
                  time_savings: { type: "string" },
                  complexity: { type: "string" },
                  priority: { type: "string" },
                  actions: { type: "array", items: { type: "string" } },
                  implementation_timeline: { type: "string" }
                }
              }
            },
            area_synergies: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  areas_involved: { type: "array", items: { type: "string" } },
                  current_workload_imbalance: { type: "string" },
                  proposed_collaboration: { type: "string" },
                  expected_outcome: { type: "string" },
                  resources_to_share: { type: "array", items: { type: "string" } },
                  timeline: { type: "string" }
                }
              }
            },
            knowledge_transfer: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  from_project: { type: "string" },
                  to_project: { type: "string" },
                  knowledge_type: { type: "string" },
                  description: { type: "string" },
                  acceleration_potential: { type: "string" },
                  transfer_method: { type: "string" }
                }
              }
            },
            resource_optimization: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  overloaded_areas: { type: "array", items: { type: "string" } },
                  available_areas: { type: "array", items: { type: "string" } },
                  resource_type: { type: "string" },
                  proposal: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            quick_wins: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  effort: { type: "string" },
                  impact: { type: "string" },
                  timeline: { type: "string" },
                  stakeholders: { type: "array", items: { type: "string" } }
                }
              }
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  category: { type: "string" },
                  recommendation: { type: "string" },
                  rationale: { type: "string" },
                  next_steps: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      setSynergyAnalysis(response);
      saveAnalysis(response);
      
    } catch (error) {
      console.error('Erro ao gerar análise de sinergia:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'alta': return 'bg-red-100 text-red-800 border-red-200';
      case 'média': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'baixa': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getComplexityIcon = (complexity) => {
    switch (complexity) {
      case 'baixa': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'média': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'alta': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Target className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSynergyTypeIcon = (type) => {
    switch (type) {
      case 'atividade_comum': return <Activity className="h-4 w-4" />;
      case 'conhecimento': return <Lightbulb className="h-4 w-4" />;
      case 'recurso': return <Users className="h-4 w-4" />;
      case 'tecnologia': return <Zap className="h-4 w-4" />;
      default: return <Network className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Network className="h-8 w-8 text-blue-500" />
          Análise de Sinergia
        </h1>
        <p className="text-gray-600 mt-2">
          Descubra oportunidades de colaboração, reutilização e otimização entre projetos e áreas
        </p>
        {lastAnalysisDate && (
          <p className="text-sm text-gray-500 mt-1">
            Última análise: {lastAnalysisDate.toLocaleDateString('pt-BR')} às {lastAnalysisDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </div>

      <div className="grid gap-6">
        {/* Botão de Análise */}
        <div className="flex justify-center">
          <Button
            onClick={generateSynergyAnalysis}
            disabled={loading || projects.length === 0}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3"
          >
            {loading ? (
              <PlanzeeButtonLoader />
            ) : (
              <>
                <Network className="mr-2 h-5 w-5" />
                {lastAnalysisDate ? 'Atualizar Análise de Sinergia' : 'Gerar Análise de Sinergia'}
              </>
            )}
          </Button>
        </div>

        {/* Resultados da Análise */}
        {loading ? (
          <Card>
            <CardContent className="py-12">
              <PlanzeeInlineLoader text="Analisando sinergias entre projetos e áreas..." />
            </CardContent>
          </Card>
        ) : synergyAnalysis ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Resumo Executivo */}
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-800">
                    <TrendingUp className="h-5 w-5" />
                    Resumo Executivo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{synergyAnalysis.summary.total_synergies}</div>
                      <div className="text-sm text-gray-600">Sinergias Identificadas</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{synergyAnalysis.summary.high_impact_opportunities}</div>
                      <div className="text-sm text-gray-600">Alto Impacto</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{synergyAnalysis.summary.estimated_time_savings}</div>
                      <div className="text-sm text-gray-600">Economia de Tempo</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{synergyAnalysis.summary.collaboration_score}/100</div>
                      <div className="text-sm text-gray-600">Score Colaboração</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Sinergias entre Projetos */}
              {synergyAnalysis.project_synergies && synergyAnalysis.project_synergies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <GitMerge className="h-5 w-5 text-green-500" />
                      Sinergias entre Projetos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {synergyAnalysis.project_synergies.map((synergy, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-gray-50">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              {getSynergyTypeIcon(synergy.synergy_type)}
                              <h3 className="font-semibold text-gray-800">{synergy.title}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={getPriorityColor(synergy.priority)}>
                                {synergy.priority?.toUpperCase()}
                              </Badge>
                              <div className="flex items-center gap-1">
                                {getComplexityIcon(synergy.complexity)}
                                <span className="text-xs text-gray-500">{synergy.complexity}</span>
                              </div>
                            </div>
                          </div>
                          
                          <p className="text-gray-600 mb-3">{synergy.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-1">Projetos Envolvidos:</h4>
                              <div className="flex flex-wrap gap-1">
                                {synergy.projects_involved.map((project, i) => (
                                  <Badge key={i} variant="outline" className="text-xs">{project}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-1">Benefício:</h4>
                              <p className="text-sm text-green-600 font-medium">{synergy.potential_benefit}</p>
                            </div>
                          </div>
                          
                          {synergy.actions && synergy.actions.length > 0 && (
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-2">Ações Recomendadas:</h4>
                              <ul className="text-sm space-y-1">
                                {synergy.actions.map((action, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <ArrowRight className="h-3 w-3 mt-1 text-blue-500 flex-shrink-0" />
                                    {action}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sinergias entre Áreas */}
              {synergyAnalysis.area_synergies && synergyAnalysis.area_synergies.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building className="h-5 w-5 text-purple-500" />
                      Colaboração entre Áreas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {synergyAnalysis.area_synergies.map((synergy, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-purple-50">
                          <h3 className="font-semibold text-gray-800 mb-2">{synergy.title}</h3>
                          <p className="text-gray-600 mb-3">{synergy.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-1">Áreas Envolvidas:</h4>
                              <div className="flex flex-wrap gap-1">
                                {synergy.areas_involved.map((area, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">{area}</Badge>
                                ))}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-sm text-gray-700 mb-1">Resultado Esperado:</h4>
                              <p className="text-sm text-purple-600 font-medium">{synergy.expected_outcome}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Transferência de Conhecimento */}
              {synergyAnalysis.knowledge_transfer && synergyAnalysis.knowledge_transfer.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shuffle className="h-5 w-5 text-orange-500" />
                      Transferência de Conhecimento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {synergyAnalysis.knowledge_transfer.map((transfer, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-orange-50">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">{transfer.from_project}</Badge>
                            <ArrowRight className="h-4 w-4 text-orange-500" />
                            <Badge variant="outline">{transfer.to_project}</Badge>
                          </div>
                          <p className="text-gray-600 mb-2">{transfer.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-orange-600 font-medium">
                              Aceleração: {transfer.acceleration_potential}
                            </span>
                            <span className="text-gray-500">
                              Método: {transfer.transfer_method}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Ganhos Rápidos */}
              {synergyAnalysis.quick_wins && synergyAnalysis.quick_wins.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-yellow-500" />
                      Ganhos Rápidos
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {synergyAnalysis.quick_wins.map((win, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-yellow-50">
                          <h3 className="font-semibold text-gray-800 mb-2">{win.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">{win.description}</p>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                Esforço: {win.effort}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                Impacto: {win.impact}
                              </Badge>
                            </div>
                            <span className="text-gray-500">{win.timeline}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recomendações */}
              {synergyAnalysis.recommendations && synergyAnalysis.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-500" />
                      Recomendações Estratégicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {synergyAnalysis.recommendations.map((rec, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4 py-2">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-800">{rec.recommendation}</h3>
                            <Badge className={getPriorityColor(rec.priority)}>
                              {rec.priority?.toUpperCase()}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{rec.rationale}</p>
                          {rec.next_steps && rec.next_steps.length > 0 && (
                            <div>
                              <h4 className="font-medium text-xs text-gray-700 mb-1">Próximos Passos:</h4>
                              <ul className="text-xs space-y-1">
                                {rec.next_steps.map((step, i) => (
                                  <li key={i} className="flex items-start gap-2">
                                    <span className="text-blue-500">•</span>
                                    {step}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        ) : lastAnalysisDate ? (
          <Card>
            <CardContent className="text-center py-8">
              <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Análise Anterior Disponível
              </h3>
              <p className="text-gray-600 mb-4">
                Última análise realizada em {lastAnalysisDate.toLocaleString('pt-BR')}
              </p>
              <Button onClick={generateSynergyAnalysis} disabled={loading}>
                Atualizar Análise
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="text-center py-8">
              <Network className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Pronto para Análise de Sinergia
              </h3>
              <p className="text-gray-600">
                Clique no botão acima para iniciar a análise de sinergia entre seus projetos e áreas.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

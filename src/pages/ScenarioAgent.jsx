
import React, { useState, useEffect } from 'react';
import { Project, Task, User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  DollarSign,
  Users,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PlanzeeInlineLoader, PlanzeeButtonLoader } from '../components/PlanzeeLoader';

export default function ScenarioAgent() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [scenarios, setScenarios] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customFactors, setCustomFactors] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, userData] = await Promise.all([
        Project.list(),
        User.me()
      ]);
      setProjects(projectsData.filter(p => p.status !== 'concluído'));
      setUser(userData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const generateScenarios = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const project = projects.find(p => p.id === selectedProject);
      const tasks = await Task.filter({ project_id: selectedProject });
      
      const today = new Date();
      const projectStartDate = new Date(project.start_date);
      const projectDeadline = new Date(project.deadline);
      
      // Calcular duração total do projeto em dias
      const totalProjectDays = Math.ceil((projectDeadline - projectStartDate) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((today - projectStartDate) / (1000 * 60 * 60 * 24));
      const daysRemaining = Math.ceil((projectDeadline - today) / (1000 * 60 * 60 * 24));
      
      // Calcular variações de tempo baseadas na complexidade
      const complexityFactor = tasks.length > 20 ? 1.3 : tasks.length > 10 ? 1.1 : 1.0;
      const blockedTasksCount = tasks.filter(t => t.status === 'bloqueada').length;
      
      // Cenário Otimista: 10-20% mais rápido
      const optimisticReduction = Math.floor(daysRemaining * 0.15);
      const optimisticEndDate = new Date(today.getTime() + (daysRemaining - optimisticReduction) * 24 * 60 * 60 * 1000);
      
      // Cenário Realista: baseado no progresso atual
      const realisticAdjustment = Math.floor(daysRemaining * 0.05 * complexityFactor);
      const realisticEndDate = new Date(today.getTime() + (daysRemaining + realisticAdjustment) * 24 * 60 * 60 * 1000);
      
      // Cenário Pessimista: 30-50% mais lento
      const pessimisticIncrease = Math.floor(daysRemaining * (0.3 + (blockedTasksCount * 0.05)));
      const pessimisticEndDate = new Date(today.getTime() + (daysRemaining + pessimisticIncrease) * 24 * 60 * 60 * 1000);

      const prompt = `
        Você é um especialista em gerenciamento de projetos de TI. Analise o projeto abaixo e gere 3 cenários realistas de execução.

        DADOS DO PROJETO:
        - Nome: ${project.title}
        - Status: ${project.status}
        - Progresso: ${project.progress}%
        - Data de Início: ${project.start_date}
        - Prazo Original: ${project.deadline}
        - Dias Decorridos: ${daysElapsed}
        - Dias Restantes: ${daysRemaining}
        - Total de Tarefas: ${tasks.length}
        - Tarefas Bloqueadas: ${blockedTasksCount}
        - Tarefas Concluídas: ${tasks.filter(t => t.status === 'concluída').length}
        - Tarefas Pendentes: ${tasks.filter(t => t.status === 'pendente').length}

        DATAS CALCULADAS:
        - Cenário Otimista: ${optimisticEndDate.toISOString().split('T')[0]}
        - Cenário Realista: ${realisticEndDate.toISOString().split('T')[0]}
        - Cenário Pessimista: ${pessimisticEndDate.toISOString().split('T')[0]}

        ${customFactors ? `FATORES ADICIONAIS: ${customFactors}` : ''}

        IMPORTANTE: As datas devem seguir a lógica:
        - Otimista = mais rápido (data mais próxima)
        - Realista = baseado no progresso atual
        - Pessimista = mais lento (data mais distante)

        Retorne um JSON com esta estrutura exata:
        {
          "optimistic": {
            "title": "Cenário Otimista",
            "probability": "25%",
            "end_date": "${optimisticEndDate.toISOString().split('T')[0]}",
            "days_from_now": ${daysRemaining - optimisticReduction},
            "budget_variance": "+5%",
            "description": "Descrição detalhada do cenário otimista",
            "key_factors": ["fator1", "fator2", "fator3"],
            "risks": ["risco1", "risco2"],
            "actions": ["ação1", "ação2", "ação3"]
          },
          "realistic": {
            "title": "Cenário Realista",
            "probability": "50%",
            "end_date": "${realisticEndDate.toISOString().split('T')[0]}",
            "days_from_now": ${daysRemaining + realisticAdjustment},
            "budget_variance": "+10%",
            "description": "Descrição detalhada do cenário realista",
            "key_factors": ["fator1", "fator2", "fator3"],
            "risks": ["risco1", "risco2"],
            "actions": ["ação1", "ação2", "ação3"]
          },
          "pessimistic": {
            "title": "Cenário Pessimista",
            "probability": "25%",
            "end_date": "${pessimisticEndDate.toISOString().split('T')[0]}",
            "days_from_now": ${daysRemaining + pessimisticIncrease},
            "budget_variance": "+25%",
            "description": "Descrição detalhada do cenário pessimista",
            "key_factors": ["fator1", "fator2", "fator3"],
            "risks": ["risco1", "risco2", "risco3"],
            "actions": ["ação1", "ação2", "ação3", "ação4"]
          }
        }
      `;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            optimistic: {
              type: "object",
              properties: {
                title: { type: "string" },
                probability: { type: "string" },
                end_date: { type: "string" },
                days_from_now: { type: "number" },
                budget_variance: { type: "string" },
                description: { type: "string" },
                key_factors: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                actions: { type: "array", items: { type: "string" } }
              }
            },
            realistic: {
              type: "object",
              properties: {
                title: { type: "string" },
                probability: { type: "string" },
                end_date: { type: "string" },
                days_from_now: { type: "number" },
                budget_variance: { type: "string" },
                description: { type: "string" },
                key_factors: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                actions: { type: "array", items: { type: "string" } }
              }
            },
            pessimistic: {
              type: "object",
              properties: {
                title: { type: "string" },
                probability: { type: "string" },
                end_date: { type: "string" },
                days_from_now: { type: "number" },
                budget_variance: { type: "string" },
                description: { type: "string" },
                key_factors: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                actions: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      setScenarios(response);
    } catch (error) {
      console.error('Erro ao gerar cenários:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScenarioIcon = (type) => {
    switch (type) {
      case 'optimistic':
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'realistic':
        return <Target className="h-5 w-5 text-blue-500" />;
      case 'pessimistic':
        return <TrendingDown className="h-5 w-5 text-red-500" />;
      default:
        return <BarChart3 className="h-5 w-5" />;
    }
  };

  const getScenarioColor = (type) => {
    switch (type) {
      case 'optimistic':
        return 'border-green-200 bg-green-50';
      case 'realistic':
        return 'border-blue-200 bg-blue-50';
      case 'pessimistic':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderScenario = (scenario, type) => (
    <motion.div
      key={type}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: type === 'optimistic' ? 0 : type === 'realistic' ? 0.1 : 0.2 }}
    >
      <Card className={`${getScenarioColor(type)} border-2`}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getScenarioIcon(type)}
              {scenario.title}
            </div>
            <Badge variant="outline">{scenario.probability}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <strong>Data:</strong> {formatDate(scenario.end_date)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">
                <strong>Dias:</strong> {scenario.days_from_now}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-sm">
              <strong>Variação Orçamentária:</strong> {scenario.budget_variance}
            </span>
          </div>

          <div>
            <p className="text-sm text-gray-700 mb-3">{scenario.description}</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Fatores Chave
            </h4>
            <ul className="text-sm space-y-1">
              {scenario.key_factors.map((factor, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500">•</span>
                  {factor}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Riscos
            </h4>
            <ul className="text-sm space-y-1">
              {scenario.risks.map((risk, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-red-500">•</span>
                  {risk}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Ações Recomendadas
            </h4>
            <ul className="text-sm space-y-1">
              {scenario.actions.map((action, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500">•</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          Agente de Simulação de Cenários
        </h1>
        <p className="text-gray-600 mt-2">
          Simule diferentes cenários de execução para seus projetos e antecipe riscos e oportunidades.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuração da Simulação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Selecione o Projeto
                </label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha um projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Fatores Adicionais (Opcional)
                </label>
                <Textarea
                  placeholder="Ex: Mudança de escopo, férias da equipe, dependências externas..."
                  value={customFactors}
                  onChange={(e) => setCustomFactors(e.target.value)}
                  className="h-20"
                />
              </div>

              <Button
                onClick={generateScenarios}
                disabled={!selectedProject || loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Cenários...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Gerar Cenários
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          {loading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <PlanzeeInlineLoader text="Gerando cenários de simulação..." />
              </CardContent>
            </Card>
          ) : scenarios ? (
            <div className="space-y-6">
              {Object.entries(scenarios).map(([type, scenario]) => 
                renderScenario(scenario, type)
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Pronto para Simular
                  </h3>
                  <p className="text-gray-600">
                    Selecione um projeto e clique em "Gerar Cenários" para começar.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

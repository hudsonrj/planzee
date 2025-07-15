
import React, { useState, useEffect, useMemo } from 'react';
import { Project, Task, User, Area, Budget, Meeting } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/ui/Combobox'; // New import
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area as RechartsArea
} from 'recharts';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  Users,
  Target,
  CheckCircle,
  Activity,
  Zap,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Briefcase,
  Award,
  Eye,
  Filter,
  Download,
  RefreshCw,
  Gauge
} from 'lucide-react';
import { motion } from 'framer-motion';
import { format, subDays, addDays, isAfter, isBefore, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';

// New imports for custom loaders
import PlanzeeLoader, { PlanzeeInlineLoader } from '../components/PlanzeeLoader';

// Assuming PlanzeeButtonLoader is a simple spinner component based on RefreshCw icon
const PlanzeeButtonLoader = () => (
  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
);

const COLORS = ['#4F7CFF', '#00C896', '#FFC700', '#FF6B6B', '#9C88FF', '#FF9F43'];

export default function Planzee360() {
  const [data, setData] = useState({
    projects: [],
    tasks: [],
    users: [],
    areas: [],
    budgets: [],
    meetings: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month'); // week, month, quarter
  const [selectedProject, setSelectedProject] = useState('all'); // all, or project ID
  const [insights, setInsights] = useState(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projects, tasks, users, areas, budgets, meetings] = await Promise.all([
        Project.list(),
        Task.list(),
        User.list(),
        Area.list(),
        Budget.list(),
        Meeting.list()
      ]);

      setData({
        projects: projects || [],
        tasks: tasks || [],
        users: users || [],
        areas: areas || [],
        budgets: budgets || [],
        meetings: meetings || []
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Cálculos de métricas principais
  const metrics = useMemo(() => {
    const today = new Date();

    // Filter data based on selected project
    const filteredProjects = selectedProject === 'all'
      ? data.projects
      : data.projects.filter(p => p.id === selectedProject);

    const projectIds = new Set(filteredProjects.map(p => p.id));
    const filteredTasks = data.tasks.filter(t => projectIds.has(t.project_id));
    const filteredBudgets = data.budgets.filter(b => projectIds.has(b.project_id));

    // Use filtered data for all subsequent calculations
    const projects = filteredProjects;
    const tasks = filteredTasks;
    const budgets = filteredBudgets;

    // Filtrar projetos ativos
    const activeProjects = projects.filter(p => p.status !== 'concluído' && p.status !== 'arquivado');
    const completedProjects = projects.filter(p => p.status === 'concluído');

    // 1. Métricas Financeiras
    const totalBudget = budgets.reduce((sum, b) => sum + (b.total_value || 0), 0);
    const totalProjectCost = projects.reduce((sum, p) => sum + (p.total_estimated_cost || 0), 0);
    const totalInfrastructureCost = projects.reduce((sum, p) => sum + (p.infrastructure_cost || 0), 0);

    // ROI simulado (baseado em progresso e valor estimado)
    const estimatedROI = completedProjects.length > 0 ?
      (completedProjects.reduce((sum, p) => sum + (p.total_estimated_cost || 0), 0) * 1.3 -
       completedProjects.reduce((sum, p) => sum + (p.total_estimated_cost || 0), 0)) /
       completedProjects.reduce((sum, p) => sum + (p.total_estimated_cost || 0), 0) * 100 : 0;

    // 2. Performance de Portfólio
    const projectsOnTime = activeProjects.filter(p => {
      if (!p.deadline) return true;
      return new Date(p.deadline) >= today;
    }).length;

    const projectsAtRisk = activeProjects.filter(p => {
      if (!p.deadline) return false;
      const daysUntilDeadline = differenceInDays(new Date(p.deadline), today);
      return daysUntilDeadline <= 7 && daysUntilDeadline >= 0 && (p.progress || 0) < 75;
    });

    const overdueTasks = tasks.filter(t => {
      if (!t.deadline || t.status === 'concluída') return false;
      return new Date(t.deadline) < today;
    });

    // 3. Eficiência Operacional
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'concluída').length;
    const taskCompletionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    // Utilização de recursos (baseada em tarefas atribuídas)
    const resourceUtilization = {};
    tasks.forEach(task => {
      if (task.assigned_to) {
        if (!resourceUtilization[task.assigned_to]) {
          resourceUtilization[task.assigned_to] = { total: 0, completed: 0 };
        }
        resourceUtilization[task.assigned_to].total++;
        if (task.status === 'concluída') {
          resourceUtilization[task.assigned_to].completed++;
        }
      }
    });

    // 4. Projetos Estratégicos (alta prioridade)
    const strategicProjects = activeProjects.filter(p => p.priority === 'alta' || p.priority === 'urgente');
    const strategicProjectsHealth = strategicProjects.map(project => {
      const projectTasks = tasks.filter(t => t.project_id === project.id);
      const blockedTasks = projectTasks.filter(t => t.status === 'bloqueada').length;
      const progress = project.progress || 0;
      const daysUntilDeadline = project.deadline ? differenceInDays(new Date(project.deadline), today) : null;

      let health = 'green';
      if (blockedTasks > 0 || (daysUntilDeadline !== null && daysUntilDeadline <= 7 && progress < 75)) {
        health = 'yellow';
      }
      if (blockedTasks > 2 || (daysUntilDeadline !== null && daysUntilDeadline < 0)) {
        health = 'red';
      }

      return { ...project, health, blockedTasks, daysUntilDeadline };
    });

    // Novas métricas para visão de projeto único
    let tasksByStatusForSelectedProject = [];
    let criticalTasksForSelectedProject = [];

    if (selectedProject !== 'all' && tasks.length > 0) { // 'tasks' here refers to 'filteredTasks'
        const statusCounts = tasks.reduce((acc, task) => {
            const status = task.status || 'desconhecido';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});
        tasksByStatusForSelectedProject = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

        const priorityOrder = { 'urgente': 4, 'alta': 3, 'média': 2, 'baixa': 1 };
        const statusOrder = { 'bloqueada': 3, 'em_andamento': 2, 'pendente': 1 };

        criticalTasksForSelectedProject = [...tasks]
            .filter(t => t.status !== 'concluída')
            .sort((a, b) => {
                const statusA = statusOrder[a.status] || 0;
                const statusB = statusOrder[b.status] || 0;
                if (statusA !== statusB) return statusB - statusA;

                const priorityA = priorityOrder[a.priority] || 0;
                const priorityB = priorityOrder[b.priority] || 0;
                if (priorityA !== priorityB) return priorityB - priorityA;

                const deadlineA = a.deadline ? new Date(a.deadline) : null;
                const deadlineB = b.deadline ? new Date(b.deadline) : null;
                if (deadlineA && !deadlineB) return -1;
                if (!deadlineA && deadlineB) return 1;
                if (deadlineA && deadlineB) return deadlineA.getTime() - deadlineB.getTime(); // Compare timestamps
                return 0;
            });
    }


    return {
      // Financeiro
      totalBudget,
      totalProjectCost,
      totalInfrastructureCost,
      estimatedROI,
      budgetUtilization: totalBudget > 0 ? (totalProjectCost / totalBudget) * 100 : 0,

      // Portfolio
      activeProjectsCount: activeProjects.length,
      completedProjectsCount: completedProjects.length,
      projectsOnTimeRate: activeProjects.length > 0 ? (projectsOnTime / activeProjects.length) * 100 : 0,
      projectsAtRisk: projectsAtRisk.length,
      strategicProjectsHealth,

      // Operacional
      totalTasks,
      completedTasks,
      taskCompletionRate,
      overdueTasks: overdueTasks.length,
      resourceUtilization: Object.keys(resourceUtilization).length,

      // Arrays para gráficos
      projectsByStatus: [
        { name: 'Ambiente', value: projects.filter(p => p.status === 'ambiente').length },
        { name: 'POC', value: projects.filter(p => p.status === 'poc').length },
        { name: 'MVP', value: projects.filter(p => p.status === 'mvp').length },
        { name: 'Desenvolvimento', value: projects.filter(p => p.status === 'desenvolvimento').length },
        { name: 'Produção', value: projects.filter(p => p.status === 'produção').length },
        { name: 'Concluído', value: projects.filter(p => p.status === 'concluído').length }
      ].filter(item => item.value > 0),

      budgetVsRealized: [
        { name: 'Orçado', value: totalBudget },
        { name: 'Realizado', value: totalProjectCost }
      ],

      projectsAtRiskList: projectsAtRisk,

      // Novos dados para visão de projeto único
      tasksByStatusForSelectedProject,
      criticalTasksForSelectedProject
    };
  }, [data, selectedProject]); // Dependency on selectedProject is crucial

  const generateInsights = async () => {
    setLoadingInsights(true);
    try {
      const prompt = `
        Analise os seguintes dados executivos de uma empresa de TI e gere insights estratégicos:

        MÉTRICAS FINANCEIRAS:
        - Orçamento Total: R$ ${metrics.totalBudget.toLocaleString()}
        - Custo Total de Projetos: R$ ${metrics.totalProjectCost.toLocaleString()}
        - ROI Estimado: ${metrics.estimatedROI.toFixed(1)}%
        - Utilização do Orçamento: ${metrics.budgetUtilization.toFixed(1)}%

        PERFORMANCE DE PORTFÓLIO:
        - Projetos Ativos: ${metrics.activeProjectsCount}
        - Projetos Concluídos: ${metrics.completedProjectsCount}
        - Taxa de Projetos no Prazo: ${metrics.projectsOnTimeRate.toFixed(1)}%
        - Projetos em Risco: ${metrics.projectsAtRisk}

        EFICIÊNCIA OPERACIONAL:
        - Total de Tarefas: ${metrics.totalTasks}
        - Taxa de Conclusão de Tarefas: ${metrics.taskCompletionRate.toFixed(1)}%
        - Tarefas Atrasadas: ${metrics.overdueTasks}
        - Recursos Utilizados: ${metrics.resourceUtilization}

        Forneça:
        1. 3 insights estratégicos principais
        2. 3 recomendações de ação imediata
        3. 2 alertas críticos (se houver)
        4. 1 oportunidade de otimização

        Use uma linguagem executiva, objetiva e focada em resultados.
      `;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            strategic_insights: {
              type: "array",
              items: { type: "string" },
              description: "3 insights estratégicos principais"
            },
            immediate_actions: {
              type: "array",
              items: { type: "string" },
              description: "3 recomendações de ação imediata"
            },
            critical_alerts: {
              type: "array",
              items: { type: "string" },
              description: "2 alertas críticos"
            },
            optimization_opportunity: {
              type: "string",
              description: "1 oportunidade de otimização"
            }
          },
          required: ["strategic_insights", "immediate_actions", "critical_alerts", "optimization_opportunity"]
        }
      });

      setInsights(response);
    } catch (error) {
      console.error('Erro ao gerar insights:', error);
    } finally {
      setLoadingInsights(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <PlanzeeLoader size="xl" text="Carregando Dashboard Executivo..." />
      </div>
    );
  }

  const projectOptions = [
      { value: 'all', label: 'Todos os Projetos' },
      ...data.projects.map(p => ({ value: p.id, label: p.title }))
  ];

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Gauge className="h-8 w-8 text-blue-500" />
            Planzee 360°
          </h1>
          <p className="text-gray-500 mt-1">Dashboard executivo com visão completa da organização</p>
        </div>

        <div className="flex items-center gap-3">
          <Combobox
            options={projectOptions}
            value={selectedProject}
            onChange={setSelectedProject}
            placeholder="Selecione um projeto..."
            notFoundText="Nenhum projeto encontrado."
            className="w-[250px]"
          />
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semanal</SelectItem>
              <SelectItem value="month">Mensal</SelectItem>
              <SelectItem value="quarter">Trimestral</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={loadData} variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button onClick={generateInsights} disabled={loadingInsights}>
            {loadingInsights ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            Gerar Insights
          </Button>
        </div>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Projetos Ativos</p>
                <p className="text-2xl font-bold">{metrics.activeProjectsCount}</p>
              </div>
              <Briefcase className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">No Prazo</p>
                <p className="text-2xl font-bold">{metrics.projectsOnTimeRate.toFixed(0)}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Orçamento Total</p>
                <p className="text-xl font-bold">R$ {(metrics.totalBudget / 1000).toFixed(0)}K</p>
              </div>
              <DollarSign className="h-8 w-8 text-yellow-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">ROI Médio</p>
                <p className="text-2xl font-bold">{metrics.estimatedROI.toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Em Risco</p>
                <p className="text-2xl font-bold">{metrics.projectsAtRisk}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principais */}
      <Tabs defaultValue="financial" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="portfolio">Portfólio</TabsTrigger>
          <TabsTrigger value="operational">Operacional</TabsTrigger>
          <TabsTrigger value="risks">Riscos</TabsTrigger>
          <TabsTrigger value="decisions">Decisões</TabsTrigger>
        </TabsList>

        {/* 1. Visão Financeira */}
        <TabsContent value="financial" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ROI dos Projetos */}
            <Card>
              <CardHeader>
                <CardTitle>ROI dos Projetos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.budgetVsRealized}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `R$ ${value.toLocaleString()}`} />
                      <Bar dataKey="value" fill="#4F7CFF" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Budget vs Realizado */}
            <Card>
              <CardHeader>
                <CardTitle>Budget vs. Realizado</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Utilização do Orçamento</span>
                      <span>{metrics.budgetUtilization.toFixed(1)}%</span>
                    </div>
                    <Progress value={metrics.budgetUtilization} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <p className="text-sm text-gray-600">Orçado</p>
                      <p className="text-xl font-bold text-blue-600">R$ {metrics.totalBudget.toLocaleString()}</p>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <p className="text-sm text-gray-600">Realizado</p>
                      <p className="text-xl font-bold text-green-600">R$ {metrics.totalProjectCost.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. Performance de Portfólio */}
        <TabsContent value="portfolio" className="space-y-6">
          {selectedProject === 'all' ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status dos Projetos */}
              <Card>
                <CardHeader>
                  <CardTitle>Status dos Projetos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.projectsByStatus}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          {metrics.projectsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Projetos Estratégicos */}
              <Card>
                <CardHeader>
                  <CardTitle>Projetos Estratégicos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {metrics.strategicProjectsHealth.slice(0, 5).map((project) => (
                      <div key={project.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{project.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={project.progress || 0} className="h-2 flex-1" />
                            <span className="text-xs text-gray-500">{project.progress || 0}%</span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className={`w-3 h-3 rounded-full ${
                            project.health === 'green' ? 'bg-green-500' :
                            project.health === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status das Tarefas do Projeto */}
              <Card>
                <CardHeader>
                  <CardTitle>Status das Tarefas do Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={metrics.tasksByStatusForSelectedProject}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, value }) => `${name.replace(/_/g, ' ')}: ${value}`}
                        >
                          {metrics.tasksByStatusForSelectedProject.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              {/* Tarefas Críticas */}
              <Card>
                <CardHeader>
                  <CardTitle>Tarefas Críticas e Riscos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 h-64 overflow-y-auto">
                  {metrics.criticalTasksForSelectedProject.slice(0, 10).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-2 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{task.title}</p>
                        <div className="flex items-center gap-2 text-xs mt-1">
                          <Badge variant={task.status === 'bloqueada' ? 'destructive' : 'secondary'} className="capitalize">
                            {task.status.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant="outline" className="capitalize">{task.priority}</Badge>
                        </div>
                      </div>
                       {task.deadline && <span className="text-xs text-red-500 font-semibold">{format(new Date(task.deadline), 'dd/MM')}</span>}
                    </div>
                  ))}
                  {metrics.criticalTasksForSelectedProject.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                          <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2"/>
                          Nenhuma tarefa crítica encontrada.
                      </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* 3. Eficiência Operacional */}
        <TabsContent value="operational" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Taxa de Conclusão */}
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conclusão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {metrics.taskCompletionRate.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-500">Tarefas Concluídas</p>
                  <div className="mt-4">
                    <Progress value={metrics.taskCompletionRate} className="h-2" />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>{metrics.completedTasks} concluídas</span>
                    <span>{metrics.totalTasks} total</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Utilização de Recursos */}
            <Card>
              <CardHeader>
                <CardTitle>Utilização de Recursos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">
                    {metrics.resourceUtilization}
                  </div>
                  <p className="text-sm text-gray-500">Recursos Ativos</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Alta utilização</span>
                      <span className="text-red-600">25%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Média utilização</span>
                      <span className="text-yellow-600">45%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Baixa utilização</span>
                      <span className="text-green-600">30%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tarefas Atrasadas */}
            <Card>
              <CardHeader>
                <CardTitle>Tarefas Atrasadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-red-600 mb-2">
                    {metrics.overdueTasks}
                  </div>
                  <p className="text-sm text-gray-500">Tarefas em Atraso</p>
                  {metrics.overdueTasks > 0 && (
                    <Alert className="mt-4">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Requer atenção imediata para evitar impacto nos prazos dos projetos.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 4. Indicadores de Risco */}
        <TabsContent value="risks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Projetos em Risco */}
            <Card>
              <CardHeader>
                <CardTitle>Projetos em Risco</CardTitle>
              </CardHeader>
              <CardContent>
                {metrics.projectsAtRiskList.length > 0 ? (
                  <div className="space-y-3">
                    {metrics.projectsAtRiskList.map((project) => (
                      <div key={project.id} className="border-l-4 border-red-500 pl-4 py-2">
                        <p className="font-medium">{project.title}</p>
                        <p className="text-sm text-gray-600">Progresso: {project.progress || 0}%</p>
                        {project.deadline && (
                          <p className="text-sm text-red-600">
                            Prazo: {format(new Date(project.deadline), 'dd/MM/yyyy', { locale: pt })}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum projeto em risco crítico</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Alertas do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Alertas do Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics.overdueTasks > 5 && (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {metrics.overdueTasks} tarefas atrasadas podem impactar prazos de projetos
                      </AlertDescription>
                    </Alert>
                  )}

                  {metrics.budgetUtilization > 90 && (
                    <Alert variant="destructive">
                      <DollarSign className="h-4 w-4" />
                      <AlertDescription>
                        Utilização do orçamento acima de 90% - revisar gastos
                      </AlertDescription>
                    </Alert>
                  )}

                  {metrics.projectsAtRisk > 3 && (
                    <Alert variant="destructive">
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        {metrics.projectsAtRisk} projetos estratégicos em risco
                      </AlertDescription>
                    </Alert>
                  )}

                  {metrics.overdueTasks === 0 && metrics.budgetUtilization < 90 && metrics.projectsAtRisk <= 3 && (
                    <Alert>
                      <CheckCircle className="h-4 w-4" />
                      <AlertDescription>
                        Todos os indicadores dentro dos parâmetros normais
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 5. Tomada de Decisão */}
        <TabsContent value="decisions" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Insights Executivos */}
            <Card>
              <CardHeader>
                <CardTitle>Insights Executivos</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingInsights ? (
                  <PlanzeeInlineLoader text="Gerando insights executivos..." />
                ) : insights ? (
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-blue-600">💡 Insights Estratégicos</h4>
                      <ul className="space-y-2">
                        {insights.strategic_insights.map((insight, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-green-600">🎯 Ações Imediatas</h4>
                      <ul className="space-y-2">
                        {insights.immediate_actions.map((action, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-gray-700">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {insights.critical_alerts.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-3 text-red-600">🚨 Alertas Críticos</h4>
                        <ul className="space-y-2">
                          {insights.critical_alerts.map((alert, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                              <span className="text-gray-700">{alert}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold text-lg mb-3 text-purple-600">⚡ Oportunidade de Otimização</h4>
                      <p className="text-gray-700 bg-purple-50 p-4 rounded-lg">
                        {insights.optimization_opportunity}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Button onClick={generateInsights} disabled={loadingInsights}>
                      {loadingInsights ? (
                        <PlanzeeButtonLoader />
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-2" />
                          Gerar Insights Executivos
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

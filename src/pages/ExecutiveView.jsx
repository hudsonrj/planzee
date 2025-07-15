
import React, { useState, useEffect } from 'react';
import { Project, Task, User, Area, Budget, ProjectType, ProjectStatus } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
  Zap,
  BarChart3,
  Calendar,
  Target,
  Activity,
  Loader2,
  Brain,
  AlertCircle,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';

const HEALTH_COLORS = {
  critical: '#ef4444', // Vermelho - Crítico
  warning: '#f59e0b',  // Amarelo - Atenção
  good: '#10b981',     // Verde - Saudável
  unknown: '#6b7280'   // Cinza - Sem dados
};

const COLORS_CHART = ['#4F7CFF', '#00C896', '#FFC700', '#FF6B6B', '#9C88FF', '#FF9F43'];

export default function ExecutiveView() {
  const [data, setData] = useState({
    projects: [],
    tasks: [],
    users: [],
    areas: [],
    budgets: [],
    projectTypes: [],
    projectStatusList: []
  });
  const [loading, setLoading] = useState(true);
  const [aiAnalysis, setAiAnalysis] = useState({});
  const [loadingAnalysis, setLoadingAnalysis] = useState({});
  const [selectedProject, setSelectedProject] = useState(null);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [projectsByArea, setProjectsByArea] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (data.projects.length > 0) {
      organizeProjectsByArea();
    }
  }, [data]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projects, tasks, users, areas, budgets, projectTypes, projectStatusList] = await Promise.all([
        Project.list(),
        Task.list(),
        User.list(),
        Area.list(),
        Budget.list(),
        ProjectType.list(),
        ProjectStatus.list()
      ]);

      // Incluir todos os projetos, mas organizar por finalização
      const allProjects = projects || [];
      const finalStatusIds = (projectStatusList || []).filter(s => s.is_final).map(s => s.id);
      const activeProjects = allProjects.filter(p => !finalStatusIds.includes(p.status_id));
      const completedProjects = allProjects.filter(p => finalStatusIds.includes(p.status_id));

      setData({
        projects: [...activeProjects, ...completedProjects], // Ativos primeiro, finalizados depois
        tasks: tasks || [],
        users: users || [],
        areas: areas || [],
        budgets: budgets || [],
        projectTypes: projectTypes || [],
        projectStatusList: projectStatusList || []
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const organizeProjectsByArea = () => {
    const organized = {};
    
    data.areas.forEach(area => {
      organized[area.id] = {
        area,
        projects: []
      };
    });

    // Projetos sem área definida
    organized['no_area'] = {
      area: { id: 'no_area', name: 'Sem Área Definida', responsible_email: '' },
      projects: []
    };

    data.projects.forEach(project => {
      const areaId = project.area_id || 'no_area';
      if (organized[areaId]) {
        organized[areaId].projects.push(project);
      }
    });

    setProjectsByArea(organized);
  };

  const calculateProjectHealth = (project) => {
    const projectTasks = data.tasks.filter(t => t.project_id === project.id);
    const today = new Date();
    const projectStatus = data.projectStatusList.find(s => s.id === project.status_id);
    const isProjectFinal = projectStatus ? projectStatus.is_final : false;
    
    // Se o projeto está finalizado, não há problemas de saúde
    if (isProjectFinal) {
      return {
        score: 100,
        level: 'good',
        issues: [],
        color: HEALTH_COLORS.good
      };
    }
    
    let healthScore = 100;
    let issues = [];

    // 1. Análise de Prazo (apenas para projetos ativos)
    if (project.deadline) {
      const deadline = new Date(project.deadline);
      const daysUntilDeadline = differenceInDays(deadline, today);
      
      if (daysUntilDeadline < 0) {
        healthScore -= 40;
        issues.push(`Projeto atrasado em ${Math.abs(daysUntilDeadline)} dias`);
      } else if (daysUntilDeadline <= 7 && (project.progress || 0) < 80) {
        healthScore -= 25;
        issues.push(`Prazo próximo e progresso baixo (${project.progress || 0}%)`);
      }
    }

    // 2. Análise de Progresso vs Tempo Decorrido (apenas para projetos ativos)
    if (project.start_date && project.deadline) {
      const startDate = new Date(project.start_date);
      const deadline = new Date(project.deadline);
      const totalDays = differenceInDays(deadline, startDate);
      const daysElapsed = differenceInDays(today, startDate);
      const expectedProgress = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;
      const actualProgress = project.progress || 0;
      
      if (actualProgress < expectedProgress - 20) {
        healthScore -= 20;
        issues.push(`Progresso abaixo do esperado (${actualProgress.toFixed(0)}% vs ${expectedProgress.toFixed(0)}%)`);
      }
    }

    // 3. Análise de Tarefas (apenas para projetos ativos)
    const blockedTasks = projectTasks.filter(t => t.status === 'bloqueada');
    const overdueTasks = projectTasks.filter(t => {
      if (!t.deadline || t.status === 'concluída') return false;
      return new Date(t.deadline) < today;
    });

    if (blockedTasks.length > 0) {
      healthScore -= 15;
      issues.push(`${blockedTasks.length} tarefa(s) bloqueada(s)`);
    }

    if (overdueTasks.length > 0) {
      healthScore -= 15;
      issues.push(`${overdueTasks.length} tarefa(s) atrasada(s)`);
    }

    // 4. Análise de Orçamento
    const projectBudgets = data.budgets.filter(b => b.project_id === project.id);
    const totalBudgeted = projectBudgets.reduce((sum, b) => sum + (b.total_value || 0), 0); // Corrected syntax: (sum, b) =>
    const estimatedCost = project.total_estimated_cost || 0;
    
    if (totalBudgeted > 0 && estimatedCost > totalBudgeted * 1.2) { // Added check for totalBudgeted > 0 to prevent division by zero
      healthScore -= 10;
      issues.push(`Custo estimado excede orçamento em ${(((estimatedCost - totalBudgeted) / totalBudgeted) * 100).toFixed(0)}%`);
    } else if (totalBudgeted === 0 && estimatedCost > 0) {
      healthScore -= 5;
      issues.push(`Projeto com custo estimado (${estimatedCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}) mas sem orçamento definido.`);
    }


    // Determinar cor da saúde
    let healthLevel = 'good';
    if (healthScore < 50) {
      healthLevel = 'critical';
    } else if (healthScore < 75) {
      healthLevel = 'warning';
    }

    return {
      score: Math.max(0, healthScore),
      level: healthLevel,
      issues,
      color: HEALTH_COLORS[healthLevel]
    };
  };

  const getProjectTypeName = (typeId) => {
    if (!typeId) return 'N/A';
    const type = data.projectTypes.find(t => t.id === typeId);
    return type ? type.name : 'Tipo não encontrado';
  };

  const getProjectStatusName = (statusId) => {
    if (!statusId) return 'N/A';
    const status = data.projectStatusList.find(s => s.id === statusId);
    return status ? status.name : 'Status não encontrado';
  };

  const getProjectStatusColor = (statusId) => {
    if (!statusId) return '#6b7280'; // Default gray
    const status = data.projectStatusList.find(s => s.id === statusId);
    return status ? status.color : '#6b7280';
  };

  const generateAIAnalysis = async (project) => {
    const projectId = project.id;
    
    if (loadingAnalysis[projectId]) return;
    
    setLoadingAnalysis(prev => ({ ...prev, [projectId]: true }));
    
    try {
      const projectTasks = data.tasks.filter(t => t.project_id === projectId);
      const health = calculateProjectHealth(project);
      const area = data.areas.find(a => a.id === project.area_id);
      const statusName = getProjectStatusName(project.status_id);
      
      const prompt = `
        Você é um consultor sênior em gestão de projetos. Analise o projeto abaixo e forneça um resumo executivo conciso (máximo 3 frases).

        PROJETO: ${project.title}
        STATUS: ${statusName}
        PROGRESSO: ${project.progress || 0}%
        ÁREA: ${area?.name || 'Não definida'}
        PRAZO: ${project.deadline ? format(new Date(project.deadline), 'dd/MM/yyyy') : 'Não definido'}
        SAÚDE CALCULADA: ${health.score}/100 (${health.level})
        TOTAL DE TAREFAS: ${projectTasks.length}
        TAREFAS CONCLUÍDAS: ${projectTasks.filter(t => t.status === 'concluída').length}
        PRINCIPAIS PROBLEMAS: ${health.issues.join('; ')}
        
        Foque em:
        1. Status atual e principais riscos
        2. Recomendação de ação imediata
        3. Impacto no negócio se não for resolvido
        
        Seja direto e acionável para um executivo.
      `;

      const analysis = await InvokeLLM({ prompt });
      
      setAiAnalysis(prev => ({
        ...prev,
        [projectId]: analysis
      }));
      
    } catch (error) {
      console.error('Erro ao gerar análise de IA:', error);
      setAiAnalysis(prev => ({
        ...prev,
        [projectId]: 'Erro ao gerar análise. Tente novamente.'
      }));
    } finally {
      setLoadingAnalysis(prev => ({ ...prev, [projectId]: false }));
    }
  };

  const handleDrillDown = (project) => {
    setSelectedProject(project);
    setDrillDownOpen(true);
  };

  const getAreaStats = () => {
    // Only consider active projects for health statistics in the charts
    const activeProjects = data.projects.filter(p => {
      const status = data.projectStatusList.find(s => s.id === p.status_id);
      return !status?.is_final;
    });

    const organizedActiveProjects = {};
    data.areas.forEach(area => {
        organizedActiveProjects[area.id] = {
            area,
            projects: []
        };
    });
    organizedActiveProjects['no_area'] = {
        area: { id: 'no_area', name: 'Sem Área Definida', responsible_email: '' },
        projects: []
    };

    activeProjects.forEach(project => {
        const areaId = project.area_id || 'no_area';
        if (organizedActiveProjects[areaId]) {
            organizedActiveProjects[areaId].projects.push(project);
        }
    });

    return Object.values(organizedActiveProjects).map(({ area, projects }) => ({
      name: area.name,
      total: projects.length,
      critical: projects.filter(p => calculateProjectHealth(p).level === 'critical').length,
      warning: projects.filter(p => calculateProjectHealth(p).level === 'warning').length,
      good: projects.filter(p => calculateProjectHealth(p).level === 'good').length
    })).filter(stat => stat.total > 0);
  };

  const renderProjectCard = (project) => {
    const health = calculateProjectHealth(project);
    const projectTasks = data.tasks.filter(t => t.project_id === project.id);
    const analysis = aiAnalysis[project.id];
    const isLoadingAnalysis = loadingAnalysis[project.id];
    const typeName = getProjectTypeName(project.type_id);
    const statusName = getProjectStatusName(project.status_id);
    const statusColor = getProjectStatusColor(project.status_id);
    const projectStatus = data.projectStatusList.find(s => s.id === project.status_id);
    const isProjectFinal = projectStatus ? projectStatus.is_final : false;


    return (
      <motion.div
        key={project.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        <Card 
          className="h-full border-l-4 hover:shadow-lg transition-all cursor-pointer"
          style={{ borderLeftColor: health.color }}
        >
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg font-bold text-gray-800 mb-1">
                  {project.title}
                </CardTitle>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Badge 
                    variant="outline" 
                    className="capitalize"
                    style={{ 
                      borderColor: health.color, 
                      color: health.color,
                      backgroundColor: `${health.color}15`
                    }}
                  >
                    {health.level === 'critical' && '🔴 Crítico'}
                    {health.level === 'warning' && '🟡 Atenção'}
                    {health.level === 'good' && '🟢 Saudável'}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    style={{ 
                      borderColor: statusColor, 
                      color: statusColor,
                      backgroundColor: `${statusColor}15`
                    }}
                  >
                    {statusName}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {typeName}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDrillDown(project)}
                className="text-gray-500 hover:text-gray-700"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Progresso */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-500">Progresso</span>
                <span className="text-sm font-bold">{project.progress || 0}%</span>
              </div>
              <Progress value={project.progress || 0} className="h-2" />
            </div>

            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Prazo</div>
                  <div className="font-medium">
                    {project.deadline ? format(new Date(project.deadline), 'dd/MM') : 'N/D'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="text-xs text-gray-500">Tarefas</div>
                  <div className="font-medium">
                    {projectTasks.filter(t => t.status === 'concluída').length}/{projectTasks.length}
                  </div>
                </div>
              </div>
            </div>

            {/* Análise de IA */}
            <div className="border-t pt-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                  <Brain className="h-3 w-3" />
                  Análise Executiva
                </span>
                {!isProjectFinal && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => generateAIAnalysis(project)}
                    disabled={isLoadingAnalysis}
                    className="h-6 px-2"
                  >
                    {isLoadingAnalysis ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
              
              <div className="text-xs text-gray-600 italic">
                {isLoadingAnalysis ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Analisando...
                  </div>
                ) : analysis ? (
                  `"${analysis}"`
                ) : (
                  !isProjectFinal && (
                    <button 
                      onClick={() => generateAIAnalysis(project)}
                      className="text-blue-600 hover:underline"
                    >
                      Clique para gerar análise
                    </button>
                  )
                )}
                {isProjectFinal && "Projeto finalizado. Análise não aplicável."}
              </div>
            </div>

            {/* Alertas principais */}
            {health.issues.length > 0 && (
              <div className="border-t pt-3">
                <div className="text-xs font-medium text-gray-500 mb-1">Principais Alertas:</div>
                <div className="space-y-1">
                  {health.issues.slice(0, 2).map((issue, idx) => (
                    <div key={idx} className="text-xs text-red-600 flex items-start gap-1">
                      <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))}
                  {health.issues.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{health.issues.length - 2} outros problemas
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderDrillDownModal = () => {
    if (!selectedProject) return null;

    const health = calculateProjectHealth(selectedProject);
    const projectStatus = data.projectStatusList.find(s => s.id === selectedProject.status_id);
    const isProjectFinal = projectStatus ? projectStatus.is_final : false;
    
    const projectTasks = data.tasks.filter(t => t.project_id === selectedProject.id);
    const overdueTasks = projectTasks.filter(t => {
      if (!t.deadline || t.status === 'concluída' || isProjectFinal) return false;
      return new Date(t.deadline) < new Date();
    });
    const projectBudgets = data.budgets.filter(b => b.project_id === selectedProject.id);
    const area = data.areas.find(a => a.id === selectedProject.area_id);
    const responsible = data.users.find(u => u.email === selectedProject.responsible);

    return (
      <Dialog open={drillDownOpen} onOpenChange={setDrillDownOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: health.color }}
              />
              {selectedProject.title}
            </DialogTitle>
            <DialogDescription>
              Análise detalhada do projeto e pontos de atenção
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Resumo Executivo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo Executivo</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold" style={{ color: health.color }}>
                    {health.score}
                  </div>
                  <div className="text-sm text-gray-500">Saúde Geral</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {selectedProject.progress || 0}%
                  </div>
                  <div className="text-sm text-gray-500">Progresso</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {projectTasks.filter(t => t.status === 'concluída').length}
                  </div>
                  <div className="text-sm text-gray-500">Tarefas Concluídas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {overdueTasks.length}
                  </div>
                  <div className="text-sm text-gray-500">Tarefas Atrasadas</div>
                </div>
              </CardContent>
            </Card>

            {/* Informações do Projeto */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações Gerais</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Área:</span> {area?.name || 'Não definida'}
                  </div>
                  <div>
                    <span className="font-medium">Responsável:</span> {responsible?.full_name || selectedProject.responsible}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> 
                    <Badge 
                      variant="outline" 
                      style={{ 
                        borderColor: getProjectStatusColor(selectedProject.status_id), 
                        color: getProjectStatusColor(selectedProject.status_id),
                        backgroundColor: `${getProjectStatusColor(selectedProject.status_id)}15`
                      }} 
                      className="ml-2 capitalize"
                    >
                      {getProjectStatusName(selectedProject.status_id)}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Tipo:</span> 
                    <Badge variant="secondary" className="ml-2 capitalize">
                      {getProjectTypeName(selectedProject.type_id)}
                    </Badge>
                  </div>
                  <div>
                    <span className="font-medium">Prazo:</span> {' '}
                    {selectedProject.deadline ? format(new Date(selectedProject.deadline), 'dd/MM/yyyy') : 'Não definido'}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Análise Financeira</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <span className="font-medium">Orçamento:</span> R$ {projectBudgets.reduce((sum, b) => sum + (b.total_value || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div>
                    <span className="font-medium">Custo Estimado:</span> R$ {(selectedProject.total_estimated_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div>
                    <span className="font-medium">Infraestrutura/mês:</span> R$ {(selectedProject.infrastructure_cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="pt-2">
                    <Progress 
                      value={projectBudgets.reduce((sum, b) => sum + (b.total_value || 0), 0) > 0 ? ((selectedProject.total_estimated_cost || 0) / projectBudgets.reduce((sum, b) => sum + (b.total_value || 0), 0)) * 100 : 0} 
                      className="h-2" 
                    />
                    <div className="text-xs text-gray-500 mt-1">
                      Uso do orçamento aprovado
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas Detalhados */}
            {health.issues.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg text-red-600">Pontos de Atenção</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {health.issues.map((issue, idx) => (
                      <Alert key={idx} variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{issue}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tarefas Atrasadas */}
            {overdueTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tarefas Atrasadas ({overdueTasks.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {overdueTasks.slice(0, 5).map(task => (
                      <div key={task.id} className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-gray-500">
                            Venceu em: {format(new Date(task.deadline), 'dd/MM/yyyy')}
                          </div>
                        </div>
                        <Badge variant="destructive">
                          {Math.abs(differenceInDays(new Date(), new Date(task.deadline)))} dias
                        </Badge>
                      </div>
                    ))}
                    {overdueTasks.length > 5 && (
                      <div className="text-sm text-gray-500 text-center">
                        +{overdueTasks.length - 5} outras tarefas atrasadas
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const areaStats = getAreaStats();

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Visão Executiva</h1>
          <p className="text-gray-500 mt-1">
            Monitoramento em tempo real da saúde dos projetos
          </p>
        </div>
        
        {/* Legenda de Cores */}
        <Card className="w-full md:w-auto">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEALTH_COLORS.good }} />
                <span>🟢 Saudável</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEALTH_COLORS.warning }} />
                <span>🟡 Atenção</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: HEALTH_COLORS.critical }} />
                <span>🔴 Crítico</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Projetos por Área */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Projetos por Área (Ativos)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={areaStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="total"
                >
                  {areaStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS_CHART[index % COLORS_CHART.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status de Saúde por Área (Ativos)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={areaStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="critical" name="Crítico" fill={HEALTH_COLORS.critical} />
                <Bar dataKey="warning" name="Atenção" fill={HEALTH_COLORS.warning} />
                <Bar dataKey="good" name="Saudável" fill={HEALTH_COLORS.good} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Projetos por Área */}
      <div className="space-y-8">
        {Object.values(projectsByArea).map(({ area, projects }) => {
          if (projects.length === 0) return null;

          const activeProjects = projects.filter(p => {
            const status = data.projectStatusList.find(s => s.id === p.status_id);
            return !status?.is_final;
          });

          const finalProjects = projects.filter(p => {
            const status = data.projectStatusList.find(s => s.id === p.status_id);
            return status?.is_final;
          });

          // Only render the section if there are active projects or final projects
          if (activeProjects.length === 0 && finalProjects.length === 0) return null;

          const areaResponsible = data.users.find(u => u.email === area.responsible_email);

          return (
            <div key={area.id} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{area.name}</h2>
                  <p className="text-gray-500">
                    {projects.length} projeto(s) • Responsável: {areaResponsible?.full_name || area.responsible_email}
                  </p>
                </div>
                {activeProjects.length > 0 && (
                  <div className="flex gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {activeProjects.filter(p => calculateProjectHealth(p).level === 'good').length} Saudáveis
                    </Badge>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
                      {activeProjects.filter(p => calculateProjectHealth(p).level === 'warning').length} Atenção
                    </Badge>
                    <Badge variant="outline" className="bg-red-50 text-red-700">
                      {activeProjects.filter(p => calculateProjectHealth(p).level === 'critical').length} Críticos
                    </Badge>
                  </div>
                )}
              </div>
              
              {activeProjects.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-700">Projetos Ativos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeProjects.map(renderProjectCard)}
                  </div>
                </div>
              )}

              {finalProjects.length > 0 && (
                <div className="space-y-4 pt-6">
                  <h3 className="text-xl font-semibold text-gray-700">Projetos Finalizados/Cancelados</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
                    {finalProjects.map(renderProjectCard)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {renderDrillDownModal()}
    </div>
  );
}

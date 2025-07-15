
import React, { useState, useEffect } from "react";
import { User, Project, Task, Role, Meeting, DailyNote } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, subDays, isValid, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
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
  Area
} from "recharts";
import FormattedInsight from "@/components/analytics/FormattedInsight"; 
import { 
  Briefcase, 
  ListChecks, 
  DollarSign, 
  Clock, 
  Loader2, 
  User as UserIcon, 
  Lightbulb, 
  TrendingUp, 
  Search,
  Calendar,
  CheckCircle2,
  PlayCircle,
  Pause,
  AlertCircle,
  Target,
  Award,
  Activity,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];
const STATUS_COLORS = {
  'concluída': '#10B981',
  'em_andamento': '#3B82F6', 
  'pendente': '#6B7280',
  'bloqueada': '#EF4444'
};

export default function SelfView() {
  const [loading, setLoading] = useState(true);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [allProjects, setAllProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [timeFilter, setTimeFilter] = useState("all");
  
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true);
        const [usersData, projectsData, tasksData, rolesData, loggedInUser] = await Promise.all([
          User.list(),
          Project.list(),
          Task.list(),
          Role.list(),
          User.me()
        ]);
        
        setUsers(usersData);
        setAllProjects(projectsData);
        setAllTasks(tasksData);
        setRoles(rolesData);
        setCurrentUser(loggedInUser);
        
        if (loggedInUser?.email) {
          setSelectedUserEmail(loggedInUser.email);
        } else if (usersData.length > 0) {
          setSelectedUserEmail(usersData[0].email);
        }
      } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
      } finally {
        setLoading(false);
      }
    };
    initialLoad();
  }, []);

  useEffect(() => {
    if (selectedUserEmail) {
      loadUserData(selectedUserEmail);
    }
  }, [selectedUserEmail, allProjects, allTasks, roles, timeFilter]);

  const getTimeFilteredTasks = (tasks) => {
    const now = new Date();
    
    switch (timeFilter) {
      case "week":
        const weekStart = startOfWeek(now);
        const weekEnd = endOfWeek(now);
        return tasks.filter(task => {
          const taskDate = task.completion_date ? parseISO(task.completion_date) : parseISO(task.created_date);
          return isWithinInterval(taskDate, { start: weekStart, end: weekEnd });
        });
      case "month":
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);
        return tasks.filter(task => {
          const taskDate = task.completion_date ? parseISO(task.completion_date) : parseISO(task.created_date);
          return isWithinInterval(taskDate, { start: monthStart, end: monthEnd });
        });
      default:
        return tasks;
    }
  };

  const loadUserData = async (email) => {
    setLoadingUserData(true);
    
    const userDetails = users.find(u => u.email === email);
    
    const userProjects = allProjects.filter(p => 
      p.responsible === email || (p.participants && p.participants.includes(email))
    );
    
    const userTasks = allTasks.filter(t => t.assigned_to === email);
    const filteredTasks = getTimeFilteredTasks(userTasks);
    
    // Categorizar tarefas por status
    const tasksByStatus = {
      concluída: filteredTasks.filter(t => t.status === 'concluída'),
      em_andamento: filteredTasks.filter(t => t.status === 'em_andamento'),
      pendente: filteredTasks.filter(t => t.status === 'pendente'),
      bloqueada: filteredTasks.filter(t => t.status === 'bloqueada'),
      futuras: filteredTasks.filter(t => {
        if (!t.start_date) return false;
        return parseISO(t.start_date) > new Date();
      })
    };

    // Calcular dados de custo mais detalhados
    const enrichedTasks = userTasks.map(task => {
      const role = roles.find(r => r.id === task.role_id);
      const seniority = role?.seniority_levels?.find(s => s.level === task.seniority_level);
      const hourlyRate = seniority?.hourly_rate || task.hourly_rate || 0;
      const taskCost = (task.estimated_hours || 0) * hourlyRate;
      return { 
        ...task, 
        hourly_rate: hourlyRate, 
        calculated_cost: taskCost,
        role_title: role?.title || 'Não especificado'
      };
    });
    
    // Análise detalhada por projeto
    const projectAnalysis = userProjects.map(project => {
      const projectTasks = allTasks.filter(t => t.project_id === project.id);
      const userProjectTasks = projectTasks.filter(t => t.assigned_to === email);
      const otherProjectTasks = projectTasks.filter(t => t.assigned_to !== email);
      
      const userCompletedTasks = userProjectTasks.filter(t => t.status === 'concluída').length;
      const totalUserTasks = userProjectTasks.length;
      const userContributionPercent = totalUserTasks > 0 ? (userCompletedTasks / totalUserTasks) * 100 : 0;
      
      const otherCompletedTasks = otherProjectTasks.filter(t => t.status === 'concluída').length;
      const totalOtherTasks = otherProjectTasks.length;
      const otherContributionPercent = totalOtherTasks > 0 ? (otherCompletedTasks / totalOtherTasks) * 100 : 0;
      
      const userHours = userProjectTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);
      const userCost = userProjectTasks.reduce((sum, t) => {
        const role = roles.find(r => r.id === t.role_id);
        const seniority = role?.seniority_levels?.find(s => s.level === t.seniority_level);
        const hourlyRate = seniority?.hourly_rate || t.hourly_rate || 0;
        return sum + ((t.estimated_hours || 0) * hourlyRate);
      }, 0);

      const userRoles = [...new Set(userProjectTasks.map(t => {
        const role = roles.find(r => r.id === t.role_id);
        return role?.title || 'Não especificado';
      }))];

      return {
        ...project,
        userTasks: userProjectTasks,
        otherTasks: otherProjectTasks,
        userContributionPercent,
        otherContributionPercent,
        userHours,
        userCost,
        userRoles,
        totalProjectTasks: projectTasks.length,
        totalProjectProgress: project.progress || 0
      };
    });

    // Dados para gráficos melhorados
    
    // 1. Gráfico de atividade semanal (últimas 8 semanas)
    const weeklyActivity = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subDays(new Date(), i * 7));
      const weekEnd = endOfWeek(subDays(new Date(), i * 7));
      const weekTasks = tasksByStatus.concluída.filter(task => {
        if (!task.completion_date) return false;
        const completionDate = parseISO(task.completion_date);
        return isWithinInterval(completionDate, { start: weekStart, end: weekEnd });
      });
      
      weeklyActivity.push({
        week: format(weekStart, 'dd/MM'),
        tarefas: weekTasks.length,
        horas: weekTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0)
      });
    }

    // 2. Distribuição de tempo por função
    const roleDistribution = enrichedTasks.reduce((acc, task) => {
      const role = task.role_title;
      if (!acc[role]) {
        acc[role] = { horas: 0, tarefas: 0, custo: 0 };
      }
      acc[role].horas += task.estimated_hours || 0;
      acc[role].tarefas += 1;
      acc[role].custo += task.calculated_cost || 0;
      return acc;
    }, {});

    const roleChartData = Object.entries(roleDistribution).map(([role, data]) => ({
      name: role,
      horas: data.horas,
      tarefas: data.tarefas,
      custo: data.custo
    }));

    // 3. Status das tarefas para gráfico radial
    const statusData = Object.entries(tasksByStatus).map(([status, tasks]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: tasks.length,
      fill: STATUS_COLORS[status] || '#6B7280'
    }));

    // 4. Produtividade por projeto
    const projectProductivity = projectAnalysis.map(project => ({
      name: project.title.length > 15 ? project.title.substring(0, 15) + "..." : project.title,
      userTasks: project.userTasks.length,
      completedTasks: project.userTasks.filter(t => t.status === 'concluída').length,
      progress: project.userContributionPercent,
      cost: project.userCost
    }));

    // 5. Timeline de conclusões mensais (últimos 6 meses)
    const monthlyCompletion = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(new Date(), i * 30));
      const monthEnd = endOfMonth(subDays(new Date(), i * 30));
      const monthTasks = tasksByStatus.concluída.filter(task => {
        if (!task.completion_date) return false;
        const completionDate = parseISO(task.completion_date);
        return isWithinInterval(completionDate, { start: monthStart, end: monthEnd });
      });
      
      monthlyCompletion.push({
        mes: format(monthStart, 'MMM', { locale: ptBR }),
        tarefas: monthTasks.length,
        valor: monthTasks.reduce((sum, t) => sum + (t.calculated_cost || 0), 0)
      });
    }

    const totalCost = enrichedTasks.reduce((sum, t) => sum + t.calculated_cost, 0);
    const totalHours = enrichedTasks.reduce((sum, t) => sum + (t.estimated_hours || 0), 0);

    const data = {
      details: userDetails,
      projects: projectAnalysis,
      tasks: enrichedTasks,
      tasksByStatus,
      stats: {
        activeProjects: userProjects.filter(p => p.status !== 'concluído').length,
        completedTasks: tasksByStatus.concluída.length,
        inProgressTasks: tasksByStatus.em_andamento.length,
        pendingTasks: tasksByStatus.pendente.length,
        blockedTasks: tasksByStatus.bloqueada.length,
        futureTasks: tasksByStatus.futuras.length,
        totalTasks: userTasks.length,
        totalHours,
        totalCost,
        avgHoursPerTask: userTasks.length > 0 ? totalHours / userTasks.length : 0,
        completionRate: userTasks.length > 0 ? (tasksByStatus.concluída.length / userTasks.length) * 100 : 0
      },
      charts: {
        weeklyActivity,
        roleDistribution: roleChartData,
        statusDistribution: statusData,
        projectProductivity,
        monthlyCompletion
      },
      aiInsight: ""
    };
    
    setUserData(data);

    // Generate Enhanced AI Insight
    const insightPrompt = `
      Analise detalhadamente o desempenho do colaborador ${userDetails?.full_name || email}.
      
      DADOS DETALHADOS:
      - Projetos Ativos: ${data.stats.activeProjects}
      - Taxa de Conclusão: ${data.stats.completionRate.toFixed(1)}%
      - Tarefas: ${data.stats.totalTasks} total (${data.stats.completedTasks} concluídas, ${data.stats.inProgressTasks} em andamento, ${data.stats.pendingTasks} pendentes, ${data.stats.blockedTasks} bloqueadas)
      - Tarefas Futuras Planejadas: ${data.stats.futureTasks}
      - Total de Horas: ${data.stats.totalHours.toFixed(1)}h (média ${data.stats.avgHoursPerTask.toFixed(1)}h por tarefa)
      - Valor Gerado: R$ ${data.stats.totalCost.toFixed(2)}
      
      PARTICIPAÇÃO EM PROJETOS:
      ${projectAnalysis.map(p => `
      • ${p.title}: ${p.userTasks.length} tarefas (${p.userTasks.filter(t => t.status === 'concluída').length} concluídas)
        - Contribuição: ${p.userContributionPercent.toFixed(1)}% das suas tarefas
        - Funções: ${p.userRoles.join(', ')}
        - Horas alocadas: ${p.userHours}h
        - Valor gerado: R$ ${p.userCost.toFixed(2)}
      `).join('')}
      
      DISTRIBUIÇÃO POR FUNÇÃO:
      ${roleChartData.map(r => `
      • ${r.name}: ${r.tarefas} tarefas, ${r.horas}h, R$ ${r.custo.toFixed(2)}
      `).join('')}
      
      Forneça uma análise executiva profissional em MARKDOWN. Use títulos com '###' e listas com '*'.
      
      ### Resumo Executivo
      Um parágrafo sobre o desempenho geral, destacando pontos mais relevantes.
      
      ### Análise de Produtividade
      * Eficiência na conclusão de tarefas
      * Qualidade da alocação de tempo
      * Consistência no delivery
      
      ### Contribuição por Projeto
      * Projetos onde tem maior impacto
      * Áreas de especialização identificadas
      * Versatilidade entre diferentes tipos de projeto
      
      ### Pontos Fortes Identificados
      * Liste 3-4 pontos fortes específicos baseados nos dados.
      
      ### Oportunidades de Desenvolvimento
      * Liste 2-3 áreas de melhoria ou desenvolvimento com base nos padrões observados.
      
      ### Recomendações Estratégicas
      * Sugestões para otimizar a alocação e maximizar o valor entregue.
    `;
    
    try {
      const insightResult = await InvokeLLM({ prompt: insightPrompt });
      setUserData(prev => ({ ...prev, aiInsight: insightResult }));
    } catch (aiError) {
      console.error("Erro ao gerar insight de IA:", aiError);
      setUserData(prev => ({ ...prev, aiInsight: "Não foi possível gerar a análise de IA no momento." }));
    }
    
    setLoadingUserData(false);
  };

  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.split(" ");
    if (parts.length > 1) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Visão do Colaborador</h1>
          <p className="text-gray-500">Análise detalhada de desempenho, contribuição e valor gerado.</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mês</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedUserEmail} onValueChange={setSelectedUserEmail}>
            <SelectTrigger className="w-72">
              <SelectValue placeholder="Selecione um usuário" />
            </SelectTrigger>
            <SelectContent>
              {users.map(user => (
                <SelectItem key={user.id} value={user.email}>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={user.profile_picture} />
                      <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                    </Avatar>
                    <span>{user.full_name || user.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loadingUserData ? (
        <div className="flex justify-center items-center py-20"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : !userData ? (
        <Card className="text-center py-20">
          <CardContent>
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Selecione um usuário para visualizar a análise.</p>
          </CardContent>
        </Card>
      ) : (
        <div>
          {/* Header do Usuário Aprimorado */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white shadow-lg">
                  <AvatarImage src={userData.details?.profile_picture} />
                  <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                    {getInitials(userData.details?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 -right-2 bg-green-500 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-gray-900">{userData.details?.full_name}</h2>
                <p className="text-gray-600 text-lg">{userData.details?.email}</p>
                <div className="flex items-center gap-4 mt-2">
                  <Badge variant="outline" className="bg-white">
                    <Target className="w-3 h-3 mr-1" />
                    Taxa de conclusão: {userData.stats.completionRate.toFixed(1)}%
                  </Badge>
                  <Badge variant="outline" className="bg-white">
                    <Award className="w-3 h-3 mr-1" />
                    {userData.stats.avgHoursPerTask.toFixed(1)}h por tarefa
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">
                  {userData.stats.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </div>
                <p className="text-gray-500">Valor Total Gerado</p>
              </div>
            </div>
          </div>

          {/* KPIs Detalhados */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                  <Briefcase className="h-4 w-4" /> Projetos Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-900">{userData.stats.activeProjects}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Concluídas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-900">{userData.stats.completedTasks}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
                  <PlayCircle className="h-4 w-4" /> Em Andamento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-900">{userData.stats.inProgressTasks}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <Pause className="h-4 w-4" /> Pendentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{userData.stats.pendingTasks}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-purple-700 flex items-center gap-2">
                  <Calendar className="h-4 w-4" /> Futuras
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-900">{userData.stats.futureTasks}</div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-red-700 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" /> Bloqueadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-900">{userData.stats.blockedTasks}</div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview">
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="projects">Projetos Detalhados</TabsTrigger>
              <TabsTrigger value="tasks">Análise de Tarefas</TabsTrigger>
              <TabsTrigger value="performance">Performance & Valor</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-amber-500" /> Análise Inteligente de Desempenho
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.aiInsight ? (
                      <FormattedInsight insightText={userData.aiInsight} />
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500"><Loader2 className="h-4 w-4 animate-spin"/> Gerando análise...</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="h-5 w-5" /> Status das Tarefas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={userData.charts.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {userData.charts.statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} stroke={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend iconType="circle" />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" /> Atividade Semanal
                    </CardTitle>
                    <CardDescription>Tarefas concluídas nas últimas 8 semanas</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={userData.charts.weeklyActivity}>
                        <defs>
                          <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="week" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="tarefas" stroke="#3B82F6" fillOpacity={1} fill="url(#colorTasks)" name="Tarefas" />
                        <Area type="monotone" dataKey="horas" stroke="#10B981" fillOpacity={0.6} fill="#10B981" name="Horas" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" /> Distribuição por Função
                    </CardTitle>
                    <CardDescription>Horas trabalhadas por tipo de função</CardDescription>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userData.charts.roleDistribution} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={100} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="horas" fill="#8884d8" name="Horas" />
                        <Bar dataKey="tarefas" fill="#82ca9d" name="Tarefas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" /> Evolução Mensal
                  </CardTitle>
                  <CardDescription>Tarefas concluídas e valor gerado nos últimos 6 meses</CardDescription>
                </CardHeader>
                <CardContent className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={userData.charts.monthlyCompletion}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mes" />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip 
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-white p-3 border rounded shadow-lg">
                                <p className="font-medium">{label}</p>
                                <p style={{ color: payload[0]?.color }}>
                                  Tarefas: {payload[0]?.value}
                                </p>
                                <p style={{ color: payload[1]?.color }}>
                                  Valor: {payload[1]?.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="tarefas" stroke="#8884d8" strokeWidth={3} name="Tarefas Concluídas" />
                      <Line yAxisId="right" type="monotone" dataKey="valor" stroke="#82ca9d" strokeWidth={3} name="Valor Gerado (R$)" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projects">
              <div className="space-y-6">
                {userData.projects.map(project => (
                  <Card key={project.id} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="bg-gray-50 border-b">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)} className="hover:underline">
                            <CardTitle className="text-xl text-blue-900">{project.title}</CardTitle>
                          </Link>
                          <CardDescription className="mt-2">{project.description}</CardDescription>
                        </div>
                        <div className="text-right">
                          <Badge variant={project.responsible === selectedUserEmail ? "default" : "secondary"}>
                            {project.responsible === selectedUserEmail ? "Responsável" : "Participante"}
                          </Badge>
                          <p className="text-sm text-gray-500 mt-1">
                            Prazo: {format(parseISO(project.deadline), 'dd/MM/yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Contribuição do Usuário */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-700">Sua Contribuição</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Tarefas suas:</span>
                              <span className="font-medium">{project.userTasks.length}</span>
                            </div>
                            <Progress value={project.userContributionPercent} className="h-2 bg-blue-100 [&>div]:bg-blue-500" />
                            <span className="text-xs text-gray-500">
                              {project.userContributionPercent.toFixed(1)}% concluídas
                            </span>
                          </div>
                        </div>

                        {/* Progresso Geral */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-700">Progresso Geral</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Total de tarefas:</span>
                              <span className="font-medium">{project.totalProjectTasks}</span>
                            </div>
                            <Progress value={project.totalProjectProgress} className="h-2" />
                            <span className="text-xs text-gray-500">
                              {project.totalProjectProgress}% do projeto
                            </span>
                          </div>
                        </div>

                        {/* Valor e Horas */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-700">Seu Investimento</h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Horas:</span>
                              <span className="font-medium">{project.userHours}h</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Valor:</span>
                              <span className="font-medium text-green-600">
                                {project.userCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Funções */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-700">Suas Funções</h4>
                          <div className="flex flex-wrap gap-1">
                            {project.userRoles.map((role, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="tasks">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <Card className="shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle>Produtividade por Projeto</CardTitle>
                    <CardDescription>Tarefas concluídas (verde) vs. total (roxo)</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userData.charts.projectProductivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />
                        <Bar dataKey="userTasks" stackId="a" fill="#8884d8" name="Total de Tarefas" />
                        <Bar dataKey="completedTasks" stackId="a" fill="#82ca9d" name="Concluídas" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Eficiência por Projeto</CardTitle>
                    <CardDescription>Taxa de conclusão e valor gerado</CardDescription>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={userData.charts.projectProductivity} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis dataKey="name" type="category" width={120} />
                        <Tooltip 
                          content={({ active, payload, label }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-white p-3 border rounded shadow-lg">
                                  <p className="font-medium">{label}</p>
                                  <p style={{ color: payload[0]?.color }}>
                                    Taxa: {payload[0]?.value?.toFixed(1)}%
                                  </p>
                                  <p style={{ color: payload[1]?.color }}>
                                    Valor: {payload[1]?.value?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="progress" fill="#3B82F6" name="Taxa de Conclusão (%)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle>Tabela Detalhada de Tarefas</CardTitle>
                  <CardDescription>Todas as suas tarefas com status e valor</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarefa</TableHead>
                        <TableHead>Projeto</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Função</TableHead>
                        <TableHead>Horas</TableHead>
                        <TableHead>Valor/h</TableHead>
                        <TableHead className="text-right">Custo Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {userData.tasks.map(task => (
                        <TableRow key={task.id} className="hover:bg-gray-50">
                          <TableCell className="font-medium">{task.title}</TableCell>
                          <TableCell>{allProjects.find(p => p.id === task.project_id)?.title || 'N/A'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" style={{ borderColor: STATUS_COLORS[task.status], color: STATUS_COLORS[task.status] }}>
                              {task.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{task.role_title}</TableCell>
                          <TableCell>{task.estimated_hours || 0}h</TableCell>
                          <TableCell>{task.hourly_rate.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {task.calculated_cost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="bg-gradient-to-br from-green-50 to-green-100">
                  <CardHeader>
                    <CardTitle className="text-green-800">Taxa de Conclusão</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-green-900 mb-2">
                      {userData.stats.completionRate.toFixed(1)}%
                    </div>
                    <Progress value={userData.stats.completionRate} className="h-3" />
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                  <CardHeader>
                    <CardTitle className="text-blue-800">Média de Horas por Tarefa</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-blue-900 mb-2">
                      {userData.stats.avgHoursPerTask.toFixed(1)}h
                    </div>
                    <p className="text-sm text-blue-700">
                      Total: {userData.stats.totalHours}h em {userData.stats.totalTasks} tarefas
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                  <CardHeader>
                    <CardTitle className="text-purple-800">Valor Médio por Hora</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-4xl font-bold text-purple-900 mb-2">
                      {userData.stats.totalHours > 0 ? 
                        (userData.stats.totalCost / userData.stats.totalHours).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 
                        'R$ 0'
                      }
                    </div>
                    <p className="text-sm text-purple-700">
                      Baseado no valor total gerado
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Análise Financeira Detalhada</CardTitle>
                  <CardDescription>Breakdown completo de custos por função e projeto</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-4">Por Função</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Função</TableHead>
                            <TableHead>Horas</TableHead>
                            <TableHead>Tarefas</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userData.charts.roleDistribution.map((role, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{role.name}</TableCell>
                              <TableCell>{role.horas}h</TableCell>
                              <TableCell>{role.tarefas}</TableCell>
                              <TableCell className="text-right font-semibold">
                                {role.custo.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-4">Por Projeto</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Projeto</TableHead>
                            <TableHead>Horas</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {userData.projects.map(project => (
                            <TableRow key={project.id}>
                              <TableCell className="font-medium">
                                {project.title.length > 20 ? project.title.substring(0, 20) + "..." : project.title}
                              </TableCell>
                              <TableCell>{project.userHours}h</TableCell>
                              <TableCell className="text-right font-semibold">
                                {project.userCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{userData.stats.totalTasks}</div>
                        <div className="text-sm text-gray-500">Total de Tarefas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{userData.stats.totalHours}h</div>
                        <div className="text-sm text-gray-500">Total de Horas</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {userData.stats.totalCost.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                        </div>
                        <div className="text-sm text-gray-500">Valor Total Gerado</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{userData.stats.activeProjects}</div>
                        <div className="text-sm text-gray-500">Projetos Ativos</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}


import React, { useState, useEffect } from "react";
import { Project } from "@/api/entities";
import { Task } from "@/api/entities";
import { Budget } from "@/api/entities"; 
import { Infrastructure } from "@/api/entities";
import { Meeting } from "@/api/entities";
import { CostInsight } from "@/api/entities";
import { Role } from "@/api/entities";
import { User } from "@/api/entities";
import { AnalysisInsight } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { InvokeLLM } from "@/api/integrations";
import { 
  BarChart2,
  Layers,
  LineChart as LineChartIcon,
  Calendar,
  CreditCard,
  PieChart as PieChartIcon,
  TrendingUp,
  Activity,
  Zap,
  Clock,
  Users,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Download,
  RefreshCw,
  Lightbulb,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  BarChart as BarChartIcon,
  Briefcase,
  DollarSign,
  FileText,
  Filter,
  ListChecks,
  Loader2
} from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  // Removed dailyNotes state as per changes
  const [users, setUsers] = useState([]);
  const [costInsights, setCostInsights] = useState([]);
  const [roles, setRoles] = useState([]);
  
  const [selectedProject, setSelectedProject] = useState("all");
  const [timeRange, setTimeRange] = useState("month");
  const [analysisType, setAnalysisType] = useState("productivity");
  
  const [insightLoading, setInsightLoading] = useState(false);
  const [currentInsight, setCurrentInsight] = useState(null);
  const [insightHistory, setInsightHistory] = useState([]);
  const [showInsightHistory, setShowInsightHistory] = useState(false);
  const [selectedInsightIndex, setSelectedInsightIndex] = useState(0);
  
  const [summaryStats, setSummaryStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    upcomingDeadlines: 0,
    meetingsThisWeek: 0,
    activeUsers: 0,
    projectHealth: {
      good: 0,
      warning: 0,
      risk: 0
    },
    projectProgressAverage: 0 
  });
  
  const [chartData, setChartData] = useState({
    taskCompletionTrend: [],
    projectProgress: [],
    taskDistribution: [],
    userActivity: []
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (projects.length > 0) {
      calculateSummaryStats();
      prepareChartData();
      loadInsightHistory();
    }
  }, [projects, tasks, meetings, selectedProject, timeRange, analysisType]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [
        projectData, 
        taskData, 
        meetingData, 
        userData,
        // Removed dailyData as per changes
        insightData,
        rolesData
      ] = await Promise.all([
        Project.list(),
        Task.list(),
        Meeting.list(),
        User.list(),
        // Removed DailyNote.list() as per changes
        CostInsight.list().catch(() => []),
        Role.list().catch(() => [])
      ]);
      
      setProjects(projectData);
      setTasks(taskData);
      setMeetings(meetingData);
      setUsers(userData);
      // Removed setDailyNotes as per changes
      setCostInsights(insightData);
      setRoles(rolesData);
      
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const calculateSummaryStats = () => {
    const filteredTasks = selectedProject === "all" 
      ? tasks 
      : tasks.filter(task => task.project_id === selectedProject);
    
    const filteredProjects = selectedProject === "all"
      ? projects
      : projects.filter(project => project.id === selectedProject);
    
    const filteredMeetings = selectedProject === "all"
      ? meetings
      : meetings.filter(meeting => meeting.project_id === selectedProject);
    
    const today = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case "week":
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(today.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      default: // "all"
        startDate = new Date(0);
    }
    
    const timeFilteredTasks = filteredTasks.filter(task => {
      const taskDate = task.updated_date ? new Date(task.updated_date) : new Date(task.created_date);
      return taskDate >= startDate;
    });
    
    const timeFilteredMeetings = filteredMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate >= startDate;
    });
    
    const completedTasks = timeFilteredTasks.filter(task => task.status === "concluída").length;
    const completedProjects = filteredProjects.filter(project => project.status === "concluído").length;
    
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingDeadlines = filteredTasks.filter(task => {
      if (!task.deadline) return false;
      const deadlineDate = new Date(task.deadline);
      return deadlineDate >= today && deadlineDate <= nextWeek && task.status !== "concluída";
    }).length;
    
    const nextWeekEnd = new Date();
    nextWeekEnd.setDate(today.getDate() + 7);
    
    const meetingsThisWeek = filteredMeetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate >= today && meetingDate <= nextWeekEnd;
    }).length;
    
    const activeUserEmails = new Set();
    
    timeFilteredTasks.forEach(task => {
      if (task.assigned_to) {
        activeUserEmails.add(task.assigned_to);
      }
    });
    
    timeFilteredMeetings.forEach(meeting => {
      if (meeting.attendees && Array.isArray(meeting.attendees)) {
        meeting.attendees.forEach(attendee => {
          activeUserEmails.add(attendee);
        });
      }
    });
    
    const projectHealth = { good: 0, warning: 0, risk: 0 };
    
    filteredProjects.forEach(project => {
      const projectTasks = tasks.filter(task => task.project_id === project.id);
      
      if (projectTasks.length === 0) {
        projectHealth.warning++;
        return;
      }
      
      const completedTasksCount = projectTasks.filter(task => task.status === "concluída").length;
      const blockedTasksCount = projectTasks.filter(task => task.status === "bloqueada").length;
      const taskCompletionRate = projectTasks.length > 0 
        ? completedTasksCount / projectTasks.length 
        : 0;
      
      const deadline = project.deadline ? new Date(project.deadline) : null;
      const daysToDeadline = deadline 
        ? Math.ceil((deadline - today) / (1000 * 60 * 60 * 24))
        : 30; // Default to 30 days if no deadline
      
      if (
        (project.progress >= 70 && taskCompletionRate >= 0.7) || 
        (daysToDeadline > 14 && blockedTasksCount === 0)
      ) {
        projectHealth.good++;
      } else if (
        (project.progress < 30 && daysToDeadline < 7) || 
        blockedTasksCount > projectTasks.length * 0.2
      ) {
        projectHealth.risk++;
      } else {
        projectHealth.warning++;
      }
    });

    const projectProgressAverage = filteredProjects.length > 0
      ? filteredProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / filteredProjects.length
      : 0;
    
    setSummaryStats({
      totalProjects: filteredProjects.length,
      completedProjects,
      totalTasks: timeFilteredTasks.length,
      completedTasks,
      upcomingDeadlines,
      meetingsThisWeek,
      activeUsers: activeUserEmails.size,
      projectHealth,
      projectProgressAverage: projectProgressAverage.toFixed(0) 
    });
  };
  
  const prepareChartData = () => {
    const filteredTasks = selectedProject === "all" 
      ? tasks 
      : tasks.filter(task => task.project_id === selectedProject);
    
    const filteredProjects = selectedProject === "all"
      ? projects
      : projects.filter(project => project.id === selectedProject);
    
    const taskCompletionTrend = [];
    const today = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthName = format(monthDate, "MMM", { locale: ptBR });
      
      const monthTasks = filteredTasks.filter(task => {
        if (!task.completion_date) return false;
        const completionDate = new Date(task.completion_date);
        return completionDate.getMonth() === monthDate.getMonth() && 
               completionDate.getFullYear() === monthDate.getFullYear();
      });
      
      taskCompletionTrend.push({
        name: monthName,
        tarefas: monthTasks.length
      });
    }
    
    const projectProgress = filteredProjects.slice(0, 8).map(project => ({
      name: project.title.length > 15 ? project.title.substring(0, 15) + "..." : project.title,
      progresso: project.progress || 0
    }));
    
    const statusCount = {
      pendente: 0,
      em_andamento: 0,
      concluída: 0,
      bloqueada: 0
    };
    
    filteredTasks.forEach(task => {
      if (statusCount[task.status] !== undefined) {
        statusCount[task.status]++;
      }
    });
    
    const taskDistribution = [
      { name: "Pendente", value: statusCount.pendente },
      { name: "Em Andamento", value: statusCount.em_andamento },
      { name: "Concluída", value: statusCount.concluída },
      { name: "Bloqueada", value: statusCount.bloqueada }
    ];
    
    const userTaskCount = {};
    
    filteredTasks.forEach(task => {
      if (task.assigned_to) {
        const userName = task.assigned_to.split('@')[0];
        if (!userTaskCount[userName]) {
          userTaskCount[userName] = { tarefas: 0, concluídas: 0 };
        }
        
        userTaskCount[userName].tarefas++;
        
        if (task.status === "concluída") {
          userTaskCount[userName].concluídas++;
        }
      }
    });
    
    const userActivity = Object.entries(userTaskCount)
      .sort((a, b) => b[1].tarefas - a[1].tarefas)
      .slice(0, 8)
      .map(([userName, counts]) => ({
        name: userName,
        total: counts.tarefas,
        concluídas: counts.concluídas
      }));
    
    setChartData({
      taskCompletionTrend,
      projectProgress,
      taskDistribution,
      userActivity
    });
  };

  const loadInsightHistory = async () => {
    try {
      const projectId = selectedProject === "all" ? "all" : selectedProject;
      const history = await AnalysisInsight.filter({ 
        project_id: projectId,
        analysis_type: analysisType
      }, "-date");
      
      setInsightHistory(history);
      
      if (history.length > 0) {
        setCurrentInsight(history[0].analysis);
        setSelectedInsightIndex(0);
      } else {
        setCurrentInsight(null);
      }
    } catch (error) {
      console.error("Erro ao carregar histórico de insights:", error);
    }
  };
  
  const calculateAverageCompletionDays = (taskList) => {
    const completedTasks = taskList.filter(task => 
      task.status === "concluída" && task.completion_date && task.created_date
    );
    
    if (completedTasks.length === 0) return "N/A";
    
    const totalDays = completedTasks.reduce((sum, task) => {
      const created = new Date(task.created_date);
      const completed = new Date(task.completion_date);
      const days = Math.ceil((completed - created) / (1000 * 60 * 60 * 24));
      return sum + days;
    }, 0);
    
    return (totalDays / completedTasks.length).toFixed(1);
  };
  
  const calculateRoleDistribution = (taskList) => {
    const roleDistribution = {};
    
    taskList.forEach(task => {
      if (!task.role_id) return;
      
      const role = roles.find(r => r.id === task.role_id);
      const roleName = role ? role.title : "Desconhecido";
      
      if (!roleDistribution[roleName]) {
        roleDistribution[roleName] = 0;
      }
      
      roleDistribution[roleName]++;
    });
    
    return Object.entries(roleDistribution)
      .map(([name, count]) => `${name}: ${count} tarefas`)
      .join('\n');
  };
  
  const generateInsight = async () => {
    try {
      setInsightLoading(true);
      
      const filteredProjects = selectedProject === "all" 
        ? projects 
        : projects.filter(project => project.id === selectedProject);
      
      const filteredTasks = selectedProject === "all" 
        ? tasks 
        : tasks.filter(task => task.project_id === selectedProject);
      
      const filteredMeetings = selectedProject === "all"
        ? meetings
        : meetings.filter(meeting => meeting.project_id === selectedProject);
      
      let analysisPrompt = "";
      
      if (analysisType === "productivity") {
        analysisPrompt = `
          Analise os seguintes dados de produtividade ${selectedProject === "all" ? "de todos os projetos" : "do projeto selecionado"}:
          
          ${selectedProject === "all" 
            ? `Dados de ${filteredProjects.length} projetos:
              - Total de tarefas: ${filteredTasks.length}
              - Tarefas concluídas: ${filteredTasks.filter(t => t.status === "concluída").length}
              - Tarefas em andamento: ${filteredTasks.filter(t => t.status === "em_andamento").length}
              - Tarefas bloqueadas: ${filteredTasks.filter(t => t.status === "bloqueada").length}
              
              Detalhes dos projetos:
              ${filteredProjects.map(p => `
                Projeto: ${p.title}
                - Status: ${p.status || "Não definido"}
                - Progresso: ${p.progress || 0}%
                - Prazo: ${p.deadline ? format(new Date(p.deadline), "dd/MM/yyyy") : "Não definido"}
                - Tarefas: ${filteredTasks.filter(t => t.project_id === p.id).length}
                - Tarefas concluídas: ${filteredTasks.filter(t => t.project_id === p.id && t.status === "concluída").length}
              `).join('\n')}
            `
            : `Detalhes do projeto "${filteredProjects[0]?.title || ""}":
              - Status: ${filteredProjects[0]?.status || "Não definido"}
              - Progresso: ${filteredProjects[0]?.progress || 0}%
              - Prazo: ${filteredProjects[0]?.deadline ? format(new Date(filteredProjects[0].deadline), "dd/MM/yyyy") : "Não definido"}
              - Total de tarefas: ${filteredTasks.length}
              - Tarefas concluídas: ${filteredTasks.filter(t => t.status === "concluída").length}
              - Tarefas em andamento: ${filteredTasks.filter(t => t.status === "em_andamento").length}
              - Tarefas bloqueadas: ${filteredTasks.filter(t => t.status === "bloqueada").length}
              
              ${filteredMeetings.length > 0 ? `
              Reuniões recentes:
              ${filteredMeetings.slice(0, 5).map(m => `
                - ${m.title} (${m.date ? format(new Date(m.date), "dd/MM/yyyy") : "Sem data"})
              `).join('\n')}
              ` : "Nenhuma reunião registrada."}
            `
          }
          
          Gere uma análise de produtividade detalhada com os seguintes componentes:
          
          1. Análise de Eficiência: Avalie a eficiência geral do trabalho com base nas tarefas concluídas.
          
          2. Análise de Progresso: Avalie o progresso do(s) projeto(s) em relação aos prazos.
          
          3. Gargalos e Bloqueios: Identifique potenciais gargalos ou bloqueios com base nas tarefas bloqueadas.
          
          4. Recomendações de Produtividade: Sugira formas de melhorar a produtividade.
          
          5. Análise de Alocação de Recursos: Avalie se os recursos estão sendo alocados de maneira eficiente.
          
          6. Recomendações Acionáveis: Liste 5 recomendações específicas e práticas.
          
          7. Resumo Executivo: Um resumo conciso dos principais insights de produtividade.
          
          Por favor, forneça uma análise completa, detalhada e específica para cada seção acima.
          Use linguagem clara e direta, com foco em insights práticos e acionáveis.
        `;
      } else if (analysisType === "risk") {
        analysisPrompt = `
          Analise os seguintes dados de risco ${selectedProject === "all" ? "de todos os projetos" : "do projeto selecionado"}:
          
          ${selectedProject === "all" 
            ? `Dados de ${filteredProjects.length} projetos:
              - Projetos com tarefas bloqueadas: ${filteredProjects.filter(p => 
                filteredTasks.some(t => t.project_id === p.id && t.status === "bloqueada")
              ).length}
              - Projetos próximos do prazo (menos de 30 dias): ${filteredProjects.filter(p => {
                if (!p.deadline) return false;
                const daysToDeadline = Math.ceil((new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                return daysToDeadline > 0 && daysToDeadline < 30;
              }).length}
              
              Detalhes dos projetos:
              ${filteredProjects.map(p => {
                const projectTasks = filteredTasks.filter(t => t.project_id === p.id);
                const blockedTasks = projectTasks.filter(t => t.status === "bloqueada");
                let daysToDeadline = "Não definido";
                
                if (p.deadline) {
                  const days = Math.ceil((new Date(p.deadline) - new Date()) / (1000 * 60 * 60 * 24));
                  daysToDeadline = days > 0 ? `${days} dias` : "Prazo expirado";
                }
                
                return `
                  Projeto: ${p.title}
                  - Status: ${p.status || "Não definido"}
                  - Progresso: ${p.progress || 0}%
                  - Prazo restante: ${daysToDeadline}
                  - Tarefas bloqueadas: ${blockedTasks.length} de ${projectTasks.length}
                `;
              }).join('\n')}
            `
            : `Detalhes do projeto "${filteredProjects[0]?.title || ""}":
              - Status: ${filteredProjects[0]?.status || "Não definido"}
              - Progresso: ${filteredProjects[0]?.progress || 0}%
              
              ${filteredProjects[0]?.deadline ? `
              - Prazo: ${format(new Date(filteredProjects[0].deadline), "dd/MM/yyyy")}
              - Dias restantes: ${Math.ceil((new Date(filteredProjects[0].deadline) - new Date()) / (1000 * 60 * 60 * 24))}
              ` : "- Prazo: Não definido"}
              
              - Total de tarefas: ${filteredTasks.length}
              - Tarefas bloqueadas: ${filteredTasks.filter(t => t.status === "bloqueada").length}
              
              ${filteredTasks.filter(t => t.status === "bloqueada").length > 0 ? `
              Tarefas bloqueadas:
              ${filteredTasks.filter(t => t.status === "bloqueada").map(t => `
                - ${t.title}
              `).join('\n')}
              ` : ""}
            `
          }
          
          Forneça uma análise de risco detalhada com os seguintes componentes:
          
          1. Análise de Riscos de Prazo: Avalie os riscos relacionados aos prazos dos projetos.
          
          2. Análise de Bloqueios: Identifique padrões ou causas comuns dos bloqueios atuais.
          
          3. Áreas de Atenção: Destaque áreas específicas que necessitam de atenção imediata.
          
          4. Estratégias de Mitigação: Sugira estratégias para mitigar os riscos identificados.
          
          5. Recomendações de Prevenção: Forneça recomendações para prevenir problemas similares no futuro.
          
          6. Recomendações Acionáveis: Liste 5 ações específicas e práticas para reduzir riscos.
          
          7. Resumo Executivo: Um resumo conciso dos principais riscos e suas mitigações.
          
          Por favor, forneça uma análise completa, detalhada e específica para cada seção acima.
          Use linguagem clara e direta, com foco em insights práticos e acionáveis.
        `;
      } else if (analysisType === "quality") {
        analysisPrompt = `
          Analise os seguintes dados de qualidade ${selectedProject === "all" ? "de todos os projetos" : "do projeto selecionado"}:
          
          ${selectedProject === "all" 
            ? `Dados de ${filteredProjects.length} projetos:
              - Total de tarefas: ${filteredTasks.length}
              - Tarefas concluídas: ${filteredTasks.filter(t => t.status === "concluída").length}
              - Tempo médio de conclusão (dias): ${calculateAverageCompletionDays(filteredTasks)}
              
              Detalhes dos projetos:
              ${filteredProjects.map(p => {
                const projectTasks = filteredTasks.filter(t => t.project_id === p.id);
                const completedTasks = projectTasks.filter(t => t.status === "concluída");
                
                return `
                  Projeto: ${p.title}
                  - Status: ${p.status || "Não definido"}
                  - Progresso: ${p.progress || 0}%
                  - Tarefas concluídas: ${completedTasks.length} de ${projectTasks.length}
                  - Tempo médio de conclusão (dias): ${calculateAverageCompletionDays(projectTasks)}
                `;
              }).join('\n')}
            `
            : `Detalhes do projeto "${filteredProjects[0]?.title || ""}":
              - Status: ${filteredProjects[0]?.status || "Não definido"}
              - Progresso: ${filteredProjects[0]?.progress || 0}%
              - Total de tarefas: ${filteredTasks.length}
              - Tarefas concluídas: ${filteredTasks.filter(t => t.status === "concluída").length}
              - Tempo médio de conclusão (dias): ${calculateAverageCompletionDays(filteredTasks)}
              
              Distribuição de tarefas por função:
              ${calculateRoleDistribution(filteredTasks)}
            `
          }
          
          Forneça uma análise de qualidade detalhada com os seguintes componentes:
          
          1. Avaliação Geral de Qualidade: Avalie a qualidade geral do trabalho com base nos dados disponíveis.
          
          2. Análise de Processos: Identifique possíveis melhorias nos processos atuais.
          
          3. Qualidade da Alocação: Avalie se as tarefas estão sendo alocadas aos recursos adequados.
          
          4. Áreas de Melhoria: Destaque áreas específicas onde a qualidade pode ser melhorada.
          
          5. Recomendações de Qualidade: Forneça recomendações para melhorar a qualidade global.
          
          6. Recomendações Acionáveis: Liste 5 ações específicas e práticas para aumentar a qualidade.
          
          7. Resumo Executivo: Um resumo conciso dos principais insights sobre qualidade.
          
          Por favor, forneça uma análise completa, detalhada e específica para cada seção acima.
          Use linguagem clara e direta, com foco em insights práticos e acionáveis.
        `;
      } else if (analysisType === "team") {
        const teamMembers = new Map();
        
        filteredTasks.forEach(task => {
          if (!task.assigned_to) return;
          
          if (!teamMembers.has(task.assigned_to)) {
            teamMembers.set(task.assigned_to, {
              total: 0,
              completed: 0,
              inProgress: 0,
              blocked: 0,
              roles: new Set()
            });
          }
          
          const member = teamMembers.get(task.assigned_to);
          member.total++;
          
          if (task.status === "concluída") member.completed++;
          if (task.status === "em_andamento") member.inProgress++;
          if (task.status === "bloqueada") member.blocked++;
          
          if (task.role_id) {
            const role = roles.find(r => r.id === task.role_id);
            if (role) member.roles.add(role.title);
          }
        });
        
        filteredMeetings.forEach(meeting => {
          if (!meeting.attendees || !Array.isArray(meeting.attendees)) return;
          
          meeting.attendees.forEach(email => {
            if (!teamMembers.has(email)) {
              teamMembers.set(email, {
                total: 0,
                completed: 0,
                inProgress: 0,
                blocked: 0,
                roles: new Set(),
                meetings: 0
              });
            }
            
            const member = teamMembers.get(email);
            member.meetings = (member.meetings || 0) + 1;
          });
        });
        
        const teamMembersArray = Array.from(teamMembers.entries()).map(([email, data]) => {
          const userName = email.split('@')[0];
          return {
            email,
            userName,
            ...data,
            roles: Array.from(data.roles),
            completionRate: data.total > 0 ? (data.completed / data.total) * 100 :0
          }
        })
        
        analysisPrompt = `
          Analise os seguintes dados de equipe ${selectedProject === "all" ? "de todos os projetos" : "do projeto selecionado"}:
          
          Membros da equipe: ${teamMembersArray.length}
          
          ${teamMembersArray.map(member => `
            Membro: ${member.userName} (${member.email})
            - Tarefas totais: ${member.total}
            - Tarefas concluídas: ${member.completed} (${member.completionRate.toFixed(0)}%)
            - Tarefas em andamento: ${member.inProgress}
            - Tarefas bloqueadas: ${member.blocked}
            - Funções: ${member.roles.join(', ') || "Não especificado"}
            - Participação em reuniões: ${member.meetings || 0}
          `).join('\n')}
          
          Forneça uma análise de equipe detalhada com os seguintes componentes:
          
          1. Análise de Desempenho de Equipe: Avalie o desempenho geral da equipe.
          
          2. Análise de Carga de Trabalho: Verifique se a distribuição de tarefas está balanceada.
          
          3. Pontos Fortes: Identifique os pontos fortes da equipe atual.
          
          4. Áreas de Melhoria: Destaque áreas onde a equipe poderia melhorar.
          
          5. Recomendações de Colaboração: Sugira formas de melhorar a colaboração e comunicação.
          
          6. Recomendações Acionáveis: Liste 5 ações específicas para melhorar o desempenho da equipe.
          
          7. Resumo Executivo: Um resumo conciso dos principais insights sobre a equipe.
          
          Por favor, forneça uma análise completa, detalhada e específica para cada seção acima.
          Use linguagem clara e direta, com foco em insights práticos e acionáveis.
        `;
      }
      
      const result = await InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            efficiency_analysis: { type: "string" },
            progress_analysis: { type: "string" },
            bottlenecks_analysis: { type: "string" },
            resource_allocation: { type: "string" },
            recommendations: { 
              type: "array", 
              items: { type: "string" } 
            },
            summary: { type: "string" }
          }
        }
      });
      
      const insightData = {
        project_id: selectedProject === "all" ? "all" : selectedProject,
        date: new Date().toISOString(),
        analysis_type: analysisType,
        analysis: result,
        metrics: {
          total_projects: summaryStats.totalProjects,
          completed_projects: summaryStats.completedProjects,
          total_tasks: summaryStats.totalTasks,
          completed_tasks: summaryStats.completedTasks
        }
      };
      
      await AnalysisInsight.create(insightData);
      
      setCurrentInsight(result);
      await loadInsightHistory();
      
    } catch (error) {
      console.error("Erro ao gerar insights:", error);
    } finally {
      setInsightLoading(false);
    }
  };
  
  const renderSummaryCards = () => {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.totalProjects}
              {summaryStats.completedProjects > 0 && (
                <span className="text-sm text-green-600 font-normal ml-2">
                  {summaryStats.completedProjects} concluídos
                </span>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Tarefas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.totalTasks}
            </div>
            <div className="flex items-center mt-1">
              <div className="w-full">
                <Progress 
                  value={summaryStats.totalTasks > 0 ? 
                    (summaryStats.completedTasks / summaryStats.totalTasks) * 100 : 0
                  } 
                  className="h-1" 
                />
              </div>
              <span className="text-sm text-gray-500 ml-2">
                {summaryStats.totalTasks > 0 ? 
                  Math.round((summaryStats.completedTasks / summaryStats.totalTasks) * 100) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Prazos Próximos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summaryStats.upcomingDeadlines}
            </div>
            <div className="text-sm text-amber-600 mt-1">
              {summaryStats.upcomingDeadlines > 0 ? 
                "Nos próximos 7 dias" : "Nenhum prazo próximo"}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Saúde dos Projetos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="text-sm">{summaryStats.projectHealth.good}</span>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <span className="text-sm">{summaryStats.projectHealth.warning}</span>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm">{summaryStats.projectHealth.risk}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderCharts = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 text-gray-500 mr-2" />
              Conclusão de Tarefas
            </CardTitle>
            <CardDescription>
              Tendência de tarefas concluídas nos últimos 6 meses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartData.taskCompletionTrend}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area 
                    type="monotone" 
                    dataKey="tarefas" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorTasks)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChartIcon className="h-5 w-5 text-gray-500 mr-2" />
              Status das Tarefas
            </CardTitle>
            <CardDescription>
              Distribuição de tarefas por status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData.taskDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.taskDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} tarefas`, ""]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="h-5 w-5 text-gray-500 mr-2" />
              Progresso dos Projetos
            </CardTitle>
            <CardDescription>
              Percentual de conclusão por projeto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.projectProgress}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip formatter={(value) => [`${value}%`, ""]} />
                  <Bar 
                    dataKey="progresso" 
                    fill="#8884d8" 
                    background={{ fill: '#eee' }} 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 text-gray-500 mr-2" />
              Atividade por Usuário
            </CardTitle>
            <CardDescription>
              Distribuição de tarefas por membro da equipe
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData.userActivity}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="total" name="Total" fill="#8884d8" />
                  <Bar dataKey="concluídas" name="Concluídas" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  const renderInsights = () => {
    if (!currentInsight) {
      return (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center py-12">
              <Lightbulb className="h-12 w-12 text-amber-500 mb-4" />
              <h3 className="text-lg font-medium mb-2">Não há análises geradas ainda</h3>
              <p className="text-gray-500 max-w-md mb-6">
                Gere uma análise para obter insights sobre 
                {selectedProject === "all" ? " todos os projetos" : " este projeto"}.
                As análises contêm recomendações acionáveis e insights valiosos.
              </p>
              <Button 
                onClick={generateInsight}
                disabled={insightLoading}
              >
                {insightLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando Análise...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Gerar Análise de {analysisType === "productivity" ? "Produtividade" : 
                      analysisType === "risk" ? "Risco" : 
                      analysisType === "quality" ? "Qualidade" : "Equipe"}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
                  Resumo Executivo
                </CardTitle>
                <CardDescription>
                  Gerado em {insightHistory[selectedInsightIndex]?.date ? 
                    format(new Date(insightHistory[selectedInsightIndex].date), "dd/MM/yyyy 'às' HH:mm") : ""}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {insightHistory.length > 1 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowInsightHistory(true)}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Histórico
                  </Button>
                )}
                <Button 
                  size="sm" 
                  onClick={generateInsight}
                  disabled={insightLoading}
                >
                  {insightLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                {currentInsight.summary}
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Projetos Concluídos</div>
                  <Progress 
                    value={summaryStats.totalProjects > 0 ? (summaryStats.completedProjects / summaryStats.totalProjects) * 100 : 0} 
                    className="h-2" 
                  />
                  <div className="text-xs text-gray-500">
                    {summaryStats.completedProjects} de {summaryStats.totalProjects}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Tarefas Concluídas</div>
                  <Progress 
                    value={summaryStats.totalTasks > 0 ? (summaryStats.completedTasks / summaryStats.totalTasks) * 100 : 0} 
                    className="h-2" 
                  />
                  <div className="text-xs text-gray-500">
                    {summaryStats.completedTasks} de {summaryStats.totalTasks}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Progresso Médio</div>
                  <Progress 
                    value={summaryStats.projectProgressAverage} 
                    className="h-2" 
                  />
                  <div className="text-xs text-gray-500">
                    {summaryStats.projectProgressAverage}% média dos projetos
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Projetos com Risco</div>
                  <Progress 
                    value={summaryStats.totalProjects > 0 ? (summaryStats.projectHealth.risk / summaryStats.totalProjects) * 100 : 0} 
                    className="h-2 bg-red-100" 
                    indicatorClassName="bg-red-600"
                  />
                  <div className="text-xs text-gray-500">
                    {summaryStats.projectHealth.risk} projetos com risco
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                Recomendações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentInsight.recommendations?.map((recommendation, index) => (
                <div key={index} className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-700 text-sm font-medium">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700">{recommendation}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 text-indigo-500 mr-2" />
                Análise de Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">
                {currentInsight.progress_analysis || currentInsight.efficiency_analysis}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-amber-500 mr-2" />
                Gargalos e Bloqueios
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-line">
                {currentInsight.bottlenecks_analysis}
              </p>
            </CardContent>
          </Card>
        </div>
        
        <Dialog open={showInsightHistory} onOpenChange={setShowInsightHistory}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Histórico de Análises</DialogTitle>
              <DialogDescription>
                Visualize análises anteriores geradas para {selectedProject === "all" ? "todos os projetos" : "este projeto"}.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <ScrollArea className="h-72">
                <div className="space-y-4">
                  {insightHistory.map((insight, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg cursor-pointer hover:bg-gray-100 ${
                        selectedInsightIndex === index ? "bg-gray-100 border border-blue-200" : ""
                      }`}
                      onClick={() => {
                        setSelectedInsightIndex(index);
                        setCurrentInsight(insight.analysis);
                        setShowInsightHistory(false);
                      }}
                    >
                      <div className="flex justify-between mb-1">
                        <div className="font-medium">
                          Análise #{insightHistory.length - index}
                        </div>
                        <div className="text-sm text-gray-500">
                          {format(new Date(insight.date), "dd/MM/yyyy")}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {insight.analysis.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
            <DialogFooter>
              <Button onClick={() => setShowInsightHistory(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Análises</h1>
          <p className="text-gray-500">
            Visualize métricas, tendências e insights sobre seus projetos
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Período de tempo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os projetos</SelectItem>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mb-6">
        <TabsList className="mb-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="insights">Insights e Análises</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          {renderSummaryCards()}
          {renderCharts()}
        </TabsContent>
        
        <TabsContent value="insights">
          <div className="flex justify-end mb-6">
            <Tabs 
              value={analysisType} 
              onValueChange={setAnalysisType} 
              className="w-full md:w-auto"
            >
              <TabsList>
                <TabsTrigger value="productivity" className="text-xs sm:text-sm">
                  <Activity className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Produtividade</span>
                </TabsTrigger>
                <TabsTrigger value="risk" className="text-xs sm:text-sm">
                  <AlertTriangle className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Riscos</span>
                </TabsTrigger>
                <TabsTrigger value="quality" className="text-xs sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Qualidade</span>
                </TabsTrigger>
                <TabsTrigger value="team" className="text-xs sm:text-sm">
                  <Users className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Equipe</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {renderInsights()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

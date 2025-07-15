
import React, { useState, useEffect, useRef } from "react";
import { Project, Task, Meeting, User, Budget, ClientReport } from "@/api/entities";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InvokeLLM, SendEmail, UploadFile } from "@/api/integrations"; // SendEmail and generateClientReportPDF might still be used elsewhere, keeping for now as per instructions not to remove imports unless specified.
import { generateClientReportPDF } from "@/api/functions";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Calendar,
  FileText,
  Send,
  Download,
  Clock,
  AlertTriangle,
  CheckCircle2,
  BarChart2,
  FileUp,
  Plus,
  RotateCcw,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Mail,
  Printer,
  Star,
  Sparkles,
  PieChart,
  TrendingUp,
  FileBarChart,
  FileCheck,
  Shield,
  AlertCircle,
  Save
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RPieChart, Pie, Cell } from 'recharts';

export default function ClientReportPage() {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedProjectData, setSelectedProjectData] = useState(null);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [selectedReport, setSelectedReport] = useState(null); // Keep for current generated/loaded report
  const [showReportHistory, setShowReportHistory] = useState(false);
  const [reportHistory, setReportHistory] = useState([]);
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({
    to: '',
    subject: '',
    additionalMessage: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [budgets, setBudgets] = useState([]); // Added budgets state
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState({
    status: "no_prazo", // no_prazo, atrasado, adiantado
    health: "verde", // verde, amarelo, vermelho
    healthJustification: "",
    progress: 0,
    highlights: "",
    completedItems: "",
    inProgressItems: "",
    blockers: "",
    risks: "",
    nextWeek: "",
    recommendations: "",
    customNotes: "",
    metrics: { // Initialize metrics for charts
      burndown_data: [],
      task_status_data: [],
      budget_data: []
    }
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]); // Added users state for getUserName helper
  const [error, setError] = useState(null); // Added error state
  const { toast } = useToast(); // Initialize toast

  const reportRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject);
      loadReportHistory(selectedProject);
    }
  }, [selectedProject, currentWeek]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, budgetsData, usersData] = await Promise.all([ // Load budgets and users
        Project.list(),
        Budget.list(),
        User.list() // Fetch all users
      ]);
      setProjects(projectsData);
      setBudgets(budgetsData); // Set budgets state
      setUsers(usersData); // Set users state

      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0].id);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados iniciais",
        description: "Não foi possível carregar projetos, orçamentos ou usuários.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  };

  const loadProjectData = async (projectId) => {
    try {
      setLoading(true);
      const [projectTasks, projectMeetings, projectReports] = await Promise.all([
        Task.filter({ project_id: projectId }),
        Meeting.filter({ project_id: projectId }),
        ClientReport.filter({ project_id: projectId }) // Fetch reports to update metrics
      ]);

      const project = projects.find(p => p.id === projectId);
      setSelectedProjectData(project);
      setTasks(projectTasks);
      setMeetings(projectMeetings);

      // Attempt to load the latest report for the current week or calculate initial metrics
      const weekPeriod = generateWeekPeriod(currentWeek);
      const existingReportForWeek = projectReports.find(report =>
        report.period_start === weekPeriod.start.toISOString() &&
        report.period_end === weekPeriod.end.toISOString()
      );

      let initialReportData = {
        ...reportData,
        progress: project.progress || 0,
        status: getProjectStatus(project),
        health: getProjectHealth(project, projectTasks)
      };

      if (existingReportForWeek) {
        initialReportData = {
          status: existingReportForWeek.status || "no_prazo",
          health: existingReportForWeek.health || "verde",
          healthJustification: existingReportForWeek.health_justification || "",
          progress: existingReportForWeek.progress || 0,
          highlights: existingReportForWeek.highlights || "",
          completedItems: existingReportForWeek.completed_items || "",
          inProgressItems: existingReportForWeek.in_progress_items || "",
          blockers: existingReportForWeek.blockers || "",
          risks: existingReportForWeek.risks || "",
          nextWeek: existingReportForWeek.next_week || "",
          recommendations: existingReportForWeek.recommendations || "",
          customNotes: existingReportForWeek.custom_notes || "",
          metrics: existingReportForWeek.metrics || { // Corrected: Expect metrics as object directly
            burndown_data: [],
            task_status_data: [],
            budget_data: []
          }
        };
      } else {
        // Calculate initial metrics if no report for the week exists
        initialReportData.metrics = {
          burndown_data: generateBurndownData(projectTasks, project),
          task_status_data: generateTaskStatusData(projectTasks),
          budget_data: generateBudgetData(project, projectTasks, budgets)
        };
      }

      setReportData(initialReportData);
      setSelectedReport(initialReportData); // Also set selectedReport for preview

    } catch (error) {
      console.error("Erro ao carregar dados do projeto:", error);
      toast({
        title: "Erro ao carregar dados do projeto",
        description: "Não foi possível carregar as informações do projeto selecionado.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadReportHistory = async (projectId) => {
    try {
      const reports = await ClientReport.filter({ project_id: projectId });
      setReportHistory(reports.sort((a, b) => new Date(b.period_end) - new Date(a.period_end)));
    } catch (error) {
      console.error("Erro ao carregar histórico de relatórios:", error);
      toast({
        title: "Erro ao carregar histórico",
        description: "Não foi possível carregar o histórico de relatórios.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    try {
      if (!reportRef || !reportRef.current) {
        console.error("Report reference is not available");
        return;
      }

      const printContent = reportRef.current.innerHTML;

      const printWindow = window.open('', '_blank', 'height=600,width=800');

      if (!printWindow) {
        console.error("Failed to open print window - popup might be blocked");
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório - ${selectedProjectData?.title || 'Projeto'}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 10px; }
              h2 { font-size: 20px; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
              h3 { font-size: 18px; margin-top: 15px; margin-bottom: 5px; }
              .badge { display: inline-block; padding: 3px 6px; border-radius: 4px; font-size: 12px; font-weight: 500; }
              .progress-container { height: 8px; background-color: #e5e7eb; border-radius: 9999px; margin: 8px 0; }
              .progress-bar { height: 100%; border-radius: 9999px; background-color: #3b82f6; }
              p { margin: 8px 0; }
              .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
              .border { border: 1px solid #e5e7eb; border-radius: 5px; padding: 8px; }
              .chart-placeholder { text-align: center; background-color: #f3f4f6; padding: 40px; margin: 10px 0; border-radius: 5px; }
              @media print {
                .page-break { page-break-before: always; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);

      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    } catch (error) {
      console.error("Erro ao imprimir relatório:", error);
      toast({
        title: "Erro ao imprimir",
        description: "Não foi possível preparar o relatório para impressão.",
        variant: "destructive"
      });
    }
  };

  const getProjectStatus = (project) => {
    if (!project || !project.start_date || !project.deadline) return "no_prazo";

    const today = new Date();
    const deadline = new Date(project.deadline);
    const startDate = new Date(project.start_date);
    const totalDuration = deadline - startDate;
    const elapsed = today - startDate;

    if (today > deadline) return "atrasado";

    const expectedProgress = (elapsed / totalDuration) * 100;

    if (project.progress > expectedProgress + 10) return "adiantado";
    if (project.progress < expectedProgress - 10) return "atrasado";

    return "no_prazo";
  };

  const getProjectHealth = (project, tasks) => {
    if (!project) return "amarelo";

    const status = getProjectStatus(project);
    if (status === "atrasado") return "vermelho";
    if (status === "adiantado") return "verde";

    const today = new Date();
    const overdueTasks = tasks.filter(t =>
      t.deadline &&
      new Date(t.deadline) < today &&
      t.status !== "concluída" && t.status !== "done"
    );

    if (overdueTasks.length > 5) return "vermelho";
    if (overdueTasks.length > 2) return "amarelo";

    return "verde";
  };

  const generateWeekPeriod = (date) => {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    const end = endOfWeek(date, { weekStartsOn: 1 });

    return {
      start,
      end,
      formatted: `${format(start, 'dd/MM/yyyy', { locale: ptBR })} a ${format(end, 'dd/MM/yyyy', { locale: ptBR })}`
    };
  };

  const handlePreviousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const handleNextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const handleCurrentWeek = () => {
    setCurrentWeek(new Date());
  };

  const getTasksForWeek = () => {
    if (!tasks || !tasks.length) return { completed: [], inProgress: [], blocked: [] };

    const weekPeriod = generateWeekPeriod(currentWeek);
    const startDate = weekPeriod.start;
    const endDate = weekPeriod.end;

    const completedThisWeek = tasks.filter(task => {
      if (task.status !== "concluída" && task.status !== "done" || !task.completion_date) return false;
      const completionDate = new Date(task.completion_date);
      return completionDate >= startDate && completionDate <= endDate;
    });

    const inProgress = tasks.filter(task =>
      task.status !== "concluída" && task.status !== "done" &&
      task.status !== "bloqueada" && task.status !== "blocked" &&
      task.status !== "pendente" && task.status !== "to_do" // Consider all non-blocked, non-completed tasks as in progress or to do
    );

    const blocked = tasks.filter(task =>
      task.status === "bloqueada" || task.status === "blocked"
    );

    return { completed: completedThisWeek, inProgress, blocked };
  };

  const getMeetingsForWeek = () => {
    if (!meetings || !meetings.length) return [];

    const weekPeriod = generateWeekPeriod(currentWeek);
    const startDate = weekPeriod.start;
    const endDate = weekPeriod.end;

    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      return meetingDate >= startDate && meetingDate <= endDate;
    });
  };

  // New utility functions for chart data generation
  const generateBurndownData = (projectTasks, project) => {
    if (!projectTasks || projectTasks.length === 0 || !project.start_date) {
      return [];
    }

    const startDate = new Date(project.start_date);
    const endDate = project.deadline ? new Date(project.deadline) : new Date();
    const today = new Date();

    // Calcular total de story points ou usar número de tarefas
    const totalPoints = projectTasks.reduce((sum, task) => {
      return sum + (task.estimated_hours || 1);
    }, 0);

    if (totalPoints === 0) {
      return [];
    }

    // Gerar dados do burndown
    const burndownData = [];
    const currentDate = new Date(startDate);
    const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    if (totalDays <= 0) {
      return [];
    }

    let dayIndex = 0;

    while (currentDate <= endDate && dayIndex <= totalDays && burndownData.length < 30) {
      const dateStr = currentDate.toISOString().split('T')[0];

      // Calcular pontos ideais restantes (linha reta)
      const idealRemaining = totalPoints - (totalPoints * dayIndex / totalDays);

      // Calcular pontos reais restantes baseado nas tarefas concluídas até esta data
      const completedTasksByDate = projectTasks.filter(task => {
        return (task.status === 'concluída' || task.status === 'done') &&
               task.completion_date &&
               task.completion_date <= dateStr;
      });

      const completedPointsByDate = completedTasksByDate.reduce((sum, task) => {
        return sum + (task.estimated_hours || 1);
      }, 0);

      const realRemaining = Math.max(0, totalPoints - completedPointsByDate);

      burndownData.push({
        date: format(currentDate, 'dd/MM', { locale: ptBR }),
        fullDate: dateStr,
        ideal: Math.max(0, Math.round(idealRemaining * 10) / 10),
        real: currentDate <= today ? realRemaining : null,
        isToday: dateStr === today.toISOString().split('T')[0],
        isFuture: currentDate > today
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
    }

    return burndownData;
  };

  const generateTaskStatusData = (projectTasks) => {
    if (!projectTasks || projectTasks.length === 0) {
      return [
        { name: 'Sem tarefas', value: 1, fill: '#E5E7EB' }
      ];
    }

    const statusCounts = projectTasks.reduce((acc, task) => {
      let status = task.status || 'pendente';

      // Normalizar status
      if (status === 'done') status = 'concluída';
      if (status === 'in_progress') status = 'em_andamento';
      if (status === 'to_do') status = 'pendente';
      if (status === 'blocked') status = 'bloqueada';

      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    const statusMapping = {
      'concluída': { name: 'Concluídas', fill: '#10B981' },
      'em_andamento': { name: 'Em Andamento', fill: '#3B82F6' },
      'pendente': { name: 'Pendentes', fill: '#F59E0B' },
      'bloqueada': { name: 'Bloqueadas', fill: '#EF4444' }
    };

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: statusMapping[status]?.name || status,
      value: count,
      fill: statusMapping[status]?.fill || '#6B7280'
    }));
  };

  const generateBudgetData = (project, projectTasks, budgets) => {
    if (!project || !budgets) {
      return [];
    }

    // Buscar orçamento relacionado ao projeto
    const projectBudget = budgets.find(budget => budget.project_id === project.id);

    // Calcular custo planejado (do orçamento)
    const plannedCost = projectBudget ? (projectBudget.total_value || 0) : 0;

    // Calcular custo realizado (baseado nas tarefas)
    const tasksCost = projectTasks ? projectTasks.reduce((sum, task) => {
      return sum + (task.total_cost || 0);
    }, 0) : 0;

    // Adicionar custo de infraestrutura se disponível
    const infrastructureCost = project.infrastructure_cost || 0;

    // Calcular duração do projeto em meses
    let projectDurationMonths = 1;
    if (project.start_date && project.deadline) {
      const startDate = new Date(project.start_date);
      const endDate = new Date(project.deadline);
      projectDurationMonths = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24 * 30)));
    }

    const totalInfrastructureCost = infrastructureCost * projectDurationMonths;
    const totalActualCost = tasksCost + totalInfrastructureCost;

    // Calcular progresso atual
    const currentProgress = project.progress || 0;

    // Estimar custo projetado baseado no progresso
    let projectedTotalCost = totalActualCost;
    if (currentProgress > 0 && currentProgress < 100) {
      projectedTotalCost = (totalActualCost / currentProgress) * 100;
    }

    const data = [];

    if (plannedCost > 0) {
      data.push({
        name: 'Planejado',
        value: plannedCost,
        fill: '#8884d8'
      });
    }

    if (totalActualCost > 0) {
      data.push({
        name: 'Realizado',
        value: totalActualCost,
        fill: '#82ca9d'
      });
    }

    if (projectedTotalCost > totalActualCost) {
      data.push({
        name: 'Projetado',
        value: projectedTotalCost,
        fill: '#ffc658'
      });
    }

    return data;
  };


  const handleSaveReport = async () => {
    try {
      setLoading(true);

      const weekPeriod = generateWeekPeriod(currentWeek);
      const reportToSave = {
        project_id: selectedProject,
        title: `Relatório Semanal - ${selectedProjectData.title}`,
        period_start: weekPeriod.start.toISOString(),
        period_end: weekPeriod.end.toISOString(),
        prepared_by: currentUser?.email || "usuario@alliedit.com",
        status: reportData.status,
        health: reportData.health,
        health_justification: reportData.healthJustification,
        progress: reportData.progress,
        highlights: reportData.highlights,
        completed_items: reportData.completedItems,
        in_progress_items: reportData.inProgressItems,
        blockers: reportData.blockers,
        risks: reportData.risks,
        next_week: reportData.nextWeek,
        recommendations: reportData.recommendations,
        custom_notes: reportData.customNotes,
        metrics: reportData.metrics
      };

      const existingReport = reportHistory.find(report =>
        report.period_start === weekPeriod.start.toISOString() &&
        report.period_end === weekPeriod.end.toISOString()
      );

      let savedReport;
      if (existingReport) {
        savedReport = await ClientReport.update(existingReport.id, reportToSave);
        toast({
          title: "Relatório atualizado!",
          description: "O relatório semanal foi salvo com sucesso."
        });
      } else {
        savedReport = await ClientReport.create(reportToSave);
        toast({
          title: "Relatório salvo!",
          description: "O relatório semanal foi criado com sucesso."
        });
      }

      await loadReportHistory(selectedProject);
      return savedReport; // IMPORTANT: Return the saved report object
    } catch (error) {
      console.error("Erro ao salvar relatório:", error);
      toast({
        title: "Erro ao salvar relatório",
        description: "Não foi possível salvar o relatório. Tente novamente.",
        variant: "destructive"
      });
      return null; // Return null on error
    } finally {
      setLoading(false);
    }
  };

  // Modified handleGenerateReport to return the generated data
  const handleGenerateReport = async () => {
    if (!selectedProject || !selectedProjectData) {
      toast({
        title: "Erro",
        description: "Selecione um projeto para gerar o relatório.",
        variant: "destructive"
      });
      return null; // Return null if prerequisites are not met
    }

    try {
      setIsGenerating(true);

      const project = selectedProjectData;
      const projectTasks = tasks;
      const projectBudgets = budgets.filter(b => b.project_id === selectedProject);
      const weekMeetings = getMeetingsForWeek();
      const { completed, inProgress, blocked } = getTasksForWeek();

      // Calcular métricas reais
      const projectStatus = getProjectStatus(project);
      const projectHealth = getProjectHealth(project, projectTasks);
      const currentProgress = project.progress || 0;

      // Determinar justificativa de saúde
      let healthJustification = "Projeto executando conforme planejado.";
      if (blocked.length > 0) {
        healthJustification = `Projeto possui ${blocked.length} tarefa(s) bloqueada(s) que podem impactar o cronograma.`;
      }
      if (projectStatus === "atrasado") {
        healthJustification = `Projeto está atrasado. Progresso atual: ${currentProgress}%.`;
      } else if (projectStatus === "adiantado") {
        healthJustification = "Projeto executando acima das expectativas.";
      }

      // Gerar dados para charts
      const burndownData = generateBurndownData(projectTasks, project);
      const taskStatusData = generateTaskStatusData(projectTasks);
      const budgetData = generateBudgetData(project, projectTasks, budgets);

      // Preparar contexto para IA
      const weekPeriod = generateWeekPeriod(currentWeek);
      const projectContext = {
        title: project.title,
        description: project.description,
        status: projectStatus,
        health: projectHealth,
        progress: currentProgress,
        start_date: project.start_date,
        deadline: project.deadline,
        responsible: project.responsible,
        participants: project.participants
      };

      const tasksContext = {
        total: projectTasks.length,
        completed_this_week: completed.length,
        in_progress: inProgress.length,
        blocked: blocked.length,
        completed_tasks: completed.map(t => ({ title: t.title, completion_date: t.completion_date })),
        in_progress_tasks: inProgress.map(t => ({ title: t.title, status: t.status, assigned_to: t.assigned_to })),
        blocked_tasks: blocked.map(t => ({ title: t.title, blocker_reason: t.blocker_reason || 'Não especificada' }))
      };

      const meetingsContext = {
        total_this_week: weekMeetings.length,
        meetings: weekMeetings.map(m => ({ title: m.title, date: m.date, attendees: m.attendees }))
      };

      const budgetContext = {
        planned: projectBudgets.reduce((sum, b) => sum + (b.total_value || 0), 0),
        spent: projectTasks.reduce((sum, t) => sum + (t.total_cost || 0), 0),
        infrastructure_cost: project.infrastructure_cost || 0
      };

      // Gerar conteúdo com IA
      const reportPrompt = `
        Gere um relatório semanal profissional para o cliente com base nos seguintes dados:

        PERÍODO: ${weekPeriod.formatted}
        
        PROJETO:
        ${JSON.stringify(projectContext, null, 2)}
        
        TAREFAS:
        ${JSON.stringify(tasksContext, null, 2)}
        
        REUNIÕES:
        ${JSON.stringify(meetingsContext, null, 2)}
        
        ORÇAMENTO:
        ${JSON.stringify(budgetContext, null, 2)}
        
        Gere o conteúdo para as seguintes seções:
        1. highlights - Destaques da semana (principais conquistas, marcos alcançados)
        2. completed_items - Lista detalhada de itens concluídos
        3. in_progress_items - Lista de itens em andamento com status
        4. blockers - Descrição dos bloqueios com planos de ação
        5. risks - Análise de riscos identificados
        6. next_week - Planejamento para próxima semana
        7. recommendations - Recomendações estratégicas para o cliente
        
        DIRETRIZES:
        - Use tom profissional mas acessível
        - Seja específico com dados quantitativos
        - Destaque conquistas e progresso
        - Seja transparente sobre desafios
        - Forneça insights acionáveis
        - Mantenha foco no valor entregue ao cliente
        
        Retorne em formato JSON com as chaves: highlights, completed_items, in_progress_items, blockers, risks, next_week, recommendations
      `;

      const aiResponse = await InvokeLLM({
        prompt: reportPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            highlights: { type: "string" },
            completed_items: { type: "string" },
            in_progress_items: { type: "string" },
            blockers: { type: "string" },
            risks: { type: "string" },
            next_week: { type: "string" },
            recommendations: { type: "string" }
          },
          required: ["highlights", "completed_items", "in_progress_items", "blockers", "risks", "next_week", "recommendations"]
        }
      });

      // Atualizar dados do relatório
      const updatedReportData = {
        highlights: aiResponse.highlights,
        completedItems: aiResponse.completed_items, // Use camelCase
        inProgressItems: aiResponse.in_progress_items, // Use camelCase
        blockers: aiResponse.blockers,
        risks: aiResponse.risks,
        nextWeek: aiResponse.next_week, // Use camelCase
        recommendations: aiResponse.recommendations,
        status: projectStatus,
        health: projectHealth,
        healthJustification: healthJustification,
        progress: currentProgress,
        customNotes: reportData.customNotes, // This one is explicitly carried over
        metrics: {
          burndown_data: burndownData,
          task_status_data: taskStatusData,
          budget_data: budgetData
        }
      };

      setReportData(updatedReportData);
      setSelectedReport(updatedReportData);

      toast({
        title: "Relatório gerado!",
        description: "O conteúdo foi gerado automaticamente com base nos dados do projeto."
      });

      return updatedReportData; // Return the generated data
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      toast({
        title: "Erro ao gerar relatório",
        description: "Houve um problema ao gerar o conteúdo do relatório. Verifique os dados do projeto.",
        variant: "destructive"
      });
      return null; // Return null on error
    } finally {
      setIsGenerating(false);
    }
  };

  const sendReportEmail = async (report, project) => {
    try {
      setLoading(true);
      
      // Usar a função específica para envio de relatório com PDF
      const response = await fetch('/functions/sendClientReportEmail', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${await User.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reportId: report.id,
          clientEmail: project.client_email || 'cliente@empresa.com'
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar relatório');
      }

      const result = await response.json();
      
      await loadReportHistory(project.id);
      toast({
        title: "Relatório enviado!",
        description: result.message || "O relatório foi enviado para o cliente por email com PDF anexado."
      });
      
    } catch (error) {
      console.error('Erro ao enviar relatório:', error);
      toast({
        title: "Erro ao enviar relatório",
        description: `Não foi possível enviar o relatório por email: ${error.message}`,
        variant: "destructive"
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // MODIFIED handleSendReport to use the new sendReportEmail function
  const handleSendReport = async () => {
    if (!selectedProject || !selectedProjectData) {
      toast({
        title: "Erro",
        description: "Selecione um projeto para enviar o relatório.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true); // Set loading at the start of the overall process
      setError(null);

      // 1. Generate the report data using AI
      const generatedData = await handleGenerateReport();
      if (!generatedData) {
        setLoading(false); // Make sure loading is off if generation fails
        return;
      }

      // 2. Save the newly generated/updated report to persist it and get its ID
      const savedReport = await handleSaveReport();
      if (!savedReport || !savedReport.id) {
          toast({
              title: "Erro",
              description: "Não foi possível salvar o relatório para envio do PDF.",
              variant: "destructive"
          });
          setLoading(false);
          return;
      }

      // 3. Send the report via email with PDF attachment using the new function
      // This will use project.client_email and fixed body as per outline's sendReportEmail
      await sendReportEmail(savedReport, selectedProjectData);

      // After successful send, clear email dialog data (even if not directly used by sendReportEmail)
      setEmailData({
        to: '',
        subject: '',
        additionalMessage: ''
      });
      setShowEmailDialog(false);

    } catch (error) {
      // This catch block handles errors propagated from handleGenerateReport, handleSaveReport, or sendReportEmail
      console.error("Erro no processo de envio de relatório:", error);
      // Specific error toasts are handled in the respective functions, this is a general fallback
      toast({
        title: "Erro no processo de envio",
        description: `Não foi possível completar o envio do relatório: ${error.message || 'Erro desconhecido'}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false); // Ensure loading is reset at the end of the overall process
    }
  };

  // Renamed from handleOpenEmail to handleOpenEmailDialog for clarity
  const handleOpenEmailDialog = () => {
    // Optionally fetch client email from project data or user profile if available
    const clientEmail = selectedProjectData?.client_email || "";

    setEmailData({
      to: clientEmail,
      subject: `Relatório Semanal - ${selectedProjectData?.title || 'Projeto'} - ${generateWeekPeriod(currentWeek).formatted}`,
      additionalMessage: "Segue o relatório semanal do projeto conforme combinado."
    });

    setShowEmailDialog(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "no_prazo": return "bg-green-100 text-green-800";
      case "atrasado": return "bg-red-100 text-red-800";
      case "adiantado": return "bg-blue-100 text-blue-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "no_prazo": return "No prazo";
      case "atrasado": return "Atrasado";
      case "adiantado": return "Adiantado";
      default: return "Desconhecido";
    }
  };

  const getHealthColor = (health) => {
    switch (health) {
      case "verde": return "bg-green-100 text-green-800";
      case "amarelo": return "bg-yellow-100 text-yellow-800";
      case "vermelho": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getHealthLabel = (health) => {
    switch (health) {
      case "verde": return "Verde";
      case "amarelo": return "Amarelo";
      case "vermelho": return "Vermelho";
      default: return "Desconhecido";
    }
  };

  // Helper function for status text in email body
  const getStatusText = (status) => {
    switch (status) {
      case 'no_prazo': return 'No Prazo ✅';
      case 'atrasado': return 'Atrasado ⚠️';
      case 'adiantado': return 'Adiantado 🚀';
      default: return 'Status não definido';
    }
  };

  // Helper function for health text in email body
  const getHealthText = (health) => {
    switch (health) {
      case 'verde': return 'Verde (Tudo certo) 💚';
      case 'amarelo': return 'Amarelo (Atenção) 💛';
      case 'vermelho': return 'Vermelho (Crítico) ❤️';
      default: return 'Não avaliado';
    }
  };

  // Helper function to get user name from email
  const getUserName = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email.split('@')[0];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const weekPeriod = generateWeekPeriod(currentWeek);
  const taskData = getTasksForWeek();
  const { completed = [], inProgress = [], blocked = [] } = taskData || { completed: [], inProgress: [], blocked: [] };

  // Use selectedReport or reportData for display
  const currentReportDisplay = selectedReport || reportData;


  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Relatório ao Cliente</h1>
          <p className="text-gray-500 mt-1">Crie relatórios profissionais para seus clientes</p>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowReportHistory(true)}>
            <FileText className="h-4 w-4 mr-2" />
            Histórico de Relatórios
          </Button>

          <Button onClick={handleSaveReport}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>

          <Button variant="default" onClick={handleOpenEmailDialog}>
            <Send className="h-4 w-4 mr-2" />
            Enviar por Email
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Configurar Relatório</CardTitle>
              <CardDescription>
                Selecione o projeto e período para gerar o relatório
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Projeto</label>
                  <Select
                    value={selectedProject}
                    onValueChange={setSelectedProject}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
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
                  <label className="text-sm font-medium">Período</label>
                  <div className="flex items-center gap-2 mt-2">
                    <Button variant="outline" size="sm" onClick={handlePreviousWeek}>
                      <ArrowLeft className="h-4 w-4" />
                    </Button>

                    <div className="text-center flex-1">
                      <div className="font-medium">{weekPeriod.formatted}</div>
                      <div className="text-xs text-gray-500">Semana atual do relatório</div>
                    </div>

                    <Button variant="outline" size="sm" onClick={handleNextWeek}>
                      <ArrowRight className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={handleCurrentWeek}>
                      <Calendar className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <Select
                      value={reportData.status}
                      onValueChange={(val) => setReportData({...reportData, status: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="no_prazo">No prazo</SelectItem>
                        <SelectItem value="atrasado">Atrasado</SelectItem>
                        <SelectItem value="adiantado">Adiantado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Saúde do Projeto</label>
                    <Select
                      value={reportData.health}
                      onValueChange={(val) => setReportData({...reportData, health: val})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a saúde" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verde">Verde</SelectItem>
                        <SelectItem value="amarelo">Amarelo</SelectItem>
                        <SelectItem value="vermelho">Vermelho</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <label className="text-sm font-medium">Progresso (%)</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={reportData.progress}
                      onChange={(e) => setReportData({...reportData, progress: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Justificativa da Saúde</label>
                  <Textarea
                    placeholder="Explique brevemente o motivo da saúde do projeto"
                    value={reportData.healthJustification}
                    onChange={(e) => setReportData({...reportData, healthJustification: e.target.value})}
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t pt-4">
              <div>
                <Button variant="outline" onClick={() => setShowPreview(true)}>
                  <FileText className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Imprimir
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Relatório
                    </>
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>

        <div className="col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Resumo da Semana</CardTitle>
              <CardDescription>
                {weekPeriod.formatted}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="text-sm font-medium mb-1">Tarefas Concluídas</div>
                  <div className="bg-green-50 border border-green-100 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{completed?.length || 0}</span>
                      <Badge variant="outline" className="bg-green-100">
                        Esta semana
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Tarefas em Andamento</div>
                  <div className="bg-blue-50 border border-blue-100 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{inProgress?.length || 0}</span>
                      <Badge variant="outline" className="bg-blue-100">
                        Em progresso
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Bloqueios</div>
                  <div className="bg-red-50 border border-red-100 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{blocked?.length || 0}</span>
                      <Badge variant="outline" className="bg-red-100">
                        Impedimentos
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-sm font-medium mb-1">Reuniões</div>
                  <div className="bg-purple-50 border border-purple-100 rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{getMeetingsForWeek()?.length || 0}</span>
                      <Badge variant="outline" className="bg-purple-100">
                        Realizadas
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo Principal</CardTitle>
            <CardDescription>
              Informações detalhadas do relatório (geradas automaticamente pela IA)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="highlights" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="highlights">Destaques</TabsTrigger>
                <TabsTrigger value="activities">Atividades</TabsTrigger>
                <TabsTrigger value="risks">Riscos</TabsTrigger>
                <TabsTrigger value="next">Próximos Passos</TabsTrigger>
              </TabsList>

              <TabsContent value="highlights">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Destaques da Semana</label>
                    <Textarea
                      placeholder="Clique em 'Gerar Relatório' para preencher automaticamente com IA..."
                      value={reportData.highlights}
                      onChange={(e) => setReportData({...reportData, highlights: e.target.value})}
                      rows={8}
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      💡 Dica: Use o botão "Gerar Relatório" para preencher automaticamente
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="activities">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Concluído esta semana</label>
                    <Textarea
                      placeholder="Será preenchido automaticamente pela IA..."
                      value={reportData.completedItems}
                      onChange={(e) => setReportData({...reportData, completedItems: e.target.value})}
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Em andamento</label>
                    <Textarea
                      placeholder="Será preenchido automaticamente pela IA..."
                      value={reportData.inProgressItems}
                      onChange={(e) => setReportData({...reportData, inProgressItems: e.target.value})}
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Bloqueios/Impedimentos</label>
                    <Textarea
                      placeholder="Será preenchido automaticamente pela IA..."
                      value={reportData.blockers}
                      onChange={(e) => setReportData({...reportData, blockers: e.target.value})}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="risks">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Gestão de Riscos</label>
                    <Textarea
                      placeholder="Será preenchido automaticamente pela IA..."
                      value={reportData.risks}
                      onChange={(e) => setReportData({...reportData, risks: e.target.value})}
                      rows={8}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="next">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Próxima Semana</label>
                    <Textarea
                      placeholder="Será preenchido automaticamente pela IA..."
                      value={reportData.nextWeek}
                      onChange={(e) => setReportData({...reportData, nextWeek: e.target.value})}
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Recomendações</label>
                    <Textarea
                      placeholder="Será preenchido automaticamente pela IA..."
                      value={reportData.recommendations}
                      onChange={(e) => setReportData({...reportData, recommendations: e.target.value})}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="bg-amber-50 border-t">
            <div className="flex items-center gap-2 text-amber-700">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm">
                Conteúdo gerado automaticamente pela IA com base nos dados reais do projeto
              </span>
            </div>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Métricas & KPIs</CardTitle>
            <CardDescription>Indicadores visuais de desempenho</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="burndown" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="burndown">Burndown</TabsTrigger>
                <TabsTrigger value="status">Status</TabsTrigger>
                <TabsTrigger value="orcamento">Orçamento</TabsTrigger>
              </TabsList>

              <TabsContent value="burndown">
                <div className="h-[300px] w-full">
                  <div className="text-sm text-center font-medium mb-2">Burndown do Projeto</div>
                  {currentReportDisplay.metrics.burndown_data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={currentReportDisplay.metrics.burndown_data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="ideal" stroke="#8884d8" activeDot={{ r: 8 }} name="Ideal" />
                        <Line type="monotone" dataKey="real" stroke="#82ca9d" name="Real" />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-gray-500 py-10">Dados de burndown não disponíveis.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="status">
                <div className="h-[300px] w-full">
                  <div className="text-sm text-center font-medium mb-2">Status das Tarefas</div>
                  {currentReportDisplay.metrics.task_status_data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <RPieChart>
                        <Pie
                          data={currentReportDisplay.metrics.task_status_data}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          dataKey="value"
                          label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {currentReportDisplay.metrics.task_status_data.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </RPieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-gray-500 py-10">Dados de status das tarefas não disponíveis.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="orcamento">
                <div className="h-[300px] w-full">
                  <div className="text-sm text-center font-medium mb-2">Orçamento Planejado vs. Real</div>
                  {currentReportDisplay.metrics.budget_data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={currentReportDisplay.metrics.budget_data}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="value" fill="#8884d8" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center text-gray-500 py-10">Dados de orçamento não disponíveis.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview} className="w-full max-w-5xl">
        <DialogContent className="max-w-5xl max-h-[90vh] w-full overflow-auto">
          <DialogHeader>
            <DialogTitle>Visualização do Relatório</DialogTitle>
          </DialogHeader>

          <div ref={reportRef} className="p-6 bg-white">
            <div className="report-content">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold mb-2">Relatório Semanal de Projeto - {selectedProjectData?.title}</h1>
                <p className="text-gray-600">Período: {generateWeekPeriod(currentWeek).formatted}</p>
                <p className="text-gray-500 mt-1">Preparado por: {currentUser?.full_name || "Usuário"}</p>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">1. Visão Geral do Projeto</h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="border rounded-md p-3">
                    <p className="text-sm text-gray-500 mb-1">Status geral</p>
                    <div className="flex items-center">
                      <Badge className={getStatusColor(currentReportDisplay.status)}>
                        {getStatusLabel(currentReportDisplay.status)}
                      </Badge>
                    </div>
                  </div>

                  <div className="border rounded-md p-3">
                    <p className="text-sm text-gray-500 mb-1">Saúde do projeto</p>
                    <div className="flex flex-col">
                      <Badge className={getHealthColor(currentReportDisplay.health)}>
                        {getHealthLabel(currentReportDisplay.health)}
                      </Badge>
                      {currentReportDisplay.healthJustification && (
                        <p className="text-sm mt-1">{currentReportDisplay.healthJustification}</p>
                      )}
                    </div>
                  </div>

                  <div className="border rounded-md p-3">
                    <p className="text-sm text-gray-500 mb-1">Progresso geral</p>
                    <div className="flex items-center gap-2">
                      <Progress value={currentReportDisplay.progress} className="flex-1" />
                      <span className="text-sm font-medium">{currentReportDisplay.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">2. Destaques da Semana</h2>
                <div className="prose max-w-none">
                  {currentReportDisplay.highlights ? (
                    <div dangerouslySetInnerHTML={{ __html: currentReportDisplay.highlights.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <p className="text-gray-500 italic">Não há destaques para esta semana.</p>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">3. Acompanhamento de Atividades</h2>

                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Concluído esta semana:</h3>
                  <div className="prose max-w-none pl-4">
                    {currentReportDisplay.completedItems ? (
                      <div dangerouslySetInnerHTML={{ __html: currentReportDisplay.completedItems.replace(/\n/g, '<br/>') }} />
                    ) : (
                      <p className="text-gray-500 italic">Nenhuma atividade concluída.</p>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-medium mb-2">Em andamento:</h3>
                  <div className="prose max-w-none pl-4">
                    {currentReportDisplay.inProgressItems ? (
                      <div dangerouslySetInnerHTML={{ __html: currentReportDisplay.inProgressItems.replace(/\n/g, '<br/>') }} />
                    ) : (
                      <p className="text-gray-500 italic">Nenhuma atividade em andamento.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Bloqueios/Impedimentos:</h3>
                  <div className="prose max-w-none pl-4">
                    {currentReportDisplay.blockers ? (
                      <div dangerouslySetInnerHTML={{ __html: currentReportDisplay.blockers.replace(/\n/g, '<br/>') }} />
                    ) : (
                      <p className="text-gray-500 italic">Não há bloqueios identificados.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">4. Métricas e KPIs</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="h-[200px]">
                    <p className="text-sm font-medium text-center mb-2">Burndown do Projeto</p>
                    {currentReportDisplay.metrics.burndown_data.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={currentReportDisplay.metrics.burndown_data}
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line type="monotone" dataKey="ideal" stroke="#8884d8" activeDot={{ r: 6 }} name="Ideal" />
                          <Line type="monotone" dataKey="real" stroke="#82ca9d" name="Real" />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-gray-500 text-xs mt-10">Dados de burndown não disponíveis.</div>
                    )}
                  </div>

                  <div className="h-[200px]">
                    <p className="text-sm font-medium text-center mb-2">Status das Tarefas</p>
                    {currentReportDisplay.metrics.task_status_data.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RPieChart>
                          <Pie
                            data={currentReportDisplay.metrics.task_status_data}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={70}
                            dataKey="value"
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          >
                            {currentReportDisplay.metrics.task_status_data.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </RPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-gray-500 text-xs mt-10">Dados de status das tarefas não disponíveis.</div>
                    )}
                  </div>

                  <div className="h-[200px]">
                    <p className="text-sm font-medium text-center mb-2">Orçamento Planejado vs. Real</p>
                    {currentReportDisplay.metrics.budget_data.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={currentReportDisplay.metrics.budget_data}
                          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="text-center text-gray-500 text-xs mt-10">Dados de orçamento não disponíveis.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">5. Gestão de Riscos</h2>
                <div className="prose max-w-none">
                  {currentReportDisplay.risks ? (
                    <div dangerouslySetInnerHTML={{ __html: currentReportDisplay.risks.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <p className="text-gray-500 italic">Não há riscos reportados para este período.</p>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">6. Próxima Semana</h2>
                <div className="prose max-w-none">
                  {currentReportDisplay.nextWeek ? (
                    <div dangerouslySetInnerHTML={{ __html: currentReportDisplay.nextWeek.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <p className="text-gray-500 italic">Não há atividades planejadas para a próxima semana.</p>
                  )}
                </div>
              </div>

              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4 border-b pb-2">7. Recomendações</h2>
                <div className="prose max-w-none">
                  {currentReportDisplay.recommendations ? (
                    <div dangerouslySetInnerHTML={{ __html: currentReportDisplay.recommendations.replace(/\n/g, '<br/>') }} />
                  ) : (
                    <p className="text-gray-500 italic">Não há recomendações para este período.</p>
                  )}
                </div>
              </div>

              {currentReportDisplay.customNotes && (
                <div className="mb-8">
                  <h2 className="text-xl font-bold mb-4 border-b pb-2">Notas Adicionais</h2>
                  <div className="prose max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: currentReportDisplay.customNotes.replace(/\n/g, '<br/>') }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setShowPreview(false)}>
              Fechar
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReportHistory} onOpenChange={setShowReportHistory}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Histórico de Relatórios</DialogTitle>
            <DialogDescription>
              Relatórios anteriores deste projeto
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {reportHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum relatório encontrado no histórico
              </div>
            ) : (
              <ScrollArea className="h-[50vh]">
                <div className="space-y-2">
                  {reportHistory.map((report) => {
                    const startDate = parseISO(report.period_start);
                    const endDate = parseISO(report.period_end);
                    const period = `${format(startDate, 'dd/MM/yyyy', { locale: ptBR })} a ${format(endDate, 'dd/MM/yyyy', { locale: ptBR })}`;

                    return (
                      <div
                        key={report.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                        onClick={() => {
                          const parsedMetrics = report.metrics || { // Corrected: Expect metrics as object directly
                            burndown_data: [], task_status_data: [], budget_data: []
                          };

                          setReportData({
                            status: report.status || "no_prazo",
                            health: report.health || "verde",
                            healthJustification: report.health_justification || "",
                            progress: report.progress || 0,
                            highlights: report.highlights || "",
                            completedItems: report.completed_items || "",
                            inProgressItems: report.in_progress_items || "",
                            blockers: report.blockers || "",
                            risks: report.risks || "",
                            nextWeek: report.next_week || "",
                            recommendations: report.recommendations || "",
                            customNotes: report.custom_notes || "",
                            metrics: parsedMetrics
                          });
                          setSelectedReport({ // Set selectedReport for preview
                            status: report.status || "no_prazo",
                            health: report.health || "verde",
                            healthJustification: report.health_justification || "",
                            progress: report.progress || 0,
                            highlights: report.highlights || "",
                            completedItems: report.completed_items || "",
                            inProgressItems: report.in_progress_items || "",
                            blockers: report.blockers || "",
                            risks: report.risks || "",
                            nextWeek: report.next_week || "",
                            recommendations: report.recommendations || "",
                            customNotes: report.custom_notes || "",
                            metrics: parsedMetrics
                          });

                          setCurrentWeek(startDate);

                          setShowReportHistory(false);
                          toast({
                            title: "Relatório carregado!",
                            description: "O relatório histórico foi carregado para visualização."
                          });
                        }}
                      >
                        <div className="flex justify-between">
                          <div>
                            <div className="font-medium">{report.title || "Relário Semanal"}</div>
                            <div className="text-sm text-gray-500">{period}</div>
                          </div>
                          <Badge className={getHealthColor(report.health || "verde")}>
                            {getHealthLabel(report.health || "verde")}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setShowReportHistory(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Relatório por Email</DialogTitle>
            <DialogDescription>
              O relatório será enviado como PDF em anexo para o e-mail do cliente do projeto.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Para</label>
              <Input
                placeholder="email@cliente.com"
                value={emailData.to}
                onChange={(e) => setEmailData({...emailData, to: e.target.value})}
                disabled // This field is disabled as recipient is now determined by project.client_email
              />
              <p className="text-xs text-gray-500">
                O e-mail do destinatário será o e-mail do cliente configurado no projeto.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Assunto</label>
              <Input
                placeholder="Assunto do email"
                value={emailData.subject}
                onChange={(e) => setEmailData({...emailData, subject: e.target.value})}
                disabled // This field is disabled as subject is now determined automatically
              />
              <p className="text-xs text-gray-500">
                O assunto será gerado automaticamente.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem Adicional</label>
              <Textarea
                placeholder="Texto adicional para o corpo do email"
                value={emailData.additionalMessage}
                onChange={(e) => setEmailData({...emailData, additionalMessage: e.target.value})}
                rows={4}
                disabled // This field is disabled as the body is now fixed by the PDF email template
              />
              <p className="text-xs text-gray-500">
                A mensagem do corpo do e-mail será gerada automaticamente com base no modelo do relatório.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendReport} disabled={loading}>
              <Send className="h-4 w-4 mr-2" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

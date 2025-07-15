
import React, { useState, useEffect } from "react";
import { Project, Task, User, Role } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { format, differenceInDays, addDays, parseISO, addMonths } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  User as UserIcon,
  Users,
  Clock,
  CreditCard,
  Calendar,
  BarChart,
  PieChart,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Zap,
  Loader2,
  RefreshCw,
  PlusCircle,
  Shuffle,
  Settings,
  Brain,
  UserCheck,
  UserMinus,
  UserPlus,
  Target,
  LineChart,
  ArrowRight,
  ChevronRight,
  ChevronDown
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart as RechartsBarChart,
  Bar as RechartsBar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  LineChart as RechartsLineChart,
  Line as RechartsLine,
  PieChart as RechartsPieChart,
  Pie as RechartsPie,
  Cell,
} from "recharts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Static color configs
const COLORS = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];

export default function ResourceAgent() {
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null); // This holds the full project object
  const [resourceAnalysis, setResourceAnalysis] = useState(null);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, tasksData, usersData, rolesData] = await Promise.all([
        Project.list(),
        Task.list(),
        User.list(),
        Role.list()
      ]);

      setProjects(projectsData);
      setTasks(tasksData);
      setUsers(usersData);
      setRoles(rolesData);

      if (projectsData.length > 0) {
        const activeProjects = projectsData.filter(p => p.status !== 'concluído');
        if (activeProjects.length > 0) {
          setSelectedProject(activeProjects[0]);
          // After setting the selected project, trigger analysis
          // We pass current data, but analyzeResources will internally derive from state as well.
          await analyzeResources(activeProjects[0], tasksData, usersData, rolesData); 
        } else if (projectsData.length > 0) {
          setSelectedProject(projectsData[0]);
          await analyzeResources(projectsData[0], tasksData, usersData, rolesData);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Ocorreu um erro ao carregar os dados. Tente novamente mais tarde.");
    } finally {
      setLoading(false);
    }
  };

  const handleProjectChange = async (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      // Trigger analysis for the newly selected project
      await analyzeResources(project, tasks, users, roles); // Pass current state data
    }
  };

  const analyzeResources = async (projectFromParam = null, tasksDataParam = null, usersDataParam = null, rolesDataParam = null) => {
    try {
      setAnalyzing(true);
      setError(null); // Clear previous errors

      // Use state variables if params are not provided (e.g., if called directly by refresh button)
      const currentProject = projectFromParam || selectedProject;
      const allTasks = tasksDataParam || tasks;
      const allUsers = usersDataParam || users;
      const allRoles = rolesDataParam || roles;

      if (!currentProject || !currentProject.id) {
        setError("Nenhum projeto selecionado para análise.");
        setAnalyzing(false);
        return;
      }

      // Filter project-specific data
      const projectTasks = allTasks.filter(t => t.project_id === currentProject.id);

      // --- Static Analysis Calculations (for parts of UI not covered by LLM schema or to feed LLM) ---
      const totalTasks = projectTasks.length;
      const completedTasks = projectTasks.filter(t => t.status === 'concluída').length;
      const pendingTasks = projectTasks.filter(t => t.status === 'pendente').length;
      const inProgressTasks = projectTasks.filter(t => t.status === 'em_andamento').length;
      const blockedTasks = projectTasks.filter(t => t.status === 'bloqueada').length;
      
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

      const assignmentStats = {};
      const roleDistribution = {};
      projectTasks.forEach(task => {
        if (task.assigned_to) {
          assignmentStats[task.assigned_to] = assignmentStats[task.assigned_to] || { total: 0, completed: 0, pending: 0, in_progress: 0 };
          assignmentStats[task.assigned_to].total += 1;
          if (task.status === 'concluída') assignmentStats[task.assigned_to].completed += 1;
          else if (task.status === 'pendente') assignmentStats[task.assigned_to].pending += 1;
          else if (task.status === 'em_andamento') assignmentStats[task.assigned_to].in_progress += 1;
        }
        if (task.role_id) {
          roleDistribution[task.role_id] = roleDistribution[task.role_id] || 0;
          roleDistribution[task.role_id] += 1;
        }
      });

      const workloadScores = Object.keys(assignmentStats).map(email => {
        const stats = assignmentStats[email];
        const user = allUsers.find(u => u.email === email);
        const workloadScore = (stats.pending * 1) + (stats.in_progress * 2);
        return {
          user_email: email,
          user_name: user?.full_name || email,
          tasks_total: stats.total,
          tasks_completed: stats.completed,
          tasks_pending: stats.pending,
          tasks_in_progress: stats.in_progress,
          completion_rate: stats.total > 0 ? (stats.completed / stats.total) * 100 : 0,
          workload_score: workloadScore
        };
      });
      workloadScores.sort((a, b) => b.workload_score - a.workload_score);

      const overloadedUsers = workloadScores
        .filter(score => score.workload_score > 10)
        .map(score => ({
          user_email: score.user_email,
          user_name: score.user_name,
          workload_score: score.workload_score,
          reason: `${score.tasks_pending} tarefas pendentes e ${score.tasks_in_progress} em andamento`
        }));
      
      const underutilizedUsers = workloadScores
        .filter(score => score.workload_score < 3 && score.tasks_total > 0)
        .map(score => ({
          user_email: score.user_email,
          user_name: score.user_name,
          workload_score: score.workload_score,
          reason: `Apenas ${score.tasks_pending} tarefas pendentes e ${score.tasks_in_progress} em andamento`
        }));

      const roleData = Object.keys(roleDistribution).map(roleId => {
        const role = allRoles.find(r => r.id === roleId);
        return {
          role_id: roleId,
          role_name: role?.title || "Função Desconhecida",
          count: roleDistribution[roleId]
        };
      });
      
      // --- LLM Integration ---
      const today = new Date();
      const projectStart = parseISO(currentProject.start_date);
      const projectEnd = parseISO(currentProject.deadline);
      
      // Ensure valid dates before calculating differences
      const projectDurationDays = isNaN(projectEnd.getTime()) || isNaN(projectStart.getTime()) 
                                   ? 0 
                                   : differenceInDays(projectEnd, projectStart);
      const remainingDays = isNaN(projectEnd.getTime()) || isNaN(today.getTime()) 
                              ? 0 
                              : differenceInDays(projectEnd, today);

      const prompt = `
        Você é um especialista em gestão de recursos de projetos de TI. Analise o projeto e otimize a alocação de recursos.

        DADOS DO PROJETO:
        - Nome: ${currentProject.title}
        - Status: ${currentProject.status}
        - Progresso: ${currentProject.progress || 0}%
        - Duração Total: ${projectDurationDays} dias
        - Dias Restantes: ${remainingDays}
        - Total de Tarefas: ${totalTasks}
        - Tarefas por Status:
          * Concluídas: ${completedTasks}
          * Em Andamento: ${inProgressTasks}
          * Pendentes: ${pendingTasks}
          * Bloqueadas: ${blockedTasks}
        - Orçamento Total: R$ ${currentProject.total_estimated_cost || 0}
        - Custo Infraestrutura: R$ ${currentProject.infrastructure_cost || 0}

        Data atual: ${format(today, 'yyyy-MM-dd')}

        Analise considerando:
        1. Alocação atual da equipe: ${JSON.stringify(workloadScores.map(ws => ({ user: ws.user_name, score: ws.workload_score })))}
        2. Capacidade vs demanda
        3. Gargalos e sobrecarga
        4. Eficiência e produtividade
        5. Custos e orçamento
        6. Cronograma e prioridades
        7. Competências necessárias

        Retorne um JSON com esta estrutura:
        {
          "summary": {
            "efficiency_score": 85,
            "utilization_rate": "75%",
            "cost_efficiency": "média",
            "bottlenecks_count": 2,
            "optimization_potential": "médio"
          },
          "current_allocation": {
            "team_size": 5,
            "roles_distribution": {
              "developers": 3,
              "designers": 1,
              "testers": 1
            },
            "workload_balance": "equilibrado"
          },
          "bottlenecks": [
            {
              "type": "resource",
              "description": "Exemplo de gargalo: Usuário X sobrecarregado.",
              "impact": "alto",
              "solution": "Redistribuir tarefas para usuário Y."
            }
          ],
          "optimizations": [
            {
              "title": "Título da Otimização",
              "description": "Descrição detalhada",
              "type": "realocação",
              "expected_benefit": "Benefício esperado",
              "effort": "baixo",
              "timeline": "Prazo para implementar",
              "cost_impact": "Impacto no custo"
            }
          ],
          "recommendations": [
            {
              "priority": "alta",
              "action": "Ação recomendada",
              "rationale": "Justificativa",
              "deadline": "Prazo recomendado"
            }
          ]
        }
      `;

      const llmResponse = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: {
              type: "object",
              properties: {
                efficiency_score: { type: "number", description: "Pontuação de eficiência do projeto (0-100)" },
                utilization_rate: { type: "string", description: "Taxa de utilização da equipe em porcentagem (ex: '75%')" },
                cost_efficiency: { type: "string", enum: ["baixa", "média", "alta"], description: "Eficiência de custo do projeto" },
                bottlenecks_count: { type: "number", description: "Número de gargalos identificados" },
                optimization_potential: { type: "string", enum: ["baixo", "médio", "alto"], description: "Potencial geral de otimização" }
              },
              required: ["efficiency_score", "utilization_rate", "cost_efficiency", "bottlenecks_count", "optimization_potential"]
            },
            current_allocation: {
              type: "object",
              properties: {
                team_size: { type: "number", description: "Número total de membros na equipe do projeto" },
                roles_distribution: { type: "object", additionalProperties: { type: "number" }, description: "Distribuição de membros por função" },
                workload_balance: { type: "string", enum: ["equilibrado", "sobrecarregado", "subutilizado", "misto"], description: "Avaliação do equilíbrio da carga de trabalho" }
              },
              required: ["team_size", "roles_distribution", "workload_balance"]
            },
            bottlenecks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["recurso", "habilidade", "processo"], description: "Tipo de gargalo" },
                  description: { type: "string", description: "Descrição detalhada do gargalo" },
                  impact: { type: "string", enum: ["baixo", "médio", "alto"], description: "Impacto do gargalo no projeto" },
                  solution: { type: "string", description: "Solução proposta para o gargalo" }
                },
                required: ["type", "description", "impact", "solution"]
              }
            },
            optimizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string", description: "Título da estratégia de otimização" },
                  description: { type: "string", description: "Descrição detalhada da otimização" },
                  type: { type: "string", enum: ["realocação", "treinamento", "contratação", "processo", "ferramenta"], description: "Tipo de otimização" },
                  expected_benefit: { type: "string", description: "Benefício esperado da implementação" },
                  effort: { type: "string", enum: ["baixo", "médio", "alto"], description: "Esforço para implementar a otimização" },
                  timeline: { type: "string", description: "Prazo estimado para implementação (ex: '3 semanas', '1 mês')" },
                  cost_impact: { type: "string", description: "Impacto financeiro estimado (ex: 'R$ 5.000', 'Neutro', 'Economia de R$ 10.000')" }
                },
                required: ["title", "description", "type", "expected_benefit", "effort", "timeline", "cost_impact"]
              }
            },
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string", enum: ["baixa", "média", "alta", "crítica"], description: "Prioridade da recomendação" },
                  action: { type: "string", description: "Ação específica a ser tomada" },
                  rationale: { type: "string", description: "Justificativa para a ação recomendada" },
                  deadline: { type: "string", description: "Prazo recomendado para concluir a ação (ex: 'DD/MM/YYYY', 'fim do mês')" }
                },
                required: ["priority", "action", "rationale", "deadline"]
              }
            }
          },
          required: ["summary", "current_allocation", "bottlenecks", "optimizations", "recommendations"]
        }
      });
      
      // --- Combine Static and LLM Analysis for UI Display ---
      const combinedAnalysis = {
        project_id: currentProject.id,
        generated_date: new Date().toISOString(),
        
        // Metrics (primarily from static calculation, augmented by LLM summary)
        metrics: {
          total_tasks: totalTasks,
          completed_tasks: completedTasks,
          pending_tasks: pendingTasks,
          in_progress_tasks: inProgressTasks,
          completion_rate: completionRate,
          team_utilization: parseFloat(llmResponse.summary?.utilization_rate || "0%") || 0,
          efficiency_score: llmResponse.summary?.efficiency_score || 0
        },
        
        // Resource Allocation (from static calculation, augmented by LLM current_allocation & bottlenecks)
        resource_allocation: {
          workload_scores: workloadScores,
          role_distribution: roleData,
          overloaded_resources: overloadedUsers, // from static analysis
          underutilized_resources: underutilizedUsers, // from static analysis
          llm_bottlenecks: llmResponse.bottlenecks || [], // LLM identified bottlenecks
          llm_current_allocation: llmResponse.current_allocation // LLM's view on current allocation
        },
        
        // Recommendations (from LLM)
        recommendations: llmResponse.recommendations || [],

        // Workload Analysis (partially from static, partially new from LLM)
        workload_analysis: {
          current_allocation: workloadScores.map(score => ({ // Re-using static workload scores for visual
            user_email: score.user_email,
            user_name: score.user_name,
            allocation_percentage: Math.min(100, score.workload_score * 5),
            tasks_count: score.tasks_total,
            status: score.workload_score > 10 ? "overloaded" : score.workload_score < 3 && score.tasks_total > 0 ? "underutilized" : "balanced"
          })),
          // Historical data and skill bottlenecks are not provided by the new LLM schema
          // Keep placeholders or adapt as 'not available'
          historical_data: [], 
          skill_bottlenecks: llmResponse.bottlenecks?.filter(b => b.type === 'habilidade').map(b => ({
            skill: b.description.split(' ')[0] || "Habilidade", // Basic parsing
            impact_score: b.impact === 'alto' ? 85 : b.impact === 'médio' ? 70 : 50,
            affected_tasks: 0 // Not available from LLM schema directly
          })) || []
        },

        // Optimization Strategies (from LLM)
        optimization_strategies: llmResponse.optimizations || [],
        
        // Skills Assessment (not directly provided by the new LLM schema)
        // Keeping a placeholder structure or showing 'not available'
        skills_assessment: {
          project_requirements: [],
          team_coverage: {
            overall_percentage: 0,
            skill_gaps: llmResponse.bottlenecks?.filter(b => b.type === 'habilidade').map(b => ({
              skill: b.description.split(' ')[0] || "Habilidade",
              gap_severity: b.impact,
              impact: b.description
            })) || []
          },
          training_recommendations: llmResponse.recommendations?.filter(r => r.action.toLowerCase().includes('treinamento')).map(r => ({
            skill: r.action.split(' em ')[1] || "Geral",
            participants: [], // LLM doesn't specify
            priority: r.priority
          })) || []
        },

        // Timeline Projection (static for now, not from LLM)
        timeline_projection: {
          baseline_end_date: currentProject.deadline,
          optimized_end_date: currentProject.deadline // LLM doesn't directly provide an optimized date
        },
      };

      setResourceAnalysis(combinedAnalysis);
      
    } catch (error) {
      console.error("Erro ao analisar recursos:", error);
      setError("Ocorreu um erro ao analisar os recursos do projeto: " + (error.message || "Detalhes desconhecidos."));
      setResourceAnalysis(null); // Clear previous analysis on error
    } finally {
      setAnalyzing(false);
    }
  };

  // Format functions
  const formatDate = (dateString) => {
    if (!dateString) return "Data não definida";
    try {
      return format(parseISO(dateString), "dd/MM/yyyy");
    } catch (error) {
      return dateString;
    }
  };

  const getUserInitials = (email) => {
    if (!email) return "?";
    
    const user = users.find(u => u.email === email);
    if (user?.full_name) {
      const nameParts = user.full_name.split(" ");
      if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
      }
      return user.full_name[0].toUpperCase();
    }
    
    const namePart = email.split('@')[0];
    const parts = namePart.split('.');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return namePart.substring(0, 2).toUpperCase();
  };

  const getUserName = (email) => {
    if (!email) return "Não atribuído";
    
    const user = users.find(u => u.email === email);
    if (user?.full_name) {
      return user.full_name;
    }
    
    return email.split('@')[0].replace('.', ' ');
  };

  const getWorkloadColor = (score) => {
    if (score > 10) return "text-red-500";
    if (score > 5) return "text-amber-500";
    return "text-green-500";
  };

  // Rendering functions
  if (loading) {
    return (
      <div className="container mx-auto py-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary mb-4" />
          <h3 className="text-lg font-medium">Carregando...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UserCheck className="h-7 w-7 text-indigo-500" />
            Otimização de Recursos
          </h1>
          <p className="text-gray-500 mt-1">
            Análise e recomendações para otimização de recursos do projeto
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
          <Select value={selectedProject?.id} onValueChange={handleProjectChange}>
            <SelectTrigger className="w-[250px]">
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
          
          <Button 
            variant="outline"
            onClick={() => analyzeResources()} // Call without parameters
            disabled={analyzing || !selectedProject}
          >
            {analyzing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            Atualizar
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {selectedProject && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xl">{selectedProject.title}</CardTitle>
              <CardDescription>
                {selectedProject.status === "concluído" ? (
                  <Badge className="bg-green-100 text-green-800 mr-2">Concluído</Badge>
                ) : (
                  <Badge className="bg-blue-100 text-blue-800 mr-2">{selectedProject.status}</Badge>
                )}
                Prazo: {formatDate(selectedProject.deadline)}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-6 mt-4">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Responsável</div>
                  <div className="flex items-center">
                    <Avatar className="h-6 w-6 mr-2">
                      <AvatarFallback>{getUserInitials(selectedProject.responsible)}</AvatarFallback>
                    </Avatar>
                    <span>{getUserName(selectedProject.responsible)}</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Progresso</div>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedProject.progress || 0} className="w-24 h-2" />
                    <span className="font-medium">{selectedProject.progress || 0}%</span>
                  </div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-500 mb-1">Equipe</div>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{selectedProject.participants?.length || 0} membros</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {analyzing ? (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <h3 className="text-lg font-medium mb-2">Analisando recursos do projeto...</h3>
                  <p className="text-gray-500 text-center max-w-md">
                    Estamos calculando métricas de produtividade, distribuição de trabalho e 
                    gerando recomendações para otimização.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : resourceAnalysis ? (
            <>
              <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="workload">Carga de Trabalho</TabsTrigger>
                  <TabsTrigger value="optimization">Otimização</TabsTrigger>
                  <TabsTrigger value="skills">Competências</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Tarefas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resourceAnalysis.metrics && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center p-3 bg-gray-50 rounded-lg">
                                <div className="text-3xl font-bold text-gray-900">
                                  {resourceAnalysis.metrics.total_tasks}
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Total</div>
                              </div>
                              
                              <div className="text-center p-3 bg-green-50 rounded-lg">
                                <div className="text-3xl font-bold text-green-700">
                                  {resourceAnalysis.metrics.completed_tasks}
                                </div>
                                <div className="text-sm text-green-600 mt-1">Concluídas</div>
                              </div>
                              
                              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                <div className="text-3xl font-bold text-yellow-700">
                                  {resourceAnalysis.metrics.pending_tasks}
                                </div>
                                <div className="text-sm text-yellow-600 mt-1">Pendentes</div>
                              </div>
                              
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <div className="text-3xl font-bold text-blue-700">
                                  {resourceAnalysis.metrics.in_progress_tasks}
                                </div>
                                <div className="text-sm text-blue-600 mt-1">Em Andamento</div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-500">Taxa de Conclusão</span>
                                <span className="text-sm font-medium">
                                  {resourceAnalysis.metrics.completion_rate.toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={resourceAnalysis.metrics.completion_rate} 
                                className="h-2" 
                              />
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Utilização da Equipe</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resourceAnalysis.metrics && (
                          <div className="space-y-4">
                            <div className="text-center p-4">
                              <div className="inline-flex items-center justify-center p-4 bg-indigo-50 rounded-full">
                                <UserCheck className="h-8 w-8 text-indigo-600" />
                              </div>
                              <div className="mt-4">
                                <div className="text-3xl font-bold text-gray-900">
                                  {resourceAnalysis.metrics.team_utilization.toFixed(0)}%
                                </div>
                                <div className="text-sm text-gray-500 mt-1">Taxa de Utilização</div>
                              </div>
                            </div>
                            
                            <div>
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-500">Utilização</span>
                                <span className="text-sm font-medium">
                                  {resourceAnalysis.metrics.team_utilization.toFixed(1)}%
                                </span>
                              </div>
                              <Progress 
                                value={resourceAnalysis.metrics.team_utilization} 
                                className="h-2" 
                              />
                            </div>
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-sm text-gray-500">Eficiência</span>
                                <span className="text-sm font-medium">
                                  {resourceAnalysis.metrics.efficiency_score.toFixed(0)}%
                                </span>
                              </div>
                              <Progress 
                                value={resourceAnalysis.metrics.efficiency_score} 
                                className="h-2" 
                                indicatorColor={
                                  resourceAnalysis.metrics.efficiency_score > 70 ? "bg-green-500" :
                                  resourceAnalysis.metrics.efficiency_score > 50 ? "bg-amber-500" :
                                  "bg-red-500"
                                }
                              />
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Distribuição por Perfil</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resourceAnalysis.resource_allocation?.role_distribution && 
                         resourceAnalysis.resource_allocation.role_distribution.length > 0 ? (
                          <div className="h-[180px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsPieChart>
                                <RechartsPie
                                  data={resourceAnalysis.resource_allocation.role_distribution}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  outerRadius={70}
                                  fill="#8884d8"
                                  dataKey="count"
                                  nameKey="role_name"
                                >
                                  {resourceAnalysis.resource_allocation.role_distribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                  ))}
                                </RechartsPie>
                                <RechartsTooltip formatter={(value, name) => [`${value} tarefas`, name]} />
                                <Legend verticalAlign="bottom" height={36} />
                              </RechartsPieChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <PieChart className="h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-gray-500">Não há dados de perfil disponíveis</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          Recursos Sobrecarregados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resourceAnalysis.resource_allocation?.overloaded_resources?.length > 0 ? (
                          <div className="space-y-4">
                            {resourceAnalysis.resource_allocation.overloaded_resources.map((resource, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-red-50 border-red-100">
                                <Avatar>
                                  <AvatarFallback>{getUserInitials(resource.user_email)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{resource.user_name}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Score de sobrecarga: <span className="text-red-600 font-medium">{resource.workload_score}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">{resource.reason}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                            <p className="text-gray-600">Nenhum recurso sobrecarregado identificado</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <UserMinus className="h-5 w-5 text-blue-500" />
                          Recursos Subutilizados
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resourceAnalysis.resource_allocation?.underutilized_resources?.length > 0 ? (
                          <div className="space-y-4">
                            {resourceAnalysis.resource_allocation.underutilized_resources.map((resource, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg bg-blue-50 border-blue-100">
                                <Avatar>
                                  <AvatarFallback>{getUserInitials(resource.user_email)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{resource.user_name}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    Score de utilização: <span className="text-blue-600 font-medium">{resource.workload_score}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">{resource.reason}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                            <p className="text-gray-600">Nenhum recurso subutilizado identificado</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-indigo-500" />
                        Recomendações de Otimização
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {resourceAnalysis.recommendations?.length > 0 ? (
                        <div className="space-y-4">
                          {resourceAnalysis.recommendations.map((recommendation, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-indigo-50 border-indigo-100">
                              <div className="flex items-start">
                                <div className="mr-3 mt-0.5">
                                  {recommendation.priority === "alta" ? (
                                    <Badge className="bg-red-100 text-red-800">Alta Prioridade</Badge>
                                  ) : recommendation.priority === "média" ? (
                                    <Badge className="bg-yellow-100 text-yellow-800">Média Prioridade</Badge>
                                  ) : (
                                    <Badge className="bg-blue-100 text-blue-800">Baixa Prioridade</Badge>
                                  )}
                                </div>
                                <div>
                                  <h4 className="font-medium">{recommendation.action}</h4>
                                  <p className="text-gray-600 mt-1">{recommendation.rationale}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                          <p className="text-gray-600">Nenhuma recomendação de otimização necessária</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="workload" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-500" />
                        Alocação Atual da Equipe
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {resourceAnalysis.workload_analysis?.current_allocation?.length > 0 ? (
                        <div className="space-y-6">
                          {resourceAnalysis.workload_analysis.current_allocation.map((member, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getUserInitials(member.user_email)}</AvatarFallback>
                                  </Avatar>
                                  <span className="font-medium">{member.user_name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-500">{member.tasks_count} tarefas</span>
                                  {member.status === "overloaded" ? (
                                    <Badge className="bg-red-100 text-red-800">Sobrecarregado</Badge>
                                  ) : member.status === "underutilized" ? (
                                    <Badge className="bg-blue-100 text-blue-800">Subutilizado</Badge>
                                  ) : (
                                    <Badge className="bg-green-100 text-green-800">Balanceado</Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Alocação</span>
                                  <span>{member.allocation_percentage}%</span>
                                </div>
                                <Progress 
                                  value={member.allocation_percentage} 
                                  className="h-2" 
                                  indicatorColor={
                                    member.status === "overloaded" ? "bg-red-500" : 
                                    member.status === "underutilized" ? "bg-blue-500" : 
                                    "bg-green-500"
                                  }
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Users className="h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-gray-500">Dados de alocação não disponíveis</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BarChart className="h-5 w-5 text-indigo-500" />
                          Histórico de Utilização
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resourceAnalysis.workload_analysis?.historical_data?.length > 0 ? (
                          <div className="h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <RechartsBarChart
                                data={resourceAnalysis.workload_analysis.historical_data}
                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="month" />
                                <YAxis label={{ value: 'Utilização (%)', angle: -90, position: 'insideLeft' }} />
                                <RechartsTooltip />
                                <RechartsBar dataKey="average_utilization" fill="#8884d8" name="Utilização Média" />
                              </RechartsBarChart>
                            </ResponsiveContainer>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <BarChart className="h-10 w-10 text-gray-300 mb-2" />
                            <p className="text-gray-500">Histórico não disponível</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-yellow-500" />
                          Gargalos de Habilidades
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resourceAnalysis.workload_analysis?.skill_bottlenecks?.length > 0 ? (
                          <div className="space-y-4">
                            {resourceAnalysis.workload_analysis.skill_bottlenecks.map((bottleneck, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between">
                                  <div className="font-medium">{bottleneck.skill}</div>
                                  <Badge className="bg-amber-100 text-amber-800">
                                    {bottleneck.affected_tasks} tarefas afetadas
                                  </Badge>
                                </div>
                                <div>
                                  <div className="flex justify-between text-xs mb-1">
                                    <span>Impacto</span>
                                    <span>{bottleneck.impact_score}%</span>
                                  </div>
                                  <Progress value={bottleneck.impact_score} className="h-2" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                            <p className="text-gray-500">Nenhum gargalo significativo identificado</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="optimization" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Zap className="h-5 w-5 text-indigo-500" />
                        Estratégias de Otimização
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {resourceAnalysis.optimization_strategies?.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {resourceAnalysis.optimization_strategies.map((strategy, index) => (
                            <div key={index} className="bg-indigo-50 rounded-lg p-5 border border-indigo-100">
                              <h3 className="font-medium text-lg text-indigo-900 mb-2">{strategy.title}</h3>
                              <p className="text-indigo-800 mb-4">{strategy.description}</p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                                  {strategy.expected_benefit}
                                </Badge>
                                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                                  Esforço: {strategy.effort}
                                </Badge>
                                <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                                  Prazo: {strategy.timeline}
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <Zap className="h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-gray-500">Estratégias de otimização não disponíveis</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-indigo-500" />
                          Impacto no Cronograma
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-center py-10">
                          <div className="text-center">
                            <h3 className="text-lg text-gray-500">Em desenvolvimento</h3>
                            <p className="text-sm text-gray-400 mt-2">
                              A análise de impacto no cronograma será disponibilizada em breve.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <DollarSign className="h-5 w-5 text-indigo-500" />
                          Impacto nos Custos
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-center py-10">
                          <div className="text-center">
                            <h3 className="text-lg text-gray-500">Em desenvolvimento</h3>
                            <p className="text-sm text-gray-400 mt-2">
                              A análise de impacto nos custos será disponibilizada em breve.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="skills" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <UserCheck className="h-5 w-5 text-indigo-500" />
                        Competências Necessárias
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {resourceAnalysis.skills_assessment?.project_requirements?.length > 0 ? (
                        <div className="space-y-6">
                          {resourceAnalysis.skills_assessment.project_requirements.map((skill, index) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <h3 className="font-medium">{skill.name}</h3>
                                <div className="flex items-center gap-2">
                                  <Badge className={
                                    skill.coverage > 70 ? "bg-green-100 text-green-800" : 
                                    skill.coverage > 40 ? "bg-amber-100 text-amber-800" : 
                                    "bg-red-100 text-red-800"
                                  }>
                                    Cobertura: {skill.coverage}%
                                  </Badge>
                                </div>
                              </div>
                              
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span>Cobertura na Equipe</span>
                                  <span>{skill.coverage}%</span>
                                </div>
                                <Progress value={skill.coverage} className="h-2 mb-3" />
                              </div>
                              
                              <div className="flex flex-wrap gap-2">
                                {skill.members.map((member, midx) => (
                                  <div key={midx} className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded-full text-xs">
                                    <Avatar className="h-4 w-4">
                                      <AvatarFallback className="text-[8px]">{getUserInitials(member.email)}</AvatarFallback>
                                    </Avatar>
                                    <span>{member.level}</span>
                                  </div>
                                ))}
                                {skill.members.length === 0 && (
                                  <div className="text-xs text-gray-500">Nenhum membro com esta habilidade</div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <UserCheck className="h-10 w-10 text-gray-300 mb-2" />
                          <p className="text-gray-500">Análise de competências não disponível</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                          Lacunas de Competências
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resourceAnalysis.skills_assessment?.team_coverage?.skill_gaps?.length > 0 ? (
                          <div className="space-y-4">
                            {resourceAnalysis.skills_assessment.team_coverage.skill_gaps.map((gap, index) => (
                              <div key={index} className="p-4 border rounded-lg bg-amber-50 border-amber-100">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-medium text-amber-900">{gap.skill}</h3>
                                  <Badge className={
                                    gap.gap_severity === "high" ? "bg-red-100 text-red-800" : 
                                    gap.gap_severity === "medium" ? "bg-amber-100 text-amber-800" : 
                                    "bg-yellow-100 text-yellow-800"
                                  }>
                                    {gap.gap_severity === "high" ? "Alta" : 
                                     gap.gap_severity === "medium" ? "Média" : "Baixa"} Severidade
                                  </Badge>
                                </div>
                                <p className="text-amber-800 mt-2 text-sm">{gap.impact}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                            <p className="text-gray-500">Nenhuma lacuna significativa identificada</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-indigo-500" />
                          Recomendações de Treinamento
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {resourceAnalysis.skills_assessment?.training_recommendations?.length > 0 ? (
                          <div className="space-y-4">
                            {resourceAnalysis.skills_assessment.training_recommendations.map((rec, index) => (
                              <div key={index} className="p-4 border rounded-lg bg-indigo-50 border-indigo-100">
                                <div className="flex justify-between items-start">
                                  <h3 className="font-medium text-indigo-900">{rec.skill}</h3>
                                  <Badge className={
                                    rec.priority === "high" ? "bg-red-100 text-red-800" : 
                                    rec.priority === "medium" ? "bg-amber-100 text-amber-800" : 
                                    "bg-blue-100 text-blue-800"
                                  }>
                                    {rec.priority === "high" ? "Alta" : 
                                     rec.priority === "medium" ? "Média" : "Baixa"} Prioridade
                                  </Badge>
                                </div>
                                <div className="mt-2">
                                  <div className="text-sm text-gray-600">Participantes:</div>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {rec.participants.map((email, pidx) => (
                                      <div key={pidx} className="flex items-center gap-1 bg-white px-2 py-1 rounded-full text-xs border border-gray-200">
                                        <Avatar className="h-4 w-4">
                                          <AvatarFallback className="text-[8px]">{getUserInitials(email)}</AvatarFallback>
                                        </Avatar>
                                        <span>{getUserName(email).split(' ')[0]}</span>
                                      </div>
                                    ))}
                                    {rec.participants.length === 0 && (
                                      <span className="text-xs text-gray-500">Não especificado</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-center">
                            <CheckCircle className="h-10 w-10 text-green-500 mb-2" />
                            <p className="text-gray-500">Nenhuma recomendação de treinamento necessária</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-center">
                  <Brain className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-medium mb-2">Análise de Recursos não Disponível</h3>
                  <p className="text-gray-500 max-w-md mb-4">
                    Inicie uma análise de recursos para este projeto para visualizar recomendações 
                    de otimização e distribuição de trabalho.
                  </p>
                  <Button onClick={() => analyzeResources()}>
                    <Zap className="h-4 w-4 mr-2" />
                    Analisar Recursos
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

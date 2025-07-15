
import React, { useState, useEffect } from "react";
import { Project, Task, Meeting, User, Note } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { createPageUrl } from "@/utils";
import { format, differenceInDays, addDays, isAfter, parseISO } from "date-fns";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertTriangle,
  Calendar,
  Clock,
  ExternalLink,
  Filter,
  Search,
  Send,
  Sparkles,
  ThumbsUp,
  Zap,
  Lightbulb,
  ClipboardCheck,
  Loader2,
  Brain,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  BarChart2,
  Info,
  GitBranch,
  Bug,
  TrendingUp,
  TrendingDown,
  Award,
  Activity,
  LineChart,
  PieChart,
  Eye,
  History,
  ChevronsRight,
  ChevronsLeft,
  ListTodo,
  Users,
  LayoutDashboard,
  HelpCircle,
  Settings,
  Plus,
  Flag,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  FileText,
  Target,
  User as UserIcon
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip as RechartsTooltip,
  LineChart as LineChartRecharts,
  Line,
  PieChart as PieChartRecharts,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from "recharts";

export default function RiskAgent() {
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [riskAnalysis, setRiskAnalysis] = useState(null);
  const [riskHistory, setRiskHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState(null);
  const [projectNote, setProjectNote] = useState("");

  const COLORS = ['#ff4d4f', '#faad14', '#52c41a', '#1890ff', '#722ed1'];
  const RISK_COLORS = {
    high: '#ff4d4f', // for alto
    medium: '#faad14', // for médio
    low: '#52c41a' // for baixo
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData] = await Promise.all([
        Project.list(),
        // Tasks and Meetings are now filtered per project in analyzeRisks
        // No need to load all here initially
      ]);

      setProjects(projectsData);
      
      if (projectsData.length > 0) {
        const project = projectsData[0];
        setSelectedProject(project);
        await analyzeRisks(); // Call the new analyze function
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
      await analyzeRisks(); // Call the new analyze function
    }
  };

  const analyzeRisks = async () => {
    if (!selectedProject) return;

    try {
      setAnalyzing(true);
      setRiskAnalysis(null); // Clear previous analysis

      const project = selectedProject; // selectedProject is already the project object
      const projectTasks = await Task.filter({ project_id: selectedProject.id });
      const projectMeetings = await Meeting.filter({ project_id: selectedProject.id });
      
      const today = new Date();
      const projectDeadline = new Date(project.deadline);
      const daysUntilDeadline = Math.ceil((projectDeadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      const prompt = `
        Você é um especialista em análise de riscos de projetos de TI. Analise o projeto abaixo e identifique riscos potenciais.

        DADOS DO PROJETO:
        - Nome: ${project.title}
        - Status: ${project.status}
        - Progresso: ${project.progress}%
        - Prazo: ${project.deadline}
        - Dias até o prazo: ${daysUntilDeadline}
        - Total de Tarefas: ${projectTasks.length}
        - Tarefas Bloqueadas: ${projectTasks.filter(t => t.status === 'bloqueada').length}
        - Tarefas Concluídas: ${projectTasks.filter(t => t.status === 'concluída').length}
        - Reuniões Realizadas: ${projectMeetings.length}
        - Orçamento: R$ ${project.total_estimated_cost || 0}

        Data atual: ${today.toISOString().split('T')[0]}

        Analise os riscos considerando:
        1. Cronograma e prazos
        2. Escopo e complexidade
        3. Recursos e equipe
        4. Tecnologia e dependências
        5. Orçamento e custos
        6. Qualidade e testes
        7. Comunicação e stakeholders

        Para cada risco, considere:
        - Probabilidade (baixa, média, alta)
        - Impacto (baixo, médio, alto)
        - Categoria do risco
        - Plano de mitigação específico
        - Indicadores de monitoramento
        - Responsável pela mitigação

        Retorne um JSON com esta estrutura:
        {
          "summary": {
            "total_risks": 0,
            "high_priority": 0,
            "medium_priority": 0,
            "low_priority": 0,
            "overall_risk_level": "baixo|médio|alto"
          },
          "risks": [
            {
              "title": "Nome do Risco",
              "description": "Descrição detalhada",
              "category": "cronograma|escopo|recursos|tecnologia|orçamento|qualidade|comunicação",
              "probability": "baixa|média|alta",
              "impact": "baixo|médio|alto",
              "risk_level": "baixo|médio|alto",
              "mitigation_plan": "Plano detalhado de mitigação",
              "monitoring_indicators": ["indicador1", "indicador2"],
              "responsible": "Responsável pela mitigação",
              "timeline": "Prazo para implementar mitigação"
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
                total_risks: { type: "number" },
                high_priority: { type: "number" },
                medium_priority: { type: "number" },
                low_priority: { type: "number" },
                overall_risk_level: { type: "string", enum: ["baixo", "médio", "alto"] }
              },
              required: ["total_risks", "high_priority", "medium_priority", "low_priority", "overall_risk_level"]
            },
            risks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  category: { type: "string", enum: ["cronograma", "escopo", "recursos", "tecnologia", "orçamento", "qualidade", "comunicação"] },
                  probability: { type: "string", enum: ["baixa", "média", "alta"] },
                  impact: { type: "string", enum: ["baixo", "médio", "alto"] },
                  risk_level: { type: "string", enum: ["baixo", "médio", "alto"] },
                  mitigation_plan: { type: "string" },
                  monitoring_indicators: { type: "array", items: { type: "string" } },
                  responsible: { type: "string" },
                  timeline: { type: "string" }
                },
                required: ["title", "description", "category", "probability", "impact", "risk_level", "mitigation_plan", "monitoring_indicators", "responsible", "timeline"]
              }
            }
          },
          required: ["summary", "risks"]
        }
      });
      
      setRiskAnalysis(response);
      
      const historyEntry = {
        date: new Date().toISOString(),
        projectId: selectedProject.id,
        analysis: response // Store the new structure
      };
      
      setRiskHistory(prev => [historyEntry, ...prev]);
      
      // Removed automatic note creation as per new prompt structure and outline
      // The outline explicitly provides the new analyzeRisks function, which does not include note creation.
      // If desired, this functionality would need to be re-added and adapted to the new schema.
      
    } catch (error) {
      console.error("Erro na análise de riscos:", error);
      setError("Ocorreu um erro ao analisar os riscos do projeto.");
    } finally {
      setAnalyzing(false);
    }
  };

  const getOverallRiskColor = (overallRiskLevel) => {
    if (!overallRiskLevel) return "bg-gray-100 text-gray-800 border-gray-200 text-sm font-normal";
    
    switch (overallRiskLevel.toLowerCase()) {
      case 'alto':
        return "bg-red-100 text-red-800 border-red-200 text-sm font-normal";
      case 'médio':
        return "bg-yellow-100 text-yellow-800 border-yellow-200 text-sm font-normal";
      case 'baixo':
        return "bg-green-100 text-green-800 border-green-200 text-sm font-normal";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200 text-sm font-normal";
    }
  };
  
  const getSeverityColor = (riskLevel) => {
    switch (riskLevel.toLowerCase()) {
      case "alto": return "bg-red-100 text-red-800 border-red-200";
      case "médio": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "baixo": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  const getSeverityIcon = (riskLevel) => {
    switch (riskLevel.toLowerCase()) {
      case "alto": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "médio": return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      case "baixo": return <Info className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  const handleNoteSubmit = async () => {
    if (projectNote.trim() && selectedProject) {
      try {
        await Note.create({
          content: projectNote,
          type: "project",
          item_id: selectedProject.id,
          author: "user@example.com",
          labels: ["nota", "projeto"],
          is_private: false
        });
        setProjectNote("");
      } catch (error) {
        console.error("Erro ao adicionar nota ao projeto:", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // renderAnalysis function is removed as project_health doesn't exist in the new schema
  // and its logic is now embedded directly in the overview tab.

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="h-7 w-7 text-amber-500" />
            Agente Antecipador de Riscos
          </h1>
          <p className="text-gray-500 mt-1">
            Monitora constantemente sinais e padrões para antecipar problemas
          </p>
        </div>
        
        <div className="mt-4 md:mt-0 flex items-center gap-3">
          <Select 
            value={selectedProject?.id} 
            onValueChange={handleProjectChange}
          >
            <SelectTrigger className="w-[200px]">
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
            onClick={() => analyzeRisks()} 
            disabled={analyzing || !selectedProject}
            className="gap-2"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            Atualizar Análise
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                {selectedProject.title}
              </CardTitle>
              <CardDescription>
                {selectedProject.description?.substring(0, 150)}{selectedProject.description?.length > 150 ? '...' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Prazo</span>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">{format(parseISO(selectedProject.deadline), 'dd/MM/yyyy')}</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Status</span>
                  <Badge className="w-fit">{selectedProject.status}</Badge>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 mb-1">Progresso</span>
                  <div className="flex items-center gap-2">
                    <Progress value={selectedProject.progress || 0} className="h-2 flex-1" />
                    <span className="font-medium">{selectedProject.progress || 0}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Adicionar Nota ao Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <Input 
                value={projectNote} 
                onChange={(e) => setProjectNote(e.target.value)} 
                placeholder="Escreva sua nota aqui..." 
              />
            </CardContent>
            <CardFooter>
              <Button onClick={handleNoteSubmit} disabled={!projectNote.trim()}>
                Adicionar Nota
              </Button>
            </CardFooter>
          </Card>

          {analyzing ? (
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col items-center justify-center py-10">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                  <h3 className="text-lg font-medium">Analisando riscos do projeto...</h3>
                  <p className="text-gray-500 mt-2">
                    Examinando métricas, tarefas e sinais para identificar possíveis problemas
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : riskAnalysis ? (
            <>
              <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="overview">Visão Geral</TabsTrigger>
                  <TabsTrigger value="risks">Riscos Identificados</TabsTrigger>
                  {/* Removed 'signals' and 'actions' tabs as data is no longer available in new schema */}
                  <TabsTrigger value="notes">Notas e Histórico</TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Resumo da Análise</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {riskAnalysis.summary && (
                          <div className="flex flex-col items-center py-4">
                            <Badge 
                              className={getOverallRiskColor(riskAnalysis.summary.overall_risk_level)} 
                              variant="outline" 
                              className="px-4 py-1.5 text-base"
                            >
                              {riskAnalysis.summary.overall_risk_level === "alto" && <AlertTriangle className="h-4 w-4 mr-2" />}
                              {riskAnalysis.summary.overall_risk_level === "médio" && <AlertCircle className="h-4 w-4 mr-2" />}
                              {riskAnalysis.summary.overall_risk_level === "baixo" && <CheckCircle className="h-4 w-4 mr-2" />}
                              Nível de Risco Geral: {riskAnalysis.summary.overall_risk_level}
                            </Badge>
                            
                            <div className="mt-4 text-center grid grid-cols-2 gap-4 w-full max-w-sm">
                              <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold">{riskAnalysis.summary.total_risks}</span>
                                <span className="text-sm text-gray-500">Total de Riscos</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-red-700">{riskAnalysis.summary.high_priority}</span>
                                <span className="text-sm text-red-700">R. Alta Prioridade</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-yellow-700">{riskAnalysis.summary.medium_priority}</span>
                                <span className="text-sm text-yellow-700">R. Média Prioridade</span>
                              </div>
                              <div className="flex flex-col items-center">
                                <span className="text-2xl font-bold text-green-700">{riskAnalysis.summary.low_priority}</span>
                                <span className="text-sm text-green-700">R. Baixa Prioridade</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                    
                    {/* Removed "Probabilidade de Atraso" card as new schema doesn't provide this */}
                    
                    {/* Removed "Áreas de Atenção Imediata" card as new schema doesn't provide this */}

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">Distribuição de Riscos por Nível</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={[
                                { 
                                  name: 'Riscos', 
                                  alto: riskAnalysis.summary?.high_priority || 0, 
                                  médio: riskAnalysis.summary?.medium_priority || 0, 
                                  baixo: riskAnalysis.summary?.low_priority || 0 
                                },
                              ]}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <RechartsTooltip />
                              <Legend />
                              <Bar dataKey="alto" name="Nível Alto" fill={RISK_COLORS.high} />
                              <Bar dataKey="médio" name="Nível Médio" fill={RISK_COLORS.medium} />
                              <Bar dataKey="baixo" name="Nível Baixo" fill={RISK_COLORS.low} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="risks" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Riscos Identificados
                      </CardTitle>
                      <CardDescription>
                        Total de {riskAnalysis.risks?.length || 0} riscos identificados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {riskAnalysis.risks?.map((risk, index) => (
                          <div key={index} className="border-b pb-6 last:border-b-0 last:pb-0">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                {getSeverityIcon(risk.risk_level)}
                                <div>
                                  <h3 className="font-medium">{risk.title}</h3>
                                  <p className="text-sm text-gray-600 mt-1">{risk.description}</p>
                                </div>
                              </div>
                              <Badge variant="outline" className={getSeverityColor(risk.risk_level)}>
                                {risk.risk_level}
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                              <div>
                                <h4 className="text-sm font-medium mb-2">Detalhes do Risco</h4>
                                <ul className="text-sm space-y-1">
                                  <li><span className="font-medium">Categoria:</span> {risk.category}</li>
                                  <li><span className="font-medium">Probabilidade:</span> {risk.probability}</li>
                                  <li><span className="font-medium">Impacto:</span> {risk.impact}</li>
                                  <li><span className="font-medium">Nível de Risco:</span> {risk.risk_level}</li>
                                </ul>
                              </div>
                              
                              <div>
                                <h4 className="text-sm font-medium mb-2">Responsável & Prazo</h4>
                                <ul className="text-sm space-y-1">
                                  <li><span className="font-medium">Responsável:</span> {risk.responsible}</li>
                                  <li><span className="font-medium">Prazo:</span> {risk.timeline}</li>
                                </ul>
                              </div>
                            </div>

                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Plano de Mitigação</h4>
                              <p className="text-sm">{risk.mitigation_plan}</p>
                            </div>
                            
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-2">Indicadores de Monitoramento</h4>
                              <ul className="text-sm space-y-1 list-disc pl-4">
                                {risk.monitoring_indicators.map((indicator, idx) => (
                                  <li key={idx}>{indicator}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                {/* Removed 'signals' tab */}
                {/* Removed 'actions' tab */}
                
                <TabsContent value="notes">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-indigo-500" />
                        Notas e Histórico
                      </CardTitle>
                      <CardDescription>
                        Análises anteriores e anotações sobre riscos
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="mb-8">
                        <h3 className="text-lg font-medium mb-4">Notas do Projeto</h3>
                        <div className="space-y-4">
                          <Input 
                            value={projectNote} 
                            onChange={(e) => setProjectNote(e.target.value)} 
                            placeholder="Adicione uma nova nota..." 
                            className="mb-2"
                          />
                          <Button 
                            onClick={handleNoteSubmit} 
                            disabled={!projectNote.trim()}
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Adicionar Nota
                          </Button>
                        </div>
                      </div>
                      
                      {riskHistory.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium mb-4">Histórico de Análises</h3>
                          <div className="space-y-4">
                            {riskHistory
                              .filter(entry => entry.projectId === selectedProject.id)
                              .map((entry, index) => (
                                <div key={index} className="p-4 border rounded-lg">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="text-sm font-medium">Análise de {format(new Date(entry.date), 'dd/MM/yyyy HH:mm')}</h4>
                                      <p className="text-sm text-gray-600 mt-1">
                                        Nível de Risco Geral: <Badge className={getOverallRiskColor(entry.analysis.summary.overall_risk_level)}>
                                          {entry.analysis.summary.overall_risk_level}
                                        </Badge>
                                      </p>
                                    </div>
                                    <Badge variant="outline">
                                      {entry.analysis.summary.high_priority} riscos altos
                                    </Badge>
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <Card>
              <CardContent className="py-6">
                <div className="flex flex-col items-center justify-center py-10">
                  <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
                  <h3 className="text-lg font-medium">Análise de Risco Não Disponível</h3>
                  <p className="text-gray-500 mt-2 mb-6">
                    Clique em "Atualizar Análise" para avaliar os riscos deste projeto
                  </p>
                  <Button 
                    onClick={() => analyzeRisks()} 
                    disabled={analyzing}
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Analisar Agora
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

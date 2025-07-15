
import React, { useState, useEffect } from "react";
import { Project, Task, Meeting, User } from "@/api/entities";
import { InvokeLLM, SendEmail } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  MessageSquare,
  Send,
  Mail,
  Users,
  Calendar,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Bot,
  UserCog,
  FileText,
  Target,
  Zap,
  ListTodo,
  Lightbulb,
  Info
} from "lucide-react";

export default function CommunicationAgent() {
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedProject, setSelectedProject] = useState("");
  const [communicationAnalysis, setCommunicationAnalysis] = useState(null); // Replaces analysisResults and communicationPlan
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailData, setEmailData] = useState({
    recipients: [],
    subject: "",
    message: ""
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projectsData, usersData] = await Promise.all([
        Project.list(),
        User.list()
      ]);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const analyzeCommunication = async () => {
    if (!selectedProject) return;

    setLoading(true);
    try {
      const project = projects.find(p => p.id === selectedProject);
      const tasks = await Task.filter({ project_id: selectedProject });
      const meetings = await Meeting.filter({ project_id: selectedProject });
      
      const today = new Date();
      // Ensure start_date exists and is a valid date for calculation
      const projectStart = project.start_date ? new Date(project.start_date) : null;
      let daysRunning = 0;
      if (projectStart && !isNaN(projectStart)) {
          daysRunning = Math.ceil((today.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
      }

      const prompt = `
        Você é um especialista em comunicação e colaboração em projetos de TI. Analise os padrões de comunicação do projeto.

        DADOS DO PROJETO:
        - Nome: ${project.title}
        - Descrição: ${project.description || "N/A"}
        - Status: ${project.status}
        - Progresso: ${project.progress}%
        - Prazo: ${project.deadline || "N/A"}
        - Responsável: ${project.responsible || "N/A"}
        - Dias em execução: ${daysRunning > 0 ? daysRunning : "Projeto não iniciado ou sem data de início"}
        - Participantes: ${project.participants?.length || 0}
        - Total de Tarefas: ${tasks.length}
        - Tarefas Concluídas: ${tasks.filter(t => t.status === 'concluída').length}
        - Tarefas Em Andamento: ${tasks.filter(t => t.status === 'em andamento').length}
        - Tarefas Bloqueadas: ${tasks.filter(t => t.status === 'bloqueada').length}
        - Reuniões Realizadas: ${meetings.length}
        - Frequência de Reuniões: ${meetings.length > 0 && daysRunning > 0 ? (meetings.length / Math.max(daysRunning / 7, 1)).toFixed(1) : 0} por semana

        Data atual: ${today.toISOString().split('T')[0]}

        Analise considerando:
        1. Frequência e qualidade da comunicação
        2. Canais de comunicação utilizados
        3. Transparência e visibilidade
        4. Feedback e colaboração
        5. Documentação e registros
        6. Alinhamento entre stakeholders
        7. Resolução de conflitos

        Avalie:
        - Eficácia da comunicação atual
        - Gaps de comunicação
        - Oportunidades de melhoria
        - Ferramentas e processos
        - Cultura colaborativa

        Retorne um JSON com esta estrutura:
        {
          "summary": {
            "communication_score": 75,
            "collaboration_level": "baixo|médio|alto",
            "transparency_score": 80,
            "major_issues": 2,
            "improvement_potential": "baixo|médio|alto"
          },
          "current_state": {
            "meeting_frequency": "adequada|insuficiente|excessiva",
            "documentation_quality": "baixa|média|alta",
            "stakeholder_alignment": "baixo|médio|alto",
            "team_engagement": "baixo|médio|alto"
          },
          "communication_gaps": [
            {
              "area": "stakeholders|equipe|cliente|fornecedor",
              "description": "Descrição do gap",
              "impact": "alto|médio|baixo",
              "solution": "Solução proposta"
            }
          ],
          "improvements": [
            {
              "title": "Título da Melhoria",
              "description": "Descrição detalhada",
              "type": "processo|ferramenta|treinamento|cultura",
              "expected_benefit": "Benefício esperado",
              "effort": "baixo|médio|alto",
              "timeline": "Prazo para implementar",
              "success_metrics": ["métrica1", "métrica2"]
            }
          ],
          "action_plan": [
            {
              "priority": "alta|média|baixa",
              "action": "Ação específica",
              "responsible": "Responsável",
              "deadline": "Prazo",
              "resources_needed": "Recursos necessários"
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
                communication_score: { type: "number" },
                collaboration_level: { type: "string" },
                transparency_score: { type: "number" },
                major_issues: { type: "number" },
                improvement_potential: { type: "string" }
              },
              required: ["communication_score", "collaboration_level", "transparency_score", "major_issues", "improvement_potential"]
            },
            current_state: {
              type: "object",
              properties: {
                meeting_frequency: { type: "string" },
                documentation_quality: { type: "string" },
                stakeholder_alignment: { type: "string" },
                team_engagement: { type: "string" }
              },
              required: ["meeting_frequency", "documentation_quality", "stakeholder_alignment", "team_engagement"]
            },
            communication_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  area: { type: "string" },
                  description: { type: "string" },
                  impact: { type: "string" },
                  solution: { type: "string" }
                },
                required: ["area", "description", "impact", "solution"]
              }
            },
            improvements: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  type: { type: "string" },
                  expected_benefit: { type: "string" },
                  effort: { type: "string" },
                  timeline: { type: "string" },
                  success_metrics: { type: "array", items: { type: "string" } }
                },
                required: ["title", "description", "type", "expected_benefit", "effort", "timeline", "success_metrics"]
              }
            },
            action_plan: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  action: { type: "string" },
                  responsible: { type: "string" },
                  deadline: { type: "string" },
                  resources_needed: { type: "string" }
                },
                required: ["priority", "action", "responsible", "deadline", "resources_needed"]
              }
            }
          },
          required: ["summary", "current_state", "communication_gaps", "improvements", "action_plan"]
        }
      });

      setCommunicationAnalysis(response);
    } catch (error) {
      console.error('Erro ao analisar comunicação:', error);
      setCommunicationAnalysis(null); // Clear analysis on error
    } finally {
      setLoading(false);
    }
  };

  // Removed generateCommunicationPlan as its output is now part of analyzeCommunication

  const handleSendCommunication = async () => {
    if (!emailData.recipients.length || !emailData.subject || !emailData.message) {
      return;
    }

    try {
      setLoading(true);

      // Enviar email para cada destinatário
      const sendPromises = emailData.recipients.map(recipient => 
        SendEmail({
          to: recipient,
          subject: emailData.subject,
          body: emailData.message,
          from_name: "Agente de Comunicação - Planzee"
        })
      );

      await Promise.all(sendPromises);

      // Limpar formulário e fechar diálogo
      setShowEmailDialog(false);
      setEmailData({ recipients: [], subject: "", message: "" });

      // You can add a success toast here
      alert("Comunicação enviada com sucesso!");

    } catch (error) {
      console.error("Erro ao enviar comunicação:", error);
      // You can show an error toast here
      alert("Erro ao enviar comunicação. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const getLevelColor = (level) => {
    const lowerLevel = level?.toLowerCase();
    switch (lowerLevel) {
      case 'alto': return 'bg-green-100 text-green-800';
      case 'médio': case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'baixo': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFrequencyColor = (frequency) => {
    const lowerFreq = frequency?.toLowerCase();
    switch (lowerFreq) {
      case 'adequada': return 'bg-green-100 text-green-800';
      case 'insuficiente': return 'bg-red-100 text-red-800';
      case 'excessiva': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'bg-green-100 text-green-800';
    if (score >= 50) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  const getPriorityColor = (priority) => {
    const lowerPriority = priority?.toLowerCase();
    switch (lowerPriority) {
      case 'alta': return 'bg-red-100 text-red-800';
      case 'média': case 'media': return 'bg-yellow-100 text-yellow-800';
      case 'baixa': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact) => {
    const lowerImpact = impact?.toLowerCase();
    switch (lowerImpact) {
      case 'alto': return 'bg-red-100 text-red-800';
      case 'médio': case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'baixo': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEffortColor = (effort) => {
    const lowerEffort = effort?.toLowerCase();
    switch (lowerEffort) {
      case 'alto': return 'bg-red-100 text-red-800';
      case 'médio': case 'medio': return 'bg-yellow-100 text-yellow-800';
      case 'baixo': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-lg">
            <MessageSquare className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agente de Comunicação Contextual</h1>
            <p className="text-gray-500">Otimize a comunicação e o engajamento da equipe com inteligência artificial</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel de Controle */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Configuração
              </CardTitle>
              <CardDescription>
                Selecione um projeto para analisar sua comunicação
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Projeto</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
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

              <div className="space-y-3">
                <Button 
                  onClick={analyzeCommunication} // Updated function call
                  disabled={!selectedProject || loading} // Updated loading state
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analisando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analisar Comunicação
                    </>
                  )}
                </Button>

                {communicationAnalysis && ( // Check for new communicationAnalysis state
                  <Button 
                    onClick={() => setShowEmailDialog(true)}
                    className="w-full"
                    variant="outline"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Enviar Comunicação
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resumo Rápido */}
          {communicationAnalysis?.summary && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Resumo da Análise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="text-sm font-medium">Pontuação de Comunicação:</span>
                  <Badge className={`ml-2 ${getScoreColor(communicationAnalysis.summary.communication_score)}`}>
                    {communicationAnalysis.summary.communication_score}%
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Nível de Colaboração:</span>
                  <Badge className={`ml-2 ${getLevelColor(communicationAnalysis.summary.collaboration_level)}`}>
                    {communicationAnalysis.summary.collaboration_level}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Engajamento da Equipe:</span>
                  <Badge className={`ml-2 ${getLevelColor(communicationAnalysis.current_state.team_engagement)}`}>
                    {communicationAnalysis.current_state.team_engagement}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Frequência de Reuniões:</span>
                  <Badge className={`ml-2 ${getFrequencyColor(communicationAnalysis.current_state.meeting_frequency)}`}>
                    {communicationAnalysis.current_state.meeting_frequency}
                  </Badge>
                </div>
                <div>
                  <span className="text-sm font-medium">Alinhamento Stakeholders:</span>
                  <Badge className={`ml-2 ${getLevelColor(communicationAnalysis.current_state.stakeholder_alignment)}`}>
                    {communicationAnalysis.current_state.stakeholder_alignment}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Área Principal de Resultados */}
        <div className="lg:col-span-2">
          {!communicationAnalysis && (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center">
                <Bot className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">Pronto para Analisar</h3>
                <p className="text-gray-500">Selecione um projeto e clique em "Analisar Comunicação" para começar</p>
              </div>
            </Card>
          )}

          {communicationAnalysis && (
            <Tabs defaultValue="overview-analysis" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="overview-analysis">Visão Geral e Análise</TabsTrigger>
                <TabsTrigger value="action-plan-improvements">Plano de Ação e Melhorias</TabsTrigger>
              </TabsList>

              <TabsContent value="overview-analysis">
                <div className="space-y-6">
                  {communicationAnalysis.summary && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Info className="h-5 w-5 text-blue-500" />
                          Visão Geral da Comunicação
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p><strong>Pontuação de Comunicação:</strong> {communicationAnalysis.summary.communication_score}%</p>
                        <p><strong>Nível de Colaboração:</strong> {communicationAnalysis.summary.collaboration_level}</p>
                        <p><strong>Pontuação de Transparência:</strong> {communicationAnalysis.summary.transparency_score}%</p>
                        <p><strong>Principais Problemas Identificados:</strong> {communicationAnalysis.summary.major_issues}</p>
                        <p><strong>Potencial de Melhoria:</strong> {communicationAnalysis.summary.improvement_potential}</p>
                        <hr className="my-2" />
                        <p><strong>Frequência de Reuniões:</strong> {communicationAnalysis.current_state.meeting_frequency}</p>
                        <p><strong>Qualidade da Documentação:</strong> {communicationAnalysis.current_state.documentation_quality}</p>
                        <p><strong>Alinhamento dos Stakeholders:</strong> {communicationAnalysis.current_state.stakeholder_alignment}</p>
                        <p><strong>Engajamento da Equipe:</strong> {communicationAnalysis.current_state.team_engagement}</p>
                      </CardContent>
                    </Card>
                  )}

                  {communicationAnalysis.communication_gaps && communicationAnalysis.communication_gaps.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          Lacunas de Comunicação
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {communicationAnalysis.communication_gaps.map((gap, index) => (
                          <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                            <p className="font-medium text-gray-800">Área: {gap.area}</p>
                            <p className="text-sm text-gray-600">Descrição: {gap.description}</p>
                            <p className="text-sm text-gray-600">Impacto: <Badge className={`ml-1 ${getImpactColor(gap.impact)}`}>{gap.impact}</Badge></p>
                            <p className="text-sm text-gray-600">Solução Proposta: {gap.solution}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {communicationAnalysis.communication_gaps && communicationAnalysis.communication_gaps.length === 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-gray-400" />
                          Lacunas de Comunicação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500">Nenhuma lacuna de comunicação significativa identificada no momento.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="action-plan-improvements">
                <div className="space-y-6">
                  {communicationAnalysis.improvements && communicationAnalysis.improvements.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-green-500" />
                          Melhorias Sugeridas
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {communicationAnalysis.improvements.map((improvement, index) => (
                          <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                            <h4 className="font-medium text-gray-800">{improvement.title}</h4>
                            <p className="text-sm text-gray-600">Descrição: {improvement.description}</p>
                            <p className="text-sm text-gray-600">Tipo: {improvement.type}</p>
                            <p className="text-sm text-gray-600">Benefício Esperado: {improvement.expected_benefit}</p>
                            <p className="text-sm text-gray-600">Esforço: <Badge className={`ml-1 ${getEffortColor(improvement.effort)}`}>{improvement.effort}</Badge></p>
                            <p className="text-sm text-gray-600">Prazo: {improvement.timeline}</p>
                            {improvement.success_metrics && improvement.success_metrics.length > 0 && (
                              <p className="text-sm text-gray-600">Métricas de Sucesso: {improvement.success_metrics.join(', ')}</p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {communicationAnalysis.improvements && communicationAnalysis.improvements.length === 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Lightbulb className="h-5 w-5 text-gray-400" />
                          Melhorias Sugeridas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500">Nenhuma melhoria específica sugerida no momento.</p>
                      </CardContent>
                    </Card>
                  )}

                  {communicationAnalysis.action_plan && communicationAnalysis.action_plan.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ListTodo className="h-5 w-5 text-purple-500" />
                          Plano de Ação
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {communicationAnalysis.action_plan.map((actionItem, index) => (
                          <div key={index} className="border-b pb-2 last:border-b-0 last:pb-0">
                            <p className="font-medium text-gray-800">Ação: {actionItem.action}</p>
                            <p className="text-sm text-gray-600">Prioridade: <Badge className={`ml-1 ${getPriorityColor(actionItem.priority)}`}>{actionItem.priority}</Badge></p>
                            <p className="text-sm text-gray-600">Responsável: {actionItem.responsible}</p>
                            <p className="text-sm text-gray-600">Prazo: {actionItem.deadline}</p>
                            <p className="text-sm text-gray-600">Recursos Necessários: {actionItem.resources_needed}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {communicationAnalysis.action_plan && communicationAnalysis.action_plan.length === 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <ListTodo className="h-5 w-5 text-gray-400" />
                          Plano de Ação
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-500">Nenhum item de ação específico no plano.</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Diálogo de Envio de Email */}
      <Dialog open={showEmailDialog} onOpenChange={setShowEmailDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Enviar Comunicação</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Destinatários</label>
              <Select 
                value=""
                onValueChange={(email) => {
                  if (!emailData.recipients.includes(email)) {
                    setEmailData(prev => ({
                      ...prev,
                      recipients: [...prev.recipients, email]
                    }));
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Adicionar destinatário" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {emailData.recipients.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {emailData.recipients.map(email => (
                    <Badge key={email} variant="secondary" className="flex items-center gap-1">
                      {email}
                      <button
                        onClick={() => setEmailData(prev => ({
                          ...prev,
                          recipients: prev.recipients.filter(r => r !== email)
                        }))}
                        className="ml-1 text-xs"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Assunto</label>
              <Input
                placeholder="Assunto do email"
                value={emailData.subject}
                onChange={(e) => setEmailData(prev => ({...prev, subject: e.target.value}))}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Mensagem</label>
              <Textarea
                placeholder="Corpo da mensagem"
                value={emailData.message}
                onChange={(e) => setEmailData(prev => ({...prev, message: e.target.value}))}
                rows={6}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEmailDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendCommunication}
              disabled={!emailData.recipients.length || !emailData.subject || !emailData.message}
            >
              <Send className="mr-2 h-4 w-4" />
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

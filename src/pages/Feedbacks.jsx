
import React, { useState, useEffect } from "react";
import { Project, Feedback, Task } from "@/api/entities";
import { User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Plus, 
  ThumbsUp, 
  AlertCircle, 
  MessageSquare, 
  ListTodo, 
  Sparkles, 
  Loader2,
  CheckSquare,
  ArrowRight
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";

export default function Feedbacks() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  
  const [newFeedback, setNewFeedback] = useState({
    project_id: "",
    content: "",
    type: "sugestão",
    priority: "média",
    status: "aberto"
  });

  // New state variables for AI task generation
  const [suggestedTasksDialogOpen, setSuggestedTasksDialogOpen] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState({});
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [feedbacksData, projectsData] = await Promise.all([
        Feedback.list(),
        Project.list()
      ]);
      
      try {
        const userData = await User.me();
        setCurrentUser(userData);
      } catch (error) {
        console.log("User not authenticated", error);
      }
      
      setFeedbacks(feedbacksData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewFeedback({
      ...newFeedback,
      [name]: value
    });
  };
  
  const handleSelectChange = (name, value) => {
    setNewFeedback({
      ...newFeedback,
      [name]: value
    });
  };
  
  const handleSubmit = async () => {
    try {
      const feedbackData = {
        ...newFeedback,
        author: currentUser?.email || "anonymous@example.com"
      };
      
      await Feedback.create(feedbackData);
      setOpenDialog(false);
      resetForm();
      await loadData();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
  };
  
  const resetForm = () => {
    setNewFeedback({
      project_id: "",
      content: "",
      type: "sugestão",
      priority: "média",
      status: "aberto"
    });
  };
  
  const updateFeedbackStatus = async (id, newStatus) => {
    try {
      await Feedback.update(id, { status: newStatus });
      await loadData();
    } catch (error) {
      console.error("Error updating feedback status:", error);
    }
  };
  
  const getProjectById = (id) => {
    return projects.find(p => p.id === id) || { title: "Desconhecido" };
  };
  
  const getInitials = (email) => {
    if (!email) return "?";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };
  
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = 
      feedback.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesProject = filterProject === "all" || feedback.project_id === filterProject;
    const matchesType = filterType === "all" || feedback.type === filterType;
    const matchesStatus = filterStatus === "all" || feedback.status === filterStatus;
    
    return matchesSearch && matchesProject && matchesType && matchesStatus;
  });
  
  const typeColors = {
    sugestão: "bg-blue-100 text-blue-800",
    problema: "bg-red-100 text-red-800",
    elogio: "bg-green-100 text-green-800",
    outro: "bg-gray-100 text-gray-800"
  };
  
  const priorityColors = {
    baixa: "bg-green-100 text-green-800",
    média: "bg-yellow-100 text-yellow-800",
    alta: "bg-red-100 text-red-800"
  };
  
  const statusColors = {
    aberto: "bg-blue-100 text-blue-800",
    em_análise: "bg-purple-100 text-purple-800",
    implementado: "bg-green-100 text-green-800",
    rejeitado: "bg-gray-100 text-gray-800"
  };

  // New functions for AI task generation
  const openSuggestedTasksDialog = (feedback) => {
    setCurrentFeedback(feedback);
    setSuggestedTasks([]);
    setSelectedTasks({});
    setSuggestedTasksDialogOpen(true);
    generateTasksFromFeedback(feedback);
  };

  const generateTasksFromFeedback = async (feedback) => {
    if (!feedback || !feedback.content) {
      toast({
        title: "Erro",
        description: "Conteúdo do feedback insuficiente para gerar tarefas.",
        variant: "destructive"
      });
      return;
    }

    try {
      setGeneratingTasks(true);
      
      const project = getProjectById(feedback.project_id);
      
      const response = await InvokeLLM({
        prompt: `
          Analise o seguinte feedback de um projeto e identifique possíveis tarefas de melhoria 
          que deveriam ser criadas para resolver os problemas ou implementar as sugestões mencionadas.
          
          Contexto do feedback:
          Projeto: ${project.title}
          Tipo: ${feedback.type}
          Prioridade: ${feedback.priority}
          
          Conteúdo do feedback:
          "${feedback.content}"
          
          Para cada tarefa de melhoria identificada, forneça:
          1. Um título claro e objetivo
          2. Uma descrição detalhada da implementação necessária
          3. Uma estimativa de esforço (em dias)
          4. Uma prioridade sugerida (baixa, média, alta)
          
          Identifique apenas tarefas específicas, práticas e implementáveis que respondam diretamente 
          ao feedback. Se o feedback for um elogio sem sugestões de melhoria, indique que não há tarefas a serem criadas.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  estimated_days: { type: "number" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      if (response.tasks && response.tasks.length > 0) {
        setSuggestedTasks(response.tasks);
        
        // Initialize selected status for all tasks (all selected by default)
        const initialSelected = {};
        response.tasks.forEach((task, index) => {
          initialSelected[index] = true;
        });
        setSelectedTasks(initialSelected);
      } else {
        toast({
          title: "Informação",
          description: "Não foram identificadas tarefas de melhoria neste feedback.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Erro ao gerar tarefas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível gerar tarefas de melhoria. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setGeneratingTasks(false);
    }
  };

  const handleTaskSelection = (index, checked) => {
    setSelectedTasks(prev => ({
      ...prev,
      [index]: checked
    }));
  };

  const createSelectedImprovementTasks = async () => {
    try {
      if (!currentFeedback || !currentFeedback.project_id) {
        toast({
          title: "Erro",
          description: "Dados do projeto insuficientes para criar tarefas.",
          variant: "destructive"
        });
        return;
      }
      
      const selectedTasksArr = suggestedTasks.filter((_, index) => selectedTasks[index]);
      
      if (selectedTasksArr.length === 0) {
        toast({
          title: "Atenção",
          description: "Nenhuma tarefa selecionada para criação.",
          variant: "default"
        });
        return;
      }
      
      // Create all selected tasks
      for (const task of selectedTasksArr) {
        const deadline = new Date();
        deadline.setDate(deadline.getDate() + task.estimated_days);
        
        await Task.create({
          project_id: currentFeedback.project_id,
          title: task.title,
          description: `${task.description}\n\nGerado a partir do feedback: "${currentFeedback.content.substring(0, 100)}${currentFeedback.content.length > 100 ? '...' : ''}"`,
          status: "pendente",
          deadline: deadline.toISOString().split('T')[0],
          priority: task.priority,
          ai_generated: true,
          feedback_reference: currentFeedback.id
        });
      }
      
      // Update feedback status to "em_análise" if it was "aberto"
      if (currentFeedback.status === "aberto") {
        await Feedback.update(currentFeedback.id, { status: "em_análise" });
      }
      
      toast({
        title: "Sucesso",
        description: `${selectedTasksArr.length} tarefas de melhoria criadas com sucesso!`,
        variant: "default"
      });
      
      setSuggestedTasksDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Erro ao criar tarefas:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar as tarefas. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Feedbacks</h1>
          <p className="text-gray-500">Gerencie feedbacks e sugestões de projetos</p>
        </div>
        <Button onClick={() => setOpenDialog(true)} className="mt-4 md:mt-0">
          <Plus className="mr-2 h-4 w-4" /> Novo Feedback
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="relative md:col-span-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar feedbacks..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="md:col-span-2">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger>
              <SelectValue placeholder="Projeto" />
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
        
        <div className="md:col-span-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="sugestão">Sugestão</SelectItem>
              <SelectItem value="problema">Problema</SelectItem>
              <SelectItem value="elogio">Elogio</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="md:col-span-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="aberto">Aberto</SelectItem>
              <SelectItem value="em_análise">Em Análise</SelectItem>
              <SelectItem value="implementado">Implementado</SelectItem>
              <SelectItem value="rejeitado">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <p>Carregando feedbacks...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFeedbacks.length > 0 ? (
            filteredFeedbacks.map(feedback => (
              <FeedbackCard
                key={feedback.id}
                feedback={feedback}
                project={getProjectById(feedback.project_id)}
                getInitials={getInitials}
                typeColors={typeColors}
                priorityColors={priorityColors}
                statusColors={statusColors}
                updateStatus={updateFeedbackStatus}
                currentUser={currentUser}
                onGenerateTasks={() => openSuggestedTasksDialog(feedback)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>Nenhum feedback encontrado.</p>
            </div>
          )}
        </div>
      )}
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Novo Feedback</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project_id">Projeto</Label>
              <Select
                value={newFeedback.project_id}
                onValueChange={(value) => handleSelectChange("project_id", value)}
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
            
            <div className="grid gap-2">
              <Label htmlFor="content">Feedback</Label>
              <Textarea
                id="content"
                name="content"
                value={newFeedback.content}
                onChange={handleInputChange}
                placeholder="Digite seu feedback ou sugestão"
                rows={5}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={newFeedback.type}
                  onValueChange={(value) => handleSelectChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sugestão">Sugestão</SelectItem>
                    <SelectItem value="problema">Problema</SelectItem>
                    <SelectItem value="elogio">Elogio</SelectItem>
                    <SelectItem value="outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="priority">Prioridade</Label>
                <Select
                  value={newFeedback.priority}
                  onValueChange={(value) => handleSelectChange("priority", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="média">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Cancelar</Button>
            <Button onClick={handleSubmit}>Enviar Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suggested Tasks Dialog */}
      <Dialog open={suggestedTasksDialogOpen} onOpenChange={setSuggestedTasksDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-[#ff7a59]" />
              Gerar Tarefas de Melhoria
            </DialogTitle>
            <DialogDescription>
              A IA identificou possíveis tarefas de melhoria com base no feedback. Selecione as que deseja criar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 overflow-y-auto max-h-[calc(80vh-200px)]">
            {generatingTasks ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-[#ff7a59] mb-4" />
                <p className="text-gray-600">Analisando feedback e gerando tarefas de melhoria...</p>
              </div>
            ) : suggestedTasks.length > 0 ? (
              <div className="space-y-4">
                {suggestedTasks.map((task, index) => (
                  <div key={index} className="border rounded-md p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id={`task-${index}`} 
                        checked={!!selectedTasks[index]}
                        onCheckedChange={(checked) => handleTaskSelection(index, checked)}
                      />
                      <div className="flex-1">
                        <Label 
                          htmlFor={`task-${index}`} 
                          className="text-base font-medium cursor-pointer"
                        >
                          {task.title}
                        </Label>
                        <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500">
                          <Badge variant="outline" className="bg-gray-100">
                            Esforço estimado: {task.estimated_days} dias
                          </Badge>
                          <Badge variant="outline" className={
                            task.priority === "baixa" ? "bg-green-100 text-green-800" :
                            task.priority === "média" ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          }>
                            Prioridade: {task.priority}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ListTodo className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Nenhuma tarefa de melhoria identificada para este feedback.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuggestedTasksDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={createSelectedImprovementTasks} 
              disabled={generatingTasks || suggestedTasks.length === 0 || !Object.values(selectedTasks).some(v => v)}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Criar Tarefas Selecionadas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FeedbackCard({ 
  feedback, 
  project, 
  getInitials, 
  typeColors, 
  priorityColors, 
  statusColors,
  updateStatus,
  currentUser,
  onGenerateTasks
}) {
  const isAdmin = currentUser?.role === "admin";
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <Avatar>
              <AvatarFallback>{getInitials(feedback.author)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{feedback.author}</div>
              <div className="text-xs text-gray-500">
                {new Date(feedback.created_date).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Badge className={typeColors[feedback.type]}>
              {feedback.type}
            </Badge>
            <Badge className={priorityColors[feedback.priority]}>
              {feedback.priority}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <p className="text-gray-700">{feedback.content}</p>
        </div>
        
        <div className="flex justify-between items-center">
          <Link 
            to={createPageUrl(`ProjectDetails?id=${feedback.project_id}`)} 
            className="text-blue-600 hover:underline text-sm"
          >
            {project.title}
          </Link>
          
          <div className="relative">
            <Badge 
              className={`${statusColors[feedback.status]} cursor-pointer ${isAdmin ? "hover:bg-opacity-80" : ""}`}
              onClick={() => isAdmin && setShowStatusMenu(!showStatusMenu)}
            >
              {feedback.status.replace("_", " ")}
            </Badge>
            
            {showStatusMenu && isAdmin && (
              <div className="absolute right-0 bottom-full mb-2 bg-white shadow-lg rounded-md z-10 border p-1 w-40">
                <button
                  className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-sm"
                  onClick={() => {
                    updateStatus(feedback.id, "aberto");
                    setShowStatusMenu(false);
                  }}
                >
                  Aberto
                </button>
                <button
                  className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-sm"
                  onClick={() => {
                    updateStatus(feedback.id, "em_análise");
                    setShowStatusMenu(false);
                  }}
                >
                  Em Análise
                </button>
                <button
                  className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-sm"
                  onClick={() => {
                    updateStatus(feedback.id, "implementado");
                    setShowStatusMenu(false);
                  }}
                >
                  Implementado
                </button>
                <button
                  className="w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded-sm"
                  onClick={() => {
                    updateStatus(feedback.id, "rejeitado");
                    setShowStatusMenu(false);
                  }}
                >
                  Rejeitado
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* New action button for generating tasks */}
        {(feedback.type === "sugestão" || feedback.type === "problema") && (
          <div className="mt-4 pt-3 border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={onGenerateTasks}
            >
              <Sparkles className="h-3 w-3 mr-2" /> 
              Gerar Tarefas de Melhoria
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


import React, { useState, useEffect } from "react";
import { Meeting, Project, User, Task } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Calendar, 
  Clock, 
  Users, 
  Plus, 
  Search, 
  Trash2, 
  Edit, 
  ArrowRight, 
  Sparkles, 
  FileText, 
  ListTodo,
  CheckSquare,
  Loader2,
  MessageSquare
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/components/ui/use-toast";

export default function Meetings() {
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterDate, setFilterDate] = useState("all");
  
  const [formData, setFormData] = useState({
    project_id: "",
    title: "",
    date: "",
    attendees: [],
    notes: "",
    action_items: []
  });
  const [newAttendee, setNewAttendee] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  const [showActionItemForm, setShowActionItemForm] = useState(false);
  const [actionItem, setActionItem] = useState({
    description: "",
    responsible: "",
    deadline: ""
  });

  const [summarizeDialogOpen, setSummarizeDialogOpen] = useState(false);
  const [currentMeeting, setCurrentMeeting] = useState(null);
  const [summarizedNotes, setSummarizedNotes] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  
  const [tasksDialogOpen, setTasksDialogOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [suggestedTasks, setSuggestedTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState({});
  const [generatingTasks, setGeneratingTasks] = useState(false);
  
  const roles = [
    { id: "dev", category: "desenvolvimento", title: "Desenvolvimento" },
    { id: "design", category: "design", title: "Design" },
    { id: "data", category: "dados", title: "Dados" },
    { id: "infra", category: "infraestrutura", title: "Infraestrutura" },
    { id: "mgmt", category: "gestao", title: "Gestão" },
    { id: "security", category: "seguranca", title: "Segurança" },
    { id: "qa", category: "qualidade", title: "Qualidade" },
    { id: "product", category: "produto", title: "Produto" }
  ];

  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [meetingsData, projectsData] = await Promise.all([
        Meeting.list(),
        Project.list()
      ]);
      setMeetings(meetingsData);
      setProjects(projectsData);
      
      try {
        const userData = await User.me();
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error loading user:", error);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleAddAttendee = () => {
    if (newAttendee.trim()) {
      setFormData({
        ...formData,
        attendees: [...formData.attendees, newAttendee.trim()]
      });
      setNewAttendee("");
    }
  };
  
  const handleRemoveAttendee = (index) => {
    const updatedAttendees = [...formData.attendees];
    updatedAttendees.splice(index, 1);
    setFormData({
      ...formData,
      attendees: updatedAttendees
    });
  };
  
  const handleActionItemChange = (e) => {
    const { name, value } = e.target;
    setActionItem({
      ...actionItem,
      [name]: value
    });
  };
  
  const addActionItem = () => {
    if (actionItem.description.trim()) {
      setFormData({
        ...formData,
        action_items: [...formData.action_items, { ...actionItem }]
      });
      setActionItem({
        description: "",
        responsible: "",
        deadline: ""
      });
      setShowActionItemForm(false);
    }
  };
  
  const removeActionItem = (index) => {
    const updatedItems = [...formData.action_items];
    updatedItems.splice(index, 1);
    setFormData({
      ...formData,
      action_items: updatedItems
    });
  };
  
  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await Meeting.update(editId, formData);
      } else {
        await Meeting.create(formData);
      }
      resetForm();
      loadData();
    } catch (error) {
      console.error("Error saving meeting:", error);
    }
  };
  
  const handleDelete = async () => {
    try {
      await Meeting.delete(deleteId);
      setOpenDeleteDialog(false);
      setDeleteId(null);
      loadData();
    } catch (error) {
      console.error("Error deleting meeting:", error);
    }
  };
  
  const openEditDialog = (meeting) => {
    setIsEditing(true);
    setEditId(meeting.id);
    setFormData({
      project_id: meeting.project_id,
      title: meeting.title,
      date: meeting.date,
      attendees: meeting.attendees || [],
      notes: meeting.notes || "",
      action_items: meeting.action_items || []
    });
    setOpenDialog(true);
  };
  
  const resetForm = () => {
    setOpenDialog(false);
    setIsEditing(false);
    setEditId(null);
    setFormData({
      project_id: "",
      title: "",
      date: "",
      attendees: [],
      notes: "",
      action_items: []
    });
    setShowActionItemForm(false);
  };
  
  const confirmDelete = (id) => {
    setDeleteId(id);
    setOpenDeleteDialog(true);
  };
  
  const getProjectById = (id) => {
    return projects.find(p => p.id === id) || { title: "Desconhecido" };
  };
  
  const filterMeetings = () => {
    return meetings.filter(meeting => {
      const matchesSearch = 
        meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        meeting.notes?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProject = filterProject === "all" || meeting.project_id === filterProject;
      
      let matchesDate = true;
      if (filterDate === "past") {
        matchesDate = new Date(meeting.date) < new Date();
      } else if (filterDate === "future") {
        matchesDate = new Date(meeting.date) >= new Date();
      } else if (filterDate === "today") {
        const meetingDate = new Date(meeting.date);
        const today = new Date();
        matchesDate = 
          meetingDate.getDate() === today.getDate() &&
          meetingDate.getMonth() === today.getMonth() &&
          meetingDate.getFullYear() === today.getFullYear();
      }
      
      return matchesSearch && matchesProject && matchesDate;
    });
  };

  const openSummarizeDialog = (meeting) => {
    setCurrentMeeting(meeting);
    setSummarizedNotes("");
    setSummarizeDialogOpen(true);
  };

  const summarizeMeetingNotes = async () => {
    if (!currentMeeting || !currentMeeting.notes) {
      toast({
        title: "Erro",
        description: "Não há anotações para resumir nesta reunião.",
        variant: "destructive"
      });
      return;
    }

    try {
      setSummarizing(true);
      
      const project = getProjectById(currentMeeting.project_id);
      
      const response = await InvokeLLM({
        prompt: `
          Por favor, reformule e melhore as seguintes anotações de reunião para um formato mais profissional, 
          organizado e bem estruturado. Mantenha todas as informações importantes, mas apresente de forma 
          mais clara, utilizando marcadores quando apropriado e formatação adequada.
          
          Contexto da reunião:
          Título: ${currentMeeting.title}
          Projeto: ${project.title}
          Data: ${format(new Date(currentMeeting.date), "PPP", { locale: pt })}
          
          Anotações originais:
          ${currentMeeting.notes}
          
          Por favor, estruture o texto em seções como "Contexto", "Discussões", "Decisões" e "Próximos Passos", 
          se aplicável. Use uma linguagem clara e profissional.
        `
      });
      
      setSummarizedNotes(response);
    } catch (error) {
      console.error("Erro ao resumir anotações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível resumir as anotações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSummarizing(false);
    }
  };

  const saveSummarizedNotes = async () => {
    try {
      if (!summarizedNotes.trim()) {
        toast({
          title: "Erro",
          description: "O resumo está vazio. Gere um resumo primeiro.",
          variant: "destructive"
        });
        return;
      }
      
      await Meeting.update(currentMeeting.id, {
        ...currentMeeting,
        notes: summarizedNotes
      });
      
      toast({
        title: "Sucesso",
        description: "Anotações atualizadas com sucesso.",
        variant: "default"
      });
      
      setSummarizeDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar anotações:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar as anotações. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const openTasksDialog = async (meeting) => {
    setCurrentMeeting(meeting);
    setSuggestedTasks([]);
    setSelectedTasks({});
    setTasksDialogOpen(true);
    generateTasksFromMeeting(meeting);
  };

  const generateTasksFromMeeting = async (meeting) => {
    if (!meeting || !meeting.notes) {
      toast({
        title: "Erro",
        description: "Não há anotações para gerar tarefas nesta reunião.",
        variant: "destructive"
      });
      return;
    }

    try {
      setGeneratingTasks(true);
      
      const project = getProjectById(meeting.project_id);
      const today = new Date();
      
      const response = await InvokeLLM({
        prompt: `
          Analise as seguintes anotações de reunião e identifique possíveis tarefas que precisam ser criadas.
          Para cada tarefa, considere as dependências entre elas e sugira uma ordem lógica de execução.
          
          Contexto da reunião:
          Título: ${meeting.title}
          Projeto: ${project.title}
          Data: ${format(new Date(meeting.date), "PPP", { locale: pt })}
          
          Anotações da reunião:
          ${meeting.notes}
          
          Para cada tarefa identificada, forneça:
          1. Um título claro e objetivo
          2. Uma descrição detalhada do que precisa ser feito
          3. A função necessária (desenvolvimento, design, dados, infraestrutura, gestao, seguranca, qualidade, produto)
          4. O nível de senioridade requerido (junior, pleno, senior, especialista)
          5. Uma estimativa realista de horas para conclusão
          6. Uma lista de IDs de tarefas predecessoras (se houver)
          7. Uma data sugerida de início, considerando as dependências
          8. Uma justificativa para a ordem sugerida
          
          Considere que hoje é ${format(today, "PPP", { locale: pt })}.
          Organize as tarefas em uma sequência lógica, onde tarefas dependentes só começam após a conclusão das predecessoras.
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
                  function_category: { type: "string" },
                  seniority_level: { type: "string" },
                  estimated_hours: { type: "number" },
                  dependencies: { 
                    type: "array",
                    items: { type: "number" }
                  },
                  start_date: { type: "string" },
                  dependency_justification: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      if (response.tasks && response.tasks.length > 0) {
        const processedTasks = response.tasks.map((task, index) => {
          const roleMatch = roles.find(r => r.category === task.function_category);
          
          let startDate = new Date(task.start_date);
          if (task.dependencies && task.dependencies.length > 0) {
            const dependencyTasks = task.dependencies.map(depIndex => response.tasks[depIndex]);
            const latestDependencyEnd = new Date(Math.max(
              ...dependencyTasks.map(depTask => {
                const depEndDate = new Date(depTask.start_date);
                depEndDate.setHours(depEndDate.getHours() + depTask.estimated_hours);
                return depEndDate.getTime();
              })
            ));
            startDate = latestDependencyEnd;
          }
          
          return {
            ...task,
            tempId: `temp-${index}`,
            role_id: roleMatch?.id,
            role_title: roleMatch?.title || "Indefinido",
            start_date: startDate.toISOString(),
            status: "pendente"
          };
        });
        
        setSuggestedTasks(processedTasks);
        setSelectedTasks(
          processedTasks.reduce((acc, _, index) => ({
            ...acc,
            [index]: true
          }), {})
        );
      } else {
        toast({
          title: "Informação",
          description: "Não foram identificadas tarefas nas anotações.",
          variant: "default"
        });
      }
    } catch (error) {
      console.error("Erro ao gerar tarefas:", error);
      toast({
        title: "Erro",
        description: "Erro ao gerar tarefas. Tente novamente.",
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

  const handleTaskEdit = (index, field, value) => {
    setSuggestedTasks(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // If editing start_date, recalculate dependent tasks
      if (field === 'start_date' || field === 'estimated_hours') {
        const updatedDate = new Date(value);
        
        // Find all tasks that depend on this one
        updated.forEach((task, i) => {
          if (task.dependencies?.includes(index)) {
            // Calculate new start date for dependent task
            const dependencyEndDate = new Date(updatedDate);
            dependencyEndDate.setHours(dependencyEndDate.getHours() + updated[index].estimated_hours);
            
            // Update dependent task start date
            updated[i] = {
              ...updated[i],
              start_date: dependencyEndDate.toISOString()
            };
          }
        });
      }

      return updated;
    });
  };

  const createSelectedTasks = async () => {
    try {
      if (!currentMeeting || !currentMeeting.project_id) {
        toast({
          title: "Erro",
          description: "Dados do projeto insuficientes.",
          variant: "destructive"
        });
        return;
      }
      
      const selectedTasksArr = suggestedTasks.filter((_, index) => selectedTasks[index]);
      
      if (selectedTasksArr.length === 0) {
        toast({
          title: "Atenção",
          description: "Nenhuma tarefa selecionada.",
          variant: "default"
        });
        return;
      }
      
      for (const task of selectedTasksArr) {
        await Task.create({
          project_id: currentMeeting.project_id,
          title: task.title,
          description: task.description,
          status: "pendente",
          role_id: task.role_id,
          seniority_level: task.seniority_level,
          estimated_hours: task.estimated_hours,
          start_date: task.start_date,
          ai_generated: true,
          meeting_reference: currentMeeting.id,
          dependencies: task.dependencies
        });
      }
      
      await Meeting.update(currentMeeting.id, {
        ...currentMeeting,
        generated_tasks: selectedTasksArr
      });
      
      toast({
        title: "Sucesso",
        description: `${selectedTasksArr.length} tarefas criadas com sucesso!`,
        variant: "default"
      });
      
      setTasksDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Erro ao criar tarefas:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar tarefas. Tente novamente.",
        variant: "destructive"
      });
    }
  };
  
  const filteredMeetings = filterMeetings();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reuniões</h1>
          <p className="text-gray-500">Gerencie reuniões e registre decisões</p>
        </div>
        <Button onClick={() => setOpenDialog(true)} className="mt-4 md:mt-0">
          <Plus className="mr-2 h-4 w-4" /> Nova Reunião
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="relative md:col-span-5">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar reuniões..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="md:col-span-4">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por projeto" />
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
        
        <div className="md:col-span-3">
          <Select value={filterDate} onValueChange={setFilterDate}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as datas</SelectItem>
              <SelectItem value="future">Próximas</SelectItem>
              <SelectItem value="past">Anteriores</SelectItem>
              <SelectItem value="today">Hoje</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading ? (
        <div className="text-center py-12">
          <p>Carregando reuniões...</p>
        </div>
      ) : (
        <>
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Próximas Reuniões</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMeetings.filter(m => new Date(m.date) >= today).length > 0 ? (
                filteredMeetings
                  .filter(m => new Date(m.date) >= today)
                  .sort((a, b) => new Date(a.date) - new Date(b.date))
                  .map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      project={getProjectById(meeting.project_id)}
                      onEdit={() => openEditDialog(meeting)}
                      onDelete={() => confirmDelete(meeting.id)}
                      onSummarize={() => openSummarizeDialog(meeting)}
                      onGenerateTasks={() => openTasksDialog(meeting)}
                    />
                  ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma reunião agendada.</p>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h2 className="text-lg font-semibold mb-4">Reuniões Anteriores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMeetings.filter(m => new Date(m.date) < today).length > 0 ? (
                filteredMeetings
                  .filter(m => new Date(m.date) < today)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))
                  .map(meeting => (
                    <MeetingCard
                      key={meeting.id}
                      meeting={meeting}
                      project={getProjectById(meeting.project_id)}
                      onEdit={() => openEditDialog(meeting)}
                      onDelete={() => confirmDelete(meeting.id)}
                      onSummarize={() => openSummarizeDialog(meeting)}
                      onGenerateTasks={() => openTasksDialog(meeting)}
                      isPast
                    />
                  ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>Nenhuma reunião anterior registrada.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Reunião" : "Nova Reunião"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="project_id">Projeto</Label>
              <Select
                value={formData.project_id}
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
              <Label htmlFor="title">Título da Reunião</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Título da reunião"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Data da Reunião</Label>
                <Input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label>Participantes</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Email do participante"
                  value={newAttendee}
                  onChange={(e) => setNewAttendee(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAttendee();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddAttendee}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {formData.attendees && formData.attendees.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.attendees.map((attendee, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {attendee}
                      <button
                        type="button"
                        onClick={() => handleRemoveAttendee(index)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Anotações</Label>
              <Textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Anotações da reunião"
                rows={3}
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex justify-between items-center">
                <Label>Itens de Ação</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowActionItemForm(true)}
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Item
                </Button>
              </div>
              
              {showActionItemForm && (
                <Card className="p-4 border bg-gray-50">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="action-description">Descrição</Label>
                      <Input
                        id="action-description"
                        name="description"
                        value={actionItem.description}
                        onChange={handleActionItemChange}
                        placeholder="O que precisa ser feito?"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="action-responsible">Responsável</Label>
                        <Input
                          id="action-responsible"
                          name="responsible"
                          value={actionItem.responsible}
                          onChange={handleActionItemChange}
                          placeholder="Email do responsável"
                        />
                      </div>
                      
                      <div className="grid gap-2">
                        <Label htmlFor="action-deadline">Prazo</Label>
                        <Input
                          id="action-deadline"
                          name="deadline"
                          type="date"
                          value={actionItem.deadline}
                          onChange={handleActionItemChange}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setShowActionItemForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="button" 
                        size="sm" 
                        onClick={addActionItem}
                      >
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
              
              {formData.action_items && formData.action_items.length > 0 && (
                <div className="space-y-2 mt-2">
                  {formData.action_items.map((item, index) => (
                    <div key={index} className="flex justify-between p-3 border rounded-md bg-gray-50">
                      <div>
                        <p className="font-medium">{item.description}</p>
                        <div className="text-sm text-gray-500">
                          <span>Responsável: {item.responsible}</span>
                          {item.deadline && (
                            <span className="ml-2">Prazo: {new Date(item.deadline).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => removeActionItem(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
            <Button onClick={handleSubmit}>{isEditing ? "Salvar Alterações" : "Criar Reunião"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={summarizeDialogOpen} onOpenChange={setSummarizeDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-[#ff7a59]" />
              Resumir e Melhorar Anotações
            </DialogTitle>
            <DialogDescription>
              Use IA para reformatar e melhorar as anotações da reunião.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 gap-4 py-4 overflow-y-auto max-h-[calc(80vh-200px)]">
            <Tabs defaultValue="original">
              <TabsList className="mb-4">
                <TabsTrigger value="original">Anotações Originais</TabsTrigger>
                <TabsTrigger value="improved">Versão Melhorada</TabsTrigger>
              </TabsList>
              
              <TabsContent value="original" className="border p-4 rounded-md bg-gray-50">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {currentMeeting?.notes || "Nenhuma anotação disponível."}
                </pre>
              </TabsContent>
              
              <TabsContent value="improved">
                {summarizedNotes ? (
                  <div className="border p-4 rounded-md bg-white">
                    <div className="prose prose-sm max-w-none">
                      <pre className="whitespace-pre-wrap font-sans text-sm">
                        {summarizedNotes}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className="border p-4 rounded-md bg-gray-50 text-center">
                    <p className="text-gray-500">
                      Clique em "Gerar Resumo" para melhorar as anotações.
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSummarizeDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={summarizeMeetingNotes} 
              disabled={summarizing}
              variant="secondary"
              className="bg-[#ff7a59]/10 text-[#ff7a59] hover:bg-[#ff7a59]/20"
            >
              {summarizing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Resumo
                </>
              )}
            </Button>
            <Button 
              onClick={saveSummarizedNotes} 
              disabled={!summarizedNotes || summarizing}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={tasksDialogOpen} onOpenChange={setTasksDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-[#ff7a59]" />
              Gerar Tarefas da Reunião
            </DialogTitle>
            <DialogDescription>
              A IA identificou as seguintes tarefas nas anotações. Revise, edite se necessário e selecione as que deseja criar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 overflow-y-auto max-h-[calc(90vh-200px)]">
            {generatingTasks ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-10 w-10 animate-spin text-[#ff7a59] mb-4" />
                <p className="text-gray-600">Analisando anotações e gerando tarefas...</p>
              </div>
            ) : suggestedTasks.length > 0 ? (
              <div className="space-y-6">
                {suggestedTasks.map((task, index) => (
                  <div key={index} className="border rounded-md p-4 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <Checkbox 
                        id={`task-${index}`} 
                        checked={!!selectedTasks[index]}
                        onCheckedChange={(checked) => handleTaskSelection(index, checked)}
                      />
                      <div className="flex-1 space-y-4">
                        <div>
                          <Label htmlFor={`title-${index}`}>Título</Label>
                          <Input
                            id={`title-${index}`}
                            value={task.title}
                            onChange={(e) => handleTaskEdit(index, 'title', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`description-${index}`}>Descrição</Label>
                          <Textarea
                            id={`description-${index}`}
                            value={task.description}
                            onChange={(e) => handleTaskEdit(index, 'description', e.target.value)}
                            className="mt-1"
                            rows={3}
                          />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`role-${index}`}>Função</Label>
                            <Select
                              value={task.role_id}
                              onValueChange={(value) => handleTaskEdit(index, 'role_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a função" />
                              </SelectTrigger>
                              <SelectContent>
                                {roles.map((role) => (
                                  <SelectItem key={role.id} value={role.id}>
                                    {role.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor={`seniority-${index}`}>Senioridade</Label>
                            <Select
                              value={task.seniority_level}
                              onValueChange={(value) => handleTaskEdit(index, 'seniority_level', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a senioridade" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="junior">Júnior</SelectItem>
                                <SelectItem value="pleno">Pleno</SelectItem>
                                <SelectItem value="senior">Sênior</SelectItem>
                                <SelectItem value="especialista">Especialista</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`hours-${index}`}>Horas Estimadas</Label>
                            <Input
                              id={`hours-${index}`}
                              type="number"
                              value={task.estimated_hours}
                              onChange={(e) => handleTaskEdit(index, 'estimated_hours', Number(e.target.value))}
                              min={1}
                              className="mt-1"
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`start-${index}`}>Data de Início</Label>
                            <Input
                              id={`start-${index}`}
                              type="date"
                              value={task.start_date.split('T')[0]}
                              onChange={(e) => handleTaskEdit(index, 'start_date', e.target.value)}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        
                        {task.dependencies && task.dependencies.length > 0 && (
                          <div className="mt-2">
                            <Label>Dependências</Label>
                            <div className="mt-1 text-sm text-gray-600">
                              Depende de: {task.dependencies.map(depIndex => suggestedTasks[depIndex]?.title).join(', ')}
                            </div>
                            <div className="mt-1 text-sm text-gray-500">
                              {task.dependency_justification}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ListTodo className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500">Nenhuma tarefa identificada nas anotações.</p>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTasksDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={createSelectedTasks} 
              disabled={generatingTasks || suggestedTasks.length === 0 || !Object.values(selectedTasks).some(v => v)}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              Criar {Object.values(selectedTasks).filter(Boolean).length} Tarefas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MeetingCard({ meeting, project, onEdit, onDelete, onSummarize, onGenerateTasks, isPast = false }) {
  const meetingDate = new Date(meeting.date);
  const isToday = 
    meetingDate.getDate() === new Date().getDate() &&
    meetingDate.getMonth() === new Date().getMonth() &&
    meetingDate.getFullYear() === new Date().getFullYear();
  
  return (
    <Card className={`${isPast ? "bg-gray-50" : isToday ? "bg-blue-50 border-blue-200" : ""}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between">
          <CardTitle className="text-lg">{meeting.title}</CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={onEdit}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-col mt-2">
          <div className="flex items-center gap-2 text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{format(meetingDate, "PPP", { locale: pt })}</span>
          </div>
          <Link to={createPageUrl(`ProjectDetails?id=${meeting.project_id}`)} className="text-blue-600 hover:underline mt-1">
            {project.title}
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {meeting.notes && (
          <div className="mb-4">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" /> Anotações Originais:
                </h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{meeting.notes}</p>
                </div>
              </div>
              
              {meeting.improved_notes && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-[#ff7a59]" /> Versão Melhorada:
                  </h4>
                  <div className="bg-[#ff7a59]/5 border border-[#ff7a59]/10 p-3 rounded-md">
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{meeting.improved_notes}</p>
                  </div>
                </div>
              )}
              
              {meeting.generated_tasks && meeting.generated_tasks.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <ListTodo className="h-4 w-4 text-[#ff7a59]" /> Tarefas Identificadas:
                  </h4>
                  <div className="space-y-2">
                    {meeting.generated_tasks.map((task, index) => (
                      <div key={index} className="bg-white border p-3 rounded-md">
                        <div className="flex items-start justify-between">
                          <div className="font-medium text-sm">{task.title}</div>
                          <Badge variant="outline" className="text-xs">
                            {task.status || 'Pendente'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {task.role_title}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.seniority_level}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {task.estimated_hours}h previstas
                          </Badge>
                          {task.start_date && (
                            <Badge variant="outline" className="text-xs">
                              Início: {format(new Date(task.start_date), 'dd/MM/yyyy')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {meeting.attendees && meeting.attendees.length > 0 && (
          <div className="mb-4">
            <h4 className="font-medium mb-1 flex items-center gap-1">
              <Users className="h-4 w-4" /> Participantes:
            </h4>
            <div className="flex flex-wrap gap-1">
              {meeting.attendees.map((attendee, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {attendee}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {meeting.action_items && meeting.action_items.length > 0 && (
          <div>
            <h4 className="font-medium mb-1">Itens de Ação:</h4>
            <ul className="space-y-2">
              {meeting.action_items.map((item, index) => (
                <li key={index} className="text-sm p-2 border rounded-md">
                  <div className="font-medium">{item.description}</div>
                  <div className="text-gray-500 mt-1 text-xs">
                    <span>Responsável: {item.responsible}</span>
                    {item.deadline && (
                      <span className="ml-2">Prazo: {new Date(item.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={onSummarize}
          >
            <FileText className="h-3 w-3 mr-1" /> Melhorar Anotações
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs"
            onClick={onGenerateTasks}
          >
            <ListTodo className="h-3 w-3 mr-1" /> Gerar Tarefas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

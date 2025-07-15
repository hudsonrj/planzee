
import React, { useState, useEffect, useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, FileText, Loader2, PlusCircle, ServerCrash, ArrowRight, Settings, CheckCircle, CheckSquare, Calendar, FilePlus, Link as LinkIcon, Edit, Users, Calendar as CalendarIcon, Settings2, Server, UserCircle, Clock, Building, Wrench, Network, DatabaseZap, Sparkles, Plus, Pencil, Info } from 'lucide-react';
import { InvokeLLM, GenerateImage } from "@/api/integrations";
import { Project, Task, Infrastructure, Checklist, Meeting, Feedback, DiagramArchitecture, Role, Area, User, ProjectType, ProjectStatus, Budget, Note, ProjectLog } from "@/api/entities"; // Added ProjectType, ProjectStatus, Budget, Note, ProjectLog
import { useSearchParams } from 'react-router-dom';
import { createPageUrl } from "@/utils";
// import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'; // Removed, now handled by TaskBoard
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import NoteComponent from "../components/notes/NoteComponent";
import ProjectNotes from "../components/notes/ProjectNotes";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import ProjectDiagrams from "@/components/projects/ProjectDiagrams";
import TaskForm from "../components/tasks/TaskForm";
import { toast as useToast } from '@/components/ui/use-toast'; // Renamed to useToast to avoid conflict
import ChecklistReviewDialog from "@/components/checklists/ChecklistReviewDialog"; // Import the new component
import { notifyTaskAssignment } from "@/api/functions";
import { filterTasksByUserAccess, canEditTask, canDeleteTask, canEditProject, useCurrentUser } from '@/components/permissions/PermissionUtils';
import TaskBoard from '@/components/tasks/TaskBoard';
import DateChangeDialog from '../components/projects/DateChangeDialog';


export default function ProjectDetailsPage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id');

  const { currentUser } = useCurrentUser();

  const [activeTab, setActiveTab] = useState("overview");
  const [project, setProject] = useState(null);
  const [diagramImage, setDiagramImage] = useState(null);
  const [generatingDiagram, setGeneratingDiagram] = useState(false);
  const [infrastructure, setInfrastructure] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notFound, setNotFound] = useState(false); // New state for not found
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [checklists, setChecklists] = useState([]);
  const [links, setLinks] = useState([]);
  const [budgets, setBudgets] = useState([]); // New state
  const [notes, setNotes] = useState([]); // New state
  const [logs, setLogs] = useState([]); // New state
  const [dateChangeInfo, setDateChangeInfo] = useState(null); // New state

  const [isAddingMeeting, setIsAddingMeeting] = useState(false);
  const [isAddingFeedback, setIsAddingFeedback] = useState(false);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isGeneratingChecklist, setIsGeneratingChecklist] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  // New state for the review process
  const [aiChecklistSuggestions, setAiChecklistSuggestions] = useState([]);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isSubmittingChecklist, setIsSubmittingChecklist] = useState(false);

  const [newMeeting, setNewMeeting] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [newFeedback, setNewFeedback] = useState({
    content: '',
    type: 'sugestão',
    priority: 'média'
  });
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    type: 'repository'
  });
  const [checklistPhase, setChecklistPhase] = useState("");
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editedProject, setEditedProject] = useState(null);
  const [users, setUsers] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [projectStatusList, setProjectStatusList] = useState([]);
  const [teamComposition, setTeamComposition] = useState({ users: {}, areas: {} });
  const [infrastructureData, setInfrastructureData] = useState(null);
  const [showGenerateChecklistDialog, setShowGenerateChecklistDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [roles, setRoles] = useState([]);
  const [areas, setAreas] = useState([]);

  const printRef = useRef(null);

  const columns = [
    {
      id: "pendente",
      title: "Pendente",
    },
    {
      id: "em_andamento",
      title: "Em Andamento",
    },
    {
      id: "bloqueada",
      title: "Bloqueada",
    },
    {
      id: "concluída",
      title: "Concluída",
    }
  ];

  // Function to calculate project progress based on tasks
  const calculateProjectProgress = (tasksToConsider) => {
    let calculatedProgress = 0;
    if (tasksToConsider.length > 0) {
      const completedTasks = tasksToConsider.filter(task => task.status === 'concluída').length;
      calculatedProgress = Math.round((completedTasks / tasksToConsider.length) * 100);
    }
    setProject(prevProject => ({
      ...prevProject,
      progress: calculatedProgress
    }));
  };

  useEffect(() => {
    if (projectId) {
      loadData(projectId);
    } else {
      setLoading(false);
      setError("ID do Projeto não fornecido na URL.");
      setNotFound(true);
    }
  }, [projectId]);

  useEffect(() => {
    if (tasks.length > 0 && users.length > 0 && areas.length > 0) {
      const composition = {
        users: {},
        areas: {}
      };

      tasks.forEach(task => {
        // Processa usuário da tarefa
        if (task.assigned_to) {
          if (!composition.users[task.assigned_to]) {
            const user = users.find(u => u.email === task.assigned_to);
            composition.users[task.assigned_to] = {
              name: user ? user.full_name : task.assigned_to,
              email: task.assigned_to,
              tasks: { pendente: 0, em_andamento: 0, bloqueada: 0, concluída: 0, total: 0 }
            };
          }
          composition.users[task.assigned_to].tasks[task.status]++;
          composition.users[task.assigned_to].tasks.total++;
        }

        // Processa área da tarefa
        if (task.area_id) {
          if (!composition.areas[task.area_id]) {
            const area = areas.find(a => a.id === task.area_id);
            composition.areas[task.area_id] = {
              name: area ? area.name : 'Área Desconhecida',
              id: task.area_id,
              tasks: { pendente: 0, em_andamento: 0, bloqueada: 0, concluída: 0, total: 0 }
            };
          }
          composition.areas[task.area_id].tasks[task.status]++;
          composition.areas[task.area_id].tasks.total++;
        }
      });
      setTeamComposition(composition);
    }
  }, [tasks, users, areas]);


  const loadData = async (id) => {
    if (!id) {
      setError("ID do projeto não fornecido.");
      setNotFound(true);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setNotFound(false); // Reset notFound state
      setError(null);

      // 1. Load global parameters first
      const [usersData, areasData, projectTypesData, projectStatusData, rolesData] = await Promise.all([
        User.list().catch(err => { console.error("Erro ao carregar usuários:", err); return []; }),
        Area.list().catch(err => { console.error("Erro ao carregar áreas:", err); return []; }),
        ProjectType.list().catch(err => { console.error("Erro ao carregar tipos de projeto:", err); return []; }),
        ProjectStatus.list().catch(err => { console.error("Erro ao carregar status de projeto:", err); return []; }),
        Role.list().catch(err => { console.error("Erro ao carregar papéis:", err); return []; })
      ]);

      setUsers(usersData);
      setAreas(areasData);
      setProjectTypes(projectTypesData);
      setProjectStatusList(projectStatusData);
      setRoles(rolesData);

      // 2. Load project-specific data
      const [projectDataResult, tasksDataResult, meetingsDataResult, feedbacksDataResult, checklistsDataResult, budgetsDataResult, notesDataResult, logsDataResult] = await Promise.all([
        Project.get(id).catch(err => {
          console.error("Erro ao carregar projeto:", err);
          return null;
        }),
        Task.filter({ project_id: id }).catch(err => {
          console.error("Erro ao carregar tarefas:", err);
          return [];
        }),
        Meeting.filter({ project_id: id }).catch(err => {
          console.error("Erro ao carregar reuniões:", err);
          return [];
        }),
        Feedback.filter({ project_id: id }).catch(err => {
          console.error("Erro ao carregar feedbacks:", err);
          return [];
        }),
        Checklist.filter({ project_id: id }).catch(err => {
          console.error("Erro ao carregar checklists:", err);
          return [];
        }),
        Budget.filter({ project_id: id }).catch(err => {
          console.error("Erro ao carregar orçamentos:", err);
          return [];
        }),
        Note.filter({ item_id: id, type: 'project' }).catch(err => {
          console.error("Erro ao carregar notas:", err);
          return [];
        }),
        ProjectLog.filter({ project_id: id }, '-created_date').catch(err => {
          console.error("Erro ao carregar logs:", err);
          return [];
        })
      ]);

      const projectData = projectDataResult || null;
      const tasksData = Array.isArray(tasksDataResult) ? tasksDataResult : [];
      const meetingsData = Array.isArray(meetingsDataResult) ? meetingsDataResult : [];
      const feedbacksData = Array.isArray(feedbacksDataResult) ? feedbacksDataResult : [];
      const checklistsData = Array.isArray(checklistsDataResult) ? checklistsDataResult : [];
      const budgetsData = Array.isArray(budgetsDataResult) ? budgetsDataResult : [];
      const notesData = Array.isArray(notesDataResult) ? notesDataResult : [];
      const logsData = Array.isArray(logsDataResult) ? logsDataResult : [];

      if (!projectData) {
        setError(`Projeto com ID "${id}" não encontrado.`);
        setNotFound(true);
        return;
      }

      // Filtrar tarefas considerando o currentUser
      let filteredTasks = tasksData;
      if (currentUser) {
        filteredTasks = filterTasksByUserAccess(
          tasksData,
          currentUser.email,
          currentUser.position,
          projectData.responsible
        );
      }

      setTasks(filteredTasks);
      setMeetings(meetingsData);
      setFeedbacks(feedbacksData);
      setChecklists(checklistsData);
      setBudgets(budgetsData);
      setNotes(notesData);
      setLogs(logsData);

      const safeProjectData = {
        ...projectData,
        links: Array.isArray(projectData.links) ? projectData.links : [],
        participants: Array.isArray(projectData.participants) ? projectData.participants : [],
        tags: Array.isArray(projectData.tags) ? projectData.tags : []
      };

      setProject(safeProjectData);
      calculateProjectProgress(tasksData);

      setLinks(safeProjectData.links);
      setEditedProject(safeProjectData);

      // Carregar infraestrutura
      try {
        const infraList = await Infrastructure.filter({ project_id: id });
        if (Array.isArray(infraList) && infraList.length > 0) {
          setInfrastructure(infraList[0]);
        } else {
          setInfrastructure(null);
        }
      } catch (infraError) {
        console.error("Erro ao carregar infraestrutura:", infraError);
        setInfrastructure(null);
      }

      // Carregar diagramas
      try {
        const diagrams = await DiagramArchitecture.filter({ project_id: id }, "-created_date", 1);
        if (Array.isArray(diagrams) && diagrams.length > 0) {
          setDiagramImage(diagrams[0].image_url);
        } else {
          setDiagramImage(null);
        }
      } catch (diagramError) {
        console.error("Erro ao carregar diagrama:", diagramError);
        setDiagramImage(null);
      }

    } catch (err) {
      console.error("Erro detalhado ao carregar dados do projeto:", err);
      setError(`Falha ao carregar dados do projeto: ${err.message}`);
      setProject(null);
      setNotFound(true);
      toast({
        title: "Erro ao carregar projeto",
        description: `Não foi possível carregar os detalhes do projeto: ${err.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (project && projectTypes.length > 0 && projectStatusList.length > 0) {
      const defaultTypeId = projectTypes.length > 0 ? projectTypes[0].id : '';
      const defaultStatusId = projectStatusList.length > 0 ? projectStatusList[0].id : '';

      setEditedProject({
        ...project,
        type_id: project.type_id || defaultTypeId,
        status_id: project.status_id || defaultStatusId,
        links: Array.isArray(project.links) ? project.links : [],
        participants: Array.isArray(project.participants) ? project.participants : [],
        tags: Array.isArray(project.tags) ? project.tags : []
      });
    } else if (project && (!projectTypes.length || !projectStatusList.length)) {
      setEditedProject({
        ...project,
        links: Array.isArray(project.links) ? project.links : [],
        participants: Array.isArray(project.participants) ? project.participants : [],
        tags: Array.isArray(project.tags) ? project.tags : []
      });
    }
  }, [project, projectTypes, projectStatusList]);

  const handleSaveProjectChanges = async () => {
    try {
      if (!editedProject) return;

      const oldStartDate = project.start_date;
      const oldDeadline = project.deadline;

      const payload = {
        title: editedProject.title,
        description: editedProject.description,
        type_id: editedProject.type_id,
        status_id: editedProject.status_id,
        area_id: editedProject.area_id,
        responsible: editedProject.responsible,
        start_date: editedProject.start_date,
        deadline: editedProject.deadline,
        priority: editedProject.priority,
        tags: editedProject.tags,
        participants: editedProject.participants,
        links: editedProject.links,
        infrastructure_cost: editedProject.infrastructure_cost,
        infrastructure_provider: editedProject.infrastructure_provider,
      };

      if (!payload.type_id || !payload.status_id) {
        toast({
          title: "Campos Obrigatórios",
          description: "Por favor, selecione o Tipo e o Status do projeto.",
          variant: "destructive",
        });
        return;
      }

      await Project.update(projectId, payload);

      // Check for date changes
      if (oldStartDate !== payload.start_date || oldDeadline !== payload.deadline) {
        setDateChangeInfo({
          projectId: projectId,
          oldStartDate: oldStartDate,
          newStartDate: payload.start_date,
          oldDeadline: oldDeadline,
          newDeadline: payload.deadline,
          initiator: currentUser?.email || 'Desconhecido',
          reason: '', // Will be filled in the dialog
          type: 'project_dates'
        });
      } else {
        // If no date change, just reload and toast
        await loadData(projectId);
        setIsEditingProject(false);
        toast({
          title: 'Sucesso!',
          description: 'Projeto atualizado com sucesso.',
        });
      }

    } catch (error) {
      console.error("Erro ao atualizar projeto:", error);
      toast({
        title: 'Erro ao Atualizar',
        description: 'Não foi possível salvar as alterações. Verifique os campos e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDateChangeConfirmed = async (logEntry) => {
    if (logEntry) {
      await ProjectLog.create(logEntry);
    }
    setDateChangeInfo(null);
    await loadData(projectId);
    setIsEditingProject(false);
    toast({
      title: 'Sucesso!',
      description: 'Projeto e datas atualizados com sucesso.',
    });
  };


  const generateProjectDiagram = async () => {
    if (!project) return;
    try {
      setGeneratingDiagram(true);
      const prompt = `
        Crie uma imagem de diagrama de arquitetura para um projeto de inovação digital com as seguintes características:

        Título: ${project.title}
        Descrição: ${project.description || 'Sem descrição'}
        Status: ${getProjectStatus(project?.status_id)?.name || 'Não definido'}

        ${infrastructure ? `
        Infraestrutura: ${project.infrastructure_provider?.toUpperCase() || "Não definida"}
        Recursos:
        ${infrastructure[`${infrastructure.selected_provider}_solution`]?.resources
          ?.map(r => `- ${r.name} (${r.environment}): ${r.specifications}`)
          ?.join('\n') || "Não definidos"}
        ` : 'Infraestrutura não definida.'}

        Gere uma imagem de diagrama técnico de arquitetura moderna, limpa e profissional, mostrando os componentes, conexões e fluxos de dados.
        Use cores diferentes para ambiente de desenvolvimento, homologação e produção.
        Inclua servidores, bancos de dados e outros recursos necessários.
        Adicione legendas e explicações.
      `;
      const result = await GenerateImage({
        prompt
      });
      if (result && result.url) {
        setDiagramImage(result.url);
        await DiagramArchitecture.create({
          project_id: projectId,
          image_url: result.url,
          generated_date: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Erro ao gerar diagrama:", error);
      toast({
        title: "Erro ao gerar diagrama",
        description: error.message || "Não foi possível gerar o diagrama.",
        variant: "destructive"
      });
    } finally {
      setGeneratingDiagram(false);
    }
  };

  // Removed handleTaskDragEnd as TaskBoard will handle drag-and-drop and call onTaskUpdate.

  const handleCreateTask = async (newTaskData) => {
    try {
      const taskToCreate = {
        ...newTaskData,
        project_id: projectId,
        estimated_hours: Number(newTaskData.estimated_hours || 0),
        hourly_rate: Number(newTaskData.hourly_rate || 0),
        total_cost: Number(newTaskData.total_cost || 0)
      };
      Object.keys(taskToCreate).forEach(key => {
        if (taskToCreate[key] === undefined || taskToCreate[key] === null) {
          delete taskToCreate[key];
        }
      });
      const createdTask = await Task.create(taskToCreate);

      // Ação de notificação - quando criar tarefa com responsável
      if (createdTask.assigned_to) {
        const taskUrl = window.location.href;
        try {
          const response = await notifyTaskAssignment({
            taskId: createdTask.id,
            projectId: projectId,
            taskUrl
          });
          console.log("✅ Notificação de nova tarefa enviada:", response);
        } catch (err) {
          console.error("❌ Erro ao enviar notificação de nova tarefa:", err);
          // Não falha a criação da tarefa se a notificação falhar
        }
      }

      setShowTaskDialog(false);
      // Update tasks state directly instead of full reload for immediate UI update
      setTasks(prevTasks => [...prevTasks, createdTask]);
      toast({
        title: "Tarefa criada",
        description: "A nova tarefa foi adicionada com sucesso."
      });
      // Recalculate progress if necessary (can be done more efficiently than full load)
      calculateProjectProgress([...tasks, createdTask]);
    } catch (error) {
      console.error("Erro ao criar tarefa:", error);
      toast({
        title: "Erro ao criar tarefa",
        description: error.message || "Não foi possível criar a tarefa.",
        variant: "destructive"
      });
    }
  };

  const handleAddMeeting = async () => {
    try {
      if (!newMeeting.title || !newMeeting.date) {
        toast({
          title: "Campos obrigatórios",
          description: "Título e data da reunião são obrigatórios.",
          variant: "destructive"
        });
        return;
      }
      const meetingToAdd = {
        ...newMeeting,
        project_id: projectId,
        attendees: []
      };
      await Meeting.create(meetingToAdd);
      setMeetings(prevMeetings => [...prevMeetings, meetingToAdd]);
      setNewMeeting({
        title: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setIsAddingMeeting(false);
      toast({
        title: "Reunião adicionada",
        description: "A reunião foi adicionada com sucesso."
      });
    } catch (error) {
      console.error("Erro ao adicionar reunião:", error);
      toast({
        title: "Erro ao adicionar reunião",
        description: error.message || "Não foi possível adicionar a reunião.",
        variant: "destructive"
      });
    }
  };

  const handleAddFeedback = async () => {
    try {
      if (!newFeedback.content) {
        toast({
          title: "Campo obrigatório",
          description: "O conteúdo do feedback é obrigatório.",
          variant: "destructive"
        });
        return;
      }
      const feedbackToAdd = {
        ...newFeedback,
        project_id: projectId,
        author: currentUser?.full_name || currentUser?.email || 'Anônimo',
        status: 'aberto'
      };
      await Feedback.create(feedbackToAdd);
      setFeedbacks(prevFeedbacks => [...prevFeedbacks, feedbackToAdd]);
      setNewFeedback({
        content: '',
        type: 'sugestão',
        priority: 'média'
      });
      setIsAddingFeedback(false);
      toast({
        title: "Feedback adicionado",
        description: "O feedback foi adicionado com sucesso."
      });
    } catch (error) {
      console.error("Erro ao adicionar feedback:", error);
      toast({
        title: "Erro ao adicionar feedback",
        description: error.message || "Não foi possível adicionar o feedback.",
        variant: "destructive"
      });
    }
  };

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) {
      toast({
        title: "Campos obrigatórios",
        description: "Título e URL do link são obrigatórios.",
        variant: "destructive"
      });
      return;
    }
    try {
      const currentLinks = Array.isArray(links) ? links : [];
      const updatedLinks = [...currentLinks, newLink];
      await Project.update(projectId, {
        links: updatedLinks
      });
      setLinks(updatedLinks);
      setIsAddingLink(false);
      setNewLink({
        title: '',
        url: '',
        type: 'repository'
      });
      toast({
        title: "Link adicionado",
        description: "O link foi adicionado com sucesso."
      });
    } catch (error) {
      console.error("Erro ao adicionar link:", error);
      toast({
        title: "Erro ao adicionar link",
        description: error.message || "Não foi possível adicionar o link.",
        variant: "destructive"
      });
    }
  };

  const generateChecklistWithAI = async () => {
    if (!checklistPhase) {
      toast({
        title: "Fase obrigatória",
        description: "Selecione uma fase do projeto para gerar a checklist.",
        variant: "destructive"
      });
      return;
    }
    try {
      setIsGeneratingChecklist(true);
      const projectTasks = Array.isArray(tasks) ? tasks : [];
      const prompt = `
        Crie uma checklist detalhada para um projeto de TI na fase de "${checklistPhase}".

        Detalhes do projeto:
        - Título: ${project?.title}
        - Descrição: ${project?.description || "Não fornecida"}
        - Status atual: ${getProjectStatus(project?.status_id)?.name || "Não definido"}

        Tarefas atuais do projeto (${projectTasks.length}):
        ${projectTasks.map(task => `- ${task.title} (${task.status})`).join('\n')}

        A checklist deve conter itens específicos e verificáveis que precisam ser concluídos nesta fase do projeto.
        Cada item deve ser uma ação concreta e verificável.
        Organize os itens em categorias lógicas quando apropriado.
        Forneça cerca de 10-15 itens relevantes para esta fase específica.
        Retorne apenas a lista de itens em formato JSON com a seguinte estrutura:
        {
          "checklist_items": [
            {"description": "Item 1 da checklist", "completed": false},
            {"description": "Item 2 da checklist", "completed": false},
            ...
          ]
        }
      `;
      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            checklist_items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  completed: { type: "boolean" }
                },
                required: ["description", "completed"]
              }
            }
          },
          required: ["checklist_items"]
        }
      });
      if (result && result.checklist_items) {
        // DO NOT create the checklist directly.
        // Instead, show the review modal with the suggestions.
        setAiChecklistSuggestions(result.checklist_items);
        setShowGenerateChecklistDialog(false); // Close the first dialog
        setShowReviewDialog(true); // Open the review dialog
      } else {
        toast({
          title: "Geração Incompleta",
          description: "A IA não conseguiu gerar itens de checklist. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao gerar sugestões de checklist:", error);
      toast({
        title: "Erro na IA",
        description: "Não foi possível gerar as sugestões. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingChecklist(false);
    }
  };

  const handleCreateFinalChecklist = async (finalItems) => {
    if (finalItems.length === 0) {
      toast({
        title: "Nenhum item selecionado",
        description: "Adicione ou selecione pelo menos um item para criar a checklist.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmittingChecklist(true);

      const createdChecklist = await Checklist.create({
        project_id: projectId,
        phase: checklistPhase,
        items: finalItems,
        ai_generated: true
      });

      setChecklists(prevChecklists => [...prevChecklists, createdChecklist]);
      setShowReviewDialog(false);
      setChecklistPhase('');
      setAiChecklistSuggestions([]);

      toast({
        title: "Checklist criada!",
        description: `A checklist para a fase de ${checklistPhase} foi criada com sucesso.`,
      });

    } catch (error) {
      console.error("Erro ao criar a checklist final:", error);
      toast({
        title: "Erro ao Salvar",
        description: "Não foi possível salvar a checklist. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingChecklist(false);
    }
  };

  const toggleChecklistItem = async (checklistId, itemIndex, completed) => {
    try {
      const checklist = Array.isArray(checklists) ? checklists.find(c => c.id === checklistId) : null;
      if (!checklist || !Array.isArray(checklist.items)) return;

      const updatedItems = JSON.parse(JSON.stringify(checklist.items));
      updatedItems[itemIndex].completed = completed;

      if (completed) {
        updatedItems[itemIndex].completion_date = new Date().toISOString().split('T')[0];
      } else {
        delete updatedItems[itemIndex].completion_date;
      }

      await Checklist.update(checklistId, {
        items: updatedItems
      });

      const updatedChecklists = (Array.isArray(checklists) ? checklists : []).map(cl =>
        cl.id === checklistId ? { ...cl, items: updatedItems } : cl
      );

      setChecklists(updatedChecklists);
    } catch (error) {
      console.error("Erro ao atualizar item da checklist:", error);
      toast({
        title: "Erro ao atualizar item",
        description: error.message || "Não foi possível atualizar o item da checklist.",
        variant: "destructive"
      });
    }
  };

  const handlePrint = () => {
    try {
      if (!printRef || !printRef.current) {
        console.error("Print reference is not available");
        return;
      }
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank', 'height=600,width=800');
      if (!printWindow) {
        console.error("Failed to open print window - popup might be blocked");
        return;
      }
      printWindow.document.write(`
        <html>
          <head>
            <title>Projeto - ${project?.title || 'Detalhes'}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { font-size: 24px; margin-bottom: 10px; }
              h2 { font-size: 20px; margin-top: 20px; margin-bottom: 10px; }
              p { margin: 8px 0; }
              table { border-collapse: collapse; width: 100%; margin: 15px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .badge { display: inline-block; padding: 3px 6px; border-radius: 4px; font-size: 12px; font-weight: 500; }
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
      console.error("Erro ao imprimir detalhes do projeto:", error);
      toast({
        title: "Erro ao imprimir",
        description: error.message || "Não foi possível gerar a versão para impressão.",
        variant: "destructive"
      });
    }
  };

  const handleEditTask = (task) => {
    setCurrentTask(task);
    setShowTaskDialog(true);
  };

  const handleTaskUpdate = async (updatedTask) => {
    try {
      if (!updatedTask.id) {
        console.error("Falta ID da tarefa para atualização");
        return;
      }

      const previousTask = tasks.find(t => t.id === updatedTask.id);

      const taskData = {
        ...updatedTask,
        estimated_hours: Number(updatedTask.estimated_hours || 0),
        hourly_rate: Number(updatedTask.hourly_rate || 0),
        total_cost: Number(updatedTask.total_cost || 0)
      };

      Object.keys(taskData).forEach(key => {
        if (taskData[key] === undefined || taskData[key] === null) {
          delete taskData[key];
        }
      });

      await Task.update(taskData.id, taskData);

      const newTasks = tasks.map(task =>
        task.id === updatedTask.id ? taskData : task
      );
      setTasks(newTasks);

      toast({
        title: "Tarefa atualizada",
        description: "A tarefa foi atualizada com sucesso."
      });

      // Verificar se houve mudança no responsável
      const responsibleChanged = previousTask?.assigned_to !== updatedTask.assigned_to;

      // Ação de notificação - quando atribuir/alterar responsável
      if (updatedTask.assigned_to && responsibleChanged) {
        const taskUrl = window.location.href;
        try {
          const response = await notifyTaskAssignment({
            taskId: updatedTask.id,
            projectId: projectId,
            taskUrl
          });
          console.log("✅ Notificação de alteração de responsável enviada:", response);
        } catch (err) {
          console.error("❌ Erro ao enviar notificação de alteração:", err);
          // Não falha a atualização da tarefa se a notificação falhar
        }
      }

      setShowTaskDialog(false);
      setCurrentTask(null);
      calculateProjectProgress(newTasks);
    } catch (error) {
      console.error("Erro na atualização da tarefa:", error);
      toast({
        title: "Erro ao atualizar tarefa",
        description: error.message || "Não foi possível atualizar a tarefa.",
        variant: "destructive"
      });
    }
  };

  const handleTaskDelete = async (task) => {
    if (!window.confirm(`Tem certeza que deseja excluir a tarefa "${task.title}"?`)) {
      return;
    }

    try {
      await Task.delete(task.id);
      const newTasks = tasks.filter(t => t.id !== task.id);
      setTasks(newTasks);

      toast({
        title: "Tarefa excluída",
        description: "A tarefa foi excluída com sucesso."
      });
      calculateProjectProgress(newTasks);
    } catch (error) {
      console.error("Erro ao excluir tarefa:", error);
      toast({
        title: "Erro ao excluir tarefa",
        description: error.message || "Não foi possível excluir a tarefa.",
        variant: "destructive"
      });
    }
  };

  const getAreaName = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : "Não definida";
  };

  const getProjectStatus = (statusId) => {
    if (!projectStatusList || projectStatusList.length === 0) {
      return { name: 'Carregando...', color: '#6b7280', icon: 'Loader2', slug: 'loading' };
    }
    return projectStatusList.find(s => s.id === statusId) || { name: 'Desconhecido', color: '#6b7280', icon: 'Info', slug: 'unknown' };
  };

  const getProjectType = (typeId) => {
    if (!projectTypes || projectTypes.length === 0) {
      return { name: 'Carregando...', icon: 'Loader2', slug: 'loading' };
    }
    return projectTypes.find(t => t.id === typeId) || { name: 'Desconhecido', icon: 'Info', slug: 'unknown' };
  };

  // Check if current user can edit the project
  const canEditCurrentProject = currentUser ? canEditProject(currentUser.position, project?.responsible, currentUser.email) : false;

  if (loading) {
    return (
      <div className="container mx-auto py-6 flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error && notFound) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
          <p className="font-bold">Erro ao carregar projeto:</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="container mx-auto py-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-4 rounded-md">
          Projeto não encontrado ou ID inválido.
        </div>
      </div>
    );
  }

  const currentStatus = getProjectStatus(project.status_id);
  const currentType = getProjectType(project.type_id);

  return (
    <>
      <div className="container mx-auto py-6 space-y-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{project.title}</h1>
            <p className="text-gray-500 mt-1">{project.description}</p>
          </div>
          <div className="flex gap-2">
            <Badge style={{ backgroundColor: currentStatus.color, color: 'white' }}>
              {currentStatus.name}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingProject(true)}
              className="ml-2"
              disabled={!canEditCurrentProject}
            >
              <Edit className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="ml-2"
            >
              Imprimir
            </Button>
          </div>
        </div>

        <Tabs defaultValue="tasks" onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 lg:grid-cols-8 w-full">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="tasks">Tarefas</TabsTrigger>
            <TabsTrigger value="diagrams">Diagramas</TabsTrigger>
            <TabsTrigger value="team">Equipe</TabsTrigger>
            <TabsTrigger value="timeline">Cronograma</TabsTrigger>
            <TabsTrigger value="checklist">Checklist</TabsTrigger>
            <TabsTrigger value="infrastructure">Infraestrutura</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Progresso</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1 text-sm">
                        <span>Status geral</span>
                        <span>{project?.progress || 0}%</span>
                      </div>
                      <Progress value={project?.progress || 0} />
                    </div>

                    <div className="pt-4">
                      <h3 className="text-sm font-medium mb-2">Resumo de Tarefas</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-yellow-50 p-3 rounded-md">
                          <div className="text-yellow-800 font-medium">
                            {Array.isArray(tasks) ? tasks.filter(t => t.status === 'pendente').length : 0}
                          </div>
                          <div className="text-xs text-yellow-600">Pendentes</div>
                        </div>
                        <div className="bg-blue-50 p-3 rounded-md">
                          <div className="text-blue-800 font-medium">
                            {Array.isArray(tasks) ? tasks.filter(t => t.status === 'em_andamento').length : 0}
                          </div>
                          <div className="text-xs text-blue-600">Em andamento</div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-md">
                          <div className="text-green-800 font-medium">
                            {Array.isArray(tasks) ? tasks.filter(t => t.status === 'concluída').length : 0}
                          </div>
                          <div className="text-xs text-green-600">Concluídas</div>
                        </div>
                        <div className="bg-red-50 p-3 rounded-md">
                          <div className="text-red-800 font-medium">
                            {Array.isArray(tasks) ? tasks.filter(t => t.status === 'bloqueada').length : 0}
                          </div>
                          <div className="text-xs text-red-600">Bloqueadas</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Próximas Reuniões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(meetings) && meetings
                      .filter(m => new Date(m.date) >= new Date())
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .slice(0, 3)
                      .map((meeting) => (
                        <div key={meeting.id} className="border rounded-md p-3">
                          <div className="font-medium">{meeting.title}</div>
                          <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(meeting.date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      ))}

                    {(!Array.isArray(meetings) || meetings.filter(m => new Date(m.date) >= new Date()).length === 0) && (
                      <div className="text-sm text-gray-500 text-center py-6">
                        Nenhuma reunião agendada
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => setActiveTab('timeline')}
                    >
                      Ver todas
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Checklist do Projeto</CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(checklists) && checklists.length > 0 ? (
                    <div className="space-y-2">
                      {Array.isArray(checklists[0]?.items) && checklists[0].items.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div className="mt-1">
                            {item.completed ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <CheckSquare className="h-4 w-4 text-gray-300" />
                            )}
                          </div>
                          <span className={`text-sm ${item.completed ? 'line-through text-gray-500' : ''}`}>
                            {item.description}
                          </span>
                        </div>
                      ))}

                      {Array.isArray(checklists[0]?.items) && checklists[0].items.length > 5 && (
                        <div className="text-center mt-2">
                          <Button variant="ghost" size="sm" onClick={() => setActiveTab('checklist')}>
                            Ver mais {checklists[0].items.length - 5} itens
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-6">
                      Nenhuma checklist disponível
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            <ProjectDiagrams project={project} />
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">Gerenciamento de Tarefas</h2>
              <Button onClick={() => {
                setCurrentTask(null);
                setShowTaskDialog(true);
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Tarefa
              </Button>
            </div>

            <TaskBoard
              tasks={tasks}
              onTaskUpdate={handleTaskUpdate}
              onTaskEdit={handleEditTask}
              onTaskDelete={handleTaskDelete}
              currentUser={currentUser}
              projectResponsible={project?.responsible}
              users={users}
              roles={roles}
              areas={areas}
            />
          </TabsContent>

          <TabsContent value="team">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-500" />
                  Composição da Equipe do Projeto
                </CardTitle>
                <CardDescription>
                  Pessoas e áreas envolvidas nas tarefas do projeto, com o resumo de suas atividades.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-8">
                <div>
                  <h3 className="text-md font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                    <UserCircle className="h-5 w-5 text-gray-400" />
                    Pessoas Envolvidas
                  </h3>
                  <div className="space-y-4">
                    {Object.keys(teamComposition.users).length > 0 ? (
                      Object.values(teamComposition.users).map(user => (
                        <div key={user.email} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar>
                              <AvatarFallback>{user.name ? user.name.substring(0, 2).toUpperCase() : '??'}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name}</p>
                              <p className="text-xs text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-center self-start sm:self-center">
                            <div className="p-2 rounded bg-yellow-100 text-yellow-800 min-w-[70px]">
                              <p className="font-bold text-base">{user.tasks.pendente}</p>
                              <p>Pendentes</p>
                            </div>
                            <div className="p-2 rounded bg-blue-100 text-blue-800 min-w-[70px]">
                              <p className="font-bold text-base">{user.tasks.em_andamento}</p>
                              <p>Andamento</p>
                            </div>
                            <div className="p-2 rounded bg-red-100 text-red-800 min-w-[70px]">
                              <p className="font-bold text-base">{user.tasks.bloqueada}</p>
                              <p>Bloqueadas</p>
                            </div>
                            <div className="p-2 rounded bg-green-100 text-green-800 min-w-[70px]">
                              <p className="font-bold text-base">{user.tasks.concluída}</p>
                              <p>Concluídas</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Nenhuma pessoa alocada em tarefas.</p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-md font-semibold mb-4 border-b pb-2 flex items-center gap-2">
                    <Building className="h-5 w-5 text-gray-400" />
                    Áreas Envolvidas
                  </h3>
                  <div className="space-y-4">
                    {Object.keys(teamComposition.areas).length > 0 ? (
                      Object.values(teamComposition.areas).map(area => (
                        <div key={area.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <Avatar>
                              <AvatarFallback className="bg-gray-200"><Building className="h-5 w-5" /></AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{area.name}</p>
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-2 text-xs text-center self-start sm:self-center">
                            <div className="p-2 rounded bg-yellow-100 text-yellow-800 min-w-[70px]">
                              <p className="font-bold text-base">{area.tasks.pendente}</p>
                              <p>Pendentes</p>
                            </div>
                            <div className="p-2 rounded bg-blue-100 text-blue-800 min-w-[70px]">
                              <p className="font-bold text-base">{area.tasks.em_andamento}</p>
                              <p>Andamento</p>
                            </div>
                            <div className="p-2 rounded bg-red-100 text-red-800 min-w-[70px]">
                              <p className="font-bold text-base">{area.tasks.bloqueada}</p>
                              <p>Bloqueadas</p>
                            </div>
                            <div className="p-2 rounded bg-green-100 text-green-800 min-w-[70px]">
                              <p className="font-bold text-base">{area.tasks.concluída}</p>
                              <p>Concluídas</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 text-center py-4">Nenhuma área alocada em tarefas.</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-gray-500" />
                    Linha do Tempo do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    {project?.start_date && project?.deadline && (
                      <>
                        <div className="absolute left-0 top-0 bottom-0 w-px bg-gray-200" />
                        <div className="space-y-8">
                          <div className="relative pl-6">
                            <div className="absolute left-0 w-2 h-2 rounded-full bg-green-500 -translate-x-1/2" />
                            <div className="text-sm font-medium">Início do Projeto</div>
                            <div className="text-xs text-gray-500">
                              {format(parseISO(project.start_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                          </div>

                          <div className="relative pl-6">
                            <div className="absolute left-0 w-2 h-2 rounded-full bg-red-500 -translate-x-1/2" />
                            <div className="text-sm font-medium">Prazo Final</div>
                            <div className="text-xs text-gray-500">
                              {format(parseISO(project.deadline), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="pt-4">
                    <h3 className="text-sm font-medium mb-2">Reuniões</h3>
                    <div className="space-y-3">
                      {Array.isArray(meetings) && meetings.length > 0 ? (
                        meetings.map((meeting) => (
                          <div key={meeting.id} className="border rounded-md p-3">
                            <div className="font-medium">{meeting.title}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(meeting.date).toLocaleDateString('pt-BR')}
                            </div>
                            {meeting.notes && (
                              <div className="text-xs text-gray-500 mt-1">
                                {meeting.notes.substring(0, 100)}{meeting.notes.length > 100 ? '...' : ''}
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500 text-center py-6">
                          Nenhuma reunião registrada
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={() => setIsAddingMeeting(true)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Adicionar Reunião
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-gray-500" />
                    Marcos Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {Array.isArray(logs) && logs.length > 0 ? (
                    <div className="space-y-4">
                      {logs.map((log) => (
                        <div key={log.id} className="p-3 bg-gray-50 rounded-lg border">
                          <div className="font-medium flex items-center gap-2">
                            {log.type === 'project_dates' ? <CalendarIcon className="h-4 w-4 text-blue-500" /> : <Info className="h-4 w-4 text-gray-500" />}
                            {log.message || 'Log de Alteração'}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            {log.reason && <p>Razão: {log.reason}</p>}
                            <p>Alterado por: {log.initiator}</p>
                            <p>Data: {format(parseISO(log.created_date), "dd/MM/yyyy HH:mm", { locale: ptBR })}</p>
                          </div>
                          {log.old_value && log.new_value && (
                            <div className="text-xs text-gray-500 mt-2">
                              <p>De: {log.old_value}</p>
                              <p>Para: {log.new_value}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-6">
                      Nenhum registro de marco importante encontrado.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="checklist">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Checklists por Fase</h2>
              <Button onClick={() => setShowGenerateChecklistDialog(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Nova Checklist
              </Button>
            </div>

            <div className="space-y-6">
              {Array.isArray(checklists) && checklists.map((checklist, index) => (
                <Card key={checklist.id || `checklist-${index}`}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-gray-500" />
                        {checklist.phase}
                      </div>
                      <Badge variant="outline">
                        {Array.isArray(checklist.items) ? checklist.items.filter(item => item.completed).length : 0}/{Array.isArray(checklist.items) ? checklist.items.length : 0} concluídos
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[300px] pr-4">
                      <div className="space-y-2">
                        {Array.isArray(checklist.items) && checklist.items.map((item, itemIndex) => (
                          <div
                            key={itemIndex}
                            className="flex items-start gap-2 p-2 hover:bg-gray-50 rounded-lg"
                          >
                            <Checkbox
                              checked={item.completed}
                              onCheckedChange={(checked) =>
                                toggleChecklistItem(checklist.id, itemIndex, checked)
                              }
                            />
                            <div className={cn(
                              "flex-1",
                              item.completed && "text-gray-500 line-through"
                            )}>
                              <div className="text-sm">{item.description}</div>
                              {item.completion_date && (
                                <div className="text-xs text-gray-500">
                                  Concluído em: {format(parseISO(item.completion_date), "dd/MM/yyyy")}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                      {(!Array.isArray(checklist.items) || checklist.items.length === 0) && (
                        <div className="text-sm text-gray-500 text-center py-6">
                          Nenhum item na checklist
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              ))}

              {(!Array.isArray(checklists) || checklists.length === 0) && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <CheckSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhuma checklist encontrada
                  </h3>
                  <p className="text-gray-500">
                    Adicione checklists para acompanhar o progresso do projeto
                  </p>
                </div>
              )}
            </div>

            <Dialog open={showGenerateChecklistDialog} onOpenChange={setShowGenerateChecklistDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Gerar Nova Checklist</DialogTitle>
                  <DialogDescription>
                    Selecione a fase do projeto para gerar uma checklist personalizada com IA
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fase do Projeto</label>
                    <Select value={checklistPhase} onValueChange={setChecklistPhase}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fase" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planejamento">Planejamento</SelectItem>
                        <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                        <SelectItem value="testes">Testes</SelectItem>
                        <SelectItem value="homologação">Homologação</SelectItem>
                        <SelectItem value="produção">Produção</SelectItem>
                        <SelectItem value="pós-produção">Pós-produção</SelectItem>
                        <SelectItem value="documentação">Documentação</SelectItem>
                        <SelectItem value="segurança">Segurança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowGenerateChecklistDialog(false)}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={generateChecklistWithAI}
                    disabled={!checklistPhase || isGeneratingChecklist}
                  >
                    {isGeneratingChecklist ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Gerar com IA
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* New Dialog for reviewing AI suggestions */}
            <ChecklistReviewDialog
              isOpen={showReviewDialog}
              onClose={() => setShowReviewDialog(false)}
              suggestions={aiChecklistSuggestions}
              phase={checklistPhase}
              onSubmit={handleCreateFinalChecklist}
              isLoading={isSubmittingChecklist}
            />
          </TabsContent>

          <TabsContent value="infrastructure">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Server className="h-5 w-5 text-gray-500" />
                    Recursos de Infraestrutura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {infrastructure ? (
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium mb-2">Provedor</div>
                        <Badge className="bg-blue-100 text-blue-800">
                          {infrastructure?.selected_provider?.toUpperCase()}
                        </Badge>
                      </div>

                      <div>
                        <div className="font-medium mb-2">Ambientes</div>
                        <div className="grid grid-cols-3 gap-2">
                          {infrastructure.environments && Object.entries(infrastructure.environments).map(([env, enabled]) => (
                            enabled && (
                              <Badge key={env} variant="outline">
                                {env}
                              </Badge>
                            )
                          ))}
                        </div>
                      </div>

                      <div>
                        <div className="font-medium mb-2">Recursos</div>
                        <div className="space-y-2">
                          {infrastructure[`${infrastructure.selected_provider}_solution`]?.resources && Array.isArray(infrastructure[`${infrastructure.selected_provider}_solution`]?.resources) && infrastructure[`${infrastructure.selected_provider}_solution`]?.resources.map((resource, index) => (
                            <div key={index} className="p-3 bg-gray-50 rounded-lg">
                              <div className="font-medium">{resource.name}</div>
                              <div className="text-sm text-gray-500">{resource.specifications}</div>
                              <div className="text-sm text-gray-500">Ambiente: {resource.environment}</div>
                            </div>
                          ))}
                          {(!infrastructure[`${infrastructure.selected_provider}_solution`]?.resources || !Array.isArray(infrastructure[`${infrastructure.selected_provider}_solution`]?.resources) || infrastructure[`${infrastructure.selected_provider}_solution`]?.resources.length === 0) && (
                            <div className="text-sm text-gray-500">Nenhum recurso definido.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Server className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">Nenhuma infraestrutura configurada</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-gray-500" />
                    Configurações e Requisitos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {infrastructure?.requirements ? (
                    <div className="space-y-4">
                      <div>
                        <div className="font-medium mb-2">Requisitos de Sistema</div>
                        <div className="space-y-2">
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Usuários Concorrentes</span>
                            <span className="font-medium">{infrastructure.requirements.concurrent_users}</span>
                          </div>
                          <div className="flex justify-between p-2 bg-gray-50 rounded">
                            <span>Volume de Dados</span>
                            <span className="font-medium">{infrastructure.requirements.data_volume}</span>
                          </div>
                        </div>
                      </div>

                      {Array.isArray(infrastructure.requirements.compliance_requirements) && infrastructure.requirements.compliance_requirements.length > 0 && (
                        <div>
                          <div className="font-medium mb-2">Requisitos de Conformidade</div>
                          <div className="flex flex-wrap gap-2">
                            {infrastructure.requirements.compliance_requirements.map((req, index) => (
                              <Badge key={index} variant="outline">{req}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 text-center py-6">
                      Nenhum requisito de infraestrutura definido
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Settings2 className="h-5 w-5 text-gray-500" />
                    Configurações do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Nome do Projeto</label>
                      <Input value={project?.title} disabled />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Tipo</label>
                      <Input value={currentType.name} disabled />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Responsável</label>
                      <Input value={project?.responsible} disabled />
                    </div>

                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <Input value={currentStatus.name} disabled />
                    </div>

                    {/* New field for Area */}
                    <div>
                      <label className="text-sm font-medium">Área</label>
                      <Input value={getAreaName(project?.area_id)} disabled />
                    </div>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsEditingProject(true)}
                      disabled={!canEditCurrentProject}
                    >
                      Editar Configurações
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Network className="h-5 w-5 text-gray-500" />
                    Integrações
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Array.isArray(links) && links.map((link, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <DatabaseZap className="h-5 w-5 text-gray-500" />
                          <div>
                            <div className="font-medium">{link.title}</div>
                            <div className="text-sm text-gray-500">{link.type}</div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a href={link.url} target="_blank" rel="noopener noreferrer">
                            Acessar
                          </a>
                        </Button>
                      </div>
                    ))}

                    {(!Array.isArray(links) || links.length === 0) && (
                      <div className="text-sm text-gray-500 text-center py-6">
                        Nenhuma integração configurada
                      </div>
                    )}

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setIsAddingLink(true)}
                    >
                      Adicionar Integração
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="diagrams">
            <ProjectDiagrams project={project} />
          </TabsContent>
        </Tabs>

        <Dialog open={isEditingProject} onOpenChange={setIsEditingProject}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Editar Projeto</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="title" className="text-sm font-medium">Título</label>
                <Input
                  id="title"
                  value={editedProject?.title || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <label htmlFor="description" className="text-sm font-medium">Descrição</label>
                <Textarea
                  id="description"
                  value={editedProject?.description || ''}
                  onChange={(e) => setEditedProject({ ...editedProject, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type_id" className="text-sm font-medium">Tipo</label>
                  <Select
                    value={editedProject?.type_id || ''}
                    onValueChange={(value) => setEditedProject({ ...editedProject, type_id: value })}
                  >
                    <SelectTrigger id="type_id" className="mt-1">
                      <SelectValue placeholder="Selecione um tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="status_id" className="text-sm font-medium">Status</label>
                  <Select
                    value={editedProject?.status_id || ''}
                    onValueChange={(value) => setEditedProject({ ...editedProject, status_id: value })}
                  >
                    <SelectTrigger id="status_id" className="mt-1">
                      <SelectValue placeholder="Selecione um status" />
                    </SelectTrigger>
                    <SelectContent>
                      {projectStatusList.map(status => (
                        <SelectItem key={status.id} value={status.id}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="priority" className="text-sm font-medium">Prioridade</label>
                  <Select
                    value={editedProject?.priority || ''}
                    onValueChange={(value) => setEditedProject({ ...editedProject, priority: value })}
                  >
                    <SelectTrigger id="priority" className="mt-1">
                      <SelectValue placeholder="Selecione a prioridade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="baixa">Baixa</SelectItem>
                      <SelectItem value="média">Média</SelectItem>
                      <SelectItem value="alta">Alta</SelectItem>
                      <SelectItem value="urgente">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="area_id" className="text-sm font-medium">Área Responsável</label>
                  <Select
                    value={editedProject?.area_id || ''}
                    onValueChange={(value) => setEditedProject({ ...editedProject, area_id: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecione a área" />
                    </SelectTrigger>
                    <SelectContent>
                      {areas.map(area => (
                        <SelectItem key={area.id} value={area.id}>
                          {area.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="start_date" className="text-sm font-medium">Data de Início</label>
                  <Input
                    id="start_date"
                    type="date"
                    value={editedProject?.start_date || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, start_date: e.target.value })}
                  />
                </div>
                <div>
                  <label htmlFor="deadline" className="text-sm font-medium">Prazo</label>
                  <Input
                    id="deadline"
                    type="date"
                    value={editedProject?.deadline || ''}
                    onChange={(e) => setEditedProject({ ...editedProject, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label htmlFor="responsible" className="text-sm font-medium">Responsável (email)</label>
                <Select
                  value={editedProject?.responsible || ''}
                  onValueChange={(value) => setEditedProject({ ...editedProject, responsible: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione um responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.email}>
                        {user.full_name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label htmlFor="tags" className="text-sm font-medium">Tags (separadas por vírgula)</label>
                <Input
                  id="tags"
                  value={Array.isArray(editedProject?.tags) ? editedProject.tags.join(', ') : ''}
                  onChange={(e) => setEditedProject({
                    ...editedProject,
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  placeholder="react, nodejs, aws, etc."
                />
              </div>
              {editedProject?.infrastructure_provider && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="infrastructure_provider" className="text-sm font-medium">Provedor de Infraestrutura</label>
                    <select
                      id="infrastructure_provider"
                      value={editedProject?.infrastructure_provider || ''}
                      onChange={(e) => setEditedProject({ ...editedProject, infrastructure_provider: e.target.value })}
                      className="w-full p-2 mt-1 border rounded-md"
                    >
                      <option value="aws">AWS</option>
                      <option value="azure">Azure</option>
                      <option value="gcp">GCP</option>
                      <option value="vps">VPS</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="infrastructure_cost" className="text-sm font-medium">Custo de Infraestrutura (R$)</label>
                    <Input
                      id="infrastructure_cost"
                      type="number"
                      value={editedProject?.infrastructure_cost || ''}
                      onChange={(e) => setEditedProject({ ...editedProject, infrastructure_cost: Number(e.target.value) })}
                    />
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditingProject(false)}>Cancelar</Button>
              <Button onClick={handleSaveProjectChanges}>Salvar Alterações</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingMeeting} onOpenChange={setIsAddingMeeting}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Reunião</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="meeting-title" className="text-sm font-medium">Título</label>
                <Input
                  id="meeting-title"
                  value={newMeeting.title}
                  onChange={(e) => setNewMeeting({ ...newMeeting, title: e.target.value })}
                  placeholder="Título da reunião"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="meeting-date" className="text-sm font-medium">Data</label>
                <Input
                  id="meeting-date"
                  type="date"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="meeting-notes" className="text-sm font-medium">Anotações</label>
                <Textarea
                  id="meeting-notes"
                  value={newMeeting.notes}
                  onChange={(e) => setNewMeeting({ ...newMeeting, notes: e.target.value })}
                  placeholder="Anotações sobre a reunião"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingMeeting(false)}>Cancelar</Button>
              <Button onClick={handleAddMeeting}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingFeedback} onOpenChange={setIsAddingFeedback}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="feedback-content" className="text-sm font-medium">Conteúdo</label>
                <Textarea
                  id="feedback-content"
                  value={newFeedback.content}
                  onChange={(e) => setNewFeedback({ ...newFeedback, content: e.target.value })}
                  placeholder="Digite seu feedback"
                  rows={4}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="feedback-type" className="text-sm font-medium">Tipo</label>
                  <select
                    id="feedback-type"
                    value={newFeedback.type}
                    onChange={(e) => setNewFeedback({ ...newFeedback, type: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="sugestão">Sugestão</option>
                    <option value="problema">Problema</option>
                    <option value="elogio">Elogio</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="feedback-priority" className="text-sm font-medium">Prioridade</label>
                  <select
                    id="feedback-priority"
                    value={newFeedback.priority}
                    onChange={(e) => setNewFeedback({ ...newFeedback, priority: e.target.value })}
                    className="w-full rounded-md border border-gray-300 p-2"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="média">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingFeedback(false)}>Cancelar</Button>
              <Button onClick={handleAddFeedback}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isAddingLink} onOpenChange={setIsAddingLink}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="link-title" className="text-sm font-medium">Título</label>
                <Input
                  id="link-title"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  placeholder="Ex: Repositório GitHub"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="link-url" className="text-sm font-medium">URL</label>
                <Input
                  id="link-url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="link-type" className="text-sm font-medium">Tipo</label>
                <select
                  id="link-type"
                  value={newLink.type}
                  onChange={(e) => setNewLink({ ...newLink, type: e.target.value })}
                  className="w-full rounded-md border border-gray-300 p-2"
                >
                  <option value="repository">Repositório</option>
                  <option value="documentation">Documentação</option>
                  <option value="environment">Ambiente</option>
                  <option value="other">Outro</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddingLink(false)}>Cancelar</Button>
              <Button onClick={handleAddLink}>Adicionar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mt-8">
          <NoteComponent itemId={projectId} itemType="project" />
        </div>
      </div>

      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {currentTask ? 'Editar Tarefa' : 'Nova Tarefa'}
            </DialogTitle>
          </DialogHeader>

          <TaskForm
            task={currentTask}
            projects={project ? [project] : []}
            roles={roles}
            areas={areas}
            onSubmit={currentTask ? handleTaskUpdate : handleCreateTask}
            onCancel={() => { setShowTaskDialog(false); setCurrentTask(null); }}
          />
        </DialogContent>
      </Dialog>

      <DateChangeDialog
        isOpen={!!dateChangeInfo}
        onClose={() => setDateChangeInfo(null)}
        dateChangeInfo={dateChangeInfo}
        onConfirm={handleDateChangeConfirmed}
      />
    </>
  );
}


import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Project,
  Task,
  Meeting,
  Budget,
  Checklist,
  Feedback,
  Infrastructure,
  ClientReport,
  DiagramArchitecture, // Added
  Note, // Added
  UserRoleAssignment, // Added
  AnalysisInsight, // Added
  CostInsight, // Added
  ChatMessage, // Added
  Area,
  User,
  ProjectType, // Added for new feature
  ProjectStatus // Added for new feature
} from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { createPageUrl } from "@/utils";
import { calculateAndUpdateProjectProgress, getCurrentDate, getFutureDate, adjustDateToFuture } from "@/components/project/ProjectUtils";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  BarChart3,
  BarChart4,
  Loader2,
  Plus,
  Search,
  ArrowRight,
  Tag, // Changed to Tag as type icon
  Trash2,
  PenSquare,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Users,
  Sparkles,
  UserPlus,
  Wand2,
  Filter,
  LayoutGrid,
  LayoutList,
  Building // Added for Area display
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { filterProjectsByUserAccess, hasExecutivePermission } from "@/components/permissions/PermissionUtils";
import ProjectAISummary from "@/components/projects/ProjectAISummary";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projects, setProjects] = useState([]);
  const [allTasks, setAllTasks] = useState([]); // Store all tasks for summaries
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // New filter for type
  const [filterStatus, setFilterStatus] = useState("all"); // Renamed for clarity
  const [areas, setAreas] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]); // New state for project types
  const [projectStatusList, setProjectStatusList] = useState([]); // New state for project statuses
  const [selectedParticipant, setSelectedParticipant] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  // State for new features
  const [isAiSummaryOpen, setIsAiSummaryOpen] = useState(false);
  const [selectedProjectForSummary, setSelectedProjectForSummary] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");

  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [taskGenerationProjectId, setTaskGenerationProjectId] = useState(null);

  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    status_id: "", // Changed from 'status' to 'status_id'
    type_id: "", // New field for project type
    responsible: "",
    area_id: "",
    participants: [],
    start_date: "",
    deadline: "",
    priority: "média",
    progress: 0,
    tags: []
  });

  const [aiProjectDialogOpen, setAiProjectDialogOpen] = useState(false);
  const [aiProjectPrompt, setAiProjectPrompt] = useState("");
  const [isGeneratingProject, setIsGeneratingProject] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Carregar parâmetros globais primeiro, essenciais para todos os usuários
      const [usersData, areasData, projectTypesData, projectStatusData] = await Promise.all([
        User.list().catch(e => { console.error("Erro ao carregar usuários:", e); return []; }),
        Area.list().catch(e => { console.error("Erro ao carregar áreas:", e); return []; }),
        ProjectType.list().catch(e => { console.error("Erro ao carregar tipos de projeto:", e); return []; }),
        ProjectStatus.list().catch(e => { console.error("Erro ao carregar status de projeto:", e); return []; }),
      ]);

      const safeUsersData = Array.isArray(usersData) ? usersData : [];
      const safeAreasData = Array.isArray(areasData) ? areasData : [];
      const safeProjectTypesData = Array.isArray(projectTypesData) ? projectTypesData : [];
      const safeProjectStatusData = Array.isArray(projectStatusData) ? projectStatusData : [];
      
      const sortedTypes = [...safeProjectTypesData].sort((a, b) => a.name.localeCompare(b.name));
      const sortedStatuses = [...safeProjectStatusData].sort((a, b) => a.name.localeCompare(b.name));

      setSystemUsers(safeUsersData);
      setAreas(safeAreasData);
      setProjectTypes(sortedTypes);
      setProjectStatusList(sortedStatuses);

      // 2. Carregar dados do usuário e dados principais (projetos, tarefas)
      let currentUserData = null;
      try {
        currentUserData = await User.me();
        setCurrentUser(currentUserData);
      } catch (err) {
        console.error("Error loading current user:", err);
        toast({
          title: "Erro de autenticação",
          description: "Não foi possível carregar seu perfil. Alguns dados podem estar limitados.",
          variant: "warning"
        });
        // Continue even if user fails to load; system parameters are already set.
        // Projects will be filtered to none by filterProjectsByUserAccess if currentUserData is null.
      }

      const [projectsData, tasksData] = await Promise.all([
        Project.list().catch(err => { console.error("Erro ao carregar projetos:", err); return []; }),
        Task.list().catch(err => { console.error("Erro ao carregar tarefas:", err); return []; })
      ]);
      
      const safeProjectsData = Array.isArray(projectsData) ? projectsData : [];
      const safeTasksData = Array.isArray(tasksData) ? tasksData : [];

      // 3. Processar e filtrar os dados principais
      const getStatusById = (id) => sortedStatuses.find(s => s.id === id);

      const filteredProjects = currentUserData
        ? filterProjectsByUserAccess(
          safeProjectsData,
          safeTasksData,
          currentUserData.email,
          currentUserData.position
        )
        : [];

      const updatedProjectsData = filteredProjects.map(project => {
        const projectTasks = safeTasksData.filter(task => task.project_id === project.id);
        const projectStatus = getStatusById(project.status_id);
        const isFinal = projectStatus ? projectStatus.is_final : false;
        
        let calculatedProgress = 0;
        if (projectTasks.length > 0) {
          const completedTasks = projectTasks.filter(task => task.status === 'concluída').length;
          calculatedProgress = Math.round((completedTasks / projectTasks.length) * 100);
        }

        const criticality = calculateProjectCriticality(project, projectTasks, isFinal);

        return {
          ...project,
          progress: isFinal ? 100 : (calculatedProgress || project.progress || 0),
          criticality
        };
      });

      const sortedProjects = updatedProjectsData.sort((a, b) => {
        const a_status = getStatusById(a.status_id);
        const b_status = getStatusById(b.status_id);
        const a_is_final = a_status?.is_final || false;
        const b_is_final = b_status?.is_final || false;

        if (a_is_final && !b_is_final) return 1;
        if (!a_is_final && b_is_final) return -1;

        if (!a_is_final && !b_is_final) {
          return b.criticality - a.criticality;
        }

        if (a_status && b_status && a_status.name !== b_status.name) {
          return a_status.name.localeCompare(b_status.name);
        }
        return a.title.localeCompare(b.title);
      });

      setProjects(sortedProjects);
      setAllTasks(safeTasksData);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar os projetos. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateProjectCriticality = (project, projectTasks, isFinal) => {
    if (isFinal) return 0; // Projetos finalizados não têm criticidade

    let criticalityScore = 0;
    const today = new Date();

    // 1. Status do projeto (peso: 30)
    const projectStatus = projectStatusList.find(s => s.id === project.status_id);
    const statusName = projectStatus ? projectStatus.name.toLowerCase() : '';

    const statusWeights = {
      'ambiente': 10,
      'poc': 20,
      'mvp': 30,
      'desenvolvimento': 40,
      'produção': 20,
      'homologação': 35,
      'testes': 25
    };

    // Mapear status personalizado para peso padrão se não encontrado
    let statusWeight = statusWeights[statusName] || 20;
    criticalityScore += statusWeight;

    // 2. Prioridade (peso: 25)
    const priorityWeights = {
      'baixa': 5,
      'média': 15,
      'alta': 25,
      'urgente': 40
    };
    criticalityScore += priorityWeights[project.priority] || 15;

    // 3. Prazo (peso: 35) - APENAS para projetos ativos
    if (project.deadline) {
      const deadline = new Date(project.deadline);
      const daysUntilDeadline = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

      if (daysUntilDeadline < 0) {
        criticalityScore += 50; // Projeto atrasado
      } else if (daysUntilDeadline <= 3) {
        criticalityScore += 40; // Muito urgente
      } else if (daysUntilDeadline <= 7) {
        criticalityScore += 30; // Urgente
      } else if (daysUntilDeadline <= 14) {
        criticalityScore += 20; // Próximo
      } else {
        criticalityScore += 10; // Normal
      }
    }

    // 4. Progresso vs Tempo Decorrido (peso: 10)
    if (project.start_date && project.deadline) {
      const startDate = new Date(project.start_date);
      const deadline = new Date(project.deadline);
      const totalDays = Math.ceil((deadline - startDate) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

      if (totalDays > 0 && daysElapsed > 0) {
        const expectedProgress = Math.min(100, (daysElapsed / totalDays) * 100);
        const actualProgress = project.progress || 0;

        if (actualProgress < expectedProgress - 20) {
          criticalityScore += 15; // Muito atrasado
        } else if (actualProgress < expectedProgress - 10) {
          criticalityScore += 10; // Atrasado
        }
      }
    }

    // 5. Número de tarefas pendentes (peso: 10) - se tasks forem fornecidas (kept from original logic as it's valuable)
    if (projectTasks && projectTasks.length > 0) {
        const pendingTasks = projectTasks.filter(task => task.status !== 'concluída').length;
        if (pendingTasks > (projectTasks.length * 0.75)) { // More than 75% pending
            criticalityScore += 10;
        } else if (pendingTasks > (projectTasks.length * 0.5)) { // More than 50% pending
            criticalityScore += 5;
        }
    }

    return Math.min(criticalityScore, 100);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleTagAdd = () => {
    const tagInput = document.getElementById("tag-input");
    if (tagInput && tagInput.value.trim()) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.value.trim()]
      });
      tagInput.value = "";
    }
  };

  const handleTagRemove = (index) => {
    const newTags = [...formData.tags];
    newTags.splice(index, 1);
    setFormData({ ...formData, tags: newTags });
  };

  const handleParticipantAdd = () => {
    if (selectedParticipant && !formData.participants?.includes(selectedParticipant)) {
      setFormData({
        ...formData,
        participants: [...(formData.participants || []), selectedParticipant]
      });
      setSelectedParticipant("");
    }
  };

  const handleParticipantRemove = (index) => {
    const newParticipants = [...formData.participants];
    newParticipants.splice(index, 1);
    setFormData({ ...formData, participants: newParticipants });
  };

  const handleSubmit = async () => {
    try {
      // Verificar se o usuário tem permissão para criar projetos
      if (!currentUser) {
        toast({
          title: "Erro de autorização",
          description: "Não foi possível verificar suas permissões.",
          variant: "destructive"
        });
        return;
      }

      const currentDate = getCurrentDate();

      // Validar campos obrigatórios
      if (!formData.title || !formData.responsible || !formData.status_id || !formData.type_id) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha título, responsável, status e tipo.",
          variant: "destructive"
        });
        return;
      }

      // Para criação manual, não ajustar datas - usar exatamente o que o usuário digitou
      const projectData = {
        ...formData,
        progress: 0,
        // Usar as datas exatamente como o usuário preencheu
        start_date: formData.start_date || currentDate,
        deadline: formData.deadline || getFutureDate(30),
        created_date: currentDate,
        last_modified_date: currentDate,
        // Garantir que arrays não sejam undefined
        participants: Array.isArray(formData.participants) ? formData.participants : [],
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        area_id: formData.area_id || null // Ensure area_id is null if empty string
      };

      console.log("Dados do projeto sendo enviados (manual):", projectData);

      const newProject = await Project.create(projectData);
      setOpenDialog(false);
      setFormData({
        title: "",
        description: "",
        status_id: "", // Reset status_id
        type_id: "", // Reset type_id
        responsible: "",
        area_id: "", // Reset area_id
        participants: [],
        start_date: "",
        deadline: "",
        priority: "média",
        progress: 0,
        tags: []
      });
      toast({
        title: "Projeto criado",
        description: "O projeto foi criado com sucesso.",
      });
      await loadData();
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Erro ao criar projeto",
        description: error.message || "Não foi possível criar o projeto.",
        variant: "destructive"
      });
    }
  };

  const handleEditProject = (e, projectId) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(createPageUrl(`ProjectDetails?id=${projectId}`));
  };

  const handleAiSummary = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedProjectForSummary(project);
    setIsAiSummaryOpen(true);
  };

  const handleDeleteClick = (e, project) => {
    e.preventDefault();
    e.stopPropagation();
    setProjectToDelete(project);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteProject = async () => {
    if (deleteConfirmationText !== 'excluir' || !projectToDelete) {
      toast({
        title: "Confirmação incorreta",
        description: "Você deve digitar 'excluir' para confirmar a exclusão.",
        variant: "destructive"
      });
      return;
    }

    try {
      const projectId = projectToDelete.id;
      toast({ title: "Iniciando exclusão...", description: `Removendo o projeto "${projectToDelete.title}" e todos os seus dados. Isso pode levar um momento.` });

      // Lista de todas as entidades que podem estar relacionadas ao projeto
      const relatedEntitiesConfig = [
        { model: Task, filter: { project_id: projectId } },
        { model: Meeting, filter: { project_id: projectId } },
        { model: Budget, filter: { project_id: projectId } },
        { model: Checklist, filter: { project_id: projectId } },
        { model: Feedback, filter: { project_id: projectId } },
        { model: Infrastructure, filter: { project_id: projectId } },
        { model: ClientReport, filter: { project_id: projectId } },
        { model: DiagramArchitecture, filter: { project_id: projectId } },
        { model: ChatMessage, filter: { project_id: projectId } },
        { model: AnalysisInsight, filter: { project_id: projectId } },
        { model: CostInsight, filter: { project_id: projectId } },
        { model: UserRoleAssignment, filter: { project_id: projectId } },
        { model: Note, filter: { item_id: projectId, type: 'project' } }, // Note needs item_id and type
      ];

      let totalDeletedItems = 0;
      const deletionPromises = [];

      // Loop para encontrar todos os itens relacionados e preparar para exclusão
      for (const { model, filter } of relatedEntitiesConfig) {
        try {
          const itemsToDelete = await model.filter(filter);
          if (itemsToDelete && itemsToDelete.length > 0) {
            console.log(`Encontrados ${itemsToDelete.length} itens do tipo ${model.name} para excluir.`);
            totalDeletedItems += itemsToDelete.length;
            itemsToDelete.forEach(item => {
              deletionPromises.push(model.delete(item.id));
            });
          }
        } catch (error) {
          console.error(`Erro ao buscar ou preparar a exclusão para ${model.name}:`, error);
          // Continua mesmo se um tipo de entidade falhar, mas registra o erro.
        }
      }

      // Executa todas as exclusões de dados relacionados em paralelo
      if (deletionPromises.length > 0) {
        await Promise.all(deletionPromises);
        console.log(`Excluídos com sucesso ${totalDeletedItems} itens relacionados.`);
      }

      // Finalmente, exclui o projeto principal
      await Project.delete(projectId);
      console.log(`Projeto ${projectId} excluído com sucesso.`);

      toast({
        title: "Projeto Excluído com Sucesso",
        description: `O projeto "${projectToDelete.title}" e ${totalDeletedItems} dados associados foram removidos permanentemente.`,
      });

      // Reseta o estado e recarrega os dados da página
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
      setDeleteConfirmationText("");
      await loadData();

    } catch (error) {
      console.error("Erro na exclusão em cascata do projeto:", error);
      toast({
        title: "Erro ao excluir o projeto",
        description: "Ocorreu um erro ao remover o projeto e seus dados. Verifique o console para mais detalhes.",
        variant: "destructive"
      });
    }
  };

  const navigateToProjectDetails = (id) => {
    navigate(createPageUrl(`ProjectDetails?id=${id}`));
  };

  const generateAITasks = async (project) => {
    if (!project || !project.id || !project.title) {
      toast({
        title: "Erro",
        description: "Detalhes do projeto inválidos para gerar tarefas.",
        variant: "destructive"
      });
      return;
    }

    setGeneratingTasks(true);
    setTaskGenerationProjectId(project.id);

    try {
      const currentDate = getCurrentDate();

      const prompt = `
        Para o projeto de TI "${project.title}" descrito como "${project.description || 'sem descrição detalhada'}",
        gere uma lista de 5 a 10 tarefas essenciais para sua execução.

        IMPORTANT: Todas as datas devem ser futuras (não no passado):
        - start_date: deve ser alguns dias no futuro (3-7 dias a partir de hoje: ${currentDate})
        - deadline: deve ser 1-3 semanas no futuro

        Para cada tarefa, inclua: title (string), description (string concisa), priority ('baixa', 'média', 'alta'),
        status ('pendente'), start_date (formato YYYY-MM-DD, futuro), deadline (formato YYYY-MM-DD, futuro),
        e assigned_to (string, pode ser deixado em branco ou sugerir um papel como 'Desenvolvedor Backend').
        Formate a resposta como um JSON com uma chave "tasks" contendo um array de objetos de tarefa.
      `;

      const response = await InvokeLLM({
        prompt: prompt,
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
                  priority: { type: "string", enum: ["baixa", "média", "alta"] },
                  status: { type: "string", enum: ["pendente"] },
                  assigned_to: { type: "string" },
                  start_date: { type: "string", format: "date" },
                  deadline: { type: "string", format: "date" }
                },
                required: ["title", "description", "priority", "status"]
              }
            }
          },
          required: ["tasks"]
        }
      });

      if (response && response.tasks && response.tasks.length > 0) {
        const tasksToCreate = response.tasks.map(task => ({
          ...task,
          project_id: project.id,
          // Para criação por IA, ajustar datas para o futuro
          start_date: adjustDateToFuture(task.start_date || getFutureDate(3), 1, true),
          deadline: adjustDateToFuture(task.deadline || getFutureDate(14), 7, true),
          created_date: currentDate
        }));

        try {
          await Task.bulkCreate(tasksToCreate);
          toast({
            title: "Tarefas Geradas",
            description: `${response.tasks.length} tarefas foram geradas com datas futuras e adicionadas ao projeto ${project.title}.`
          });

          // Recalcular e atualizar o progresso do projeto
          try {
            const updatedProgress = await calculateAndUpdateProjectProgress(project.id);
            if (typeof updatedProgress === 'number') {
              setProjects(prevProjects => prevProjects.map(p =>
                p.id === project.id ? { ...p, progress: updatedProgress } : p
              ));
            }
          } catch (progressError) {
            console.warn("Erro ao recalcular progresso após geração de tarefas:", progressError);
            toast({
              title: "Aviso",
              description: "Tarefas geradas, mas houve um problema ao atualizar o progresso do projeto.",
              variant: "warning"
            });
          }

        } catch (createError) {
          console.error("Erro ao criar tarefas:", createError);
          toast({
            title: "Erro ao Criar Tarefas",
            description: "As tarefas foram geradas mas houve erro ao salvá-las.",
            variant: "destructive"
          });
        }
      } else {
        toast({
          title: "Nenhuma Tarefa Gerada",
          description: "A IA não conseguiu gerar tarefas para este projeto.",
          variant: "info"
        });
      }
    } catch (error) {
      console.error("Erro ao gerar tarefas com IA:", error);
      toast({
        title: "Erro ao Gerar Tarefas",
        description: error.message || "Ocorreu um erro ao tentar gerar tarefas com IA.",
        variant: "destructive"
      });
    } finally {
      setGeneratingTasks(false);
      setTaskGenerationProjectId(null);
    }
  };

  const generateAIProject = async () => {
    if (!aiProjectPrompt.trim()) {
      toast({ title: "Prompt Vazio", description: "Por favor, descreva o projeto que você deseja criar.", variant: "warning" });
      return;
    }
    setIsGeneratingProject(true);
    try {
      const currentDate = getCurrentDate();

      const prompt = `
        Baseado na seguinte descrição de projeto: "${aiProjectPrompt}",
        crie os detalhes para um novo projeto de TI.

        IMPORTANT: Todas as datas devem ser futuras (não no passado). Use as seguintes diretrizes:
        - start_date: deve ser hoje (${currentDate}) ou uma data futura próxima
        - deadline: deve ser pelo menos 2-4 semanas no futuro a partir de hoje

        A resposta deve ser um JSON com as seguintes chaves:
        - title (string): Um título conciso e descritivo para o projeto.
        - description (string): Uma descrição mais detalhada do projeto (2-3 frases).
        - status (string): O status inicial do projeto, escolha entre: 'Ambiente', 'POC', 'MVP', 'Desenvolvimento'. Default 'Ambiente'.
        - type (string): O tipo do projeto, escolha entre: 'Software', 'Hardware', 'Rede', 'Dados', 'Segurança'. Default 'Software'.
        - priority (string): A prioridade do projeto, escolha entre: 'baixa', 'média', 'alta'. Default 'média'.
        - responsible (string): O e-mail do responsável (se não especificado, deixe como ${currentUser?.email || 'project.manager@example.com'}).
        - start_date (string): Data de início no formato YYYY-MM-DD (hoje ou futuro próximo)
        - deadline (string): Data de término no formato YYYY-MM-DD (pelo menos 2-4 semanas no futuro)
        - tags (array de strings): Uma lista de 3-5 tags relevantes (ex: 'react', 'nodejs', 'ia', 'mobile').
        - tasks (array de objetos): Uma lista de 3 a 5 tarefas iniciais para este projeto. Cada tarefa deve ter:
            - title (string)
            - description (string)
            - priority (string: 'baixa', 'média', 'alta')
            - status (string: 'pendente')
            - start_date (string): Data de início no formato YYYY-MM-DD (alguns dias no futuro)
            - deadline (string): Data de término no formato YYYY-MM-DD (1-2 semanas no futuro)
      `;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            status: { type: "string", enum: ['Ambiente', 'POC', 'MVP', 'Desenvolvimento'] }, // AI returns status names
            type: { type: "string", enum: ['Software', 'Hardware', 'Rede', 'Dados', 'Segurança'] }, // AI returns type names
            priority: { type: "string", enum: ['baixa', 'média', 'alta'] },
            responsible: { type: "string", format: "email" },
            start_date: { type: "string", format: "date" },
            deadline: { type: "string", format: "date" },
            tags: { type: "array", items: { type: "string" } },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  priority: { type: "string", enum: ["baixa", "média", "alta"] },
                  status: { type: "string", enum: ["pendente"] },
                  start_date: { type: "string", format: "date" },
                  deadline: { type: "string", format: "date" }
                },
                required: ["title", "description", "priority", "status"]
              }
            }
          },
          required: ["title", "description", "status", "type", "priority", "responsible", "start_date", "deadline", "tags", "tasks"]
        }
      });

      if (response && response.title) {
        // Map AI generated status and type names to their IDs
        const aiStatusId = projectStatusList.find(s => s.name.toLowerCase() === response.status.toLowerCase())?.id || projectStatusList.find(s => s.name === 'Ambiente')?.id;
        const aiTypeId = projectTypes.find(t => t.name.toLowerCase() === response.type.toLowerCase())?.id || projectTypes.find(t => t.name === 'Software')?.id;

        // For creation by AI, ensure dates are in the future
        const projectPayload = {
          title: response.title,
          description: response.description,
          status_id: aiStatusId, // Use mapped status_id
          type_id: aiTypeId, // Use mapped type_id
          priority: response.priority || 'média',
          responsible: response.responsible || currentUser?.email,
          tags: Array.isArray(response.tags) ? response.tags : [],
          participants: response.responsible ? [response.responsible] : (currentUser?.email ? [currentUser.email] : []),
          progress: 0,
          area_id: null, // AI does not generate this, set to null by default
          // MANDATORY FIELDS - always defined
          start_date: adjustDateToFuture(response.start_date || currentDate, 0, true),
          deadline: adjustDateToFuture(response.deadline || getFutureDate(30), 7, true),
          created_date: currentDate,
          last_modified_date: currentDate
        };

        // Ensure start_date is before deadline
        if (projectPayload.start_date >= projectPayload.deadline) {
          projectPayload.deadline = getFutureDate(30); // Force 1 month if there's a conflict
        }

        console.log("Project data being sent (AI):", projectPayload);

        const newProject = await Project.create(projectPayload);

        if (newProject && newProject.id && response.tasks && response.tasks.length > 0) {
          const tasksToCreate = response.tasks.map(task => ({
            ...task,
            project_id: newProject.id,
            // For creation by AI, adjust dates to the future
            start_date: adjustDateToFuture(task.start_date || getFutureDate(3), 1, true),
            deadline: adjustDateToFuture(task.deadline || getFutureDate(14), 7, true),
            created_date: currentDate
          }));
          await Task.bulkCreate(tasksToCreate);
        }

        setAiProjectDialogOpen(false);
        setAiProjectPrompt("");
        toast({
          title: "AI Generated Project!",
          description: `Project "${response.title}" and its initial tasks were created with future dates.`
        });
        await loadData(); // Reload all data, including the new project and its progress.
      } else {
        throw new Error("Invalid or incomplete AI response.");
      }
    } catch (error) {
      console.error("Error generating project with AI:", error);
      toast({
        title: "Error Generating Project",
        description: error.message || "Could not generate project with AI.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingProject(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = (project.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (project.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || project.type_id === filterType;
    const matchesStatus = filterStatus === "all" || project.status_id === filterStatus;

    return matchesSearch && matchesType && matchesStatus;
  });

  const getInitials = (email) => {
    if (!email) return "?";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getUserName = (email) => {
    const user = systemUsers.find(u => u.email === email);
    return user && user.full_name ? user.full_name : email;
  };

  const getProjectStatusName = (statusId) => {
    const status = projectStatusList.find(s => s.id === statusId);
    return status ? status.name : 'Indefinido';
  };

  const getProjectStatusColor = (statusId) => {
    const status = projectStatusList.find(s => s.id === statusId);
    return status ? status.color : '#6B7280';
  };

  const getProjectTypeName = (typeId) => {
    const type = projectTypes.find(t => t.id === typeId);
    return type ? type.name : 'Indefinido';
  };

  const getProjectTypeColor = (typeId) => {
    const type = projectTypes.find(t => t.id === typeId);
    return type ? type.color : '#6B7280';
  };

  const getAreaName = (areaId) => {
    const area = areas.find(a => a.id === areaId);
    return area ? area.name : 'Não definida';
  };

  const getAreaResponsible = (areaId) => {
    if (!areaId) return null;
    const area = areas.find(a => a.id === areaId);
    if (!area || !area.responsible_email) return null;
    const user = systemUsers.find(u => u.email === area.responsible_email);
    return user ? user.full_name : area.responsible_email;
  };

  const getProjectTasks = (projectId) => {
    return allTasks.filter(task => task.project_id === projectId);
  };

  const getProjectHealth = (project) => {
    const projectTasks = getProjectTasks(project.id);
    const today = new Date();
    const projectStatus = projectStatusList.find(s => s.id === project.status_id);
    const isFinal = projectStatus ? projectStatus.is_final : false;

    // Projetos finalizados sempre têm saúde "boa"
    if (isFinal) {
      return {
        level: 'good',
        color: '#10b981', // Green
        issues: []
      };
    }

    let healthIssues = [];

    // Verificar tarefas atrasadas APENAS para projetos ativos
    const overdueTasks = projectTasks.filter(task => {
      if (task.status === 'concluída') return false;
      if (!task.deadline) return false;
      return new Date(task.deadline) < today;
    });

    // Verificar prazo do projeto APENAS se ativo
    const isProjectOverdue = project.deadline && new Date(project.deadline) < today;

    if (overdueTasks.length > 0) {
      healthIssues.push(`${overdueTasks.length} tarefa(s) atrasada(s)`);
    }

    if (isProjectOverdue) {
      const daysOverdue = Math.ceil((today - new Date(project.deadline)) / (1000 * 60 * 60 * 24));
      healthIssues.push(`Projeto atrasado (${daysOverdue} dias)`);
    }

    const progress = project.progress || 0;
    if (progress < 30 && project.deadline) {
      const daysUntilDeadline = Math.ceil((new Date(project.deadline) - today) / (1000 * 60 * 60 * 24));
      if (daysUntilDeadline <= 14) {
        healthIssues.push('Progresso baixo próximo ao prazo');
      }
    }

    const blockedTasks = projectTasks.filter(task => task.status === 'bloqueada');
    if (blockedTasks.length > 0) {
      healthIssues.push(`${blockedTasks.length} tarefa(s) bloqueada(s)`);
    }

    // Determinar nível de saúde
    if (healthIssues.length === 0) {
      return { level: 'good', color: '#10b981', issues: [] };
    } else if (healthIssues.length <= 2 && !isProjectOverdue) { // If only few minor issues and not overall project overdue
      return { level: 'warning', color: '#f59e0b', issues: healthIssues }; // Orange/Yellow
    } else {
      return { level: 'critical', color: '#ef4444', issues: healthIssues }; // Red
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Projetos</h1>
          <p className="text-gray-500 mt-1">
            {currentUser && hasExecutivePermission(currentUser.position, 'canViewAllProjects')
              ? "Gerencie todos os projetos de inovação"
              : "Seus projetos de inovação"}
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button onClick={() => setAiProjectDialogOpen(true)} className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700">
            <Wand2 className="mr-2 h-4 w-4" /> Criar com IA
          </Button>
          <Button onClick={() => {
            setOpenDialog(true);
            // Set default values for status_id and type_id if available
            const defaultStatus = projectStatusList.find(s => s.name === 'Ambiente');
            const defaultType = projectTypes.find(t => t.name === 'Software');
            setFormData(prev => ({
              ...prev,
              status_id: defaultStatus ? defaultStatus.id : '',
              type_id: defaultType ? defaultType.id : '',
            }));
          }} className="flex-1 md:flex-none">
            <Plus className="mr-2 h-4 w-4" /> Novo Projeto
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar projetos..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Tipos</SelectItem>
            {projectTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            {projectStatusList.map((status) => (
              <SelectItem key={status.id} value={status.id}>
                {status.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : (
        <AnimatePresence>
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {filteredProjects.map((project) => {
              const typeName = getProjectTypeName(project.type_id);
              const typeColor = getProjectTypeColor(project.type_id);
              const statusName = getProjectStatusName(project.status_id);
              const statusColor = getProjectStatusColor(project.status_id);
              const areaName = getAreaName(project.area_id);
              const areaResponsible = getAreaResponsible(project.area_id);
              const projectHealth = getProjectHealth(project); // Calculate health here

              return (
                <motion.div key={project.id} variants={itemVariants}>
                  <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)} className="h-full block">
                    <Card
                      className={`h-full flex flex-col transition-all duration-300 hover:shadow-xl`}
                      style={{ borderTop: `4px solid ${projectHealth.color}` }} // Dynamic border color based on health
                    >
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg font-bold text-gray-800 line-clamp-2">{project.title}</CardTitle>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant="outline"
                              className="capitalize"
                              style={{
                                borderColor: statusColor,
                                color: statusColor,
                                backgroundColor: `${statusColor}15`
                              }}
                            >
                              {statusName}
                            </Badge>
                            {/* Display Health Status */}
                            <div className={`text-xs font-medium flex items-center gap-1`} style={{ color: projectHealth.color }}>
                              {projectHealth.level === 'good' && <CheckCircle2 className="h-3 w-3" />}
                              {projectHealth.level === 'warning' && <AlertTriangle className="h-3 w-3" />}
                              {projectHealth.level === 'critical' && <AlertTriangle className="h-3 w-3" />}
                              <span>
                                {projectHealth.level === 'good' && 'Saudável'}
                                {projectHealth.level === 'warning' && 'Atenção'}
                                {projectHealth.level === 'critical' && 'Crítico'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {project.description || "Sem descrição detalhada."}
                        </p>
                        {projectHealth.issues.length > 0 && (
                          <div className="mt-2 text-xs text-gray-600 flex flex-wrap gap-1">
                            {projectHealth.issues.map((issue, idx) => (
                              <Badge key={idx} variant="secondary" className="px-2 py-0.5 rounded-full" style={{ backgroundColor: `${projectHealth.color}20`, color: projectHealth.color }}>
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="flex-grow space-y-4">
                        {/* Tipo do Projeto */}
                        <div className="bg-gray-50 rounded-lg p-3 border">
                          <div className="flex items-center gap-2 mb-1">
                            <Tag className="h-4 w-4" style={{ color: typeColor }} />
                            <span className="text-xs font-semibold text-gray-500">TIPO DE PROJETO</span>
                          </div>
                          <div className="text-sm font-medium text-gray-700">{typeName}</div>
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-semibold text-gray-500">PROGRESSO</span>
                            <span className="text-sm font-bold text-teal-600">{project.progress || 0}%</span>
                          </div>
                          <Progress value={project.progress || 0} className="h-2 [&>div]:bg-gradient-to-r [&>div]:from-teal-400 [&>div]:to-blue-500" />
                        </div>

                        {/* Área Responsável */}
                        <div className="bg-gray-50 rounded-lg p-3 border">
                          <div className="flex items-center gap-2 mb-1">
                            <Building className="h-4 w-4 text-blue-500" />
                            <span className="text-xs font-semibold text-gray-500">ÁREA RESPONSÁVEL</span>
                          </div>
                          <div className="text-sm font-medium text-gray-700">{areaName}</div>
                          {areaResponsible && (
                            <div className="text-xs text-gray-500 mt-1">
                              Responsável: {areaResponsible}
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-xs text-gray-500">Responsável</div>
                              <div className="font-medium text-gray-700 truncate">{getUserName(project.responsible)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <div>
                              <div className="text-xs text-gray-500">Prazo</div>
                              <div className="font-medium text-gray-700">{project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-4 flex justify-between items-center">
                        <div className="flex -space-x-2 overflow-hidden">
                          {project.participants?.slice(0, 3).map((participant, i) => (
                            <Avatar key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white">
                              <AvatarFallback>{getInitials(participant)}</AvatarFallback>
                            </Avatar>
                          ))}
                          {project.participants?.length > 3 && <Avatar className="h-8 w-8"><AvatarFallback>+{project.participants.length - 3}</AvatarFallback></Avatar>}
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200" onClick={(e) => handleEditProject(e, project.id)}>
                            <PenSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-200" onClick={(e) => handleAiSummary(e, project)}>
                            <Sparkles className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-100" onClick={(e) => handleDeleteClick(e, project)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              )
            })}

            {filteredProjects.length === 0 && (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">
                  {currentUser && hasExecutivePermission(currentUser.position, 'canViewAllProjects')
                    ? "Nenhum projeto encontrado."
                    : "Você não tem projetos atribuídos ou não está participando de nenhum projeto."}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Projeto</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Título*</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Título do projeto"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva o projeto..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="status_id">Status*</Label>
                <Select
                  value={formData.status_id}
                  onValueChange={(value) => handleSelectChange("status_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectStatusList.map((status) => (
                      <SelectItem key={status.id} value={status.id}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="type_id">Tipo de Projeto*</Label>
                <Select
                  value={formData.type_id}
                  onValueChange={(value) => handleSelectChange("type_id", value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleSelectChange("priority", value)}
              >
                <SelectTrigger>
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

            <div className="grid gap-2">
              <Label htmlFor="area_id">Área Responsável</Label>
              <Select
                value={formData.area_id}
                onValueChange={(value) => handleSelectChange("area_id", value)}
              >
                <SelectTrigger>
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

            <div className="grid gap-2">
              <Label htmlFor="responsible">Responsável*</Label>
              <Select
                value={formData.responsible}
                onValueChange={(value) => handleSelectChange("responsible", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o responsável" />
                </SelectTrigger>
                <SelectContent>
                  {systemUsers.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Participantes</Label>
              <div className="flex gap-2">
                <Select
                  value={selectedParticipant}
                  onValueChange={setSelectedParticipant}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Adicionar participante" />
                  </SelectTrigger>
                  <SelectContent>
                    {systemUsers
                      .filter(user => !formData.participants?.includes(user.email))
                      .map(user => (
                        <SelectItem key={user.id} value={user.email}>
                          {user.full_name || user.email}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={handleParticipantAdd} variant="outline">
                  <UserPlus className="w-4 h-4" />
                </Button>
              </div>

              {formData.participants && formData.participants.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.participants.map((participant, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                      <Avatar className="h-4 w-4">
                        <AvatarFallback className="text-xs">
                          {getInitials(participant)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{getUserName(participant)}</span>
                      <button
                        onClick={() => handleParticipantRemove(index)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Data de Início*</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="deadline">Prazo Final*</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  value={formData.deadline || ""}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tag-input">Tags</Label>
              <div className="flex gap-2">
                <Input id="tag-input" placeholder="Adicionar tag..." />
                <Button type="button" onClick={handleTagAdd} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        onClick={() => handleTagRemove(index)}
                        className="ml-1 text-gray-500 hover:text-gray-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setOpenDialog(false)} variant="outline">Cancelar</Button>
            <Button onClick={handleSubmit}>Criar Projeto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={aiProjectDialogOpen} onOpenChange={setAiProjectDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-indigo-500" />
              Criar Projeto com IA
            </DialogTitle>
          </DialogHeader>

          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="py-4">
            <Label htmlFor="ai-project-prompt" className="mb-2 block">
              Descreva o projeto que você quer criar
            </Label>
            <Textarea
              id="ai-project-prompt"
              placeholder="Ex: Um sistema de inteligência artificial para analisar documentos financeiros e extrair dados importantes como valores, datas e categorias de despesas."
              value={aiProjectPrompt}
              onChange={(e) => setAiProjectPrompt(e.target.value)}
              rows={5}
              className="mb-4"
            />

            <div className="text-sm text-gray-500 space-y-1">
              <p>A IA irá gerar automaticamente:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Título e descrição detalhada</li>
                <li>Cronograma com datas de início e fim</li>
                <li>Tarefas principais com prazos</li>
                <li>Tipo e Status do projeto</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setAiProjectDialogOpen(false)} variant="outline">
              Cancelar
            </Button>
            <Button
              onClick={generateAIProject}
              disabled={isGeneratingProject || !aiProjectPrompt.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isGeneratingProject ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando Projeto...
                </>
              ) : (
                <>
                  <Wand2 className="mr-2 h-4 w-4" />
                  Gerar Projeto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Esta ação é irreversível. Todos os dados associados a este projeto, incluindo tarefas, serão perdidos. Para confirmar, digite <strong className="text-red-600">excluir</strong> abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              id="delete-confirm"
              placeholder="excluir"
              value={deleteConfirmationText}
              onChange={(e) => setDeleteConfirmationText(e.target.value)}
              autoComplete="off" // Prevent autofill for critical confirmation
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteConfirmationText !== 'excluir'}
              onClick={confirmDeleteProject}
            >
              Excluir Projeto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAiSummaryOpen} onOpenChange={setIsAiSummaryOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-teal-500" />
              Resumo do Projeto (IA)
            </DialogTitle>
            <DialogDescription>
              {selectedProjectForSummary?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[70vh] overflow-y-auto">
            {selectedProjectForSummary && (
              <ProjectAISummary
                project={selectedProjectForSummary}
                tasks={allTasks.filter(t => t.project_id === selectedProjectForSummary.id)}
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setIsAiSummaryOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

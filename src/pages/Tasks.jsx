import React, { useState, useEffect } from "react";
import { Task, Project, User, Role, ProjectStatus } from "@/api/entities";
import { Area } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Trash2,
  LayoutGrid,
  LayoutList,
  Filter as FilterIcon,
  Kanban
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import TaskForm from "../components/tasks/TaskForm";
import AgileTaskForm from '../components/tasks/AgileTaskForm';
import TaskFilters from "../components/tasks/TaskFilters";
import TaskItem from "../components/tasks/TaskItem";
import TaskCard from "../components/tasks/TaskCard";
import { calculateAndUpdateProjectProgress, getCurrentDate } from "@/components/project/ProjectUtils";
import { filterTasksByUserAccess, hasExecutivePermission, canEditTask } from "@/components/permissions/PermissionUtils";
import { useToast } from "@/components/ui/use-toast";

import { notifyTaskAssignment } from "@/api/functions";

const createPageUrl = (path) => {
  return `/${path.startsWith('/') ? path.substring(1) : path}`;
};

export default function TasksPage() {
  const [allTasks, setAllTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [roles, setRoles] = useState([]);
  const [areas, setAreas] = useState([]);
  const [systemUsers, setSystemUsers] = useState([]);
  const [projectStatusList, setProjectStatusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterProject, setFilterProject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAssignee, setFilterAssignee] = useState("all");
  const [filters, setFilters] = useState({
    deadline: ""
  });
  const [view, setView] = useState("kanban");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [
        projectsData,
        rolesData,
        areasData,
        systemUsersData,
        projectStatusData
      ] = await Promise.all([
        Project.list().catch(e => { console.error("Erro ao carregar projetos:", e); return []; }),
        Role.list().catch(e => { console.error("Erro ao carregar roles:", e); return []; }),
        Area.list().catch(e => { console.error("Erro ao carregar áreas:", e); return []; }),
        User.list().catch(e => { console.error("Erro ao carregar usuários:", e); return []; }),
        ProjectStatus.list().catch(e => { console.error("Erro ao carregar status de projeto:", e); return []; })
      ]);

      setProjects(projectsData || []);
      setRoles(rolesData || []);
      setAreas(areasData || []);
      setSystemUsers(systemUsersData || []);
      setProjectStatusList(projectStatusData || []);

      let user = null;
      try {
        user = await User.me();
        setCurrentUser(user);
      } catch (err) {
        console.warn("Usuário não autenticado:", err);
      }

      const tasksData = await Task.list().catch(e => { console.error("Erro ao carregar tarefas:", e); return []; });

      let permissionFilteredTasks = tasksData || [];
      if (user && !hasExecutivePermission(user.position, 'canViewAllTasks')) {
        const userProjectIds = (projectsData || []).filter(p => p.responsible === user.email || p.participants?.includes(user.email)).map(p => p.id);
        
        permissionFilteredTasks = (tasksData || []).filter(task => 
            task.assigned_to === user.email || userProjectIds.includes(task.project_id)
        );
      }
      
      setAllTasks(permissionFilteredTasks);

    } catch (err) {
      console.error("Erro ao carregar dados da página de tarefas:", err);
      setError("Não foi possível carregar os dados necessários.");
      toast({
        title: "Erro ao Carregar Dados",
        description: "Não foi possível carregar as tarefas e filtros. Tente recarregar a página.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTask = async (formData) => {
    try {
      setUpdating(true);
      
      const taskId = formData.id;
      if (!taskId) {
        throw new Error("ID da tarefa não encontrado para atualização.");
      }
      
      const currentTasks = await Task.list(); 
      const previousTask = currentTasks.find(t => t.id === taskId);

      const payload = {
        title: formData.title,
        description: formData.description || '',
        project_id: formData.project_id,
        status: formData.status,
        assigned_to: formData.assigned_to || '',
        priority: formData.priority,
        role_id: formData.role_id || '',
        seniority_level: formData.seniority_level || '',
        area_id: formData.area_id || '',
        start_date: formData.start_date || '',
        deadline: formData.deadline || '',
        completion_date: formData.completion_date || '',
        estimated_hours: Number(formData.estimated_hours) || 0,
        hourly_rate: Number(formData.hourly_rate) || 0,
        total_cost: Number(formData.total_cost) || 0,
        last_modified_date: getCurrentDate(),
      };
      
      await Task.update(taskId, payload);
      
      if (payload.assigned_to && payload.assigned_to !== previousTask?.assigned_to) {
        const taskUrl = window.location.origin + createPageUrl(`ProjectDetails?id=${formData.project_id}`);
        notifyTaskAssignment({ taskId: taskId, projectId: formData.project_id, taskUrl })
          .catch(err => console.error("Falha ao enviar notificação de tarefa:", err));
      }
      
      await loadData();
      if (formData.project_id) {
        await calculateAndUpdateProjectProgress(formData.project_id);
      }

      toast({
        title: "Sucesso!",
        description: "A tarefa foi atualizada com sucesso.",
      });

      setShowTaskDialog(false);
      setCurrentTask(null);
    } catch (err) {
      console.error("Erro detalhado ao atualizar tarefa:", err);
      setError(`Não foi possível atualizar a tarefa: ${err.message}`);
      toast({
        title: "Erro na atualização",
        description: "Não foi possível salvar as alterações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateTask = async (taskData) => {
    try {
      setUpdating(true);
      
      const dataToCreate = {
        ...taskData,
        estimated_hours: Number(taskData.estimated_hours) || 0,
        hourly_rate: Number(taskData.hourly_rate) || 0,
        total_cost: Number(taskData.total_cost) || 0,
      };

      Object.keys(dataToCreate).forEach(key => {
        if (dataToCreate[key] === undefined || dataToCreate[key] === null) {
          delete dataToCreate[key];
        }
      });

      const newTask = await Task.create(dataToCreate);

      if (newTask.assigned_to) {
          const taskUrl = window.location.origin + createPageUrl(`ProjectDetails?id=${newTask.project_id}`);
          notifyTaskAssignment({ taskId: newTask.id, projectId: newTask.project_id, taskUrl })
            .catch(err => console.error("Falha ao enviar notificação de nova tarefa:", err));
      }

      await loadData();
      if (newTask.project_id) {
        await calculateAndUpdateProjectProgress(newTask.project_id);
      }
      setShowTaskDialog(false);
      setCurrentTask(null);
    } catch (err) {
      console.error("Erro ao criar tarefa:", err);
      setError("Não foi possível criar a tarefa.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      setUpdating(true);
      const projectId = taskToDelete.project_id;
      await Task.delete(taskToDelete.id);
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
      await loadData();
      if (projectId) {
        await calculateAndUpdateProjectProgress(projectId);
      }
    } catch (err) {
      console.error("Erro ao excluir tarefa:", err);
      setError("Não foi possível excluir a tarefa.");
    } finally {
      setUpdating(false);
    }
  };

  const handleEditTask = (task) => {
    if (!currentUser || !canEditTask(task, currentUser.email, currentUser.position)) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para editar esta tarefa.",
        variant: "destructive"
      });
      return;
    }
    
    const taskToEdit = {
      id: task.id,
      title: task.title || '',
      description: task.description || '',
      project_id: task.project_id || '',
      status: task.status || 'pendente',
      assigned_to: task.assigned_to || '',
      priority: task.priority || 'média',
      role_id: task.role_id || '',
      seniority_level: task.seniority_level || '',
      area_id: task.area_id || '',
      start_date: task.start_date || '',
      deadline: task.deadline || '',
      completion_date: task.completion_date || '',
      estimated_hours: task.estimated_hours || 0,
      hourly_rate: task.hourly_rate || 0,
      total_cost: task.total_cost || 0,
    };
    
    setCurrentTask(taskToEdit);
    setShowTaskDialog(true);
  };

  const handleDeleteConfirm = (task) => {
    if (!currentUser || !canEditTask(task, currentUser.email, currentUser.position)) {
      toast({
        title: "Sem permissão",
        description: "Você não tem permissão para excluir esta tarefa.",
        variant: "destructive"
      });
      return;
    }
    
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleStatusChange = async (task, newStatus) => {
    try {
      setUpdating(true);
      if (!currentUser || !canEditTask(task, currentUser.email, currentUser.position)) {
        toast({
          title: "Sem permissão",
          description: "Você não tem permissão para alterar o status desta tarefa.",
          variant: "destructive"
        });
        await loadData();
        return;
      }

      await Task.update(task.id, { status: newStatus });
      await loadData();
      if (task.project_id) {
        await calculateAndUpdateProjectProgress(task.project_id);
      }
    } catch (err) {
      console.error("Erro ao atualizar status da tarefa:", err);
      setError("Não foi possível atualizar o status da tarefa.");
    } finally {
      setUpdating(false);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { draggableId, destination } = result;
    const taskToMove = allTasks.find(t => t.id === draggableId);

    if (taskToMove && taskToMove.status !== destination.droppableId) {
      const originalStatus = taskToMove.status;
      const newStatus = destination.droppableId;

      if (!currentUser || !canEditTask(taskToMove, currentUser.email, currentUser.position)) {
        toast({
          title: "Sem permissão",
          description: "Você não tem permissão para mover esta tarefa.",
          variant: "destructive"
        });
        return;
      }

      setAllTasks(prevTasks => prevTasks.map(t =>
        t.id === taskToMove.id ? { ...t, status: newStatus } : t
      ));

      try {
        setUpdating(true);
        await Task.update(taskToMove.id, { status: newStatus });
        if (taskToMove.project_id) {
          await calculateAndUpdateProjectProgress(taskToMove.project_id);
        }
      } catch (error) {
        console.error("Erro ao atualizar status da tarefa via D&D:", error);
        setError("Não foi possível atualizar o status da tarefa via arrastar e soltar.");
        setAllTasks(prevTasks => prevTasks.map(t =>
          t.id === taskToMove.id ? { ...t, status: originalStatus } : t
        ));
      } finally {
        setUpdating(false);
      }
    }
  };

  const filteredTasks = allTasks.filter(task => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      task.title?.toLowerCase().includes(searchLower) ||
      task.description?.toLowerCase().includes(searchLower);

    const matchesProject = filterProject === "all" || task.project_id === filterProject;
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    const matchesAssignee = filterAssignee === "all" || task.assigned_to === filterAssignee;
    
    const matchesDeadline = !filters.deadline || (task.deadline && task.deadline <= filters.deadline);

    return matchesSearch && matchesProject && matchesStatus && matchesAssignee && matchesDeadline;
  });

  const groupByProject = (tasks) => {
    const groups = {};
    tasks.forEach(task => {
      const projectId = task.project_id || 'unassigned';
      if (!groups[projectId]) {
        groups[projectId] = [];
      }
      groups[projectId].push(task);
    });
    return groups;
  };

  const getProjectById = (id) => {
    return projects.find(p => p.id === id) || { title: "Sem projeto" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tarefas</h1>
          <p className="text-gray-500">
            {currentUser && hasExecutivePermission(currentUser.position, 'canViewAllTasks') 
              ? "Gerencie todas as tarefas" 
              : "Suas tarefas atribuídas"}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="flex border rounded-md overflow-hidden">
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={view === "kanban" ? "default" : "ghost"}
              size="sm"
              onClick={() => setView("kanban")}
            >
              <Kanban className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={() => setShowTaskDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Tarefa
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Buscar tarefas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <TaskFilters
          onFilterChange={({ status, project, assignee }) => {
            setFilterStatus(status);
            setFilterProject(project);
            setFilterAssignee(assignee);
          }}
          filters={filters}
          setFilters={setFilters}
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {filteredTasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {currentUser && hasExecutivePermission(currentUser.position, 'canViewAllTasks') 
              ? "Nenhuma tarefa encontrada." 
              : "Você não tem tarefas atribuídas."}
          </p>
        </div>
      )}

      {view === "list" && filteredTasks.length > 0 && (
        <div className="grid gap-4">
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTask}
                onDelete={handleDeleteConfirm}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {view === "grid" && filteredTasks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={handleStatusChange}
                onEdit={handleEditTask}
                onDelete={handleDeleteConfirm}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {view === "kanban" && filteredTasks.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          {filterProject !== "all" ? (
            <div className="mb-10">
              <h2 className="text-xl font-bold mb-4">
                {getProjectById(filterProject).title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <KanbanColumn
                  title="Pendente"
                  status="pendente"
                  tasks={filteredTasks.filter(t => t.status === 'pendente')}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteConfirm}
                />
                <KanbanColumn
                  title="Em Andamento"
                  status="em_andamento"
                  tasks={filteredTasks.filter(t => t.status === 'em_andamento')}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteConfirm}
                />
                <KanbanColumn
                  title="Concluída"
                  status="concluída"
                  tasks={filteredTasks.filter(t => t.status === 'concluída')}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteConfirm}
                />
                <KanbanColumn
                  title="Bloqueada"
                  status="bloqueada"
                  tasks={filteredTasks.filter(t => t.status === 'bloqueada')}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteConfirm}
                />
              </div>
            </div>
          ) : (
            <div>
              {Object.entries(groupByProject(filteredTasks)).map(([projectId, projectTasks]) => (
                <div key={projectId} className="mb-10">
                  <h2 className="text-xl font-bold mb-4">
                    {getProjectById(projectId).title}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <KanbanColumn
                      title="Pendente"
                      status="pendente"
                      tasks={projectTasks.filter(t => t.status === 'pendente')}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteConfirm}
                    />
                    <KanbanColumn
                      title="Em Andamento"
                      status="em_andamento"
                      tasks={projectTasks.filter(t => t.status === 'em_andamento')}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteConfirm}
                    />
                    <KanbanColumn
                      title="Concluída"
                      status="concluída"
                      tasks={projectTasks.filter(t => t.status === 'concluída')}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteConfirm}
                    />
                    <KanbanColumn
                      title="Bloqueada"
                      status="bloqueada"
                      tasks={projectTasks.filter(t => t.status === 'bloqueada')}
                      onEdit={handleEditTask}
                      onDelete={handleDeleteConfirm}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DragDropContext>
      )}

      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentTask ? 'Editar Tarefa' : 'Nova Tarefa'}</DialogTitle>
            <DialogDescription>
              {currentTask ? 'Altere os dados da tarefa conforme necessário.' : 'Preencha os dados para criar uma nova tarefa.'}
            </DialogDescription>
          </DialogHeader>

          <TaskForm
            task={currentTask}
            projects={projects}
            roles={roles}
            areas={areas}
            onSubmit={(formData) => {
              if (formData.id) {
                handleUpdateTask(formData);
              } else {
                handleCreateTask(formData);
              }
            }}
            onCancel={() => {
              setShowTaskDialog(false);
              setCurrentTask(null);
            }}
            updating={updating}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar exclusão</DialogTitle>
          </DialogHeader>
          <p>Tem certeza que deseja excluir esta tarefa?</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteTask}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KanbanColumn({ title, status, tasks, onEdit, onDelete }) {
  const statusColors = {
    pendente: "bg-gray-100",
    em_andamento: "bg-blue-50",
    concluída: "bg-green-50",
    bloqueada: "bg-red-50"
  };

  return (
    <Droppable droppableId={status}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`${statusColors[status]} rounded-md p-3 h-[calc(100vh-260px)] overflow-y-auto`}
        >
          <h3 className="font-medium text-gray-700 mb-3 sticky top-0 bg-inherit py-1">
            {title} <Badge>{tasks.length}</Badge>
          </h3>

          {tasks.map((task, index) => (
            <Draggable key={task.id} draggableId={task.id} index={index}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.draggableProps}
                  {...provided.dragHandleProps}
                  className="mb-2"
                >
                  <TaskCard
                    task={task}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    isKanban={true}
                  />
                </div>
              )}
            </Draggable>
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
}
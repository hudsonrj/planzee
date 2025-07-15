import React, { useState, useEffect } from "react";
import { Task, Project, User } from "@/api/entities";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Play,
  Pause
} from "lucide-react";

export default function MobileTasks() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filtrar tarefas
    let filtered = tasks;
    
    if (searchQuery) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (filterStatus !== "all") {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Ordenar por prioridade e deadline
    filtered.sort((a, b) => {
      const priorityOrder = { 'urgente': 0, 'alta': 1, 'média': 2, 'baixa': 3 };
      const aPriority = priorityOrder[a.priority] || 3;
      const bPriority = priorityOrder[b.priority] || 3;
      
      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }
      
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      return a.deadline ? -1 : 1;
    });

    setFilteredTasks(filtered);
  }, [tasks, searchQuery, filterStatus]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [userData, tasksData, projectsData] = await Promise.all([
        User.me(),
        Task.list(),
        Project.list()
      ]);

      setCurrentUser(userData);
      setProjects(projectsData);

      // Filtrar tarefas do usuário
      const userTasks = tasksData.filter(task => task.assigned_to === userData.email);
      setTasks(userTasks);

    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await Task.update(taskId, { status: newStatus });
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgente': 'bg-red-100 text-red-800 border-red-200',
      'alta': 'bg-orange-100 text-orange-800 border-orange-200',
      'média': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'baixa': 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status) => {
    const icons = {
      'pendente': <Clock className="h-4 w-4 text-gray-500" />,
      'em_andamento': <Play className="h-4 w-4 text-blue-500" />,
      'concluída': <CheckCircle2 className="h-4 w-4 text-green-500" />,
      'bloqueada': <Pause className="h-4 w-4 text-red-500" />
    };
    return icons[status] || <Clock className="h-4 w-4 text-gray-500" />;
  };

  const isOverdue = (deadline) => {
    return deadline && new Date(deadline) < new Date();
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project?.title || "Sem projeto";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Minhas Tarefas</h1>
        <Badge variant="outline">{filteredTasks.length} tarefas</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar tarefas..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: "all", label: "Todas" },
          { key: "pendente", label: "Pendentes" },
          { key: "em_andamento", label: "Em Andamento" },
          { key: "concluída", label: "Concluídas" },
          { key: "bloqueada", label: "Bloqueadas" }
        ].map(filter => (
          <Button
            key={filter.key}
            variant={filterStatus === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterStatus(filter.key)}
            className="whitespace-nowrap"
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Tasks List */}
      <motion.div className="space-y-3">
        {filteredTasks.map((task, index) => (
          <motion.div
            key={task.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className={`${isOverdue(task.deadline) && task.status !== 'concluída' ? 'border-red-300 bg-red-50' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {task.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {getProjectName(task.project_id)}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-2">
                    {getStatusIcon(task.status)}
                    {isOverdue(task.deadline) && task.status !== 'concluída' && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                  
                  {task.deadline && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span className={isOverdue(task.deadline) && task.status !== 'concluída' ? 'text-red-600 font-medium' : ''}>
                        {new Date(task.deadline).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Status Change */}
                <div className="flex gap-2">
                  {task.status === 'pendente' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleStatusChange(task.id, 'em_andamento')}
                      className="flex-1"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Iniciar
                    </Button>
                  )}
                  
                  {task.status === 'em_andamento' && (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleStatusChange(task.id, 'concluída')}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Concluir
                    </Button>
                  )}
                  
                  {task.status === 'concluída' && (
                    <div className="flex-1 text-center text-sm text-green-600 font-medium">
                      ✓ Tarefa concluída
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {filteredTasks.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery || filterStatus !== "all" 
              ? "Nenhuma tarefa encontrada com os filtros aplicados." 
              : "Você não tem tarefas atribuídas."}
          </p>
        </div>
      )}
    </div>
  );
}
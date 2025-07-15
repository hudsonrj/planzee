
import React, { useState, useEffect, useMemo } from 'react';
import { Project, Task, User, Area, ProjectStatus, ProjectType } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  GitBranch, // Changed from Timeline to GitBranch as requested
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users,
  Target,
  Activity,
  Eye,
  Filter,
  Zap,
  TrendingUp,
  Flag,
  Play,
  Pause,
  Square,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, parseISO } from 'date-fns';
import { pt } from 'date-fns/locale';

const STATUS_ICONS = {
  'pendente': <Clock className="h-4 w-4" />,
  'em_andamento': <Play className="h-4 w-4" />,
  'concluída': <CheckCircle className="h-4 w-4" />,
  'bloqueada': <Pause className="h-4 w-4" />
};

const PRIORITY_COLORS = {
  'baixa': '#10b981',
  'média': '#f59e0b', 
  'alta': '#ef4444',
  'urgente': '#dc2626'
};

export default function MilestonesPage() {
  const [data, setData] = useState({
    projects: [],
    tasks: [],
    users: [],
    areas: [],
    projectTypes: [],
    projectStatusList: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState('all');
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState('timeline');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [projects, tasks, users, areas, projectTypes, projectStatusList] = await Promise.all([
        Project.list(),
        Task.list(),
        User.list(),
        Area.list(),
        ProjectType.list(),
        ProjectStatus.list()
      ]);

      // Filtrar apenas projetos ativos (não finalizados)
      const finalStatusIds = (projectStatusList || []).filter(s => s.is_final).map(s => s.id);
      const activeProjects = (projects || []).filter(p => !finalStatusIds.includes(p.status_id));

      setData({
        projects: activeProjects,
        tasks: tasks || [],
        users: users || [],
        areas: areas || [],
        projectTypes: projectTypes || [],
        projectStatusList: projectStatusList || []
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Processar dados para a timeline
  const timelineData = useMemo(() => {
    if (!data.projects.length) return [];

    const filteredProjects = selectedProject === 'all' 
      ? data.projects 
      : data.projects.filter(p => p.id === selectedProject);

    const projectIds = new Set(filteredProjects.map(p => p.id));
    const relevantTasks = data.tasks.filter(t => projectIds.has(t.project_id));

    // Criar marcos baseados em datas importantes
    const milestones = [];

    filteredProjects.forEach(project => {
      const projectTasks = relevantTasks.filter(t => t.project_id === project.id);
      const area = data.areas.find(a => a.id === project.area_id);
      const projectType = data.projectTypes.find(t => t.id === project.type_id);
      const projectStatus = data.projectStatusList.find(s => s.id === project.status_id);

      // Marco de início do projeto
      if (project.start_date) {
        milestones.push({
          id: `${project.id}-start`,
          date: project.start_date,
          type: 'project_start',
          title: `Início: ${project.title}`,
          project,
          projectType,
          projectStatus,
          area,
          tasks: projectTasks.filter(t => t.start_date === project.start_date),
          icon: <Play className="h-5 w-5" />,
          color: '#10b981'
        });
      }

      // Marco de prazo final do projeto
      if (project.deadline) {
        const isOverdue = new Date(project.deadline) < new Date();
        milestones.push({
          id: `${project.id}-deadline`,
          date: project.deadline,
          type: 'project_deadline',
          title: `Prazo: ${project.title}`,
          project,
          projectType,
          projectStatus,
          area,
          tasks: projectTasks.filter(t => t.deadline === project.deadline),
          icon: <Target className="h-5 w-5" />,
          color: isOverdue ? '#ef4444' : '#f59e0b',
          isOverdue
        });
      }

      // Marcos de tarefas críticas
      projectTasks
        .filter(task => {
          const isDueThisWeek = task.deadline && 
            differenceInDays(new Date(task.deadline), new Date()) <= 7 &&
            differenceInDays(new Date(task.deadline), new Date()) >= 0;
          const isHighPriority = task.priority === 'alta' || task.priority === 'urgente';
          return isDueThisWeek || isHighPriority;
        })
        .forEach(task => {
          milestones.push({
            id: `${task.id}-critical`,
            date: task.deadline || task.start_date,
            type: 'critical_task',
            title: `Tarefa Crítica: ${task.title}`,
            project,
            projectType,
            projectStatus,
            area,
            tasks: [task],
            icon: <AlertTriangle className="h-5 w-5" />,
            color: PRIORITY_COLORS[task.priority] || '#f59e0b'
          });
        });
    });

    // Ordenar marcos por data
    return milestones.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [data, selectedProject]);

  const openMilestoneModal = (milestone) => {
    setSelectedMilestone(milestone);
    setModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Marcos & Timeline</h1>
          <p className="text-gray-500 mt-1">Visualização executiva dos marcos dos projetos</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedProject} onValueChange={setSelectedProject}>
            <SelectTrigger className="w-[280px]">
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Projetos</SelectItem>
              {data.projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" /> {/* Changed icon here */}
            Timeline de Marcos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {timelineData.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum marco encontrado para os filtros selecionados</p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
              
              {/* Timeline Items */}
              <div className="space-y-8">
                {timelineData.map((milestone, index) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative flex items-start gap-6"
                  >
                    {/* Timeline Dot */}
                    <div 
                      className="relative z-10 flex items-center justify-center w-16 h-16 rounded-full border-4 border-white shadow-lg"
                      style={{ backgroundColor: milestone.color }}
                    >
                      <div className="text-white">
                        {milestone.icon}
                      </div>
                    </div>

                    {/* Timeline Content */}
                    <div className="flex-1 min-w-0">
                      <Card 
                        className="cursor-pointer hover:shadow-lg transition-all duration-200"
                        onClick={() => openMilestoneModal(milestone)}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {milestone.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(milestone.date), 'dd/MM/yyyy', { locale: pt })}
                                </div>
                                {milestone.isOverdue && (
                                  <Badge variant="destructive" className="text-xs">
                                    Atrasado
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Projeto:</span>
                              <p className="font-medium truncate">{milestone.project.title}</p>
                            </div>
                            {milestone.area && (
                              <div>
                                <span className="text-gray-500">Área:</span>
                                <p className="font-medium">{milestone.area.name}</p>
                              </div>
                            )}
                            {milestone.projectType && (
                              <div>
                                <span className="text-gray-500">Tipo:</span>
                                <p className="font-medium">{milestone.projectType.name}</p>
                              </div>
                            )}
                            <div>
                              <span className="text-gray-500">Tarefas:</span>
                              <p className="font-medium">{milestone.tasks.length}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Marco */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          {selectedMilestone && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                    style={{ backgroundColor: selectedMilestone.color }}
                  >
                    {selectedMilestone.icon}
                  </div>
                  {selectedMilestone.title}
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedMilestone.date), 'dd/MM/yyyy', { locale: pt })} • 
                  {selectedMilestone.area ? ` ${selectedMilestone.area.name} • ` : ' '}
                  {selectedMilestone.tasks.length} tarefa(s)
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {/* Informações do Projeto */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Informações do Projeto</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">Projeto:</span>
                      <p className="font-medium">{selectedMilestone.project.title}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Progresso:</span>
                      <div className="flex items-center gap-2">
                        <Progress value={selectedMilestone.project.progress || 0} className="flex-1" />
                        <span className="text-sm font-medium">{selectedMilestone.project.progress || 0}%</span>
                      </div>
                    </div>
                    {selectedMilestone.area && (
                      <div>
                        <span className="text-sm text-gray-500">Área:</span>
                        <p className="font-medium">{selectedMilestone.area.name}</p>
                      </div>
                    )}
                    {selectedMilestone.projectType && (
                      <div>
                        <span className="text-sm text-gray-500">Tipo:</span>
                        <p className="font-medium">{selectedMilestone.projectType.name}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Tarefas do Marco */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Tarefas ({selectedMilestone.tasks.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedMilestone.tasks.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Nenhuma tarefa específica para este marco</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedMilestone.tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-2">
                                {STATUS_ICONS[task.status] || <Clock className="h-4 w-4" />}
                                <span className="font-medium">{task.title}</span>
                              </div>
                              {task.priority && (
                                <Badge 
                                  variant="outline"
                                  style={{ 
                                    borderColor: PRIORITY_COLORS[task.priority],
                                    color: PRIORITY_COLORS[task.priority]
                                  }}
                                >
                                  {task.priority}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              {task.responsible && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {task.responsible}
                                </div>
                              )}
                              {task.deadline && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  {format(new Date(task.deadline), 'dd/MM', { locale: pt })}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

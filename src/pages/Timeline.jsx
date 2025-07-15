
import React, { useState, useEffect, useMemo } from 'react';
import { Project, Task, User, Area, ProjectType, ProjectStatus } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Filter,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Target,
  Users,
  Building,
  Eye,
  Settings,
  Download,
  Loader2,
  Play,
  Pause,
  Square,
  Flag,
  Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfYear, 
  endOfYear, 
  eachMonthOfInterval, 
  eachDayOfInterval, 
  startOfMonth, 
  endOfMonth, 
  isSameDay, 
  isToday,
  differenceInDays,
  isBefore,
  isAfter,
  parseISO,
  isValid
} from 'date-fns';
import { pt } from 'date-fns/locale';

const PROJECT_HEALTH_COLORS = {
  excellent: '#10b981',
  good: '#22c55e',
  warning: '#f59e0b',
  critical: '#ef4444',
  blocked: '#8b5cf6'
};

// Cores predefinidas para projetos (até 12 cores distintas)
const PROJECT_RANGE_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#ec4899', // pink
  '#6366f1', // indigo
  '#14b8a6', // teal
  '#a855f7'  // purple
];

const MILESTONE_TYPES = {
  project_start: { icon: <Play className="h-3 w-3" />, label: 'Início', color: '#10b981' },
  project_deadline: { icon: <Target className="h-3 w-3" />, label: 'Prazo', color: '#f59e0b' },
  critical_task: { icon: <AlertTriangle className="h-3 w-3" />, label: 'Tarefa Crítica', color: '#ef4444' },
  milestone: { icon: <Flag className="h-3 w-3" />, label: 'Marco', color: '#8b5cf6' }
};

export default function TimelinePage() {
  const [data, setData] = useState({
    projects: [],
    tasks: [],
    users: [],
    areas: [],
    projectTypes: [],
    projectStatusList: []
  });
  const [loading, setLoading] = useState(true);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedAreas, setSelectedAreas] = useState([]);
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [selectedProjectTypes, setSelectedProjectTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [hoveredProject, setHoveredProject] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [dateDetails, setDateDetails] = useState(null);

  // Mapeamento de cores para projetos
  const [projectColorMap, setProjectColorMap] = useState({});

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

      const allData = {
        projects: projects || [],
        tasks: tasks || [],
        users: users || [],
        areas: areas || [],
        projectTypes: projectTypes || [],
        projectStatusList: projectStatusList || []
      };

      setData(allData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar projetos baseado nas seleções
  const filteredProjects = useMemo(() => {
    let filtered = data.projects;

    // Filtrar por status final se showOnlyActive está ativo
    if (showOnlyActive) {
      const finalStatusIds = data.projectStatusList.filter(s => s.is_final).map(s => s.id);
      filtered = filtered.filter(p => !finalStatusIds.includes(p.status_id));
    }

    // Filtrar por áreas selecionadas
    if (selectedAreas.length > 0) {
      filtered = filtered.filter(p => selectedAreas.includes(p.area_id));
    }

    // Filtrar por projetos selecionados
    if (selectedProjects.length > 0) {
      filtered = filtered.filter(p => selectedProjects.includes(p.id));
    }

    // Filtrar por tipos de projeto
    if (selectedProjectTypes.length > 0) {
      filtered = filtered.filter(p => selectedProjectTypes.includes(p.type_id));
    }

    // Filtrar por status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(p => selectedStatuses.includes(p.status_id));
    }

    return filtered;
  }, [data, selectedAreas, selectedProjects, selectedProjectTypes, selectedStatuses, showOnlyActive]);

  useEffect(() => {
    // Criar mapeamento de cores para projetos filtrados
    const colorMap = {};
    filteredProjects.forEach((project, index) => {
      colorMap[project.id] = PROJECT_RANGE_COLORS[index % PROJECT_RANGE_COLORS.length];
    });
    setProjectColorMap(colorMap);
  }, [filteredProjects]);

  // Calcular saúde do projeto
  const calculateProjectHealth = (project) => {
    const projectTasks = data.tasks.filter(t => t.project_id === project.id);
    const today = new Date();
    const projectStatus = data.projectStatusList.find(s => s.id === project.status_id);
    const isFinal = projectStatus?.is_final || false;

    if (isFinal) {
      return {
        level: 'excellent',
        score: 100,
        color: PROJECT_HEALTH_COLORS.excellent,
        issues: [],
        completionRisk: 'baixo'
      };
    }

    let healthScore = 100;
    let issues = [];
    let completionRisk = 'baixo';

    // Análise de prazo
    if (project.deadline) {
      const deadline = new Date(project.deadline);
      const daysUntilDeadline = differenceInDays(deadline, today);
      
      if (daysUntilDeadline < 0) {
        healthScore -= 40;
        issues.push(`Projeto atrasado em ${Math.abs(daysUntilDeadline)} dias`);
        completionRisk = 'alto';
      } else if (daysUntilDeadline <= 7 && (project.progress || 0) < 80) {
        healthScore -= 25;
        issues.push(`Prazo próximo e progresso baixo`);
        completionRisk = 'médio';
      }
    }

    // Análise de tarefas
    const blockedTasks = projectTasks.filter(t => t.status === 'bloqueada');
    const overdueTasks = projectTasks.filter(t => {
      if (!t.deadline || t.status === 'concluída') return false;
      return new Date(t.deadline) < today;
    });

    if (blockedTasks.length > 0) {
      healthScore -= 20;
      issues.push(`${blockedTasks.length} tarefa(s) bloqueada(s)`);
      completionRisk = 'médio';
    }

    if (overdueTasks.length > 0) {
      healthScore -= 15;
      issues.push(`${overdueTasks.length} tarefa(s) atrasada(s)`);
      completionRisk = 'médio';
    }

    // Análise de progresso
    if (project.progress < 30 && project.deadline) {
      const daysTotal = differenceInDays(new Date(project.deadline), new Date(project.start_date));
      const daysElapsed = differenceInDays(today, new Date(project.start_date));
      const expectedProgress = (daysElapsed / daysTotal) * 100;
      
      if (project.progress < expectedProgress - 20) {
        healthScore -= 15;
        issues.push(`Progresso abaixo do esperado`);
        completionRisk = 'médio';
      }
    }

    // Determinar nível de saúde
    let healthLevel = 'excellent';
    if (healthScore < 50) {
      healthLevel = 'critical';
      completionRisk = 'alto';
    } else if (healthScore < 70) {
      healthLevel = 'warning';
      completionRisk = 'médio';
    } else if (healthScore < 90) {
      healthLevel = 'good';
    }

    return {
      level: healthLevel,
      score: Math.max(0, healthScore),
      color: PROJECT_HEALTH_COLORS[healthLevel],
      issues,
      completionRisk
    };
  };

  // Verificar se uma data está dentro do range de um projeto
  const getProjectsForDate = (date) => {
    return filteredProjects.filter(project => {
      if (!project.start_date || !project.deadline) return false;
      
      const startDate = new Date(project.start_date);
      const endDate = new Date(project.deadline);
      
      // Check if date is within or on the boundary of the project's start and end dates
      // Convert date to start of day to avoid time issues
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const startDateOnly = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

      return dateOnly >= startDateOnly && dateOnly <= endDateOnly;
    });
  };

  // Obter cor de fundo para uma data baseada nos projetos ativos
  const getDateBackgroundColor = (date) => {
    const projectsInRange = getProjectsForDate(date);
    if (projectsInRange.length === 0) return null;

    // Se há apenas um projeto, usar sua cor com baixa opacidade
    if (projectsInRange.length === 1) {
      const projectColor = projectColorMap[projectsInRange[0].id];
      return projectColor ? `${projectColor}15` : 'transparent'; // 15 in hex = ~8% opacity
    }

    // Se há múltiplos projetos, criar um gradiente sutil
    const colors = projectsInRange.map(p => projectColorMap[p.id]).filter(Boolean);
    if (colors.length >= 2) {
      // Use the first two colors for a simple gradient
      return `linear-gradient(45deg, ${colors[0]}15, ${colors[1] || colors[0]}15)`;
    }
    
    // Fallback for unexpected case (e.g., if colors array is empty for some reason)
    return '#64748b10'; // gray with low opacity
  };

  // Obter borda para indicar múltiplos projetos
  const getDateBorder = (date) => {
    const projectsInRange = getProjectsForDate(date);
    if (projectsInRange.length <= 1) return null;

    // Usar borda colorida para indicar múltiplos projetos
    if (projectsInRange.length === 2) {
      // If only two projects, the gradient background already provides visual distinction.
      // So, a transparent border makes sense here.
      return `2px solid transparent`;
    }
    
    // For 3+ projects, a subtle gray border
    return `1px solid #64748b40`; 
  };

  // Gerar marcos para o calendário
  const generateMilestones = (project) => {
    const milestones = [];
    const projectTasks = data.tasks.filter(t => t.project_id === project.id);
    const health = calculateProjectHealth(project);

    // Marco de início
    if (project.start_date && isValid(new Date(project.start_date))) {
      milestones.push({
        id: `${project.id}-start`,
        date: new Date(project.start_date),
        type: 'project_start',
        project,
        health,
        tasks: projectTasks.filter(t => isSameDay(new Date(t.start_date), new Date(project.start_date)))
      });
    }

    // Marco de prazo
    if (project.deadline && isValid(new Date(project.deadline))) {
      milestones.push({
        id: `${project.id}-deadline`,
        date: new Date(project.deadline),
        type: 'project_deadline',
        project,
        health,
        tasks: projectTasks.filter(t => isSameDay(new Date(t.deadline), new Date(project.deadline)))
      });
    }

    // Marcos de tarefas críticas
    projectTasks
      .filter(task => {
        if (!task.deadline || !isValid(new Date(task.deadline))) return false;
        const taskDate = new Date(task.deadline);
        const isInYear = taskDate.getFullYear() === currentYear;
        const isHighPriority = task.priority === 'alta' || task.priority === 'urgente';
        // Consider tasks that are upcoming (within 14 days) or overdue.
        // For the timeline, we focus on upcoming or past critical dates.
        const isRelevantTimeframe = differenceInDays(taskDate, new Date()) <= 14 && differenceInDays(taskDate, new Date()) >= 0;
        
        return isInYear && (isHighPriority || isRelevantTimeframe);
      })
      .forEach(task => {
        milestones.push({
          id: `${task.id}-critical`,
          date: new Date(task.deadline),
          type: 'critical_task',
          project,
          health,
          task,
          tasks: [task]
        });
      });

    return milestones;
  };

  // Obter marcos para uma data específica
  const getMilestonesForDate = (date) => {
    const milestones = [];
    
    filteredProjects.forEach(project => {
      const projectMilestones = generateMilestones(project);
      const dayMilestones = projectMilestones.filter(m => isSameDay(m.date, date));
      milestones.push(...dayMilestones);
    });

    return milestones;
  };

  // Verificar se uma data tem marcos
  const hasEventsForDate = (date) => {
    return getMilestonesForDate(date).length > 0;
  };

  // Obter cor predominante para uma data
  const getDateColor = (date) => {
    const milestones = getMilestonesForDate(date);
    if (milestones.length === 0) return null;

    // Priorizar marcos críticos
    const criticalMilestone = milestones.find(m => m.type === 'critical_task');
    if (criticalMilestone) return criticalMilestone.health.color;

    // Senão, usar a cor do primeiro marco
    return milestones[0].health.color;
  };

  // Navegar entre anos
  const goToPreviousYear = () => setCurrentYear(prev => prev - 1);
  const goToNextYear = () => setCurrentYear(prev => prev + 1);
  const goToCurrentYear = () => setCurrentYear(new Date().getFullYear());

  // Abrir modal de detalhes da data
  const handleDateClick = (date) => {
    const milestones = getMilestonesForDate(date);
    setDateDetails({
      date,
      milestones,
      formattedDate: format(date, 'dd/MM/yyyy', { locale: pt })
    });
    setModalOpen(true);
  };

  // Renderizar célula do calendário
  const renderCalendarDay = (date, monthIndex) => {
    const isCurrentMonth = date.getMonth() === monthIndex;
    const hasEvents = hasEventsForDate(date);
    const milestones = getMilestonesForDate(date);
    const projectsInRange = getProjectsForDate(date);
    const dateColor = getDateColor(date);
    const backgroundColor = getDateBackgroundColor(date);
    const borderStyle = getDateBorder(date);

    return (
      <div
        key={date.toISOString()}
        className={`
          relative h-8 w-8 rounded-sm cursor-pointer transition-all duration-200 flex items-center justify-center
          ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
          ${isToday(date) ? 'ring-2 ring-blue-500 ring-offset-1' : ''}
          ${hasEvents ? 'font-bold' : ''}
          ${projectsInRange.length > 0 ? 'font-medium' : ''}
          hover:bg-gray-100 hover:scale-110
        `}
        style={{
          background: backgroundColor || 'transparent',
          border: borderStyle,
          borderLeft: hasEvents ? `3px solid ${dateColor}` : 'none'
        }}
        onClick={() => handleDateClick(date)}
        // setHoveredProject on mouse enter/leave is for displaying details on the side, not in this component context anymore
        // onMouseEnter={() => setHoveredProject(milestones[0]?.project)}
        // onMouseLeave={() => setHoveredProject(null)}
        title={projectsInRange.length > 0 ? 
          `${projectsInRange.length} projeto(s): ${projectsInRange.map(p => p.title).join(', ')}` : 
          undefined}
      >
        <span className="text-xs z-10">{format(date, 'd')}</span>
        
        {/* Indicadores de marcos */}
        {milestones.length > 0 && (
          <div className="absolute top-0 right-0 flex flex-wrap gap-0.5">
            {milestones.slice(0, 3).map((milestone, idx) => (
              <div
                key={idx}
                className="w-1.5 h-1.5 rounded-full border border-white"
                style={{ backgroundColor: milestone.health.color }}
              />
            ))}
            {milestones.length > 3 && (
              <div className="w-1.5 h-1.5 rounded-full bg-gray-500 border border-white" />
            )}
          </div>
        )}

        {/* Indicador de múltiplos projetos na mesma data */}
        {projectsInRange.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 flex">
            {projectsInRange.slice(0, 4).map((project) => ( // Display up to 4 project colors
              <div
                key={project.id}
                className="flex-1 h-full"
                style={{ backgroundColor: projectColorMap[project.id] }}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Renderizar mês do calendário
  const renderMonth = (monthDate, index) => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    
    // Adjust start and end to align with week boundaries (Sunday to Saturday)
    const calendarStart = startOfMonth(monthDate);
    const calendarEnd = endOfMonth(monthDate);
    
    // Ensure the first day of the week is Sunday (0)
    const firstDayOfMonth = monthStart.getDay(); // 0 for Sunday, 1 for Monday
    const daysFromPrevMonth = firstDayOfMonth; // Number of days to show from prev month

    const effectiveStartDate = new Date(monthStart.getFullYear(), monthStart.getMonth(), monthStart.getDate() - daysFromPrevMonth);
    
    // Ensure the last day of the week is Saturday (6)
    const lastDayOfMonth = monthEnd.getDay();
    const daysToNextMonth = (6 - lastDayOfMonth + 7) % 7; // Number of days to show from next month

    const effectiveEndDate = new Date(monthEnd.getFullYear(), monthEnd.getMonth(), monthEnd.getDate() + daysToNextMonth);
    
    const days = eachDayOfInterval({ start: effectiveStartDate, end: effectiveEndDate });
    const weeks = [];
    
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }

    return (
      <Card key={index} className="p-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-center">
            {format(monthDate, 'MMMM', { locale: pt })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 p-1">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {weeks.map((week, weekIndex) => (
              week.map(day => renderCalendarDay(day, monthDate.getMonth()))
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Renderizar legenda de projetos
  const renderProjectLegend = () => {
    if (filteredProjects.length === 0) return null;

    return (
      <Card className="p-4">
        <div className="space-y-3">
          <h3 className="font-medium text-sm">Projetos Selecionados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {filteredProjects.map(project => {
              const projectColor = projectColorMap[project.id];
              const health = calculateProjectHealth(project);
              const area = data.areas.find(a => a.id === project.area_id);
              
              return (
                <div key={project.id} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50">
                  <div 
                    className="w-3 h-3 rounded-full border border-white"
                    style={{ backgroundColor: projectColor }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{project.title}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{area?.name || 'Sem área'}</span>
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: health.color }}
                        title={`Saúde: ${health.level}`}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  const yearStart = new Date(currentYear, 0, 1);
  const yearEnd = new Date(currentYear, 11, 31);
  const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cronograma Anual</h1>
          <p className="text-gray-500 mt-1">Visualização completa dos projetos ao longo do ano</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={goToPreviousYear}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToCurrentYear}>
            Hoje
          </Button>
          <span className="text-lg font-semibold min-w-[80px] text-center">{currentYear}</span>
          <Button variant="outline" onClick={goToNextYear}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Filtro por Áreas */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Áreas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedAreas.length === 0 ? 'Todas as áreas' : `${selectedAreas.length} área(s)`}
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  {data.areas.map(area => (
                    <div key={area.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={area.id}
                        checked={selectedAreas.includes(area.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAreas([...selectedAreas, area.id]);
                          } else {
                            setSelectedAreas(selectedAreas.filter(id => id !== area.id));
                          }
                        }}
                      />
                      <Label htmlFor={area.id} className="text-sm">{area.name}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro por Projetos */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Projetos</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedProjects.length === 0 ? 'Todos os projetos' : `${selectedProjects.length} projeto(s)`}
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {data.projects.map(project => (
                    <div key={project.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={project.id}
                        checked={selectedProjects.includes(project.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjects([...selectedProjects, project.id]);
                          } else {
                            setSelectedProjects(selectedProjects.filter(id => id !== project.id));
                          }
                        }}
                      />
                      <Label htmlFor={project.id} className="text-sm truncate">{project.title}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro por Tipo */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Tipos</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedProjectTypes.length === 0 ? 'Todos os tipos' : `${selectedProjectTypes.length} tipo(s)`}
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  {data.projectTypes.map(type => (
                    <div key={type.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.id}
                        checked={selectedProjectTypes.includes(type.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedProjectTypes([...selectedProjectTypes, type.id]);
                          } else {
                            setSelectedProjectTypes(selectedProjectTypes.filter(id => id !== type.id));
                          }
                        }}
                      />
                      <Label htmlFor={type.id} className="text-sm">{type.name}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filtro por Status */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Status</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  {selectedStatuses.length === 0 ? 'Todos os status' : `${selectedStatuses.length} status`}
                  <Filter className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-2">
                  {data.projectStatusList.map(status => (
                    <div key={status.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={status.id}
                        checked={selectedStatuses.includes(status.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStatuses([...selectedStatuses, status.id]);
                          } else {
                            setSelectedStatuses(selectedStatuses.filter(id => id !== status.id));
                          }
                        }}
                      />
                      <Label htmlFor={status.id} className="text-sm">{status.name}</Label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Toggle para projetos ativos */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Visualização</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active-only"
                checked={showOnlyActive}
                onCheckedChange={setShowOnlyActive}
              />
              <Label htmlFor="active-only" className="text-sm">Apenas projetos ativos</Label>
            </div>
          </div>
        </div>

        {/* Botão para limpar filtros */}
        <div className="mt-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => {
              setSelectedAreas([]);
              setSelectedProjects([]);
              setSelectedProjectTypes([]);
              setSelectedStatuses([]);
              setShowOnlyActive(true);
            }}
          >
            Limpar Filtros
          </Button>
        </div>
      </Card>

      {/* Legenda de Projetos */}
      {renderProjectLegend()}

      {/* Legenda de Símbolos */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-6 items-center text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Legenda:</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 bg-opacity-15 rounded border-l-2 border-blue-500" />
            <span>Range do Projeto</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span>Marco do Projeto</span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-gray-400 bg-gray-100 rounded flex">
              <div className="w-1/2 h-full bg-blue-500"></div>
              <div className="w-1/2 h-full bg-red-500"></div>
            </div>
            <span>Múltiplos Projetos</span>
          </div>

          <Separator orientation="vertical" className="h-4" />
          
          {Object.entries(PROJECT_HEALTH_COLORS).map(([level, color]) => (
            <div key={level} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs capitalize">
                {level === 'excellent' ? 'excelente' : 
                 level === 'good' ? 'boa' : 
                 level === 'warning' ? 'atenção' : 
                 level === 'critical' ? 'crítica' : 
                 level === 'blocked' ? 'bloqueado' : level}
              </span>
            </div>
          ))}
        </div>
      </Card>

      {/* Calendário Anual */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {months.map((month, index) => renderMonth(month, index))}
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Projetos Ativos</p>
              <p className="text-2xl font-bold text-blue-600">{filteredProjects.length}</p>
            </div>
            <Activity className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Marcos no Ano</p>
              <p className="text-2xl font-bold text-green-600">
                {filteredProjects.reduce((acc, project) => acc + generateMilestones(project).length, 0)}
              </p>
            </div>
            <Flag className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Projetos em Risco</p>
              <p className="text-2xl font-bold text-red-600">
                {filteredProjects.filter(p => {
                  const health = calculateProjectHealth(p);
                  return health.completionRisk === 'alto';
                }).length}
              </p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Progresso Médio</p>
              <p className="text-2xl font-bold text-purple-600">
                {filteredProjects.length > 0 
                  ? Math.round(filteredProjects.reduce((acc, p) => acc + (p.progress || 0), 0) / filteredProjects.length)
                  : 0}%
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Modal de Detalhes da Data */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Eventos de {dateDetails?.formattedDate}
            </DialogTitle>
            <DialogDescription>
              {dateDetails?.milestones.length} marco(s) encontrado(s)
            </DialogDescription>
          </DialogHeader>
          
          {dateDetails && (
            <div className="space-y-6">
              {dateDetails.milestones.map((milestone, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start gap-4">
                    <div 
                      className="p-3 rounded-lg"
                      style={{ backgroundColor: `${milestone.health.color}20` }}
                    >
                      {MILESTONE_TYPES[milestone.type].icon}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{milestone.project.title}</h3>
                        <Badge 
                          variant="outline"
                          style={{ 
                            borderColor: milestone.health.color,
                            color: milestone.health.color 
                          }}
                        >
                          {MILESTONE_TYPES[milestone.type].label}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Progresso</p>
                          <div className="flex items-center gap-2">
                            <Progress value={milestone.project.progress || 0} className="flex-1" />
                            <span className="text-sm font-medium">{milestone.project.progress || 0}%</span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Saúde do Projeto</p>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: milestone.health.color }}
                            />
                            <span className="text-sm font-medium capitalize">{milestone.health.level}</span>
                            <span className="text-sm text-gray-500">({milestone.health.score}/100)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-1">Risco de Conclusão</p>
                        <Badge 
                          variant={milestone.health.completionRisk === 'alto' ? 'destructive' : 
                                  milestone.health.completionRisk === 'médio' ? 'default' : 'secondary'}
                        >
                          {milestone.health.completionRisk}
                        </Badge>
                      </div>
                      
                      {milestone.health.issues.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Principais Problemas</p>
                          <ul className="space-y-1">
                            {milestone.health.issues.map((issue, idx) => (
                              <li key={idx} className="flex items-center gap-2 text-sm">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                {issue}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {milestone.tasks.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-500 mb-2">Tarefas Relacionadas</p>
                          <div className="space-y-2">
                            {milestone.tasks.map((task, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">{task.title}</span>
                                <Badge variant="outline">
                                  {task.status}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

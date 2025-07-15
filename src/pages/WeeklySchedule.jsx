
import React, { useState, useEffect, useMemo } from 'react';
import { Project, Task, User, Area, ProjectStatus, ProjectType } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Download,
  Loader2,
  Eye,
  Settings
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  format, 
  startOfYear, 
  endOfYear, 
  eachWeekOfInterval, 
  startOfWeek, 
  endOfWeek,
  addYears,
  subYears,
  getWeek,
  getMonth,
  isSameWeek,
  parseISO,
  isValid,
  differenceInWeeks
} from 'date-fns';
import { pt } from 'date-fns/locale';

// Cores para status dos projetos
const STATUS_COLORS = {
  'Concluído': '#22c55e',      // Verde
  'Em andamento': '#f59e0b',   // Amarelo  
  'Planejado': '#6b7280',      // Cinza
  'Paralisado': '#ef4444',     // Vermelho
  'Aguardando': '#3b82f6',     // Azul
  'Finalizado': '#22c55e',     // Verde
  'Andamento': '#f59e0b',      // Amarelo
  'Cancelado': '#ef4444'       // Vermelho
};

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export default function WeeklySchedulePage() {
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
  const [selectedClients, setSelectedClients] = useState([]); // This state is not used in the filters, selectedAreas is used instead. Keeping it for now as it was in original.
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

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

      setData({
        projects: projects || [],
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

  // Gerar semanas do ano
  const yearWeeks = useMemo(() => {
    const yearStart = startOfYear(new Date(currentYear, 0, 1));
    const yearEnd = endOfYear(new Date(currentYear, 11, 31));
    
    const weeks = eachWeekOfInterval(
      { start: yearStart, end: yearEnd },
      { weekStartsOn: 1 } // Segunda-feira
    );

    return weeks.map((week, index) => ({
      weekNumber: index + 1,
      startDate: week,
      endDate: endOfWeek(week, { weekStartsOn: 1 }),
      month: getMonth(week)
    }));
  }, [currentYear]);

  // Filtrar e organizar projetos
  const filteredProjects = useMemo(() => {
    let filtered = data.projects;

    // Filtrar por área
    if (selectedAreas.length > 0) {
      filtered = filtered.filter(p => selectedAreas.includes(p.area_id));
    }

    // Filtrar por status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(p => selectedStatuses.includes(p.status_id));
    }

    // Filtrar por termo de busca
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.title.toLowerCase().includes(term) ||
        (p.description && p.description.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [data.projects, selectedAreas, selectedStatuses, searchTerm]);

  // Organizar projetos por área
  const projectsByArea = useMemo(() => {
    const areaMap = new Map();

    filteredProjects.forEach(project => {
      const area = data.areas.find(a => a.id === project.area_id);
      const areaName = area ? area.name : 'Sem Área';
      
      if (!areaMap.has(areaName)) {
        areaMap.set(areaName, []);
      }
      
      areaMap.get(areaName).push(project);
    });

    return Array.from(areaMap.entries()).map(([areaName, projects]) => ({
      areaName,
      projects: projects.sort((a, b) => a.title.localeCompare(b.title))
    }));
  }, [filteredProjects, data.areas]);

  // Verificar se um projeto está ativo em uma semana específica
  const isProjectActiveInWeek = (project, week) => {
    if (!project.start_date || !project.deadline) return false;
    
    const projectStart = new Date(project.start_date);
    const projectEnd = new Date(project.deadline);
    const weekStart = week.startDate;
    const weekEnd = week.endDate;

    return (projectStart <= weekEnd && projectEnd >= weekStart);
  };

  // Obter cor do status do projeto
  const getStatusColor = (statusId) => {
    const status = data.projectStatusList.find(s => s.id === statusId);
    if (!status) return STATUS_COLORS['Planejado'];
    
    const statusName = status.name;
    return STATUS_COLORS[statusName] || STATUS_COLORS['Planejado'];
  };

  // Obter nome do status
  const getStatusName = (statusId) => {
    const status = data.projectStatusList.find(s => s.id === statusId);
    return status ? status.name : 'Indefinido';
  };

  // Navegar entre anos
  const goToPreviousYear = () => setCurrentYear(prev => prev - 1);
  const goToNextYear = () => setCurrentYear(prev => prev + 1);
  const goToCurrentYear = () => setCurrentYear(new Date().getFullYear());

  // Obter lista única de áreas para filtro
  const availableAreas = useMemo(() => {
    const areas = new Set();
    data.projects.forEach(project => {
      const area = data.areas.find(a => a.id === project.area_id);
      areas.add(area ? area.name : 'Sem Área');
    });
    return Array.from(areas).sort();
  }, [data.projects, data.areas]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cronograma Semanal</h1>
          <p className="text-gray-500 mt-1">Visualização semanal dos projetos por área</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Busca */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Buscar Projeto</Label>
            <Input
              placeholder="Digite o nome do projeto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por Área */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Áreas</Label>
            <Select 
              value={selectedAreas.length === 1 ? selectedAreas[0] : 'all'} 
              onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedAreas([]);
                } else {
                  setSelectedAreas([value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as áreas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as Áreas</SelectItem>
                {data.areas.map(area => (
                  <SelectItem key={area.id} value={area.id}>
                    {area.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filtro por Status */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Status</Label>
            <Select 
              value={selectedStatuses.length === 1 ? selectedStatuses[0] : 'all'} 
              onValueChange={(value) => {
                if (value === 'all') {
                  setSelectedStatuses([]);
                } else {
                  setSelectedStatuses([value]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                {data.projectStatusList.map(status => (
                  <SelectItem key={status.id} value={status.id}>
                    {status.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botão Limpar Filtros */}
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSelectedAreas([]);
                setSelectedStatuses([]);
                setSearchTerm('');
              }}
              className="w-full"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </Card>

      {/* Legenda das cores */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center text-sm">
          <span className="font-medium">Legenda das cores:</span>
          {Object.entries(STATUS_COLORS).map(([status, color]) => (
            <div key={status} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: color }}
              />
              <span>{status}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Cronograma Semanal */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Cabeçalho do cronograma */}
            <div className="bg-gray-800 text-white">
              {/* Linha dos meses */}
              <div className="flex">
                <div className="w-64 p-3 font-bold text-center border-r border-gray-600">
                  CRONOGRAMA SEMANAL {currentYear}
                </div>
                {MONTH_NAMES.map((month, monthIndex) => {
                  const weeksInMonth = yearWeeks.filter(week => week.month === monthIndex);
                  const monthWidth = Math.max(weeksInMonth.length * 24, 60); // Mínimo 60px por mês
                  
                  return (
                    <div 
                      key={month} 
                      className="p-3 text-center font-bold border-r border-gray-600"
                      style={{ width: `${monthWidth}px` }}
                    >
                      {month}
                    </div>
                  );
                })}
              </div>

              {/* Linha dos números das semanas */}
              <div className="flex bg-gray-700">
                <div className="w-64 flex">
                  <div className="w-20 p-2 text-xs font-medium border-r border-gray-600 text-center">Área</div>
                  <div className="w-24 p-2 text-xs font-medium border-r border-gray-600 text-center">Projeto</div>
                  <div className="w-20 p-2 text-xs font-medium border-r border-gray-600 text-center">Status</div>
                  <div className="flex-1 p-2 text-xs font-medium text-center">Responsável</div>
                </div>
                {yearWeeks.map((week, index) => (
                  <div 
                    key={index} 
                    className="w-6 p-1 text-xs text-center border-r border-gray-600"
                    title={`Semana ${week.weekNumber} - ${format(week.startDate, 'dd/MM')} a ${format(week.endDate, 'dd/MM')}`}
                  >
                    {week.weekNumber}
                  </div>
                ))}
              </div>
            </div>

            {/* Linhas dos projetos */}
            <div className="bg-white">
              {projectsByArea.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  Nenhum projeto encontrado com os filtros selecionados.
                </div>
              ) : (
                projectsByArea.map(({ areaName, projects }) => (
                  projects.map((project, projectIndex) => {
                    const responsible = data.users.find(u => u.email === project.responsible);
                    const statusColor = getStatusColor(project.status_id);
                    const statusName = getStatusName(project.status_id);
                    
                    return (
                      <div key={`${areaName}-${project.id}`} className="flex border-b border-gray-200 hover:bg-gray-50">
                        {/* Informações do projeto */}
                        <div className="w-64 flex border-r border-gray-200">
                          <div className="w-20 p-2 text-xs border-r border-gray-200 flex items-center">
                            {projectIndex === 0 ? areaName : ''}
                          </div>
                          <div className="w-24 p-2 text-xs border-r border-gray-200 flex items-center">
                            <span className="truncate" title={project.title}>
                              {project.title}
                            </span>
                          </div>
                          <div className="w-20 p-2 text-xs border-r border-gray-200 flex items-center">
                            <Badge 
                              variant="outline" 
                              className="text-xs px-1 py-0"
                              style={{ 
                                borderColor: statusColor,
                                color: statusColor,
                                backgroundColor: `${statusColor}20`
                              }}
                            >
                              {statusName}
                            </Badge>
                          </div>
                          <div className="flex-1 p-2 text-xs flex items-center">
                            <span className="truncate" title={responsible?.full_name || project.responsible}>
                              {responsible?.full_name || project.responsible.split('@')[0]}
                            </span>
                          </div>
                        </div>

                        {/* Barras das semanas */}
                        <div className="flex">
                          {yearWeeks.map((week, weekIndex) => {
                            const isActive = isProjectActiveInWeek(project, week);
                            
                            return (
                              <div 
                                key={weekIndex}
                                className="w-6 h-12 border-r border-gray-200 flex items-center justify-center"
                                style={{
                                  backgroundColor: isActive ? statusColor : 'transparent'
                                }}
                                title={isActive ? 
                                  `${project.title} - Semana ${week.weekNumber} (${format(week.startDate, 'dd/MM')} - ${format(week.endDate, 'dd/MM')})` : 
                                  ''
                                }
                              >
                                {isActive && (
                                  <div 
                                    className="w-4 h-8 rounded-sm opacity-80"
                                    style={{ backgroundColor: statusColor }}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {filteredProjects.length}
            </div>
            <div className="text-sm text-gray-500">Total de Projetos</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {filteredProjects.filter(p => {
                const status = data.projectStatusList.find(s => s.id === p.status_id);
                return status && status.is_final;
              }).length}
            </div>
            <div className="text-sm text-gray-500">Projetos Concluídos</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {filteredProjects.filter(p => {
                const status = data.projectStatusList.find(s => s.id === p.status_id);
                return status && !status.is_final;
              }).length}
            </div>
            <div className="text-sm text-gray-500">Projetos Ativos</div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {projectsByArea.length}
            </div>
            <div className="text-sm text-gray-500">Áreas</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { Project, Task, Meeting, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { format, addDays, addMonths, subMonths, subDays, startOfWeek, endOfWeek, eachDayOfInterval, isToday, isSameMonth, parseISO, isSameDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  ArrowRight,
  CheckCircle2,
  Clock,
  Calendar as CalendarIconFull,
  AlertTriangle,
  ListTodo,
  Users,
  ExternalLink,
  Loader2,
  FileText,
  Filter
} from "lucide-react";

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState("month"); // month, week, day
  const [tasks, setTasks] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateEvents, setDateEvents] = useState([]);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [filterUser, setFilterUser] = useState("all");
  const [filterProject, setFilterProject] = useState("all");
  const [filterTimeframe, setFilterTimeframe] = useState("all");

  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (selectedDate) {
      const events = getEventsForDate(selectedDate);
      setDateEvents(events);
    }
  }, [selectedDate, tasks, meetings, filterUser, filterProject]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tasksData, meetingsData, projectsData, usersData] = await Promise.all([
        Task.list(),
        Meeting.list(),
        Project.list(),
        User.list()
      ]);
      
      setTasks(tasksData);
      setMeetings(meetingsData);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const filterEvents = () => {
    // Apply filters
    const filteredTasks = tasks.filter(task => {
      const userFilter = filterUser === "all" || task.assigned_to === filterUser;
      const projectFilter = filterProject === "all" || task.project_id === filterProject;
      
      let timeFilter = true;
      if (filterTimeframe !== "all" && task.deadline) {
        const taskDate = new Date(task.deadline);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (filterTimeframe === "today") {
          timeFilter = isSameDay(taskDate, today);
        } else if (filterTimeframe === "tomorrow") {
          const tomorrow = addDays(today, 1);
          timeFilter = isSameDay(taskDate, tomorrow);
        } else if (filterTimeframe === "week") {
          const endOfWeekDate = endOfWeek(today);
          timeFilter = taskDate >= today && taskDate <= endOfWeekDate;
        } else if (filterTimeframe === "month") {
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          timeFilter = taskDate >= today && taskDate <= endOfMonth;
        } else if (filterTimeframe === "overdue") {
          timeFilter = taskDate < today && task.status !== "concluída";
        }
      }
      
      return userFilter && projectFilter && timeFilter;
    });
    
    const filteredMeetings = meetings.filter(meeting => {
      const userFilter = filterUser === "all" || (meeting.attendees && meeting.attendees.includes(filterUser));
      const projectFilter = filterProject === "all" || meeting.project_id === filterProject;
      
      let timeFilter = true;
      if (filterTimeframe !== "all" && meeting.date) {
        const meetingDate = new Date(meeting.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (filterTimeframe === "today") {
          timeFilter = isSameDay(meetingDate, today);
        } else if (filterTimeframe === "tomorrow") {
          const tomorrow = addDays(today, 1);
          timeFilter = isSameDay(meetingDate, tomorrow);
        } else if (filterTimeframe === "week") {
          const endOfWeekDate = endOfWeek(today);
          timeFilter = meetingDate >= today && meetingDate <= endOfWeekDate;
        } else if (filterTimeframe === "month") {
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          timeFilter = meetingDate >= today && meetingDate <= endOfMonth;
        } else if (filterTimeframe === "overdue") {
          timeFilter = meetingDate < today;
        }
      }
      
      return userFilter && projectFilter && timeFilter;
    });
    
    return { filteredTasks, filteredMeetings };
  };

  const navigateToPreviousMonth = () => {
    setCurrentDate(prevDate => subMonths(prevDate, 1));
  };

  const navigateToNextMonth = () => {
    setCurrentDate(prevDate => addMonths(prevDate, 1));
  };
  
  const navigateToPreviousWeek = () => {
    setCurrentDate(prevDate => subDays(prevDate, 7));
  };

  const navigateToNextWeek = () => {
    setCurrentDate(prevDate => addDays(prevDate, 7));
  };
  
  const navigateToPreviousDay = () => {
    setCurrentDate(prevDate => subDays(prevDate, 1));
  };

  const navigateToNextDay = () => {
    setCurrentDate(prevDate => addDays(prevDate, 1));
  };
  
  const navigateToToday = () => {
    setCurrentDate(new Date());
  };
  
  const getProjectById = (projectId) => {
    return projects.find(p => p.id === projectId) || { title: "Desconhecido" };
  };
  
  const getUserName = (userEmail) => {
    const user = users.find(u => u.email === userEmail);
    return user ? user.full_name || user.email : "Não atribuído";
  };
  
  const getInitials = (email) => {
    if (!email) return "?";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };
  
  const getEventsForDate = (date) => {
    const { filteredTasks, filteredMeetings } = filterEvents();
    
    const dateObj = new Date(date);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);
    
    const dayTasks = filteredTasks.filter(task => {
      if (!task.deadline) return false;
      const taskDate = parseISO(task.deadline);
      return isSameDay(taskDate, dateObj);
    });
    
    const dayMeetings = filteredMeetings.filter(meeting => {
      if (!meeting.date) return false;
      const meetingDate = parseISO(meeting.date);
      return isSameDay(meetingDate, dateObj);
    });
    
    return [...dayTasks.map(task => ({ ...task, type: 'task' })), 
            ...dayMeetings.map(meeting => ({ ...meeting, type: 'meeting' }))];
  };

  const hasEventsForDate = (date) => {
    const events = getEventsForDate(date);
    return events.length > 0;
  };
  
  const renderMonthView = () => {
    const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayOfMonth = startOfWeek(monthStart, { weekStartsOn: 0 });
    const lastDayOfMonth = endOfWeek(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0), { weekStartsOn: 0 });
    
    const daysOfMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
    
    const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    
    return (
      <div className="pt-4">
        <div className="grid grid-cols-7 mb-2">
          {weekDays.map((day, index) => (
            <div key={index} className="text-center text-gray-500 font-medium text-sm py-2">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {daysOfMonth.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const hasEvents = hasEventsForDate(day);
            
            return (
              <div
                key={index}
                className={`
                  h-24 border p-1 rounded-lg transition-colors cursor-pointer
                  ${isCurrentMonth ? "bg-white" : "bg-gray-50 text-gray-400"}
                  ${isToday ? "border-blue-500" : "border-gray-200"}
                  hover:bg-gray-50
                `}
                onClick={() => {
                  setSelectedDate(day);
                  setOpenDetailsDialog(true);
                }}
              >
                <div className="flex justify-between items-center">
                  <span 
                    className={`text-sm font-medium ${isToday ? "bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center" : ""}`}
                  >
                    {format(day, "d")}
                  </span>
                  {hasEvents && (
                    <div className="h-2 w-2 rounded-full bg-indigo-500"></div>
                  )}
                </div>
                <div className="mt-1 overflow-hidden max-h-16">
                  {getEventsForDate(day).slice(0, 2).map((event, idx) => (
                    <div 
                      key={idx} 
                      className={`text-xs rounded px-1 py-0.5 mb-0.5 truncate
                        ${event.type === 'task' ? 
                          (event.status === 'concluída' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800') : 
                          'bg-purple-100 text-purple-800'
                        }
                      `}
                    >
                      {event.title}
                    </div>
                  ))}
                  {getEventsForDate(day).length > 2 && (
                    <div className="text-xs text-gray-500 px-1">
                      + {getEventsForDate(day).length - 2} mais
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
    
    const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });
    
    return (
      <div className="pt-4 grid grid-cols-1 md:grid-cols-7 gap-4">
        {daysOfWeek.map((day, index) => {
          const isToday = isSameDay(day, new Date());
          const events = getEventsForDate(day);
          
          return (
            <div key={index} className="space-y-2">
              <div className={`text-center p-2 rounded-lg ${isToday ? "bg-blue-500 text-white" : "bg-gray-100"}`}>
                <div className="font-medium">{format(day, "EEE", { locale: ptBR })}</div>
                <div>{format(day, "d MMM", { locale: ptBR })}</div>
              </div>
              
              <div className="space-y-2">
                {events.length === 0 ? (
                  <div className="text-center text-sm text-gray-500 py-2">
                    Nenhum evento
                  </div>
                ) : (
                  events.map((event, idx) => (
                    <Card key={idx} className="shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <div className={`mt-0.5 p-1 rounded ${event.type === 'task' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                            {event.type === 'task' ? (
                              <ListTodo className="h-3 w-3 text-blue-800" />
                            ) : (
                              <Users className="h-3 w-3 text-purple-800" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{event.title}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {getProjectById(event.project_id).title}
                            </div>
                            {event.type === 'task' && event.assigned_to && (
                              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                                <Avatar className="h-4 w-4">
                                  <AvatarFallback className="text-[8px]">{getInitials(event.assigned_to)}</AvatarFallback>
                                </Avatar>
                                {getUserName(event.assigned_to)}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  
  const renderDayView = () => {
    const events = getEventsForDate(currentDate);
    const tasks = events.filter(event => event.type === 'task');
    const meetings = events.filter(event => event.type === 'meeting');
    
    return (
      <div className="pt-4">
        <h2 className="text-xl font-bold mb-4">
          {format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <ListTodo className="h-5 w-5 text-blue-500" />
                Tarefas ({tasks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma tarefa para hoje
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, idx) => (
                    <Card key={idx} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge className={
                                task.status === "pendente" ? "bg-yellow-100 text-yellow-800" : 
                                task.status === "em_andamento" ? "bg-blue-100 text-blue-800" :
                                task.status === "concluída" ? "bg-green-100 text-green-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {task.status}
                              </Badge>
                              <Badge variant="outline">
                                {getProjectById(task.project_id).title}
                              </Badge>
                            </div>
                          </div>
                          
                          {task.assigned_to && (
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>{getInitials(task.assigned_to)}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-500" />
                Reuniões ({meetings.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {meetings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhuma reunião para hoje
                </div>
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting, idx) => (
                    <Card key={idx} className="shadow-sm">
                      <CardContent className="p-4">
                        <h3 className="font-medium">{meeting.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {getProjectById(meeting.project_id).title}
                          </Badge>
                        </div>
                        
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">Participantes:</p>
                            <div className="flex flex-wrap gap-2">
                              {meeting.attendees.map((attendee, i) => (
                                <div key={i} className="flex items-center gap-1 text-sm">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">{getInitials(attendee)}</AvatarFallback>
                                  </Avatar>
                                  <span>{getUserName(attendee)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendário</h1>
          <p className="text-gray-500 mt-1">Visualize tarefas e reuniões no calendário</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Visualização" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="day">Dia</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={navigateToToday}>
            Hoje
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Usuário
              </label>
              <Select value={filterUser} onValueChange={setFilterUser}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filtrar por usuário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os usuários</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Projeto
              </label>
              <Select value={filterProject} onValueChange={setFilterProject}>
                <SelectTrigger className="w-[200px]">
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
            
            <div className="w-full md:w-auto">
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Período
              </label>
              <Select value={filterTimeframe} onValueChange={setFilterTimeframe}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="today">Hoje</SelectItem>
                  <SelectItem value="tomorrow">Amanhã</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mês</SelectItem>
                  <SelectItem value="overdue">Atrasados</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Badge 
                variant="outline" 
                className="flex items-center gap-1 mr-2"
              >
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                Tarefas
              </Badge>
            </div>
            
            <div>
              <Badge 
                variant="outline" 
                className="flex items-center gap-1"
              >
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                Reuniões
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Calendar navigation */}
      <div className="flex justify-between items-center mb-4">
        <div className="font-bold text-xl">
          {view === "month" && format(currentDate, "MMMM yyyy", { locale: ptBR })}
          {view === "week" && `Semana de ${format(startOfWeek(currentDate, { weekStartsOn: 0 }), "d")} a ${format(endOfWeek(currentDate, { weekStartsOn: 0 }), "d 'de' MMMM", { locale: ptBR })}`}
          {view === "day" && format(currentDate, "d 'de' MMMM yyyy", { locale: ptBR })}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={
            view === "month" ? navigateToPreviousMonth : 
            view === "week" ? navigateToPreviousWeek : 
            navigateToPreviousDay
          }>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={
            view === "month" ? navigateToNextMonth : 
            view === "week" ? navigateToNextWeek : 
            navigateToNextDay
          }>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Calendar views */}
      <Card>
        <CardContent className="p-4">
          {view === "month" && renderMonthView()}
          {view === "week" && renderWeekView()}
          {view === "day" && renderDayView()}
        </CardContent>
      </Card>
      
      {/* Date events dialog */}
      <Dialog open={openDetailsDialog} onOpenChange={setOpenDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && format(selectedDate, "EEEE, d 'de' MMMM yyyy", { locale: ptBR })}
            </DialogTitle>
          </DialogHeader>
          
          {dateEvents.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIconFull className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum evento para esta data</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-blue-500" />
                  Tarefas
                </h3>
                <div className="space-y-3">
                  {dateEvents.filter(e => e.type === 'task').map((task, idx) => (
                    <Card key={idx} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{task.title}</h3>
                            {task.description && (
                              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge className={
                                task.status === "pendente" ? "bg-yellow-100 text-yellow-800" : 
                                task.status === "em_andamento" ? "bg-blue-100 text-blue-800" :
                                task.status === "concluída" ? "bg-green-100 text-green-800" :
                                "bg-red-100 text-red-800"
                              }>
                                {task.status}
                              </Badge>
                              <Badge variant="outline">
                                {getProjectById(task.project_id).title}
                              </Badge>
                            </div>
                          </div>
                          
                          <Link to={createPageUrl("Tasks")}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                        
                        {task.assigned_to && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="text-xs">{getInitials(task.assigned_to)}</AvatarFallback>
                            </Avatar>
                            <span>Responsável: {getUserName(task.assigned_to)}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {dateEvents.filter(e => e.type === 'task').length === 0 && (
                    <p className="text-gray-500 text-center py-2">Nenhuma tarefa</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
                  <Users className="h-5 w-5 text-purple-500" />
                  Reuniões
                </h3>
                <div className="space-y-3">
                  {dateEvents.filter(e => e.type === 'meeting').map((meeting, idx) => (
                    <Card key={idx} className="shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{meeting.title}</h3>
                            <div className="mt-2">
                              <Badge variant="outline">
                                {getProjectById(meeting.project_id).title}
                              </Badge>
                            </div>
                          </div>
                          
                          <Link to={createPageUrl(`MeetingDetails?id=${meeting.id}`)}>
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                        
                        {meeting.attendees && meeting.attendees.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-1">Participantes:</p>
                            <div className="flex flex-wrap gap-2">
                              {meeting.attendees.map((attendee, i) => (
                                <div key={i} className="flex items-center gap-1 text-sm">
                                  <Avatar className="h-5 w-5">
                                    <AvatarFallback className="text-xs">{getInitials(attendee)}</AvatarFallback>
                                  </Avatar>
                                  <span>{getUserName(attendee)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                  
                  {dateEvents.filter(e => e.type === 'meeting').length === 0 && (
                    <p className="text-gray-500 text-center py-2">Nenhuma reunião</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setOpenDetailsDialog(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Task, Meeting, Project, User } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Bell,
  CheckCircle2,
  Calendar,
  ClipboardList,
  Clock,
  AlertTriangle,
  User as UserIcon,
  X,
  ExternalLink,
  Trash2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isTomorrow, isThisWeek, differenceInDays } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [dismissedNotifications, setDismissedNotifications] = useState(new Set());

  useEffect(() => {
    loadNotifications();
    loadDismissedNotifications();
    
    // Atualizar notificações a cada 5 minutos
    const interval = setInterval(loadNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadDismissedNotifications = () => {
    const dismissed = localStorage.getItem('dismissedNotifications');
    if (dismissed) {
      setDismissedNotifications(new Set(JSON.parse(dismissed)));
    }
  };

  const saveDismissedNotifications = (dismissed) => {
    localStorage.setItem('dismissedNotifications', JSON.stringify([...dismissed]));
    setDismissedNotifications(dismissed);
  };

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const user = await User.me();
      setCurrentUser(user);

      const [tasks, meetings, projects] = await Promise.all([
        Task.list(),
        Meeting.list(),
        Project.list()
      ]);

      const today = new Date();
      const notifications = [];

      // 1. Tarefas atribuídas ao usuário
      const userTasks = tasks.filter(task => task.assigned_to === user.email);
      
      // Tarefas pendentes
      const pendingTasks = userTasks.filter(task => task.status === 'pendente');
      pendingTasks.forEach(task => {
        const project = projects.find(p => p.id === task.project_id);
        notifications.push({
          id: `task-pending-${task.id}`,
          type: 'task',
          priority: 'medium',
          title: 'Nova tarefa atribuída',
          message: task.title,
          details: `Projeto: ${project?.title || 'N/A'}`,
          date: task.created_date || today.toISOString(),
          link: createPageUrl(`ProjectDetails?id=${task.project_id}`),
          icon: ClipboardList,
          color: 'text-blue-500'
        });
      });

      // Tarefas com prazo próximo (próximos 3 dias)
      const urgentTasks = userTasks.filter(task => {
        if (!task.deadline || task.status === 'concluída') return false;
        const deadline = new Date(task.deadline);
        const daysUntilDeadline = differenceInDays(deadline, today);
        return daysUntilDeadline >= 0 && daysUntilDeadline <= 3;
      });

      urgentTasks.forEach(task => {
        const deadline = new Date(task.deadline);
        const daysUntilDeadline = differenceInDays(deadline, today);
        const project = projects.find(p => p.id === task.project_id);
        
        let urgencyText = '';
        let priority = 'medium';
        if (daysUntilDeadline === 0) {
          urgencyText = 'vence hoje';
          priority = 'high';
        } else if (daysUntilDeadline === 1) {
          urgencyText = 'vence amanhã';
          priority = 'high';
        } else {
          urgencyText = `vence em ${daysUntilDeadline} dias`;
        }

        notifications.push({
          id: `task-urgent-${task.id}`,
          type: 'task',
          priority,
          title: `Tarefa ${urgencyText}`,
          message: task.title,
          details: `Projeto: ${project?.title || 'N/A'}`,
          date: task.deadline,
          link: createPageUrl(`ProjectDetails?id=${task.project_id}`),
          icon: AlertTriangle,
          color: priority === 'high' ? 'text-red-500' : 'text-yellow-500'
        });
      });

      // Tarefas atrasadas
      const overdueTasks = userTasks.filter(task => {
        if (!task.deadline || task.status === 'concluída') return false;
        return new Date(task.deadline) < today;
      });

      overdueTasks.forEach(task => {
        const project = projects.find(p => p.id === task.project_id);
        const daysOverdue = Math.abs(differenceInDays(new Date(task.deadline), today));
        
        notifications.push({
          id: `task-overdue-${task.id}`,
          type: 'task',
          priority: 'high',
          title: `Tarefa atrasada (${daysOverdue} dias)`,
          message: task.title,
          details: `Projeto: ${project?.title || 'N/A'}`,
          date: task.deadline,
          link: createPageUrl(`ProjectDetails?id=${task.project_id}`),
          icon: AlertTriangle,
          color: 'text-red-500'
        });
      });

      // 2. Reuniões onde o usuário é participante
      const userMeetings = meetings.filter(meeting => 
        meeting.attendees && meeting.attendees.includes(user.email)
      );

      // Reuniões próximas (próximos 2 dias)
      const upcomingMeetings = userMeetings.filter(meeting => {
        const meetingDate = new Date(meeting.date);
        const daysUntilMeeting = differenceInDays(meetingDate, today);
        return daysUntilMeeting >= 0 && daysUntilMeeting <= 2;
      });

      upcomingMeetings.forEach(meeting => {
        const meetingDate = new Date(meeting.date);
        const project = projects.find(p => p.id === meeting.project_id);
        
        let timeText = '';
        if (isToday(meetingDate)) {
          timeText = 'hoje';
        } else if (isTomorrow(meetingDate)) {
          timeText = 'amanhã';
        } else {
          timeText = format(meetingDate, 'dd/MM', { locale: pt });
        }

        notifications.push({
          id: `meeting-upcoming-${meeting.id}`,
          type: 'meeting',
          priority: 'medium',
          title: `Reunião ${timeText}`,
          message: meeting.title,
          details: `Projeto: ${project?.title || 'N/A'}`,
          date: meeting.date,
          link: createPageUrl(`MeetingDetails?id=${meeting.id}`),
          icon: Calendar,
          color: 'text-green-500'
        });
      });

      // 3. Projetos onde o usuário é responsável ou participante
      const userProjects = projects.filter(project => 
        project.responsible === user.email || 
        (project.participants && project.participants.includes(user.email))
      );

      // Projetos com prazo próximo
      const urgentProjects = userProjects.filter(project => {
        if (!project.deadline || project.status === 'concluído') return false;
        const deadline = new Date(project.deadline);
        const daysUntilDeadline = differenceInDays(deadline, today);
        return daysUntilDeadline >= 0 && daysUntilDeadline <= 7; // próximos 7 dias
      });

      urgentProjects.forEach(project => {
        const deadline = new Date(project.deadline);
        const daysUntilDeadline = differenceInDays(deadline, today);
        
        let urgencyText = '';
        let priority = 'low';
        if (daysUntilDeadline <= 3) {
          urgencyText = `vence em ${daysUntilDeadline} dias`;
          priority = 'high';
        } else {
          urgencyText = `vence em ${daysUntilDeadline} dias`;
          priority = 'medium';
        }

        notifications.push({
          id: `project-urgent-${project.id}`,
          type: 'project',
          priority,
          title: `Projeto ${urgencyText}`,
          message: project.title,
          details: `Progresso: ${project.progress || 0}%`,
          date: project.deadline,
          link: createPageUrl(`ProjectDetails?id=${project.id}`),
          icon: Clock,
          color: priority === 'high' ? 'text-red-500' : 'text-yellow-500'
        });
      });

      // Ordenar notificações por prioridade e data
      const sortedNotifications = notifications
        .filter(notification => !dismissedNotifications.has(notification.id))
        .sort((a, b) => {
          // Primeiro por prioridade
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
          if (priorityDiff !== 0) return priorityDiff;
          
          // Depois por data
          return new Date(a.date) - new Date(b.date);
        });

      setNotifications(sortedNotifications);
      setUnreadCount(sortedNotifications.length);

    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
    } finally {
      setLoading(false);
    }
  };

  const dismissNotification = (notificationId) => {
    const newDismissed = new Set(dismissedNotifications);
    newDismissed.add(notificationId);
    saveDismissedNotifications(newDismissed);
    
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    setNotifications(updatedNotifications);
    setUnreadCount(updatedNotifications.length);
  };

  const clearAllNotifications = () => {
    const allIds = notifications.map(n => n.id);
    const newDismissed = new Set([...dismissedNotifications, ...allIds]);
    saveDismissedNotifications(newDismissed);
    
    setNotifications([]);
    setUnreadCount(0);
  };

  const getNotificationIcon = (notification) => {
    const IconComponent = notification.icon;
    return <IconComponent className={`h-4 w-4 ${notification.color}`} />;
  };

  const getTimeAgo = (date) => {
    const notificationDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.floor((now - notificationDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'há poucos minutos';
    if (diffInHours < 24) return `há ${diffInHours}h`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return 'ontem';
    if (diffInDays < 7) return `há ${diffInDays} dias`;
    
    return format(notificationDate, 'dd/MM', { locale: pt });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs animate-pulse"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0 bg-white border border-gray-200 shadow-lg rounded-lg"
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Notificações</h3>
            {notifications.length > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllNotifications}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Limpar tudo
              </Button>
            )}
          </div>
          
          {unreadCount > 0 && (
            <p className="text-sm text-gray-500 mt-1">
              {unreadCount} {unreadCount === 1 ? 'notificação' : 'notificações'}
            </p>
          )}
        </div>

        <ScrollArea className="max-h-96">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Carregando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">Nenhuma notificação</p>
              <p className="text-gray-400 text-xs mt-1">Você está em dia! 🎉</p>
            </div>
          ) : (
            <div className="p-2">
              <AnimatePresence>
                {notifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="mb-2"
                  >
                    <Card className={`cursor-pointer hover:bg-gray-50 transition-colors border-l-4 ${
                      notification.priority === 'high' ? 'border-l-red-500' :
                      notification.priority === 'medium' ? 'border-l-yellow-500' : 'border-l-blue-500'
                    }`}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="mt-0.5">
                              {getNotificationIcon(notification)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {notification.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {getTimeAgo(notification.date)}
                                </p>
                              </div>
                              
                              <p className="text-sm text-gray-700 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              
                              {notification.details && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {notification.details}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between mt-2">
                                <Link
                                  to={notification.link}
                                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                                >
                                  Ver detalhes
                                  <ExternalLink className="h-3 w-3 ml-1" />
                                </Link>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    dismissNotification(notification.id);
                                  }}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
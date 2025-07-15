import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, Task, User } from "@/api/entities";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Briefcase,
  ClipboardList,
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  ArrowRight
} from "lucide-react";

export default function MobileDashboard() {
  const [stats, setStats] = useState({
    activeProjects: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    completionRate: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [urgentTasks, setUrgentTasks] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [userData, projectsData, tasksData] = await Promise.all([
        User.me(),
        Project.list(),
        Task.list()
      ]);

      setCurrentUser(userData);

      // Filtrar dados do usuário
      const userTasks = tasksData.filter(task => task.assigned_to === userData.email);
      const userProjects = projectsData.filter(project => 
        project.responsible === userData.email || 
        project.participants?.includes(userData.email)
      );

      // Calcular estatísticas
      const activeProjects = userProjects.filter(p => p.status !== 'concluído').length;
      const pendingTasks = userTasks.filter(t => t.status === 'pendente' || t.status === 'em_andamento').length;
      const overdueTasks = userTasks.filter(t => 
        t.deadline && 
        new Date(t.deadline) < new Date() && 
        t.status !== 'concluída'
      ).length;
      const completedTasks = userTasks.filter(t => t.status === 'concluída').length;
      const completionRate = userTasks.length > 0 ? (completedTasks / userTasks.length) * 100 : 0;

      setStats({
        activeProjects,
        pendingTasks,
        overdueTasks,
        completionRate: Math.round(completionRate)
      });

      // Projetos recentes (limitado a 3 para mobile)
      setRecentProjects(userProjects.slice(0, 3));

      // Tarefas urgentes (limitado a 5 para mobile)
      const urgent = userTasks
        .filter(t => t.status !== 'concluída')
        .sort((a, b) => {
          if (a.priority === 'urgente' && b.priority !== 'urgente') return -1;
          if (b.priority === 'urgente' && a.priority !== 'urgente') return 1;
          if (a.deadline && b.deadline) {
            return new Date(a.deadline) - new Date(b.deadline);
          }
          return 0;
        })
        .slice(0, 5);
      
      setUrgentTasks(urgent);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgente': 'bg-red-100 text-red-800',
      'alta': 'bg-orange-100 text-orange-800',
      'média': 'bg-yellow-100 text-yellow-800',
      'baixa': 'bg-blue-100 text-blue-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 pb-20">
      {/* Welcome Header */}
      <div className="text-center py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Olá, {currentUser?.full_name?.split(' ')[0] || 'Usuário'}!
        </h1>
        <p className="text-gray-600 mt-1">Aqui está seu resumo de hoje</p>
      </div>

      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Projetos Ativos</p>
                  <p className="text-2xl font-bold text-blue-900">{stats.activeProjects}</p>
                </div>
                <Briefcase className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Tarefas Pendentes</p>
                  <p className="text-2xl font-bold text-orange-900">{stats.pendingTasks}</p>
                </div>
                <ClipboardList className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Atrasadas</p>
                  <p className="text-2xl font-bold text-red-900">{stats.overdueTasks}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Taxa Conclusão</p>
                  <p className="text-2xl font-bold text-green-900">{stats.completionRate}%</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Projects */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Projetos Recentes</CardTitle>
              <Link 
                to={createPageUrl("MobileProjects")}
                className="text-blue-600 text-sm font-medium flex items-center"
              >
                Ver todos <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.map((project) => (
              <Link 
                key={project.id}
                to={createPageUrl(`ProjectDetails?id=${project.id}`)}
                className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate flex-1">
                    {project.title}
                  </h3>
                  <Badge className="ml-2 capitalize">{project.status}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <Progress value={project.progress || 0} className="flex-1 mr-3" />
                  <span className="text-sm text-gray-600">{project.progress || 0}%</span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Urgent Tasks */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Tarefas Urgentes</CardTitle>
              <Link 
                to={createPageUrl("MobileTasks")}
                className="text-blue-600 text-sm font-medium flex items-center"
              >
                Ver todas <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {urgentTasks.map((task) => (
              <div key={task.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 text-sm flex-1">
                    {task.title}
                  </h3>
                  <Badge className={`ml-2 text-xs ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </Badge>
                </div>
                {task.deadline && (
                  <div className="flex items-center text-xs text-gray-600">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(task.deadline).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
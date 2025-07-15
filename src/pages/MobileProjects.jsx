import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, Task, User } from "@/api/entities";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Calendar,
  Users,
  Filter,
  ArrowRight
} from "lucide-react";

export default function MobileProjects() {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    // Filtrar projetos baseado na pesquisa
    const filtered = projects.filter(project =>
      project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProjects(filtered);
  }, [projects, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [userData, projectsData, tasksData] = await Promise.all([
        User.me(),
        Project.list(),
        Task.list()
      ]);

      setCurrentUser(userData);

      // Filtrar projetos do usuário
      const userProjects = projectsData.filter(project => 
        project.responsible === userData.email || 
        project.participants?.includes(userData.email)
      );

      // Calcular progresso para cada projeto
      const projectsWithProgress = userProjects.map(project => {
        const projectTasks = tasksData.filter(task => task.project_id === project.id);
        let calculatedProgress = 0;
        if (projectTasks.length > 0) {
          const completedTasks = projectTasks.filter(task => task.status === 'concluída').length;
          calculatedProgress = Math.round((completedTasks / projectTasks.length) * 100);
        }
        return { ...project, progress: calculatedProgress };
      });

      setProjects(projectsWithProgress);

    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'ambiente': 'bg-gray-100 text-gray-800',
      'poc': 'bg-blue-100 text-blue-800',
      'mvp': 'bg-purple-100 text-purple-800',
      'desenvolvimento': 'bg-orange-100 text-orange-800',
      'produção': 'bg-green-100 text-green-800',
      'concluído': 'bg-green-200 text-green-900'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgente': 'border-l-red-500',
      'alta': 'border-l-orange-500',
      'média': 'border-l-yellow-500',
      'baixa': 'border-l-blue-500'
    };
    return colors[priority] || 'border-l-gray-500';
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
        <h1 className="text-2xl font-bold text-gray-900">Meus Projetos</h1>
        <Badge variant="outline">{filteredProjects.length} projetos</Badge>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Buscar projetos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Projects List */}
      <motion.div className="space-y-4">
        {filteredProjects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)}>
              <Card className={`border-l-4 ${getPriorityColor(project.priority)} hover:shadow-md transition-shadow`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {project.title}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {project.description || "Sem descrição"}
                      </p>
                    </div>
                    <Badge className={`ml-2 ${getStatusColor(project.status)}`}>
                      {project.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Progress */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Progresso</span>
                      <span className="text-sm font-medium text-gray-900">
                        {project.progress || 0}%
                      </span>
                    </div>
                    <Progress value={project.progress || 0} className="h-2" />
                  </div>

                  {/* Info Row */}
                  <div className="flex items-center justify-between text-sm text-gray-600">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      <span>{project.participants?.length || 0} pessoas</span>
                    </div>
                    {project.deadline && (
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(project.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Participants Avatars */}
                  {project.participants && project.participants.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {project.participants.slice(0, 3).map((participant, i) => (
                        <Avatar key={i} className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {participant.split('@')[0].substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      {project.participants.length > 3 && (
                        <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-xs font-medium text-gray-600">
                            +{project.participants.length - 3}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {filteredProjects.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {searchQuery ? "Nenhum projeto encontrado." : "Você não tem projetos atribuídos."}
          </p>
        </div>
      )}
    </div>
  );
}
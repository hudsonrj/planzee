import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Home,
  ListTodo,
  Calendar,
  MessageSquare,
  FileText,
  User,
  Users,
  Clock,
  FileCheck,
  ArrowRight,
  Search
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function SearchResults({ results, onItemClick }) {
  if (!results || Object.keys(results).every(key => results[key].length === 0)) {
    return (
      <div className="py-6 text-center text-gray-500">
        <Search className="h-10 w-10 mx-auto mb-3 text-gray-400 opacity-50" />
        <p>Nenhum resultado encontrado.</p>
        <p className="text-sm">Tente buscar por outro termo.</p>
      </div>
    );
  }

  // Helper to truncate text
  const truncate = (text, length = 60) => {
    if (!text) return "";
    return text.length > length ? `${text.substring(0, length)}...` : text;
  };

  // Helper to format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (e) {
      return dateString;
    }
  };

  // Get icon for each entity type
  const getIcon = (type) => {
    switch (type) {
      case "projects":
        return <Home className="h-4 w-4 text-blue-600" />;
      case "tasks":
        return <ListTodo className="h-4 w-4 text-purple-600" />;
      case "meetings":
        return <Calendar className="h-4 w-4 text-green-600" />;
      case "notes":
        return <FileText className="h-4 w-4 text-amber-600" />;
      case "feedback":
        return <MessageSquare className="h-4 w-4 text-indigo-600" />;
      case "checklists":
        return <FileCheck className="h-4 w-4 text-teal-600" />;
      default:
        return <Search className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <ScrollArea className="h-[350px]">
      <div className="p-4">
        {results.projects && results.projects.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center mb-2">
              <Home className="h-4 w-4 mr-2 text-blue-600" />
              Projetos
            </h3>
            <div className="space-y-2">
              {results.projects.map((project) => (
                <Link 
                  key={project.id} 
                  to={createPageUrl(`ProjectDetails?id=${project.id}`)} 
                  className="block p-2 hover:bg-gray-50 rounded-md border border-gray-100"
                  onClick={() => onItemClick()}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-blue-700">{project.title}</h4>
                      <p className="text-xs text-gray-500 mt-1">{truncate(project.description)}</p>
                    </div>
                    <Badge className="text-xs">{project.status}</Badge>
                  </div>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Clock className="h-3 w-3 mr-1" />
                    <span>Prazo: {formatDate(project.deadline)}</span>
                    {project.responsible && (
                      <span className="ml-3 flex items-center">
                        <User className="h-3 w-3 mr-1" />
                        {project.responsible.split('@')[0].replace('.', ' ')}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {results.tasks && results.tasks.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center mb-2">
              <ListTodo className="h-4 w-4 mr-2 text-purple-600" />
              Tarefas
            </h3>
            <div className="space-y-2">
              {results.tasks.map((task) => (
                <Link 
                  key={task.id} 
                  to={createPageUrl(`Tasks`)} 
                  className="block p-2 hover:bg-gray-50 rounded-md border border-gray-100"
                  onClick={() => onItemClick()}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-purple-700">{task.title}</h4>
                    <Badge className="text-xs" variant={task.status === "concluída" ? "success" : (task.status === "em_andamento" ? "default" : "outline")}>
                      {task.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{truncate(task.description, 80)}</p>
                  {task.deadline && (
                    <div className="flex items-center text-xs text-gray-500 mt-2">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>Prazo: {formatDate(task.deadline)}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}

        {results.meetings && results.meetings.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-900 flex items-center mb-2">
              <Calendar className="h-4 w-4 mr-2 text-green-600" />
              Reuniões
            </h3>
            <div className="space-y-2">
              {results.meetings.map((meeting) => (
                <Link 
                  key={meeting.id} 
                  to={createPageUrl(`MeetingDetails?id=${meeting.id}`)} 
                  className="block p-2 hover:bg-gray-50 rounded-md border border-gray-100"
                  onClick={() => onItemClick()}
                >
                  <h4 className="font-medium text-green-700">{meeting.title}</h4>
                  <div className="flex items-center text-xs text-gray-500 mt-2">
                    <Calendar className="h-3 w-3 mr-1" />
                    <span>Data: {formatDate(meeting.date)}</span>
                    {meeting.attendees && meeting.attendees.length > 0 && (
                      <span className="ml-3 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {meeting.attendees.length} participante(s)
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Additional result sections could be added here */}

        <div className="pt-2 flex justify-center">
          <Link 
            to={createPageUrl("SearchResults")} 
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            onClick={() => onItemClick()}
          >
            Ver todos os resultados <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
      </div>
    </ScrollArea>
  );
}
import React, { useState, useEffect } from "react";
import { Project, Task, Meeting, Note, Feedback, Checklist } from "@/api/entities";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Search,
  Loader2,
  Home,
  ListTodo,
  Calendar,
  MessageSquare,
  FileText,
  FileCheck,
  Clock,
  User,
  Users,
  ArrowLeft
} from "lucide-react";
import { format } from "date-fns";

export default function SearchResultsPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [currentTab, setCurrentTab] = useState("all");
  
  // Get query parameters on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setSearchQuery(q);
      performSearch(q);
    }
  }, []);

  const performSearch = async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults({});
      return;
    }
    
    try {
      setIsSearching(true);
      
      const [projects, tasks, meetings, notes, feedbacks, checklists] = await Promise.all([
        Project.list(),
        Task.list(),
        Meeting.list(),
        Note.list(),
        Feedback.list(),
        Checklist.list()
      ]);
      
      const lowerQuery = query.toLowerCase();
      
      // Search in projects
      const filteredProjects = projects.filter(p => 
        p.title?.toLowerCase().includes(lowerQuery) || 
        p.description?.toLowerCase().includes(lowerQuery) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
      );
      
      // Search in tasks
      const filteredTasks = tasks.filter(t => 
        t.title?.toLowerCase().includes(lowerQuery) || 
        t.description?.toLowerCase().includes(lowerQuery)
      );
      
      // Search in meetings
      const filteredMeetings = meetings.filter(m => 
        m.title?.toLowerCase().includes(lowerQuery) || 
        m.notes?.toLowerCase().includes(lowerQuery)
      );
      
      // Search in notes
      const filteredNotes = notes.filter(n => 
        n.content?.toLowerCase().includes(lowerQuery)
      );
      
      // Search in feedbacks
      const filteredFeedbacks = feedbacks.filter(f => 
        f.content?.toLowerCase().includes(lowerQuery)
      );
      
      // Search in checklists
      const filteredChecklists = checklists.filter(c => 
        c.items?.some(item => item.description?.toLowerCase().includes(lowerQuery))
      );
      
      setSearchResults({
        projects: filteredProjects,
        tasks: filteredTasks,
        meetings: filteredMeetings,
        notes: filteredNotes,
        feedbacks: filteredFeedbacks,
        checklists: filteredChecklists
      });
      
      // Update URL with search query
      const url = new URL(window.location);
      url.searchParams.set("q", query);
      window.history.pushState({}, "", url);
      
    } catch (error) {
      console.error("Error performing search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };
  
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };
  
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      performSearch(searchQuery);
    }
  };
  
  // Get total results count
  const getTotalResults = () => {
    let total = 0;
    Object.values(searchResults).forEach(results => {
      total += results?.length || 0;
    });
    return total;
  };
  
  // Helper to truncate text
  const truncate = (text, length = 100) => {
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

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate(-1)}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <h1 className="text-2xl font-bold">Resultados da Pesquisa</h1>
        </div>
        
        <form onSubmit={handleSearch} className="flex max-w-2xl gap-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Pesquisar em todos os itens..."
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button type="submit" disabled={isSearching}>
            {isSearching ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Pesquisar
          </Button>
        </form>
        
        {!isSearching && searchQuery && (
          <p className="text-sm text-gray-600">
            {getTotalResults()} resultado(s) para "{searchQuery}"
          </p>
        )}
      </div>
      
      {isSearching ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Pesquisando...</span>
        </div>
      ) : searchQuery ? (
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">
              Todos ({getTotalResults()})
            </TabsTrigger>
            <TabsTrigger value="projects">
              Projetos ({searchResults.projects?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="tasks">
              Tarefas ({searchResults.tasks?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="meetings">
              Reuniões ({searchResults.meetings?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="notes">
              Notas ({searchResults.notes?.length || 0})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="space-y-4">
            {getTotalResults() === 0 ? (
              <div className="text-center py-6 bg-white rounded-lg shadow">
                <Search className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium">Nenhum resultado encontrado</h3>
                <p className="text-gray-500">Tente buscar por outro termo ou verifique a ortografia.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {/* Projects section */}
                {searchResults.projects?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Home className="h-5 w-5 mr-2 text-blue-600" />
                        Projetos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {searchResults.projects.map(project => (
                          <Link 
                            key={project.id} 
                            to={createPageUrl(`ProjectDetails?id=${project.id}`)}
                            className="block p-3 hover:bg-gray-50 rounded-md border border-gray-200"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium text-blue-700">{project.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{truncate(project.description)}</p>
                              </div>
                              <Badge>{project.status}</Badge>
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
                    </CardContent>
                  </Card>
                )}
                
                {/* Tasks section */}
                {searchResults.tasks?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <ListTodo className="h-5 w-5 mr-2 text-purple-600" />
                        Tarefas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {searchResults.tasks.map(task => (
                          <Link 
                            key={task.id} 
                            to={createPageUrl(`Tasks`)}
                            className="block p-3 hover:bg-gray-50 rounded-md border border-gray-200"
                          >
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-purple-700">{task.title}</h3>
                              <Badge variant={task.status === 'concluída' ? 'success' : 'outline'}>
                                {task.status.replace('_', ' ')}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{truncate(task.description)}</p>
                            {task.deadline && (
                              <div className="flex items-center text-xs text-gray-500 mt-2">
                                <Clock className="h-3 w-3 mr-1" />
                                <span>Prazo: {formatDate(task.deadline)}</span>
                              </div>
                            )}
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Meetings section */}
                {searchResults.meetings?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-green-600" />
                        Reuniões
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {searchResults.meetings.map(meeting => (
                          <Link 
                            key={meeting.id} 
                            to={createPageUrl(`MeetingDetails?id=${meeting.id}`)}
                            className="block p-3 hover:bg-gray-50 rounded-md border border-gray-200"
                          >
                            <h3 className="font-medium text-green-700">{meeting.title}</h3>
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
                    </CardContent>
                  </Card>
                )}
                
                {/* Notes section */}
                {searchResults.notes?.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center">
                        <FileText className="h-5 w-5 mr-2 text-amber-600" />
                        Notas
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {searchResults.notes.map(note => {
                          let href = "#";
                          if (note.type === "project") {
                            href = createPageUrl(`ProjectDetails?id=${note.item_id}`);
                          } else if (note.type === "task") {
                            href = createPageUrl(`Tasks`);
                          }
                          
                          return (
                            <Link 
                              key={note.id} 
                              to={href}
                              className="block p-3 hover:bg-gray-50 rounded-md border border-gray-200"
                            >
                              <p className="text-sm text-gray-600">{truncate(note.content, 200)}</p>
                              <div className="flex items-center text-xs text-gray-500 mt-2">
                                <User className="h-3 w-3 mr-1" />
                                <span>{note.author.split('@')[0].replace('.', ' ')}</span>
                                <span className="ml-3">
                                  {formatDate(note.created_date)}
                                </span>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>
          
          {/* Individual tabs for each type - just showing projects as example */}
          <TabsContent value="projects">
            {searchResults.projects?.length === 0 ? (
              <div className="text-center py-6 bg-white rounded-lg shadow">
                <Home className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <h3 className="text-lg font-medium">Nenhum projeto encontrado</h3>
                <p className="text-gray-500">Tente buscar por outro termo.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {searchResults.projects?.map(project => (
                  // Same as the project cards above
                  <Link 
                    key={project.id} 
                    to={createPageUrl(`ProjectDetails?id=${project.id}`)}
                    className="block p-4 hover:bg-gray-50 rounded-md border border-gray-200 bg-white"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-blue-700">{project.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{truncate(project.description)}</p>
                      </div>
                      <Badge>{project.status}</Badge>
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
            )}
          </TabsContent>
          
          {/* Similar tabs for tasks, meetings, etc. */}
        </Tabs>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Search className="h-16 w-16 mx-auto mb-3 text-gray-200" />
          <h2 className="text-xl font-medium mb-2">Pesquise em todos os itens</h2>
          <p className="text-gray-500 max-w-md mx-auto">
            Digite sua consulta na caixa de pesquisa acima para encontrar projetos, tarefas, reuniões e muito mais.
          </p>
        </div>
      )}
    </div>
  );
}
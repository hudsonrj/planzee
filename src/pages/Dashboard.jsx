
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, Task, Meeting, User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations"; // Import InvokeLLM
import { motion } from "framer-motion";
import {
  Briefcase,
  ClipboardList,
  Calendar,
  Users,
  LineChart,
  Plus,
  ArrowRight,
  AlertTriangle,
  Clock,
  Sparkles
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { filterProjectsByUserAccess, hasExecutivePermission } from "@/components/permissions/PermissionUtils";
import WordCloud from "../components/dashboard/WordCloud";
import WeatherCard from "../components/dashboard/WeatherCard"; // New component import

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function Dashboard() {
  const [stats, setStats] = useState({ activeProjects: 0, pendingTasks: 0, overdueTasks: 0, upcomingMeetings: 0 });
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]); // New state for all relevant tasks
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [wordCloudData, setWordCloudData] = useState([]); // New state for word cloud data
  const [weatherData, setWeatherData] = useState(null); // New state for weather

  useEffect(() => {
    loadData();
    loadWeatherData(); // Load weather data on mount
  }, []);

  useEffect(() => {
    // Process word data whenever projects or tasks change
    if (projects.length > 0 || tasks.length > 0) {
      processWordData();
    }
  }, [projects, tasks]);
  
  const loadWeatherData = async () => {
    try {
        // Primeiro tenta obter localização do usuário
        let cityPrompt = "São Paulo, Brasil"; // Fallback padrão
        
        if (navigator.geolocation) {
            try {
                const position = await new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, {
                        timeout: 5000,
                        enableHighAccuracy: false
                    });
                });
                
                // Usa coordenadas para obter cidade via IA
                const locationPrompt = `
                Baseado nas coordenadas latitude ${position.coords.latitude} e longitude ${position.coords.longitude}, 
                identifique qual é a cidade e estado/país correspondente. 
                Retorne apenas o nome da cidade seguido do estado/país no formato "Cidade, Estado/País".
                `;
                
                const locationResponse = await InvokeLLM({
                    prompt: locationPrompt,
                    add_context_from_internet: true
                });
                
                if (typeof locationResponse === 'string' && locationResponse.trim()) {
                    cityPrompt = locationResponse.trim();
                }
            } catch (geoError) {
                console.log("Geolocalização não disponível ou permissão negada. Usando São Paulo como padrão.", geoError);
            }
        }

        const weatherPrompt = `
        Forneça o clima atual e a previsão para os próximos 5 dias para ${cityPrompt}.
        - O dia da semana da previsão deve estar em português e abreviado (ex: 'Seg', 'Ter', 'Qua', 'Qui', 'Sex').
        - O ícone da condição deve ser uma palavra única em inglês (ex: 'Clear', 'Clouds', 'Rain', 'Thunderstorm', 'Snow', 'Mist').
        - A condição atual deve estar em português.
        Retorne os dados em formato JSON com informações precisas e atuais.
        `;

        const weatherSchema = {
            type: "object",
            properties: {
                current: {
                    type: "object",
                    properties: {
                        temp: { type: "number" },
                        condition: { type: "string" },
                        icon: { type: "string" },
                        city: { type: "string" }
                    },
                    required: ["temp", "condition", "icon", "city"]
                },
                forecast: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            day: { type: "string" },
                            temp_max: { type: "number" },
                            temp_min: { type: "number" },
                            icon: { type: "string" }
                        },
                        required: ["day", "temp_max", "temp_min", "icon"]
                    }
                }
            },
            required: ["current", "forecast"]
        };
        
        const data = await InvokeLLM({
            prompt: weatherPrompt,
            response_json_schema: weatherSchema,
            add_context_from_internet: true
        });

        setWeatherData(data);

    } catch (error) {
        console.error("Erro ao carregar dados do clima:", error);
        // Fallback com dados mock para demonstração
        setWeatherData({
            current: {
                temp: 25,
                condition: "Ensolarado",
                icon: "Clear",
                city: "São Paulo, SP"
            },
            forecast: [
                { day: "Seg", temp_max: 28, temp_min: 18, icon: "Clear" },
                { day: "Ter", temp_max: 26, temp_min: 19, icon: "Clouds" },
                { day: "Qua", temp_max: 23, temp_min: 17, icon: "Rain" },
                { day: "Qui", temp_max: 25, temp_min: 18, icon: "Clear" },
                { day: "Sex", temp_max: 27, temp_min: 20, icon: "Clear" }
            ]
        });
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);

      const [allProjectData, allTaskData, allMeetingData, allUserData] = await Promise.all([
        Project.list(),
        Task.list(),
        Meeting.list(),
        User.list()
      ]);

      let currentLoggedInUser = null;
      try {
        const currentUserData = await User.me();
        setCurrentUser(currentUserData);
        currentLoggedInUser = currentUserData;
      } catch (err) {
        console.error("Error loading current user:", err);
      }

      let projectsAfterPermission = allProjectData;
      let tasksAfterPermission = allTaskData;

      if (currentLoggedInUser) {
        projectsAfterPermission = filterProjectsByUserAccess(
          allProjectData,
          allTaskData,
          currentLoggedInUser.email,
          currentLoggedInUser.position
        );

        tasksAfterPermission = hasExecutivePermission(currentLoggedInUser.position, 'canViewAllTasks')
          ? allTaskData
          : allTaskData.filter(task => task.assigned_to === currentLoggedInUser.email);
      }

      setUsers(allUserData);
      setTasks(tasksAfterPermission); // Set tasks for word cloud processing

      const todayString = new Date().toISOString().split('T')[0];
      const today = new Date(todayString);

      const activeProjectsData = projectsAfterPermission.filter(p => p.status !== "concluído");
      const pendingTasksData = tasksAfterPermission.filter(t => t.status === "pendente" || t.status === "to_do" || t.status === "in_progress");
      const lateTasksData = tasksAfterPermission.filter(t =>
        t.deadline &&
        new Date(t.deadline) < today &&
        (t.status === "pendente" || t.status === "to_do" || t.status === "in_progress")
      );
      const upcomingMeetingsData = allMeetingData
        .filter(m => m.date && new Date(m.date) >= today)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setStats({
        activeProjects: activeProjectsData.length,
        pendingTasks: pendingTasksData.length,
        overdueTasks: lateTasksData.length,
        upcomingMeetings: upcomingMeetingsData.length,
      });

      setProjects(activeProjectsData);
      setOverdueTasks(lateTasksData);
      setUpcomingMeetings(upcomingMeetingsData);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const processWordData = () => {
    const stopWords = new Set([
      'a', 'o', 'e', 'ou', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'um', 'uma',
      'com', 'por', 'para', 'sem', 'sob', 'sobre', 'que', 'se', 'ser', 'ter', 'ir', 'estar', 'seu',
      'sua', 'meu', 'minha', 'este', 'esse', 'aquele', 'aquela', 'isto', 'isso', 'aquilo', 'mas',
      'nem', 'ou', 'pois', 'portanto', 'porque', 'quando', 'quanto', 'como', 'onde', 'qual', 'quem',
      'enquanto', 'logo', 'sao', 'pelo', 'pela', 'as', 'os', 'foi', 'for', 'era', 'é', 'à', 'só',
      'não', 'mais', 'muito', 'pouco', 'já', 'ainda', 'até', 'também', 'após', 'ante', 'desde', 'projeto',
      'tarefa', 'criar', 'desenvolver', 'implementar', 'sistema', 'plataforma', 'novo', 'nova', 'api',
      'comercial', 'equipe', 'equipes', 'cliente', 'clientes', 'negócio', 'negócios', 'gestão', 'gestao',
      'digital', 'produto', 'produção', 'producao', 'suporte', 'tecnologia', 'serviço', 'servicos', 'solução', 'solucoes',
      'melhoria', 'processo', 'processos', 'reunião', 'reuniao', 'planejamento', 'estratégia', 'estrategia',
      'desenvolvimento', 'acompanhamento', 'atendimento', 'marketing', 'vendas', 'financeiro', 'rh', 'dados', 'análise', 'analise',
      'gerenciamento', 'otimização', 'otimizacao', 'implantação', 'implantacao', 'manutenção', 'manutencao', 'pesquisa', 'relatório', 'relatorio'
    ]);

    let allText = '';
    projects.forEach(p => { allText += ` ${p.title} ${p.title} ${p.description || ''}`; }); // Boost title weight
    tasks.forEach(t => { allText += ` ${t.title} ${t.description || ''}`; });

    // Normalize text: lowercase, remove punctuation, split by whitespace
    // Added 'à-ú' to regex to include Portuguese accented characters
    const words = allText.toLowerCase().replace(/[^\w\sà-ú]/g, '').split(/\s+/);
    
    const wordCounts = {};
    words.forEach(word => {
        if (word && !stopWords.has(word) && word.length > 3) { // Filter out short words and stop words
            wordCounts[word] = (wordCounts[word] || 0) + 1;
        }
    });

    const sortedWords = Object.entries(wordCounts)
        .sort(([, a], [, b]) => b - a) // Sort by count in descending order
        .slice(0, 40) // Limit to top 40 words
        .map(([text, value]) => ({ text, value }));

    setWordCloudData(sortedWords);
  };
  
  const getUserName = (email) => {
    const user = users.find(u => u.email === email);
    if (user && user.full_name) {
      return user.full_name;
    }
    if (email) {
      const namePart = email.split('@')[0];
      return namePart.split('.').map(part =>
        part.charAt(0).toUpperCase() + part.slice(1)
      ).join(' ');
    }
    return "Usuário";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-112px)]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Bem-vindo(a), {currentUser?.full_name || 'Usuário'}!</h1>
          <p className="text-gray-500 mt-1">Aqui está um resumo das suas atividades e projetos.</p>
        </div>
        <div className="flex gap-2">
          <Link to={createPageUrl("NewProject")}>
            <Button className="yellow-glow"><Plus className="h-4 w-4 mr-2" /> Novo Projeto</Button>
          </Link>
          <Link to={createPageUrl("Tasks")}>
            <Button variant="outline" className="yellow-glow"><Plus className="h-4 w-4 mr-2" /> Nova Tarefa</Button>
          </Link>
        </div>
      </div>

      {/* Resumo Geral - Summary Cards */}
      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {[
          {
            title: "Projetos Ativos", value: stats.activeProjects, icon: <Briefcase className="h-6 w-6 text-blue-500" />,
            color: "from-blue-50 to-blue-100", link: createPageUrl("Projects")
          },
          {
            title: "Tarefas Pendentes", value: stats.pendingTasks, icon: <ClipboardList className="h-6 w-6 text-orange-500" />,
            color: "from-orange-50 to-orange-100", link: createPageUrl("Tasks")
          },
          {
            title: "Tarefas Atrasadas", value: stats.overdueTasks, icon: <AlertTriangle className="h-6 w-6 text-red-500" />,
            color: "from-red-50 to-red-100", link: createPageUrl("Tasks")
          },
          {
            title: "Próximas Reuniões", value: stats.upcomingMeetings, icon: <Calendar className="h-6 w-6 text-green-500" />,
            color: "from-green-50 to-green-100", link: createPageUrl("Meetings")
          },
        ].map(item => (
          <motion.div key={item.title} variants={itemVariants}>
            <Card className="card-hover-effect overflow-hidden transition-all duration-300 yellow-glow">
              <CardHeader className={`flex flex-row items-center justify-between space-y-0 pb-2 p-4 rounded-t-lg bg-gradient-to-tr ${item.color}`}>
                <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                {item.icon}
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="text-2xl font-bold">{item.value}</div>
                <Link to={item.link} className="text-xs text-muted-foreground flex items-center hover:underline hover:text-[#FFC700]">
                  Ver detalhes <ArrowRight className="inline h-3 w-3 ml-1" />
                </Link>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Nuvem de Palavras */}
        <motion.div variants={itemVariants}>
            <Card className="planzee-card yellow-glow h-full">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-yellow-500 yellow-pulse" />
                        Palavras-Chave em Destaque
                    </CardTitle>
                    <CardDescription>Termos técnicos mais frequentes nos seus projetos e tarefas.</CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                    <WordCloud data={wordCloudData} />
                </CardContent>
            </Card>
        </motion.div>

        {/* Card de Clima */}
        <motion.div variants={itemVariants}>
            <WeatherCard weather={weatherData} />
        </motion.div>
      </div>


      {/* Main Content Grid: Project Progress & Alert Lists */}
      <div className="grid gap-8 md:grid-cols-3">
        {/* Progresso dos Projetos */}
        <motion.div className="md:col-span-2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Progresso dos Projetos Ativos</CardTitle>
              <CardDescription>Acompanhe o andamento dos seus projetos ativos.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {projects.length > 0 ? (
                <div className="space-y-4">
                  {projects.slice(0, 5).map(project => (
                    <Link to={createPageUrl(`ProjectDetails?id=${project.id}`)} key={project.id} className="block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm">{project.title}</span>
                        <span className="text-xs text-gray-500">{project.progress || 0}%</span>
                      </div>
                      <Progress value={project.progress || 0} className="h-2" />
                      <div className="flex justify-between items-center mt-1 text-xs text-gray-400">
                        <span>Resp: {getUserName(project.responsible)}</span>
                        <span>Prazo: {project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </Link>
                  ))}
                  {projects.length > 5 && (
                    <Link to={createPageUrl("Projects")} className="block text-center text-sm text-blue-600 hover:underline mt-2">
                      Ver todos os {projects.length} projetos
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  Nenhum projeto ativo no momento.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Listas de Alerta */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Atenção</CardTitle>
              <CardDescription>Itens que requerem sua atenção imediata.</CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-red-600 flex items-center"><AlertTriangle className="h-4 w-4 mr-2" /> Tarefas Atrasadas</h4>
                {overdueTasks.length > 0 ? (
                  <ul className="space-y-1 text-xs">
                    {overdueTasks.slice(0, 4).map(task => (
                      <li key={task.id} className="truncate p-1 hover:bg-red-50 rounded">
                        <Link to={createPageUrl(`TaskDetails?id=${task.id}`)} className="text-gray-700 hover:text-red-700">
                          {task.title} - <span className="font-medium">Vencida em: {new Date(task.deadline).toLocaleDateString()}</span>
                        </Link>
                      </li>
                    ))}
                    {overdueTasks.length > 4 && (
                      <li className="text-center mt-2">
                        <Link to={createPageUrl("Tasks")} className="text-blue-600 hover:underline">Ver todas ({overdueTasks.length})</Link>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs">Nenhuma tarefa atrasada. Bom trabalho!</p>
                )}
              </div>
              <hr className="my-4" />
              <div>
                <h4 className="font-semibold text-sm mb-2 text-blue-600 flex items-center"><Clock className="h-4 w-4 mr-2" /> Próximas Reuniões</h4>
                {upcomingMeetings.length > 0 ? (
                  <ul className="space-y-1 text-xs">
                    {upcomingMeetings.slice(0, 4).map(meeting => (
                      <li key={meeting.id} className="truncate p-1 hover:bg-blue-50 rounded">
                        <Link to={createPageUrl(`MeetingDetails?id=${meeting.id}`)} className="text-gray-700 hover:text-blue-700">
                          {meeting.title} - {new Date(meeting.date).toLocaleDateString()} {meeting.time}
                        </Link>
                      </li>
                    ))}
                    {upcomingMeetings.length > 4 && (
                      <li className="text-center mt-2">
                        <Link to={createPageUrl("Meetings")} className="text-blue-600 hover:underline">Ver todas ({upcomingMeetings.length})</Link>
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="text-gray-500 text-xs">Nenhuma reunião agendada.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Atalhos de Navegação */}
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Atalhos de Navegação</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Projetos</h3>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl("Projects")} className="text-blue-600 hover:underline flex items-center text-sm">
                  <Briefcase className="h-4 w-4 mr-2" />
                  Visualizar Projetos
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("NewProject")} className="text-blue-600 hover:underline flex items-center text-sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Projeto
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("Timeline")} className="text-blue-600 hover:underline flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Timeline
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Tarefas</h3>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl("Tasks")} className="text-blue-600 hover:underline flex items-center text-sm">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Todas as Tarefas
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("Tasks")} className="text-blue-600 hover:underline flex items-center text-sm">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Tarefas Pendentes
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Reuniões</h3>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl("Meetings")} className="text-blue-600 hover:underline flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2" />
                  Ver Reuniões
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("Calendar")} className="text-blue-600 hover:underline flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2" />
                  Calendário
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">Relatórios</h3>
            <ul className="space-y-2">
              <li>
                <Link to={createPageUrl("Analytics")} className="text-blue-600 hover:underline flex items-center text-sm">
                  <LineChart className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </li>
              <li>
                <Link to={createPageUrl("ClientReport")} className="text-blue-600 hover:underline flex items-center text-sm">
                  <LineChart className="h-4 w-4 mr-2" />
                  Relatórios
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

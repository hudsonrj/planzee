
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Task, Project, User } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import {
  MessageCircle,
  X,
  ChevronUp,
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  TrendingUp,
  Target,
  Star,
  Send,
  Loader2,
  Zap,
  Award,
  BookOpen,
  ArrowRight
} from "lucide-react";
import { format, isAfter, isBefore, differenceInDays } from "date-fns";

export default function PlanzeeMe() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userTasks, setUserTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [userScore, setUserScore] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("tasks"); // "tasks", "score", "chat"
  const inputRef = useRef(null); // Ref para o textarea

  const chatSuggestions = [
    "Me ajude a escrever...",
    "Me ajude a responder...",
    "Me explique o que é...",
    "Me diga como fazer..."
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);

      const [allTasks, allProjects] = await Promise.all([
        Task.list(),
        Project.list()
      ]);

      // Filtrar tarefas do usuário
      const myTasks = allTasks.filter(task => 
        task.assigned_to === userData.email && 
        (task.status === 'pendente' || task.status === 'em_andamento')
      );

      // Ordenar por urgência e deadline
      const sortedTasks = myTasks.sort((a, b) => {
        // Primeiro por status (em_andamento primeiro)
        if (a.status !== b.status) {
          return a.status === 'em_andamento' ? -1 : 1;
        }

        // Depois por prioridade
        const priorityOrder = { 'urgente': 0, 'alta': 1, 'média': 2, 'baixa': 3 };
        const aPriority = priorityOrder[a.priority] || 3;
        const bPriority = priorityOrder[b.priority] || 3;
        
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }

        // Por último por deadline
        if (a.deadline && b.deadline) {
          return new Date(a.deadline) - new Date(b.deadline);
        }
        return a.deadline ? -1 : 1;
      });

      setUserTasks(sortedTasks);
      setProjects(allProjects);

      // Calcular score do usuário
      await calculateUserScore(myTasks, allTasks.filter(t => t.assigned_to === userData.email));

    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
    }
  };

  const calculateUserScore = async (activeTasks, allUserTasks) => {
    try {
      const completedTasks = allUserTasks.filter(t => t.status === 'concluída');
      const overdueTasks = activeTasks.filter(t => 
        t.deadline && isAfter(new Date(), new Date(t.deadline))
      );

      const totalTasks = allUserTasks.length;
      const completionRate = totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0;
      const overdueRate = activeTasks.length > 0 ? (overdueTasks.length / activeTasks.length) * 100 : 0;

      // Calcular pontuação (0-100)
      let score = 50; // Base
      score += completionRate * 0.3; // 30% da nota pela taxa de conclusão
      score -= overdueRate * 0.4; // 40% de penalidade por atrasos
      
      // Bonus por consistência (tarefas concluídas recentemente)
      const recentlyCompleted = completedTasks.filter(t => 
        t.completion_date && 
        differenceInDays(new Date(), new Date(t.completion_date)) <= 7
      ).length;
      score += recentlyCompleted * 2;

      score = Math.max(0, Math.min(100, score)); // Limitar entre 0-100

      const prompt = `
        Analise a performance do usuário ${currentUser?.full_name}:
        - Tarefas totais: ${totalTasks}
        - Tarefas concluídas: ${completedTasks.length}
        - Taxa de conclusão: ${completionRate.toFixed(1)}%
        - Tarefas atrasadas: ${overdueTasks.length}
        - Score calculado: ${score.toFixed(0)}

        Forneça:
        1. Uma avaliação motivadora da performance
        2. 3 dicas específicas para melhorar
        3. Uma mensagem de encorajamento personalizada
        
        Seja positivo, motivador e específico. Fale diretamente com o usuário.
      `;

      const analysis = await InvokeLLM({ prompt });

      setUserScore({
        score: Math.round(score),
        completionRate: Math.round(completionRate),
        totalTasks,
        completedTasks: completedTasks.length,
        overdueTasks: overdueTasks.length,
        analysis
      });

    } catch (error) {
      console.error("Erro ao calcular score:", error);
    }
  };

  const getTaskAdvice = async (task) => {
    try {
      const project = projects.find(p => p.id === task.project_id);
      
      const prompt = `
        Como especialista em produtividade, dê conselhos específicos para esta tarefa:
        
        Tarefa: ${task.title}
        Descrição: ${task.description || 'Não informada'}
        Projeto: ${project?.title || 'Não informado'}
        Prioridade: ${task.priority}
        Deadline: ${task.deadline ? format(new Date(task.deadline), 'dd/MM/yyyy') : 'Não definido'}
        Status: ${task.status}
        
        Forneça:
        1. Uma estratégia clara para completar a tarefa
        2. Passos específicos e acionáveis
        3. Dicas para manter o foco
        4. Como priorizar se há conflitos
        
        Seja conciso, prático e motivador. Limite a 150 palavras.
      `;

      const advice = await InvokeLLM({ prompt });
      return advice;

    } catch (error) {
      console.error("Erro ao gerar conselho:", error);
      return "Foque em quebrar a tarefa em partes menores e estabeleça metas intermediárias. Você consegue!";
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMsg = {
      type: "user",
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setLoading(true);

    try {
      const prompt = `
        Você é PlanzeeMe, assistente pessoal de produtividade do usuário ${currentUser?.full_name}.
        
        Contexto do usuário:
        - Tarefas ativas: ${userTasks.length}
        - Score atual: ${userScore?.score || 'Calculando...'}
        - Performance: ${userScore?.completionRate || 0}% de conclusão
        
        Pergunta do usuário: "${inputMessage}"
        
        Responda como um coach pessoal motivador e prestativo. Seja específico, 
        prático e sempre termine com encorajamento. Se for sobre tarefas específicas,
        dê conselhos acionáveis. Se for sobre motivação, seja inspirador.
        
        Limite a resposta a 200 palavras e seja direto ao ponto.
      `;

      const response = await InvokeLLM({ prompt });

      const assistantMsg = {
        type: "assistant",
        content: response,
        timestamp: new Date().toISOString()
      };

      setChatMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error("Erro no chat:", error);
      const errorMsg = {
        type: "assistant",
        content: "Desculpe, tive um problema técnico. Mas lembre-se: você é capaz de superar qualquer desafio! 💪",
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgente': 'bg-red-500 text-white',
      'alta': 'bg-orange-500 text-white',
      'média': 'bg-yellow-500 text-black',
      'baixa': 'bg-green-500 text-white'
    };
    return colors[priority] || colors['média'];
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const isTaskOverdue = (deadline) => {
    return deadline && isAfter(new Date(), new Date(deadline));
  };

  if (!currentUser) return null;

  return (
    <>
      {/* Botão Flutuante */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg relative"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" />
                <AvatarFallback>PM</AvatarFallback>
              </Avatar>
              
              {userTasks.length > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="absolute -top-1 -right-1 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold"
                >
                  {userTasks.length}
                </motion.div>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget Principal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0, x: 100, y: 100 }}
            animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ scale: 0, opacity: 0, x: 100, y: 100 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Card className={`w-96 shadow-2xl border-purple-200 ${isMinimized ? 'h-16' : 'h-[500px]'} transition-all duration-300`}>
              {/* Header */}
              <CardHeader className="pb-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" />
                      <AvatarFallback>PM</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-sm">PlanzeeMe</CardTitle>
                      <p className="text-xs opacity-90">Seu assistente pessoal</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-white/20"
                      onClick={() => setIsMinimized(!isMinimized)}
                    >
                      {isMinimized ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-white hover:bg-white/20"
                      onClick={() => setIsOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {/* Content */}
              {!isMinimized && (
                <CardContent className="p-0 h-[calc(100%-80px)] flex flex-col">
                  {/* Tabs */}
                  <div className="flex border-b bg-white">
                    <Button
                      variant={activeTab === "tasks" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1 rounded-none h-10"
                      onClick={() => setActiveTab("tasks")}
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Tarefas
                    </Button>
                    <Button
                      variant={activeTab === "score" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1 rounded-none h-10"
                      onClick={() => setActiveTab("score")}
                    >
                      <Award className="h-4 w-4 mr-1" />
                      Score
                    </Button>
                    <Button
                      variant={activeTab === "chat" ? "default" : "ghost"}
                      size="sm"
                      className="flex-1 rounded-none h-10"
                      onClick={() => setActiveTab("chat")}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Chat
                    </Button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden bg-gray-50">
                    {activeTab === "tasks" && (
                      <div className="h-full overflow-y-auto">
                        <div className="p-4">
                          <h3 className="font-semibold mb-3 flex items-center gap-2 text-gray-800">
                            <Target className="h-4 w-4" />
                            Suas Tarefas Prioritárias
                          </h3>
                        </div>
                        
                        {userTasks.length === 0 ? (
                          <div className="text-center py-8 px-4">
                            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Parabéns! Você está em dia com suas tarefas! 🎉</p>
                          </div>
                        ) : (
                          <div className="px-4 pb-4 space-y-3">
                            {userTasks.slice(0, 5).map((task) => (
                              <TaskItem
                                key={task.id}
                                task={task}
                                project={projects.find(p => p.id === task.project_id)}
                                onGetAdvice={getTaskAdvice}
                              />
                            ))}
                            {userTasks.length > 5 && (
                              <p className="text-xs text-gray-500 text-center pt-2">
                                +{userTasks.length - 5} tarefas adicionais
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === "score" && userScore && (
                      <div className="h-full overflow-y-auto">
                        <div className="p-4">
                          <div className="text-center mb-4">
                            <div className={`text-4xl font-bold ${getScoreColor(userScore.score)} mb-2`}>
                              {userScore.score}
                              <span className="text-lg text-gray-500">/100</span>
                            </div>
                            <p className="text-sm text-gray-600">Seu Score de Performance</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between text-sm mb-2">
                                <span className="text-gray-700">Taxa de Conclusão</span>
                                <span className="font-semibold">{userScore.completionRate}%</span>
                              </div>
                              <Progress value={userScore.completionRate} className="h-2" />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                                <div className="font-bold text-green-600 text-lg">{userScore.completedTasks}</div>
                                <div className="text-green-700 text-xs">Concluídas</div>
                              </div>
                              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                                <div className="font-bold text-red-600 text-lg">{userScore.overdueTasks}</div>
                                <div className="text-red-700 text-xs">Atrasadas</div>
                              </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                              <div className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                Análise IA
                              </div>
                              <div className="text-blue-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {userScore.analysis}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "chat" && (
                      <div className="h-full flex flex-col">
                        <div className="flex-1 overflow-y-auto">
                          <div className="p-4 space-y-3">
                            {chatMessages.length === 0 ? (
                              <div className="text-center py-8">
                                <MessageCircle className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                                <p className="text-sm text-gray-800 font-medium mb-1">
                                  Olá, {currentUser.full_name?.split(' ')[0]}!
                                </p>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  Precisa de ajuda com alguma tarefa ou tem dúvidas sobre produtividade?
                                </p>
                              </div>
                            ) : (
                              chatMessages.map((msg, index) => (
                                <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} mb-3`}>
                                  <div className={`max-w-[85%] p-3 rounded-lg text-sm leading-relaxed ${
                                    msg.type === 'user' 
                                      ? 'bg-purple-500 text-white rounded-br-sm' 
                                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-sm'
                                  }`}>
                                    <div className="whitespace-pre-wrap">{msg.content}</div>
                                    <div className={`text-xs mt-2 opacity-70 ${
                                      msg.type === 'user' ? 'text-purple-100' : 'text-gray-500'
                                    }`}>
                                      {new Date(msg.timestamp).toLocaleTimeString([], { 
                                        hour: '2-digit', 
                                        minute: '2-digit' 
                                      })}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                            {loading && (
                              <div className="flex justify-start mb-3">
                                <div className="bg-white border border-gray-200 p-3 rounded-lg rounded-bl-sm shadow-sm">
                                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="p-3 border-t bg-white">
                          <div className="mb-2 flex flex-wrap gap-2">
                            {chatSuggestions.map((suggestion) => (
                              <Button
                                key={suggestion}
                                variant="outline"
                                size="sm"
                                className="text-xs text-gray-600 hover:bg-purple-50 rounded-full"
                                onClick={() => {
                                  setInputMessage(suggestion + " ");
                                  inputRef.current?.focus();
                                }}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                          <div className="flex gap-2">
                            <Textarea
                              ref={inputRef}
                              placeholder="Digite sua dúvida..."
                              value={inputMessage}
                              onChange={(e) => setInputMessage(e.target.value)}
                              className="text-sm resize-none border-gray-300 focus:border-purple-400"
                              rows={2}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  handleSendMessage();
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              onClick={handleSendMessage}
                              disabled={loading || !inputMessage.trim()}
                              className="bg-purple-500 hover:bg-purple-600 px-3"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Componente para cada item de tarefa
function TaskItem({ task, project, onGetAdvice }) {
  const [showAdvice, setShowAdvice] = useState(false);
  const [advice, setAdvice] = useState("");
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const handleGetAdvice = async () => {
    if (showAdvice) {
      setShowAdvice(false);
      return;
    }

    setLoadingAdvice(true);
    try {
      const taskAdvice = await onGetAdvice(task);
      setAdvice(taskAdvice);
      setShowAdvice(true);
    } catch (error) {
      console.error("Erro ao obter conselho:", error);
    } finally {
      setLoadingAdvice(false);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'urgente': 'bg-red-500 text-white',
      'alta': 'bg-orange-500 text-white',
      'média': 'bg-yellow-500 text-black',
      'baixa': 'bg-green-500 text-white'
    };
    return colors[priority] || colors['média'];
  };

  const isOverdue = task.deadline && isAfter(new Date(), new Date(task.deadline));

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-sm text-gray-800 truncate pr-2">{task.title}</h4>
            {isOverdue && <AlertTriangle className="h-3 w-3 text-red-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <Badge className={`${getPriorityColor(task.priority)} text-xs px-2 py-0.5`}>
              {task.priority}
            </Badge>
            {project && (
              <span className="text-gray-500 truncate">{project.title}</span>
            )}
          </div>
          {task.deadline && (
            <div className={`text-xs mt-2 flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
              <Clock className="h-3 w-3" />
              <span>{format(new Date(task.deadline), 'dd/MM/yyyy')}</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0 flex-shrink-0 ml-2"
          onClick={handleGetAdvice}
          disabled={loadingAdvice}
        >
          {loadingAdvice ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Lightbulb className="h-4 w-4" />
          )}
        </Button>
      </div>

      <AnimatePresence>
        {showAdvice && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
          >
            <div className="flex items-start gap-2">
              <Zap className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-600" />
              <div className="text-xs text-blue-800 leading-relaxed">{advice}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

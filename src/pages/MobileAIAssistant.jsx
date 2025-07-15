import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InvokeLLM } from "@/api/integrations";
import { Project, Task, User } from "@/api/entities";
import {
  Send,
  Bot,
  User as UserIcon,
  Loader2,
  Lightbulb,
  Target,
  Clock,
  AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MobileAIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [contextData, setContextData] = useState(null);
  const messagesEndRef = useRef(null);

  const suggestions = [
    "Como está o progresso dos meus projetos?",
    "Quais tarefas estão atrasadas?",
    "Me dê dicas para melhorar minha produtividade",
    "Qual projeto precisa de mais atenção?"
  ];

  useEffect(() => {
    loadInitialData();
    // Mensagem de boas-vindas
    setMessages([{
      type: "assistant",
      content: "Olá! Sou a Gabih, sua assistente de projetos. Como posso ajudá-lo hoje?",
      timestamp: new Date()
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadInitialData = async () => {
    try {
      const [userData, projectsData, tasksData] = await Promise.all([
        User.me(),
        Project.list(),
        Task.list()
      ]);

      setCurrentUser(userData);

      // Filtrar dados do usuário
      const userProjects = projectsData.filter(project =>
        project.responsible === userData.email ||
        project.participants?.includes(userData.email)
      );

      const userTasks = tasksData.filter(task =>
        task.assigned_to === userData.email
      );

      setContextData({
        projects: userProjects,
        tasks: userTasks,
        user: userData
      });

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      type: "user",
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      const prompt = `
        Você é Gabih, uma assistente de projetos inteligente e amigável da plataforma Planzee.
        
        Dados do usuário atual:
        - Nome: ${currentUser?.full_name}
        - Email: ${currentUser?.email}
        - Cargo: ${currentUser?.position}
        
        Projetos do usuário (${contextData?.projects?.length || 0}):
        ${contextData?.projects?.map(p => `
          - ${p.title} (Status: ${p.status}, Progresso: ${p.progress || 0}%, Prazo: ${p.deadline || 'Não definido'})
        `).join('') || 'Nenhum projeto encontrado.'}
        
        Tarefas do usuário (${contextData?.tasks?.length || 0}):
        ${contextData?.tasks?.map(t => `
          - ${t.title} (Status: ${t.status}, Prioridade: ${t.priority}, Prazo: ${t.deadline || 'Não definido'})
        `).join('') || 'Nenhuma tarefa encontrada.'}
        
        Pergunta do usuário: ${inputMessage}
        
        Responda de forma clara, útil e amigável. Forneça insights específicos baseados nos dados do usuário.
        Seja proativa em sugerir melhorias e próximos passos. Use emojis quando apropriado para tornar a conversa mais amigável.
      `;

      const response = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false
      });

      const assistantMessage = {
        type: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      const errorMessage = {
        type: "assistant",
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputMessage(suggestion);
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" />
            <AvatarFallback>GA</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg font-bold">Gabih</h1>
            <p className="text-sm opacity-90">Sua assistente de projetos</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        <AnimatePresence>
          {messages.map((message, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <Avatar className="h-8 w-8 flex-shrink-0">
                  {message.type === 'user' ? (
                    <UserIcon className="h-4 w-4" />
                  ) : (
                    <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" />
                  )}
                  <AvatarFallback>
                    {message.type === 'user' ? 'EU' : 'GA'}
                  </AvatarFallback>
                </Avatar>
                
                <div className={`rounded-2xl p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-500 text-white ml-2' 
                    : 'bg-white text-gray-900 mr-2 shadow-sm'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className={`text-xs mt-1 opacity-70 ${
                    message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="flex gap-2 max-w-[85%]">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" />
                <AvatarFallback>GA</AvatarFallback>
              </Avatar>
              <div className="bg-white rounded-2xl p-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                  <span className="text-sm text-gray-600">Pensando...</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggestions */}
      {messages.length === 1 && (
        <div className="p-4 bg-white border-t">
          <p className="text-sm font-medium text-gray-700 mb-3">Sugestões:</p>
          <div className="grid grid-cols-1 gap-2">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleSuggestionClick(suggestion)}
                className="text-left justify-start h-auto p-3 whitespace-normal"
              >
                <Lightbulb className="h-4 w-4 mr-2 flex-shrink-0 text-purple-500" />
                <span className="text-sm">{suggestion}</span>
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <Textarea
            placeholder="Digite sua pergunta..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            className="resize-none border-gray-300 focus:border-purple-400"
            rows={2}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={loading || !inputMessage.trim()}
            className="bg-purple-500 hover:bg-purple-600 px-4"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
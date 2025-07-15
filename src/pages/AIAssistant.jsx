
import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, Project, Task, Meeting, Note, Checklist, Feedback, Infrastructure, User } from "@/api/entities"; // Ensure User is imported
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { InvokeLLM, SendEmail } from "@/api/integrations";
import {
  Send,
  Bot,
  Loader2,
  Calendar,
  CheckCircle2,
  FileText,
  Lightbulb,
  MessageSquare,
  Sparkles,
  History,
  Plus,
  Trash2,
  Edit2,
  MoreVertical,
  Bookmark,
  X,
  Archive
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { createPageUrl } from "@/utils";
import { Label } from "@/components/ui/label";
import { getCurrentDate, getFutureDate, adjustDateToFuture } from "@/components/project/ProjectUtils";
import { format } from "date-fns"; // Import format from date-fns

export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [suggestions] = useState([
    "Quais são os projetos em atraso?",
    "Crie uma nova tarefa para o projeto",
    "Agende uma reunião para amanhã",
    "Quais são as tarefas pendentes?",
    "Como está o progresso do projeto?",
    "Gere uma checklist para a fase MVP",
    "Crie um agente personalizado para mim"
  ]);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]); // New state for all users

  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(false);

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newChatName, setNewChatName] = useState("");

  const [createAgentDialogOpen, setCreateAgentDialogOpen] = useState(false);
  const [agentForm, setAgentForm] = useState({
    name: "",
    description: "",
    objectives: "",
    capabilities: []
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadData = async () => {
    try {
      const [projectData, userData, allUsersData] = await Promise.all([
        Project.list(),
        User.me(),
        User.list() // Fetch all users
      ]);

      setProjects(projectData);
      setUser(userData);
      setUsers(allUsersData); // Set all users

      await loadChatHistory();
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Erro ao carregar dados. Por favor, recarregue a página.");
    }
  };

  const loadChatHistory = async () => {
    try {
      const chatMessages = await ChatMessage.list("-created_date");
      
      // Agrupar mensagens por chat
      const chats = {};
      chatMessages.forEach(message => {
        const chatId = message.chat_id || 'default';
        if (!chats[chatId]) {
          chats[chatId] = {
            id: chatId,
            title: message.chat_title || 'Nova conversa',
            messages: [],
            created_date: message.created_date,
            updated_date: message.created_date
          };
        }

        if (new Date(message.created_date) > new Date(chats[chatId].updated_date)) {
          chats[chatId].updated_date = message.created_date;
        }

        chats[chatId].messages.push(message);
      });

      const chatsList = Object.values(chats).sort((a, b) =>
        new Date(b.updated_date) - new Date(a.updated_date)
      );

      setChatHistory(chatsList);

      if (chatsList.length > 0 && !currentChatId) {
        setCurrentChatId(chatsList[0].id);
        setMessages(chatsList[0].messages.sort((a, b) =>
          new Date(a.created_date) - new Date(b.created_date)
        ));
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const createNewChat = async () => {
    const chatId = `chat_${Date.now()}`;
    const newChat = {
      id: chatId,
      title: 'Nova conversa',
      messages: [],
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };

    setChatHistory(prev => [newChat, ...prev]);
    setCurrentChatId(chatId);
    setMessages([]);
    setSelectedProject(null);

    setShowHistorySidebar(false);
  };

  const loadChatById = (chatId) => {
    const chat = chatHistory.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);

      const sortedMessages = chat.messages.sort((a, b) =>
        new Date(a.created_date) - new Date(b.created_date)
      );

      setMessages(sortedMessages);

      const projectMessage = sortedMessages.find(m => m.project_id);
      if (projectMessage) {
        setSelectedProject(projectMessage.project_id);
      } else {
        setSelectedProject(null);
      }

      setShowHistorySidebar(false);
    }
  };

  const getChatTitle = () => {
    const chat = chatHistory.find(c => c.id === currentChatId);
    return chat?.title || 'Nova conversa';
  };

  const renameChat = async () => {
    if (!selectedChat || !newChatName.trim()) return;

    try {
      const chatMessages = chatHistory.find(c => c.id === selectedChat.id)?.messages || [];

      for (const message of chatMessages) {
        await ChatMessage.update(message.id, { chat_title: newChatName });
      }

      setChatHistory(prev => prev.map(chat =>
        chat.id === selectedChat.id
          ? { ...chat, title: newChatName }
          : chat
      ));

      setRenameDialogOpen(false);
      setNewChatName("");
    } catch (error) {
      console.error("Error renaming chat:", error);
      setError("Erro ao renomear conversa. Tente novamente.");
    }
  };

  const deleteChat = async () => {
    if (!selectedChat) return;

    try {
      const chatMessages = chatHistory.find(c => c.id === selectedChat.id)?.messages || [];

      for (const message of chatMessages) {
        await ChatMessage.delete(message.id);
      }

      setChatHistory(prev => prev.filter(chat => chat.id !== selectedChat.id));

      if (currentChatId === selectedChat.id) {
        if (chatHistory.length > 1) {
          const nextChat = chatHistory.find(c => c.id !== selectedChat.id);
          if (nextChat) {
            loadChatById(nextChat.id);
          } else {
            createNewChat();
          }
        } else {
          createNewChat();
        }
      }

      setDeleteDialogOpen(false);
    } catch (error) {
      console.error("Error deleting chat:", error);
      setError("Erro ao excluir conversa. Tente novamente.");
    }
  };

  // Adicionar função para enviar resumo por email se necessário
  const sendProjectSummaryEmail = async (projectId, recipients) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      const tasks = await Task.filter({ project_id: projectId });
      const meetings = await Meeting.filter({ project_id: projectId });

      const emailSubject = `Resumo do Projeto: ${project.title}`;
      
      const emailBody = `
Resumo do Projeto: ${project.title}

📊 STATUS GERAL:
• Status: ${project.status}
• Progresso: ${project.progress}%
• Responsável: ${getUserName(project.responsible)}
• Prazo: ${project.deadline ? format(new Date(project.deadline), 'dd/MM/yyyy') : 'Não definido'}

📋 TAREFAS (${tasks.length} total):
• Concluídas: ${tasks.filter(t => t.status === 'concluída').length}
• Em andamento: ${tasks.filter(t => t.status === 'em_andamento').length}
• Pendentes: ${tasks.filter(t => t.status === 'pendente').length}

🤝 REUNIÕES: ${meetings.length} reuniões registradas

${project.description ? `
📝 DESCRIÇÃO:
${project.description}
` : ''}

---
Relatório gerado automaticamente pela Gabih - Assistente IA do Planzee
      `;

      const sendPromises = recipients.map(recipient => 
        SendEmail({
          to: recipient,
          subject: emailSubject,
          body: emailBody,
          from_name: "Gabih - Assistente IA"
        })
      );

      await Promise.all(sendPromises);

    } catch (error) {
      console.error("Erro ao enviar resumo por email:", error);
    }
  };

  // Função auxiliar para obter nome do usuário
  const getUserName = (email) => {
    if (!email) return "Não atribuído";
    
    const foundUser = users.find(u => u.email === email); // Use the 'users' state
    if (foundUser?.full_name) {
      return foundUser.full_name;
    }
    
    return email.split('@')[0].replace('.', ' ');
  };

  const handleSendMessage = async (text = inputMessage) => {
    if (!text.trim()) return;

    setError(null);

    if (!currentChatId) {
      await createNewChat();
    }

    const chatTitle = getChatTitle();

    const userMessage = {
      content: text,
      type: "user",
      project_id: selectedProject,
      chat_id: currentChatId,
      chat_title: chatTitle,
      created_date: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      await ChatMessage.create(userMessage);

      // Obter dados do projeto selecionado (se houver)
      const projectContext = selectedProject
        ? await Project.get(selectedProject)
        : null;

      // Obter todos os projetos para contexto
      const projectsForContext = await Project.list();

      // Obter tarefas relacionadas ao projeto selecionado
      const tasksContext = selectedProject
        ? await Task.filter({ project_id: selectedProject })
        : [];

      // Obter reuniões relacionadas ao projeto selecionado
      const meetingsContext = selectedProject
        ? await Meeting.filter({ project_id: selectedProject })
        : [];

      // Obter notas relacionadas ao projeto selecionado
      const notesContext = selectedProject
        ? await Note.filter({ item_id: selectedProject, type: "project" })
        : [];

      // Obter checklists relacionadas ao projeto selecionado
      const checklistsContext = selectedProject
        ? await Checklist.filter({ project_id: selectedProject })
        : [];

      // Verificar se o texto pede para criar uma tarefa
      const isCreatingTask = text.toLowerCase().includes("criar tarefa") ||
        text.toLowerCase().includes("nova tarefa") ||
        text.toLowerCase().includes("adicione uma tarefa") ||
        text.toLowerCase().includes("adicionar tarefa");

      // Verificar se o texto pede para atualizar uma tarefa
      const isUpdatingTask = text.toLowerCase().includes("atualizar tarefa") ||
        text.toLowerCase().includes("concluir tarefa") ||
        text.toLowerCase().includes("mudar status") ||
        text.toLowerCase().includes("marcar como concluída");

      // Verificar se o texto pede para criar uma nota
      const isCreatingNote = text.toLowerCase().includes("criar nota") ||
        text.toLowerCase().includes("nova nota") ||
        text.toLowerCase().includes("adicionar nota");

      // Verificar se o texto pede para agendar uma reunião
      const isSchedulingMeeting = text.toLowerCase().includes("agendar reunião") ||
        text.toLowerCase().includes("nova reunião") ||
        text.toLowerCase().includes("marcar reunião");

      // Verificar se o texto pede para criar um projeto
      const isCreatingProject = text.toLowerCase().includes("criar projeto") ||
        text.toLowerCase().includes("novo projeto") ||
        text.toLowerCase().includes("iniciar projeto");

      // Verificar se o texto pede para criar uma checklist
      const isCreatingChecklist = text.toLowerCase().includes("criar checklist") ||
        text.toLowerCase().includes("nova checklist") ||
        text.toLowerCase().includes("gerar checklist");
      
      const isSendingEmail = text.toLowerCase().includes("enviar email") || 
                              text.toLowerCase().includes("mandar email");

      // Define o contexto de banco de dados para a IA
      const databaseContext = {
        entities: {
          Project: {
            schema: await Project.schema(),
            exampleData: projectsForContext.slice(0, 2)
          },
          Task: {
            schema: await Task.schema(),
            exampleData: tasksContext.slice(0, 2)
          },
          Meeting: {
            schema: await Meeting.schema(),
            exampleData: meetingsContext.slice(0, 2)
          },
          Note: {
            schema: await Note.schema(),
            exampleData: notesContext.slice(0, 2)
          },
          Checklist: {
            schema: await Checklist.schema(),
            exampleData: checklistsContext.slice(0, 2)
          },
          Feedback: {
            schema: await Feedback.schema()
          },
          Infrastructure: {
            schema: await Infrastructure.schema()
          }
        }
      };

      const currentDate = getCurrentDate();
      // Prompt para a IA com contexto do banco de dados
      const prompt = `
        Você é Gabih, assistente de IA especializada em inovação tecnológica para gerenciamento de projetos da AlliedIT.
        
        Data atual: ${currentDate}
        IMPORTANTE: Ao criar ou sugerir datas, SEMPRE use datas futuras (nunca no passado). 
        - Para datas de início: use hoje ou futuro próximo
        - Para prazos: use pelo menos 1 semana no futuro
        - Para projetos: sugira prazos de 2-4 semanas no futuro
        
        Informações do usuário atual:
        Nome: ${user?.full_name || "Usuário"}
        Email: ${user?.email || "usuário@alliedit.com.br"}
        
        Estrutura de banco de dados do sistema:
        ${JSON.stringify(databaseContext)}
        
        ${projectContext ? `Contexto do projeto selecionado: ${JSON.stringify({
        id: projectContext.id,
        title: projectContext.title,
        description: projectContext.description,
        status: projectContext.status,
        deadline: projectContext.deadline
      })}` : 'Nenhum projeto específico selecionado.'}
        
        ${selectedProject ? `Tarefas do projeto (${tasksContext.length}): ${JSON.stringify(tasksContext.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status,
        deadline: t.deadline,
        assigned_to: t.assigned_to
      })))}` : ''}
        
        ${selectedProject ? `Reuniões do projeto (${meetingsContext.length}): ${JSON.stringify(meetingsContext.map(m => ({
        id: m.id,
        title: m.title,
        date: m.date,
        attendees: m.attendees
      })))}` : ''}
        
        Histórico de mensagens recentes:
        ${messages.slice(-5).map(m => `${m.type === 'user' ? 'Usuário' : 'Gabih'}: ${m.content}`).join('\n')}
        
        Responda à seguinte mensagem do usuário: "${text}"
        
        IMPORTANTE:
        - Se o usuário está solicitando criar, atualizar ou consultar informações, você deve fornecer dados precisos do banco.
        - Você pode executar ações no banco de dados como criar tarefas, projetos, notas, reuniões, e atualizar status.
        - SEMPRE use datas futuras ao criar novos itens (projetos, tarefas, reuniões)
        - Para executar operações no banco, formate sua resposta claramente mencionando o que foi feito.
        - Para as consultas, use os dados atuais do banco e não invente informações.
        - Se não há informações suficientes, pergunte educadamente ao usuário o que precisa.
        - Seja profissional, concisa e útil. Use um tom formal mas amigável.
        - Sempre assine suas mensagens com "Gabih 🤖".
      `;

      // Resposta da IA
      const aiResponse = await InvokeLLM({
        prompt: prompt
      });

      // Processando ações solicitadas
      let actionTaken = null;

      // Criar tarefa se solicitado
      if (isCreatingTask && selectedProject) {
        try {
          // Extrair dados da tarefa do texto do usuário
          const taskDataPrompt = `
            O usuário solicitou a criação de uma tarefa com esta mensagem: "${text}"
            
            Extraia os seguintes detalhes da tarefa:
            - title: título da tarefa
            - description: descrição da tarefa (opcional)
            - deadline: prazo no formato YYYY-MM-DD (opcional)
            - status: status inicial (pendente, em_andamento, concluída, bloqueada)
            - assigned_to: email do responsável (opcional)
            
            Retorne apenas o JSON com estes campos.
          `;

          const taskData = await InvokeLLM({
            prompt: taskDataPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                deadline: { type: "string" },
                status: { type: "string" },
                assigned_to: { type: "string" }
              }
            }
          });

          // Adicionar project_id ao objeto de tarefa
          const newTaskData = {
            ...taskData,
            project_id: selectedProject,
            status: taskData.status || "pendente",
            // Para criação por IA, ajustar datas para o futuro
            start_date: adjustDateToFuture(taskData.start_date || getFutureDate(1), 1, true),
            deadline: adjustDateToFuture(taskData.deadline || getFutureDate(7), 7, true),
            created_date: currentDate
          };

          // Garantir que start_date seja anterior ao deadline
          if (newTaskData.start_date >= newTaskData.deadline) {
            newTaskData.deadline = getFutureDate(14);
          }

          // Criar tarefa no banco
          const createdTask = await Task.create(newTaskData);

          actionTaken = {
            type: "create_task",
            data: createdTask
          };
        } catch (err) {
          console.error("Erro ao criar tarefa:", err);
        }
      }

      // Atualizar tarefa se solicitado
      else if (isUpdatingTask && selectedProject) {
        try {
          // Extrair ID e dados de atualização da tarefa
          const updateTaskPrompt = `
            O usuário solicitou a atualização de uma tarefa com esta mensagem: "${text}"
            
            Com base nas tarefas disponíveis neste projeto:
            ${JSON.stringify(tasksContext.map(t => ({
            id: t.id,
            title: t.title,
            status: t.status
          })))}
            
            Extraia:
            - task_id: ID da tarefa a ser atualizada
            - status: novo status (pendente, em_andamento, concluída, bloqueada) se aplicável
            - assigned_to: novo responsável (email) se aplicável
            
            Retorne apenas o JSON com estes campos.
          `;

          const updateData = await InvokeLLM({
            prompt: updateTaskPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                task_id: { type: "string" },
                status: { type: "string" },
                assigned_to: { type: "string" }
              }
            }
          });

          if (updateData.task_id) {
            const updatedTask = await Task.update(updateData.task_id, {
              status: updateData.status,
              assigned_to: updateData.assigned_to
            });

            actionTaken = {
              type: "update_task",
              data: updatedTask
            };
          }
        } catch (err) {
          console.error("Erro ao atualizar tarefa:", err);
        }
      }

      // Criar nota se solicitado
      else if (isCreatingNote && selectedProject) {
        try {
          // Extrair conteúdo da nota
          const notePrompt = `
            O usuário solicitou criar uma nota com esta mensagem: "${text}"
            
            Extraia:
            - content: conteúdo detalhado da nota 
            
            Retorne apenas o JSON com este campo.
          `;

          const noteData = await InvokeLLM({
            prompt: notePrompt,
            response_json_schema: {
              type: "object",
              properties: {
                content: { type: "string" }
              }
            }
          });

          if (noteData.content) {
            const createdNote = await Note.create({
              content: noteData.content,
              type: "project",
              item_id: selectedProject,
              author: user.email,
              is_private: false
            });

            actionTaken = {
              type: "create_note",
              data: createdNote
            };
          }
        } catch (err) {
          console.error("Erro ao criar nota:", err);
        }
      }

      // Agendar reunião se solicitado
      else if (isSchedulingMeeting && selectedProject) {
        try {
          // Extrair dados da reunião
          const meetingPrompt = `
            O usuário solicitou agendar uma reunião com esta mensagem: "${text}"
            Data atual: ${currentDate}
            
            IMPORTANTE: A data da reunião deve ser FUTURA (não no passado).
            
            Extraia:
            - title: título da reunião
            - date: data da reunião no formato YYYY-MM-DD (deve ser futura)
            - attendees: array de emails dos participantes (se mencionados)
            - notes: notas iniciais para a reunião (opcional)
            
            Retorne apenas o JSON com estes campos.
          `;

          const meetingData = await InvokeLLM({
            prompt: meetingPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                date: { type: "string", format: "date" },
                attendees: { type: "array", items: { type: "string" } },
                notes: { type: "string" }
              }
            }
          });

          // Garantir que o array de attendees exista
          if (!meetingData.attendees) {
            meetingData.attendees = [];
          }

          // Adicionar o usuário atual se não estiver já incluído
          if (!meetingData.attendees.includes(user.email)) {
            meetingData.attendees.push(user.email);
          }

          const createdMeeting = await Meeting.create({
            ...meetingData,
            project_id: selectedProject,
            // Para criação por IA, ajustar data para o futuro
            date: adjustDateToFuture(meetingData.date || getFutureDate(1), 1, true)
          });

          actionTaken = {
            type: "create_meeting",
            data: createdMeeting
          };
        } catch (err) {
          console.error("Erro ao agendar reunião:", err);
        }
      }

      // Criar projeto se solicitado
      else if (isCreatingProject) {
        try {
          const currentDate = getCurrentDate();
        
          const projectPrompt = `
            O usuário solicitou criar um projeto com esta mensagem: "${text}"
            Data atual: ${currentDate}
            
            IMPORTANTE: Todas as datas devem ser FUTURAS e são OBRIGATÓRIAS:
            - start_date: hoje ou futuro próximo (formato YYYY-MM-DD)
            - deadline: pelo menos 2-4 semanas no futuro (formato YYYY-MM-DD)
            
            Extraia TODOS os campos obrigatórios:
            - title: título do projeto (obrigatório)
            - description: descrição do projeto (opcional)
            - status: status inicial (ambiente, poc, mvp, desenvolvimento, produção, concluído) - padrão 'ambiente'
            - start_date: data de início no formato YYYY-MM-DD (OBRIGATÓRIO - futuro)
            - deadline: prazo no formato YYYY-MM-DD (OBRIGATÓRIO - futuro)
            - responsible: email do responsável (use: ${user.email})
            - participants: array de emails dos participantes (inclua o responsável)
            - priority: prioridade (baixa, média, alta) - padrão 'média'
            - tags: array de tags relevantes
            
            Retorne apenas o JSON com TODOS estes campos obrigatórios preenchidos.
          `;

          const projectData = await InvokeLLM({
            prompt: projectPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                status: { type: "string", enum: ["ambiente", "poc", "mvp", "desenvolvimento", "produção", "concluído"] },
                start_date: { type: "string", format: "date" },
                deadline: { type: "string", format: "date" },
                responsible: { type: "string" },
                participants: { type: "array", items: { type: "string" } },
                priority: { type: "string", enum: ["baixa", "média", "alta"] },
                tags: { type: "array", items: { type: "string" } }
              },
              required: ["title", "start_date", "deadline", "responsible"]
            }
          });

          // Garantir que SEMPRE temos start_date e deadline válidos
          const finalProjectData = {
            title: projectData.title,
            description: projectData.description || `Projeto criado via assistente IA: ${projectData.title}`,
            status: projectData.status || 'ambiente',
            priority: projectData.priority || 'média',
            responsible: projectData.responsible || user.email,
            participants: Array.isArray(projectData.participants) ? projectData.participants : [projectData.responsible || user.email],
            tags: Array.isArray(projectData.tags) ? projectData.tags : [],
            progress: 0,
            // Para criação por IA, ajustar datas para o futuro
            start_date: adjustDateToFuture(projectData.start_date || currentDate, 0, true),
            deadline: adjustDateToFuture(projectData.deadline || getFutureDate(30), 7, true),
            created_date: currentDate,
            last_modified_date: currentDate
          };

          // Garantir que start_date seja anterior ao deadline
          if (finalProjectData.start_date >= finalProjectData.deadline) {
            finalProjectData.deadline = adjustDateToFuture(finalProjectData.start_date, 7, true); // Ensure deadline is at least 7 days after start_date
          }

          // Garantir que o responsável esteja nos participantes
          if (!finalProjectData.participants.includes(finalProjectData.responsible)) {
            finalProjectData.participants.push(finalProjectData.responsible);
          }

          console.log("Dados do projeto sendo criados via IA:", finalProjectData); // Debug

          const createdProject = await Project.create(finalProjectData);

          actionTaken = {
            type: "create_project",
            data: createdProject
          };
        } catch (err) {
          console.error("Erro ao criar projeto:", err);
          setError(`Erro ao criar projeto: ${err.message}`);
        }
      }

      // Criar checklist se solicitado
      else if (isCreatingChecklist && selectedProject) {
        try {
          // Extrair fase da checklist
          const checklistPrompt = `
            O usuário solicitou criar uma checklist com esta mensagem: "${text}"
            
            Extraia:
            - phase: fase do projeto para esta checklist
            - items: array de itens da checklist, cada um com:
              - description: descrição do item
              - completed: false (todos começam como não concluídos)
            
            As fases possíveis são: planejamento, design, desenvolvimento, testes, homologação, produção, etc.
            
            Retorne apenas o JSON com estes campos.
          `;

          const checklistData = await InvokeLLM({
            prompt: checklistPrompt,
            response_json_schema: {
              type: "object",
              properties: {
                phase: { type: "string" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      completed: { type: "boolean" }
                    }
                  }
                }
              }
            }
          });

          const createdChecklist = await Checklist.create({
            ...checklistData,
            project_id: selectedProject,
            ai_generated: true
          });

          actionTaken = {
            type: "create_checklist",
            data: createdChecklist
          };
        } catch (err) {
          console.error("Erro ao criar checklist:", err);
        }
      }
      // Enviar email se solicitado
      else if (isSendingEmail && selectedProject) {
        try {
            const emailPrompt = `
                O usuário solicitou enviar um email com base nesta mensagem: "${text}"
                
                Se a solicitação for para enviar um "resumo do projeto" ou "relatório do projeto", extraia:
                - project_id: O ID do projeto selecionado (se houver, senão null)
                - recipients: Um array de endereços de e-mail para os destinatários. Se não especificado, use o e-mail do usuário logado (${user.email}).
                
                Retorne apenas o JSON com estes campos.
            `;
            const emailData = await InvokeLLM({
                prompt: emailPrompt,
                response_json_schema: {
                    type: "object",
                    properties: {
                        project_id: { type: "string", nullable: true },
                        recipients: { type: "array", items: { type: "string" } }
                    }
                }
            });

            const recipients = emailData.recipients && emailData.recipients.length > 0
                ? emailData.recipients
                : [user.email];

            if (selectedProject) {
                await sendProjectSummaryEmail(selectedProject, recipients);
                actionTaken = {
                    type: "send_email",
                    data: { project_id: selectedProject, recipients: recipients }
                };
            } else {
                // If no project is selected, maybe a generic email? Or prompt user for project?
                // For now, let AI handle general response if project not selected for email summary
                actionTaken = {
                    type: "no_action_taken",
                    message: "Não foi possível enviar o resumo por email sem um projeto selecionado. Por favor, selecione um projeto."
                };
            }
        } catch (err) {
            console.error("Erro ao tentar enviar email:", err);
            setError("Erro ao tentar enviar email. Tente novamente.");
        }
    }


      // Configurar o título da conversa para novos chats
      let updatedChatTitle = chatTitle;
      const currentChat = chatHistory.find(c => c.id === currentChatId);
      if (currentChat && currentChat.messages.length <= 1 && currentChat.title === 'Nova conversa') {
        const titlePrompt = `
          Com base na mensagem do usuário: "${text}"
          Gere um título curto e descritivo para esta conversa (máximo 5 palavras).
          Retorne apenas o título, sem aspas ou pontuação adicional.
        `;

        try {
          const titleResponse = await InvokeLLM({ prompt: titlePrompt });
          updatedChatTitle = titleResponse.replace(/"/g, '').trim();

          setChatHistory(prev => prev.map(chat =>
            chat.id === currentChatId
              ? { ...chat, title: updatedChatTitle }
              : chat
          ));
        } catch (error) {
          console.error("Error generating chat title:", error);
        }
      }

      // Criar mensagem do assistente com informação sobre ação tomada
      let finalResponse = aiResponse;
      if (actionTaken) {
        finalResponse = aiResponse + `\n\n**Ação Realizada**: ${getActionMessage(actionTaken)}`;
      }

      const assistantMessage = {
        content: finalResponse,
        type: "assistant",
        project_id: selectedProject,
        chat_id: currentChatId,
        chat_title: updatedChatTitle,
        created_date: new Date().toISOString(),
        action_taken: actionTaken ? JSON.stringify(actionTaken) : null
      };

      await ChatMessage.create(assistantMessage);

      setMessages(prev => [...prev, assistantMessage]);

      await loadChatHistory();
    } catch (error) {
      console.error("Error processing message:", error);
      setError("Ocorreu um erro ao processar sua mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função auxiliar para formatar mensagens de ação realizada
  const getActionMessage = (action) => {
    switch (action.type) {
      case "create_task":
        return `Tarefa "${action.data.title}" criada com sucesso.`;
      case "update_task":
        return `Tarefa atualizada com sucesso (Status: ${action.data.status}).`;
      case "create_note":
        return `Nota adicionada ao projeto com sucesso.`;
      case "create_meeting":
        return `Reunião "${action.data.title}" agendada para ${new Date(action.data.date).toLocaleDateString()}.`;
      case "create_project":
        return `Projeto "${action.data.title}" criado com sucesso.`;
      case "create_checklist":
        return `Checklist para fase "${action.data.phase}" criada com ${action.data.items.length} itens.`;
      case "send_email":
        return `E-mail enviado para: ${action.data.recipients.join(', ')}.`;
      case "no_action_taken":
        return action.message;
      default:
        return `Ação concluída com sucesso.`;
    }
  };

  const renderMessage = (message, index) => {
    const isUser = message.type === "user";

    const formatMessageContent = (content) => {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const withLinks = content.replace(urlRegex, '<a href="$1" target="_blank" class="text-blue-600 underline">$1</a>');
      const withLineBreaks = withLinks.replace(/\n/g, '<br>');
      return { __html: withLineBreaks };
    };

    const getMessageStyle = (content, isUser) => {
      if (isUser) return "bg-blue-600 text-white rounded-tl-2xl rounded-tr-none rounded-bl-2xl rounded-br-2xl";

      const hasStructuredContent = content.includes("```") ||
        content.includes("1.") ||
        content.includes("*") ||
        content.includes("Passos para");

      if (hasStructuredContent) {
        return "bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 text-gray-800 rounded-tl-none rounded-tr-2xl rounded-bl-2xl rounded-br-2xl";
      }

      return "bg-gradient-to-r from-pink-50 to-purple-50 border border-purple-100 text-gray-800 rounded-tl-none rounded-tr-2xl rounded-bl-2xl rounded-br-2xl";
    };

    return (
      <div
        key={message.id || index}
        className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-5`}
      >
        <div className={`flex ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[85%]`}>
          {!isUser ? (
            <Avatar className="h-10 w-10 border-2 border-purple-200">
              <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" alt="Gabih" />
              <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">GA</AvatarFallback>
            </Avatar>
          ) : (
            <Avatar className="h-10 w-10 border-2 border-blue-200">
              <AvatarFallback className="bg-blue-600 text-white">
                {user?.full_name?.[0] || 'U'}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex flex-col">
            {!isUser && (
              <div className="text-sm font-medium text-purple-700 ml-2 mb-1">
                Gabih na Inovação Tecnológica
              </div>
            )}

            <div
              className={cn(
                "p-4 shadow-sm",
                getMessageStyle(message.content, isUser)
              )}
            >
              <div
                className="whitespace-pre-wrap text-[15px]"
                dangerouslySetInnerHTML={formatMessageContent(message.content)}
              />

              <div className="mt-2 pt-2 border-t border-gray-200 flex justify-between items-center text-xs opacity-70">
                <span>{new Date(message.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {!isUser && <span className="font-medium">Gabih 🤖</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const getSuggestionIcon = (suggestion) => {
    if (suggestion.toLowerCase().includes("projeto")) return <FileText className="w-4 h-4" />;
    if (suggestion.toLowerCase().includes("tarefa")) return <CheckCircle2 className="w-4 h-4" />;
    if (suggestion.toLowerCase().includes("reunião")) return <Calendar className="w-4 h-4" />;
    if (suggestion.toLowerCase().includes("progresso")) return <Sparkles className="w-4 h-4" />;
    if (suggestion.toLowerCase().includes("checklist")) return <CheckCircle2 className="w-4 h-4" />;
    return <Lightbulb className="w-4 h-4" />;
  };

  const getFormattedDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return `Hoje, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }

    return date.toLocaleDateString() + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-3/4">
          <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border-2 border-purple-200">
                <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" alt="Gabih" />
                <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white">GA</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900 truncate">
                  {getChatTitle()}
                </h1>
                <p className="text-sm text-gray-600">Sua assistente de IA para projetos</p>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <Sheet open={showHistorySidebar} onOpenChange={setShowHistorySidebar}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <History className="h-4 w-4" />
                    Histórico
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
                  <SheetHeader className="px-4 py-3 border-b">
                    <SheetTitle>Histórico de Conversas</SheetTitle>
                  </SheetHeader>
                  <div className="flex items-center gap-2 p-3 border-b">
                    <Button onClick={createNewChat} className="w-full flex gap-2">
                      <Plus className="h-4 w-4" />
                      Nova Conversa
                    </Button>
                  </div>
                  <div className="p-1 overflow-y-auto h-[calc(100vh-130px)]">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p>Nenhuma conversa encontrada.</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {chatHistory.map(chat => (
                          <div
                            key={chat.id}
                            className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-colors
                              ${currentChatId === chat.id ? 'bg-purple-100' : 'hover:bg-gray-100'}`}
                            onClick={() => loadChatById(chat.id)}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">{chat.title}</div>
                              <div className="text-xs text-gray-500">
                                {getFormattedDate(chat.updated_date)}
                              </div>
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedChat(chat);
                                  setNewChatName(chat.title);
                                  setRenameDialogOpen(true);
                                }}>
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Renomear
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedChat(chat);
                                    setDeleteDialogOpen(true);
                                  }}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              <Button variant="outline" onClick={createNewChat} className="gap-2">
                <Plus className="h-4 w-4" />
                Nova Conversa
              </Button>

              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className="w-[150px] sm:w-[250px]">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Todos os projetos</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Card className="h-[calc(100vh-220px)] border-purple-200 shadow-lg">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-indigo-50/30 to-purple-50/30">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Avatar className="h-24 w-24 mb-5 border-4 border-purple-200">
                      <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" alt="Gabih" />
                      <AvatarFallback className="bg-gradient-to-br from-pink-400 to-purple-500 text-white text-3xl">GA</AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-bold text-purple-800 mb-2">Gabih - Sua Assistente de IA</h3>
                    <p className="text-gray-600 max-w-md mb-4">
                      Estou aqui para ajudar você com seus projetos de inovação tecnológica.
                      Posso responder perguntas, criar tarefas, agendar reuniões e muito mais.
                    </p>
                    <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-4 rounded-lg border border-purple-200 shadow-sm">
                      <p className="text-purple-700 font-medium">
                        Experimente me perguntar algo sobre seus projetos ou como posso ajudar em suas tarefas de inovação!
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {messages.map(renderMessage)}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="mx-4 mb-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="p-4 border-t border-purple-100 bg-white">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Pergunte algo para a Gabih..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[60px] border-purple-200 focus-visible:ring-purple-400"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={loading || !inputMessage.trim()}
                    className="h-[60px] w-[60px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full md:w-1/4">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-purple-800 flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Sugestões
            </h2>
            <p className="text-sm text-gray-500">Clique em uma sugestão para começar</p>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start text-left h-auto py-3 px-4 border-purple-200 hover:bg-purple-50 hover:border-purple-300 transition-all"
                onClick={() => {
                  setInputMessage(suggestion);
                  handleSendMessage(suggestion);
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 p-2 rounded-full text-purple-600 mt-0.5">
                    {getSuggestionIcon(suggestion)}
                  </div>
                  <span className="text-gray-700">{suggestion}</span>
                </div>
              </Button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-purple-100">
            <h3 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Dica da Gabih
            </h3>
            <p className="text-sm text-gray-600">
              Você pode selecionar um projeto específico no menu acima para obter respostas mais precisas e contextualizadas sobre ele!
            </p>
          </div>
        </div>
      </div>

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Conversa</DialogTitle>
            <DialogDescription>
              Digite um novo nome para esta conversa.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              value={newChatName}
              onChange={(e) => setNewChatName(e.target.value)}
              placeholder="Nome da conversa"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenameDialogOpen(false)}>Cancelar</Button>
            <Button onClick={renameChat} disabled={!newChatName.trim()}>Renomear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Conversa</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir esta conversa? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={deleteChat}
            >
              Excluir Permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={createAgentDialogOpen} onOpenChange={setCreateAgentDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Criar Agente Personalizado</DialogTitle>
            <DialogDescription>
              Descreva suas necessidades e eu criarei um agente de IA personalizado para você.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div>
              <Label>Nome do Agente</Label>
              <Input
                placeholder="Ex: Agente de Análise de Riscos"
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
              />
            </div>

            <div>
              <Label>Descrição do Agente</Label>
              <Textarea
                placeholder="Descreva o que você espera que este agente faça..."
                value={agentForm.description}
                onChange={(e) => setAgentForm({ ...agentForm, description: e.target.value })}
                className="h-20"
              />
            </div>

            <div>
              <Label>Objetivos Principais</Label>
              <Textarea
                placeholder="Liste os principais objetivos que o agente deve alcançar..."
                value={agentForm.objectives}
                onChange={(e) => setAgentForm({ ...agentForm, objectives: e.target.value })}
                className="h-20"
              />
            </div>

            <div>
              <Label>Capacidades Desejadas</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "Análise de Dados",
                  "Previsões",
                  "Recomendações",
                  "Automação",
                  "Monitoramento",
                  "Alertas",
                  "Relatórios",
                  "Integração com APIs"
                ].map((cap) => (
                  <Button
                    key={cap}
                    variant={agentForm.capabilities.includes(cap) ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      if (agentForm.capabilities.includes(cap)) {
                        setAgentForm({
                          ...agentForm,
                          capabilities: agentForm.capabilities.filter(c => c !== cap)
                        });
                      } else {
                        setAgentForm({
                          ...agentForm,
                          capabilities: [...agentForm.capabilities, cap]
                        });
                      }
                    }}
                  >
                    {cap}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateAgentDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={async () => {
                try {
                  setLoading(true);

                  // Criar prompt para o assistente criar o agente
                  const prompt = `
                Crie um agente de IA personalizado com as seguintes especificações:
                
                Nome: ${agentForm.name}
                Descrição: ${agentForm.description}
                Objetivos: ${agentForm.objectives}
                Capacidades: ${agentForm.capabilities.join(", ")}
                
                Retorne uma descrição detalhada de como este agente funcionará e como ele pode ajudar o usuário.
              `;

                  await handleSendMessage(prompt);
                  setCreateAgentDialogOpen(false);
                  setAgentForm({
                    name: "",
                    description: "",
                    objectives: "",
                    capabilities: []
                  });
                } catch (error) {
                  console.error("Erro ao criar agente:", error);
                } finally {
                  setLoading(false);
                }
              }}
              disabled={!agentForm.name || !agentForm.description || !agentForm.objectives || agentForm.capabilities.length === 0}
            >
              Criar Agente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

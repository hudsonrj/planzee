import React, { useState, useEffect, useRef } from "react";
import { Meeting, Task, Project, User } from "@/api/entities";
import { InvokeLLM, UploadFile } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Calendar,
  Clock,
  Users,
  Edit,
  Trash2,
  ChevronLeft,
  Mic,
  StopCircle,
  Headphones,
  FileText,
  AlertCircle,
  Sparkles,
  Plus,
  Loader2,
  MapPin
} from "lucide-react";

export default function MeetingDetails() {
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [systemUsers, setSystemUsers] = useState([]);
  const [notes, setNotes] = useState("");
  const [notesAutoSave, setNotesAutoSave] = useState(null);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUrl, setRecordingUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  // AI task generation
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [showTasksDialog, setShowTasksDialog] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState({});
  
  // Audio playback
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Delete confirmation
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const meetingId = urlParams.get("id");
    
    if (meetingId) {
      loadMeetingData(meetingId);
      loadUsers();
    } else {
      setError("ID da reunião não fornecido");
      setLoading(false);
    }
    
    // Set up audio element
    if (audioRef.current) {
      audioRef.current.onplay = () => setIsPlaying(true);
      audioRef.current.onpause = () => setIsPlaying(false);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    return () => {
      // Clean up recording if component unmounts during recording
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);
  
  // Auto-save notes
  useEffect(() => {
    if (meeting && notes !== meeting.notes) {
      clearTimeout(notesAutoSave);
      
      const timeoutId = setTimeout(() => {
        saveNotes();
      }, 2000);
      
      setNotesAutoSave(timeoutId);
    }
    
    return () => {
      clearTimeout(notesAutoSave);
    };
  }, [notes]);

  const loadMeetingData = async (meetingId) => {
    try {
      setLoading(true);
      
      const meetingData = await Meeting.get(meetingId);
      setMeeting(meetingData);
      setNotes(meetingData.notes || "");
      
      if (meetingData.project_id) {
        const projectData = await Project.get(meetingData.project_id);
        setProject(projectData);
      }
      
      // Set recording URL if available
      if (meetingData.recording_url) {
        setRecordingUrl(meetingData.recording_url);
      }
      
      // Set transcript if available
      if (meetingData.transcript) {
        setTranscript(meetingData.transcript);
      }
      
    } catch (error) {
      console.error("Error loading meeting data:", error);
      setError("Erro ao carregar dados da reunião");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const users = await User.list();
      setSystemUsers(users);
    } catch (error) {
      console.error("Error loading users:", error);
    }
  };

  const saveNotes = async () => {
    if (!meeting) return;
    
    try {
      await Meeting.update(meeting.id, { notes });
      console.log("Notes saved successfully");
    } catch (error) {
      console.error("Error saving notes:", error);
      setError("Erro ao salvar anotações");
    }
  };
  
  const deleteMeeting = async () => {
    if (!meeting) return;
    
    try {
      await Meeting.delete(meeting.id);
      navigate(createPageUrl("Meetings"));
    } catch (error) {
      console.error("Error deleting meeting:", error);
      setError("Erro ao excluir reunião");
    }
  };
  
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordingUrl(audioUrl);
        setAudioBlob(audioBlob);
        
        // Stop all tracks from the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      setError("Erro ao iniciar gravação. Verifique se o microfone está acessível.");
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  const transcribeRecording = async () => {
    if (!audioBlob) {
      setError("Nenhuma gravação disponível para transcrição");
      return;
    }
    
    setIsTranscribing(true);
    
    try {
      // Create a File object from the Blob
      const audioFile = new File([audioBlob], "meeting_recording.wav", { 
        type: "audio/wav" 
      });
      
      // Use the UploadFile integration to save the recording
      const { file_url } = await UploadFile({ file: audioFile });
      
      // Save the recording URL to the meeting
      await Meeting.update(meeting.id, { recording_url: file_url });
      
      // Now use LLM to transcribe the audio
      const transcriptionResult = await InvokeLLM({
        prompt: `
          Transcreva a gravação de áudio da reunião anexada. 
          Você é uma IA especializada em transcrição de áudio para português, 
          então faça um trabalho preciso estruturando o texto de forma clara,
          identificando diferentes falantes quando possível.
          
          Detalhe a fala por pontos principais, em formato de transcrição profissional.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            transcript: { type: "string" }
          }
        },
        file_urls: [file_url]
      });
      
      // Set transcript and save to meeting
      if (transcriptionResult.transcript) {
        setTranscript(transcriptionResult.transcript);
        await Meeting.update(meeting.id, { transcript: transcriptionResult.transcript });
      } else {
        setError("Falha ao obter transcrição");
      }
      
      // Reload meeting data
      await loadMeetingData(meeting.id);
      
    } catch (error) {
      console.error("Error transcribing recording:", error);
      setError("Erro ao transcrever gravação");
    } finally {
      setIsTranscribing(false);
    }
  };
  
  const generateTasks = async () => {
    if (!transcript && !notes) {
      setError("Nenhuma transcrição ou anotação disponível para gerar tarefas");
      return;
    }
    
    setIsGeneratingTasks(true);
    
    try {
      // Use the InvokeLLM integration to generate tasks from transcript/notes
      const prompt = `
        Você é um especialista em gerenciamento de projetos. Analise o conteúdo da reunião a seguir e 
        identifique potenciais tarefas a serem criadas com base na discussão.
        
        ${transcript ? `\nTranscrição da reunião:\n${transcript}` : ''}
        ${notes ? `\nAnotações da reunião:\n${notes}` : ''}
        
        Identifique de 3 a 8 tarefas claras, objetivas e acionáveis que foram discutidas ou mencionadas 
        na reunião. Para cada tarefa, forneça:
        1. Um título claro e conciso
        2. Uma descrição detalhada
        3. Um status inicial (pendente ou em_andamento)
        4. Uma sugestão de prazo (em dias a partir de hoje, ou informe "não especificado")
        
        Retorne somente tarefas que foram realmente discutidas ou que são claramente relevantes 
        para o conteúdo da reunião. Para cada tarefa, explique em uma frase por que você acha que 
        esta tarefa é relevante com base na discussão.
      `;
      
      const result = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  status: { type: "string" },
                  deadline_estimate: { type: "string" },
                  relevance: { type: "string" }
                }
              }
            }
          }
        }
      });
      
      if (result.tasks && result.tasks.length > 0) {
        // Calculate date for each task
        const processedTasks = result.tasks.map(task => {
          // Initialize selected state for each task
          const newSelected = { ...selectedTasks };
          newSelected[task.title] = true;
          setSelectedTasks(newSelected);
          
          // Calculate deadline if provided
          let deadline = null;
          if (task.deadline_estimate && task.deadline_estimate !== "não especificado") {
            // Try to extract a number from the deadline_estimate
            const daysMatch = task.deadline_estimate.match(/\d+/);
            if (daysMatch) {
              const days = parseInt(daysMatch[0]);
              const deadlineDate = new Date();
              deadlineDate.setDate(deadlineDate.getDate() + days);
              deadline = deadlineDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
            }
          }
          
          return {
            ...task,
            actual_deadline: deadline
          };
        });
        
        setGeneratedTasks(processedTasks);
        setShowTasksDialog(true);
      } else {
        setError("Não foi possível identificar tarefas na transcrição/anotações");
      }
    } catch (error) {
      console.error("Error generating tasks:", error);
      setError("Erro ao gerar tarefas");
    } finally {
      setIsGeneratingTasks(false);
    }
  };
  
  const createSelectedTasks = async () => {
    if (!meeting || !project) {
      setError("Dados do projeto ou reunião não disponíveis");
      return;
    }
    
    try {
      const tasksToCreate = generatedTasks.filter(task => selectedTasks[task.title]);
      
      for (const task of tasksToCreate) {
        await Task.create({
          title: task.title,
          description: task.description,
          project_id: project.id,
          status: task.status || "pendente",
          deadline: task.actual_deadline,
          meeting_id: meeting.id,
          ai_generated: true
        });
      }
      
      // Close dialog and show success
      setShowTasksDialog(false);
      alert(`${tasksToCreate.length} tarefas foram criadas com sucesso!`);
      
      // Clear selections and generated tasks
      setSelectedTasks({});
      setGeneratedTasks([]);
      
    } catch (error) {
      console.error("Error creating tasks:", error);
      setError("Erro ao criar tarefas");
    }
  };
  
  const getInitials = (email) => {
    if (!email) return "?";
    const parts = email.split("@")[0].split(".");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  const getUserName = (email) => {
    const user = systemUsers.find(u => u.email === email);
    if (user && user.full_name) {
      return user.full_name;
    }
    
    // If we don't have a full name, format the email nicely
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
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button 
          onClick={() => navigate(createPageUrl("Meetings"))}
          variant="outline"
          className="mt-4"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Reuniões
        </Button>
      </div>
    );
  }
  
  if (!meeting) {
    return (
      <div className="container mx-auto py-8 text-center">
        <AlertCircle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Reunião não encontrada</h2>
        <p className="text-gray-500 mb-4">A reunião solicitada não existe ou foi removida.</p>
        <Button 
          onClick={() => navigate(createPageUrl("Meetings"))}
          variant="outline"
        >
          <ChevronLeft className="mr-2 h-4 w-4" /> Voltar para Reuniões
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => navigate(createPageUrl("Meetings"))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          {project && (
            <div className="text-gray-500">
              Projeto: <span className="text-blue-600">{project.title}</span>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="md:col-span-2 space-y-6">
          {/* Meeting notes card */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Anotações da Reunião</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Adicione suas anotações da reunião aqui..."
                className="min-h-[200px]"
              />
            </CardContent>
          </Card>
          
          {/* Recording section */}
          <Card>
            <CardHeader className="border-b">
              <CardTitle>Gravação e Transcrição</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                {/* Recording controls */}
                <div className="flex flex-wrap gap-2">
                  {!isRecording && !recordingUrl && (
                    <Button 
                      onClick={startRecording}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <Mic className="mr-2 h-4 w-4" /> Iniciar Gravação
                    </Button>
                  )}
                  
                  {isRecording && (
                    <Button 
                      onClick={stopRecording}
                      variant="outline"
                      className="border-red-300 text-red-600"
                    >
                      <StopCircle className="mr-2 h-4 w-4" /> Parar Gravação
                    </Button>
                  )}
                  
                  {recordingUrl && (
                    <>
                      <Button 
                        onClick={() => {
                          if (audioRef.current) {
                            if (isPlaying) {
                              audioRef.current.pause();
                            } else {
                              audioRef.current.play();
                            }
                          }
                        }}
                        variant="outline"
                      >
                        <Headphones className="mr-2 h-4 w-4" /> 
                        {isPlaying ? "Pausar" : "Ouvir"} Gravação
                      </Button>
                      
                      <Button 
                        onClick={transcribeRecording}
                        disabled={isTranscribing || transcript}
                        variant="outline"
                      >
                        {isTranscribing ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Transcrevendo...
                          </>
                        ) : (
                          <>
                            <FileText className="mr-2 h-4 w-4" /> Transcrever
                          </>
                        )}
                      </Button>
                    </>
                  )}
                  
                  {(transcript || notes) && (
                    <Button 
                      onClick={generateTasks}
                      disabled={isGeneratingTasks}
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      {isGeneratingTasks ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" /> Gerar Tarefas
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                {/* Audio element (hidden) */}
                <audio ref={audioRef} src={recordingUrl} className="hidden" controls />
                
                {/* Transcript display */}
                {transcript && (
                  <div className="mt-4 border rounded-lg p-4 bg-gray-50">
                    <h3 className="font-medium mb-2 flex items-center">
                      <FileText className="mr-2 h-4 w-4" /> Transcrição
                    </h3>
                    <div className="text-gray-700 whitespace-pre-wrap text-sm">
                      {transcript}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Meeting details card */}
          <Card>
            <CardHeader className="border-b">
              <div className="flex justify-between">
                <CardTitle>Detalhes</CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setShowDeleteAlert(true)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <h3 className="font-medium">Data</h3>
                    <p className="text-gray-600">
                      {new Date(meeting.date).toLocaleDateString()} 
                      {meeting.time && ` às ${meeting.time}`}
                    </p>
                  </div>
                </div>
                
                {meeting.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    <div>
                      <h3 className="font-medium">Local</h3>
                      <p className="text-gray-600">{meeting.location}</p>
                    </div>
                  </div>
                )}
                
                {meeting.attendees && meeting.attendees.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="h-5 w-5 text-gray-500" /> Participantes
                    </h3>
                    <div className="space-y-2">
                      {meeting.attendees.map((attendee, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {getInitials(attendee)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-gray-700">{getUserName(attendee)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Tasks Dialog */}
      <Dialog open={showTasksDialog} onOpenChange={setShowTasksDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Tarefas Sugeridas
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 max-h-[60vh] overflow-y-auto">
            <p className="text-sm text-gray-500 mb-4">
              A IA identificou as seguintes tarefas baseadas nas anotações e/ou transcrição da reunião.
              Selecione as que deseja criar:
            </p>
            
            <div className="space-y-4">
              {generatedTasks.map((task, index) => (
                <div 
                  key={index} 
                  className={`border rounded-lg p-4 ${
                    selectedTasks[task.title] ? "border-green-200 bg-green-50" : "border-gray-200"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Checkbox 
                      id={`task-${index}`}
                      checked={selectedTasks[task.title]}
                      onCheckedChange={(checked) => {
                        setSelectedTasks({
                          ...selectedTasks,
                          [task.title]: checked
                        });
                      }}
                    />
                    <div className="flex-1">
                      <label 
                        htmlFor={`task-${index}`} 
                        className="font-medium cursor-pointer"
                      >
                        {task.title}
                      </label>
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className="bg-gray-50">
                          Status: {task.status || "pendente"}
                        </Badge>
                        
                        {task.actual_deadline && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Prazo: {new Date(task.actual_deadline).toLocaleDateString()}
                          </Badge>
                        )}
                      </div>
                      
                      {task.relevance && (
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Relevância: {task.relevance}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowTasksDialog(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={createSelectedTasks}
              disabled={Object.values(selectedTasks).filter(Boolean).length === 0}
            >
              <Plus className="mr-2 h-4 w-4" /> 
              Criar {Object.values(selectedTasks).filter(Boolean).length} Tarefas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Reunião</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta reunião? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700"
              onClick={deleteMeeting}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
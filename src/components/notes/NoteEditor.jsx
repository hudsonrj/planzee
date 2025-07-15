import React, { useState } from "react";
import { User, Note, Task } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import {
  MessageSquare,
  Edit,
  Save,
  X,
  Sparkles,
  PlusCircle,
  Tag,
  Check,
  Trash2,
  Clock,
  User as UserIcon,
  RotateCw,
  ListTodo,
  Plus,
  Loader2,
  Lightbulb
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function NoteEditor({ projectId, onNoteSaved, existingNote = null }) {
  const [content, setContent] = useState(existingNote?.content || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [improvedContent, setImprovedContent] = useState("");
  const [isImproving, setIsImproving] = useState(false);
  const [showImproveDialog, setShowImproveDialog] = useState(false);
  const [showTasksDialog, setShowTasksDialog] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState([]);

  React.useEffect(() => {
    const loadCurrentUser = async () => {
      try {
        const userData = await User.me();
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error loading current user:", error);
      }
    };
    
    loadCurrentUser();
  }, []);

  const saveNote = async () => {
    if (!content.trim()) return;
    
    try {
      setIsSubmitting(true);
      
      if (existingNote) {
        // Update existing note
        await Note.update(existingNote.id, {
          ...existingNote,
          content: content,
          updated_date: new Date().toISOString()
        });
      } else {
        // Create new note
        const newNote = {
          content: content,
          type: "project",
          item_id: projectId,
          author: currentUser?.email || "anonymous",
          labels: [],
          is_private: false
        };
        
        await Note.create(newNote);
      }
      
      if (onNoteSaved) {
        onNoteSaved();
      }
      
      // Clear form if it's a new note
      if (!existingNote) {
        setContent("");
      }
      
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const improveNote = async () => {
    if (!content.trim()) return;
    
    try {
      setIsImproving(true);
      
      const result = await InvokeLLM({
        prompt: `
        Você é um assistente de escrita profissional, especializado em melhorar notas de projetos.
        
        Por favor, melhore a seguinte nota de projeto, tornando-a mais clara, concisa, bem estruturada
        e profissional, mantendo todas as informações importantes:
        
        "${content}"
        
        Melhore a formatação, clareza e profissionalismo. Corrija quaisquer erros gramaticais ou de ortografia.
        Adicione estrutura se necessário (como tópicos, seções, etc).
        
        Responda apenas com o texto melhorado, sem comentários adicionais.
        `,
      });
      
      setImprovedContent(result);
      setShowImproveDialog(true);
      
    } catch (error) {
      console.error("Error improving note:", error);
    } finally {
      setIsImproving(false);
    }
  };

  const extractTasksFromNote = async () => {
    if (!content.trim()) return;
    
    try {
      setIsExtracting(true);
      
      const result = await InvokeLLM({
        prompt: `
        Você é um assistente especializado em gerenciamento de projetos e análise de texto.
        
        Analise a seguinte nota de projeto e identifique todas as potenciais tarefas mencionadas
        que podem ser criadas como itens de ação:
        
        "${content}"
        
        Para cada tarefa identificada, forneça:
        1. Um título claro e conciso
        2. Uma descrição detalhada
        3. Uma estimativa razoável de horas para conclusão
        4. Uma sugestão de prioridade (baixa, média, alta)
        
        Retorne apenas tarefas que são claramente ações a serem realizadas, não fatos ou informações.
        Formate sua resposta como JSON.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            extracted_tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  estimated_hours: { type: "number" },
                  priority: { 
                    type: "string", 
                    enum: ["baixa", "média", "alta"]
                  }
                }
              }
            }
          }
        }
      });
      
      if (result && result.extracted_tasks && result.extracted_tasks.length > 0) {
        setExtractedTasks(result.extracted_tasks);
        setSelectedTasks(result.extracted_tasks.map((_, index) => index));
        setShowTasksDialog(true);
      } else {
        alert("Não foram encontradas tarefas na nota.");
      }
      
    } catch (error) {
      console.error("Error extracting tasks:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const createSelectedTasks = async () => {
    try {
      setIsSubmitting(true);
      
      const tasksToCreate = selectedTasks.map(index => {
        const task = extractedTasks[index];
        return {
          project_id: projectId,
          title: task.title,
          description: task.description,
          status: "pendente",
          estimated_hours: task.estimated_hours,
          ai_generated: true
        };
      });
      
      // Create all tasks using bulkCreate if available, or one by one
      if (tasksToCreate.length > 0) {
        for (const taskData of tasksToCreate) {
          await Task.create(taskData);
        }
        
        setShowTasksDialog(false);
        alert(`${tasksToCreate.length} tarefas criadas com sucesso!`);
      }
      
    } catch (error) {
      console.error("Error creating tasks:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskCheckboxChange = (index) => {
    if (selectedTasks.includes(index)) {
      setSelectedTasks(selectedTasks.filter(i => i !== index));
    } else {
      setSelectedTasks([...selectedTasks, index]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <Textarea
          placeholder="Digite uma nova nota de projeto..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[150px] resize-y"
        />
        <div className="flex justify-between items-center mt-2">
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mr-2"
              onClick={improveNote}
              disabled={!content.trim() || isImproving}
            >
              {isImproving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Melhorar Nota
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={extractTasksFromNote}
              disabled={!content.trim() || isExtracting}
            >
              {isExtracting ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ListTodo className="h-4 w-4 mr-1" />
              )}
              Extrair Tarefas
            </Button>
          </div>
          
          <Button
            onClick={saveNote}
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : existingNote ? (
              <Save className="h-4 w-4 mr-1" />
            ) : (
              <PlusCircle className="h-4 w-4 mr-1" />
            )}
            {existingNote ? "Atualizar" : "Adicionar Nota"}
          </Button>
        </div>
      </div>
      
      {/* Dialog para mostrar conteúdo melhorado */}
      <Dialog open={showImproveDialog} onOpenChange={setShowImproveDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Nota Melhorada
            </DialogTitle>
            <DialogDescription>
              Revisamos e aprimoramos sua nota com melhor estrutura e clareza
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 border rounded-lg bg-indigo-50 whitespace-pre-line mt-2">
            {improvedContent}
          </div>
          
          <DialogFooter className="flex justify-between">
            <Button 
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(improvedContent);
              }}
              className="mr-auto"
            >
              Copiar
            </Button>
            
            <div>
              <Button 
                variant="outline" 
                onClick={() => setShowImproveDialog(false)}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button 
                onClick={() => {
                  setContent(improvedContent);
                  setShowImproveDialog(false);
                }}
              >
                Usar Versão Melhorada
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para mostrar tarefas extraídas */}
      <Dialog open={showTasksDialog} onOpenChange={setShowTasksDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-indigo-500" />
              Tarefas Identificadas
            </DialogTitle>
            <DialogDescription>
              Identificamos as seguintes tarefas em sua nota. Selecione as que deseja criar:
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 mt-2">
            {extractedTasks.map((task, index) => (
              <div 
                key={index} 
                className={`p-4 border rounded-lg ${
                  selectedTasks.includes(index) ? "bg-indigo-50 border-indigo-200" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      checked={selectedTasks.includes(index)}
                      onChange={() => handleTaskCheckboxChange(index)}
                      className="h-5 w-5"
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium">{task.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge variant="outline">
                        {task.estimated_hours} {task.estimated_hours === 1 ? "hora" : "horas"}
                      </Badge>
                      <Badge className={
                        task.priority === "baixa" ? "bg-blue-100 text-blue-800" :
                        task.priority === "média" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }>
                        Prioridade {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {selectedTasks.length} de {extractedTasks.length} tarefas selecionadas
            </div>
            
            <div>
              <Button 
                variant="outline" 
                onClick={() => setShowTasksDialog(false)}
                className="mr-2"
              >
                Cancelar
              </Button>
              <Button 
                onClick={createSelectedTasks}
                disabled={selectedTasks.length === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Criar {selectedTasks.length} {selectedTasks.length === 1 ? "Tarefa" : "Tarefas"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
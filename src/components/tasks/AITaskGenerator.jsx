
import React, { useState, useEffect } from "react";
import { Task, Role } from "@/api/entities";
import { InvokeLLM } from "@/api/integrations";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  Sparkles,
  Briefcase,
  CalendarRange,
  DollarSign,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";

export default function AITaskGenerator({ isOpen, onClose, projectId, projectData, onTasksGenerated }) {
  const [prompt, setPrompt] = useState("");
  const [phase, setPhase] = useState("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState([]);
  const [selectedTasks, setSelectedTasks] = useState([]);
  const [step, setStep] = useState(1);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [taskDetailsVisible, setTaskDetailsVisible] = useState({});
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadRoles();
      setDefaultPrompt();
    }
  }, [isOpen, projectData]);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await Role.list();
      setRoles(rolesData);
    } catch (error) {
      console.error("Erro ao carregar funções:", error);
    } finally {
      setLoading(false);
    }
  };

  const setDefaultPrompt = () => {
    if (!projectData) return;
    
    const defaultPrompt = `Gerar tarefas para o projeto "${projectData.title}" com foco em ${projectData.status === 'ambiente' ? 'preparação do ambiente e definição de requisitos' : 
      projectData.status === 'poc' ? 'prova de conceito e validação técnica' : 
      projectData.status === 'mvp' ? 'desenvolvimento do produto mínimo viável' : 
      projectData.status === 'desenvolvimento' ? 'desenvolvimento completo das funcionalidades' : 
      'conclusão e entrega do projeto'}.`;
    
    setPrompt(defaultPrompt);
  };

  const toggleTaskDetail = (taskId) => {
    setTaskDetailsVisible(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handlePhaseChange = (value) => {
    setPhase(value);
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
  };

  const toggleTaskSelection = (task) => {
    if (selectedTasks.some(t => t.tempId === task.tempId)) {
      setSelectedTasks(selectedTasks.filter(t => t.tempId !== task.tempId));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const selectAll = () => {
    setSelectedTasks([...generatedTasks]);
  };

  const deselectAll = () => {
    setSelectedTasks([]);
  };

  const handleGenerateTasks = async () => {
    if (!prompt.trim()) {
      setErrorMessage("Por favor, informe o que deseja gerar.");
      return;
    }

    try {
      setErrorMessage("");
      setIsGenerating(true);
      setStep(1);
      setGeneratedTasks([]);
      setSelectedTasks([]);

      const projectPrompt = `
        Sou um gerente de projetos da Allied IT e preciso gerar um conjunto de tarefas detalhadas para o seguinte projeto:
        
        Título: ${projectData.title}
        Descrição: ${projectData.description || 'N/A'}
        Status: ${projectData.status}
        Prazo: ${projectData.deadline ? new Date(projectData.deadline).toLocaleDateString() : 'N/A'}
        
        Requisitos específicos: ${prompt}
        
        ${phase !== 'all' ? `As tarefas devem focar na fase de ${phase} do projeto.` : ''}
        
        Para cada tarefa, forneça:
        1. Um título claro e objetivo
        2. Uma descrição detalhada
        3. Um prazo estimado (em YYYY-MM-DD, considerando que hoje é ${new Date().toISOString().split('T')[0]})
        4. A função necessária (escolha entre: desenvolvimento, design, dados, infraestrutura, gestao, seguranca, qualidade, produto)
        5. O nível de senioridade requerido (junior, pleno, senior, especialista)
        6. Uma estimativa realista de horas para a conclusão da tarefa
        
        As tarefas devem seguir uma ordem lógica de implementação e cobrir todo o ciclo de vida do projeto ou fase solicitada.
      `;

      const result = await InvokeLLM({
        prompt: projectPrompt,
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
                  deadline: { type: "string" },
                  function_category: { type: "string" },
                  seniority_level: { type: "string" },
                  estimated_hours: { type: "number" }
                }
              }
            }
          }
        }
      });

      if (result.tasks && result.tasks.length > 0) {
        const tasksWithCost = result.tasks.map((task, index) => {
          const roleMatch = roles.find(r => r.category === task.function_category);
          let hourlyRate = 0;
          let totalCost = 0;
          let roleId = null;
          
          if (roleMatch) {
            roleId = roleMatch.id;
            const levelData = roleMatch.seniority_levels?.find(l => 
              l.level === task.seniority_level
            );
            
            if (levelData) {
              if (levelData.hourly_rate) {
                hourlyRate = levelData.hourly_rate;
              } else if (levelData.hourly_rate_min && levelData.hourly_rate_max) {
                hourlyRate = (levelData.hourly_rate_min + levelData.hourly_rate_max) / 2;
              }
              
              totalCost = hourlyRate * task.estimated_hours;
            }
          }
          
          return {
            ...task,
            tempId: `temp-${index}`,
            role_id: roleId,
            hourly_rate: hourlyRate,
            total_cost: totalCost,
            role_title: roleMatch?.title || "Indefinido"
          };
        });
        
        setGeneratedTasks(tasksWithCost);
        setSelectedTasks(tasksWithCost);
        setStep(2);
      } else {
        setErrorMessage("Não consegui gerar tarefas. Por favor, tente um prompt diferente.");
      }
    } catch (error) {
      console.error("Erro ao gerar tarefas:", error);
      setErrorMessage("Ocorreu um erro ao gerar as tarefas. Por favor, tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveTasks = async () => {
    if (selectedTasks.length === 0) {
      setErrorMessage("Selecione pelo menos uma tarefa para salvar.");
      return;
    }

    try {
      setLoading(true);
      
      for (const task of selectedTasks) {
        const taskToCreate = {
          project_id: projectId,
          title: task.title,
          description: task.description,
          deadline: task.deadline,
          status: "pendente",
          role_id: task.role_id,
          seniority_level: task.seniority_level,
          estimated_hours: task.estimated_hours,
          hourly_rate: task.hourly_rate,
          total_cost: task.total_cost,
          ai_generated: true
        };
        
        await Task.create(taskToCreate);
      }
      
      onTasksGenerated();
      onClose();
    } catch (error) {
      console.error("Erro ao salvar tarefas:", error);
      setErrorMessage("Ocorreu um erro ao salvar as tarefas.");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const getSeniorityLabel = (level) => {
    const labels = {
      junior: "Júnior",
      pleno: "Pleno",
      senior: "Sênior",
      especialista: "Especialista",
      coordenador: "Coordenador",
      gerente: "Gerente"
    };
    return labels[level] || level;
  };

  const getCategoryLabel = (category) => {
    const labels = {
      desenvolvimento: "Desenvolvimento",
      design: "Design",
      dados: "Dados",
      infraestrutura: "Infraestrutura",
      gestao: "Gestão",
      seguranca: "Segurança",
      qualidade: "Qualidade",
      produto: "Produto"
    };
    return labels[category] || category;
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const filteredTasks = generatedTasks.filter(task => {
    const taskTitle = (task.title || "").toLowerCase();
    const taskDescription = (task.description || "").toLowerCase();
    const searchTerm = (searchText || "").toLowerCase();
    
    return taskTitle.includes(searchTerm) || taskDescription.includes(searchTerm);
  });

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="phase">Fase do Projeto</Label>
        <Select value={phase} onValueChange={handlePhaseChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione a fase" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as fases</SelectItem>
            <SelectItem value="ambiente">Ambiente</SelectItem>
            <SelectItem value="poc">POC</SelectItem>
            <SelectItem value="mvp">MVP</SelectItem>
            <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
            <SelectItem value="produção">Produção</SelectItem>
            <SelectItem value="conclusão">Conclusão</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">Descreva quais tarefas deseja gerar</Label>
        <Textarea
          id="prompt"
          placeholder="Ex: Gerar tarefas para desenvolvimento do frontend do sistema com React..."
          value={prompt}
          onChange={handlePromptChange}
          rows={4}
        />
      </div>

      {errorMessage && (
        <div className="text-red-500 flex items-center mt-2">
          <AlertCircle className="w-4 h-4 mr-2" />
          {errorMessage}
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-500">
          {selectedTasks.length} de {generatedTasks.length} tarefas selecionadas
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={selectAll}>
            Selecionar Todas
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>
            Limpar Seleção
          </Button>
        </div>
      </div>

      <Input
        type="search"
        placeholder="Buscar tarefas..."
        value={searchText}
        onChange={handleSearch}
        className="mb-4"
      />

      {filteredTasks.length > 0 ? (
        <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
          {filteredTasks.map((task) => (
            <motion.div
              key={task.tempId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Card className={`p-4 ${selectedTasks.some(t => t.tempId === task.tempId) ? 'border-indigo-300 bg-indigo-50' : ''}`}>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={selectedTasks.some(t => t.tempId === task.tempId)}
                    onCheckedChange={() => toggleTaskSelection(task)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium">{task.title}</h3>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0" 
                        onClick={() => toggleTaskDetail(task.tempId)}
                      >
                        {taskDetailsVisible[task.tempId] ? 
                          <ChevronUp className="h-4 w-4" /> : 
                          <ChevronDown className="h-4 w-4" />
                        }
                      </Button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="flex items-center gap-1 bg-gray-50">
                        <Briefcase className="h-3 w-3" />
                        {task.role_title || getCategoryLabel(task.function_category)}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1 bg-gray-50">
                        <Briefcase className="h-3 w-3" />
                        {getSeniorityLabel(task.seniority_level)}
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1 bg-gray-50">
                        <Clock className="h-3 w-3" />
                        {task.estimated_hours}h
                      </Badge>
                      <Badge variant="outline" className="flex items-center gap-1 bg-gray-50">
                        <DollarSign className="h-3 w-3" />
                        {formatCurrency(task.total_cost)}
                      </Badge>
                      {task.deadline && (
                        <Badge variant="outline" className="flex items-center gap-1 bg-gray-50">
                          <CalendarRange className="h-3 w-3" />
                          {new Date(task.deadline).toLocaleDateString()}
                        </Badge>
                      )}
                    </div>
                    
                    {taskDetailsVisible[task.tempId] && (
                      <div className="mt-3 text-sm text-gray-600 bg-white p-3 rounded-md">
                        {task.description}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          Nenhuma tarefa encontrada
        </div>
      )}

      {errorMessage && (
        <div className="text-red-500 flex items-center mt-2">
          <AlertCircle className="w-4 h-4 mr-2" />
          {errorMessage}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="w-5 h-5 text-indigo-500 mr-2" />
            Gerar Tarefas com IA
          </DialogTitle>
          <DialogDescription>
            {step === 1 
              ? "Descreva as tarefas que deseja gerar para o projeto" 
              : "Revise e selecione as tarefas que deseja adicionar ao projeto"}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? renderStep1() : renderStep2()}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          
          {step === 1 ? (
            <Button 
              onClick={handleGenerateTasks} 
              disabled={isGenerating || !prompt.trim()} 
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Gerar Tarefas
                </>
              )}
            </Button>
          ) : (
            <Button 
              onClick={handleSaveTasks} 
              disabled={loading || selectedTasks.length === 0}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Adicionar Tarefas ({selectedTasks.length})
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

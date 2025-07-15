
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Budget, Project, User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { AlertTriangle, Calendar as CalendarIcon, Plus, Save, Trash2, ArrowLeft, Bot, FileText, Loader2 } from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function BudgetCreate() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const isAIMode = urlParams.get("ai") === "true";
  
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showPromptDialog, setShowPromptDialog] = useState(isAIMode);
  
  const [budget, setBudget] = useState({
    title: "",
    client_name: "",
    client_email: "",
    project_id: "",
    description: "",
    scope: "",
    requirements: [],
    items: [],
    total_value: 0,
    proposed_deadline: 30,
    start_date: format(new Date(), "yyyy-MM-dd"),
    end_date: format(new Date(new Date().setDate(new Date().getDate() + 30)), "yyyy-MM-dd"),
    payment_terms: "50% na aprovação, 25% na entrega parcial, 25% na entrega final",
    validity_period: 30,
    additional_notes: "",
    responsible: "",
    status: "rascunho",
    ai_generated: isAIMode
  });
  
  const [currentItem, setCurrentItem] = useState({
    description: "",
    type: "serviço",
    unit_price: 0,
    quantity: 1,
    total: 0
  });
  
  const [currentRequirement, setCurrentRequirement] = useState("");
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setLoadingProjects(true);
      
      const [projectsData, userData] = await Promise.all([
        Project.list(),
        User.me()
      ]);
      
      setProjects(projectsData);
      setCurrentUser(userData);
      
      setBudget(prev => ({
        ...prev,
        responsible: userData.email
      }));
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoadingProjects(false);
    }
  };
  
  const generateWithAI = async () => {
    if (!aiPrompt.trim()) {
      alert("Por favor, informe uma descrição detalhada do projeto para gerar o orçamento.");
      return;
    }
    
    try {
      setAiGenerating(true);
      
      const prompt = `
        Crie um orçamento técnico detalhado de TI para o seguinte projeto: "${aiPrompt}".
        
        O orçamento deve ser extremamente completo e profissional, seguindo os mais altos padrões do mercado brasileiro atual de TI, e incluir:
        
        1. Um título técnico apropriado para o projeto
        2. Uma descrição técnica detalhada incluindo arquitetura proposta e fluxo de trabalho
        3. Um escopo preciso do trabalho incluindo todas as fases e entregáveis
        4. Lista de requisitos técnicos e funcionais (mínimo 8 itens)
        5. Planejamento estratégico completo com metodologia de projeto (ex: Scrum, Kanban, Waterfall)
           - Detalhamento de sprints ou fases de trabalho
           - Estrutura de reuniões recorrentes (daily, planning, review, etc.)
           - Processo de acompanhamento e métricas de qualidade
           - Estratégia de testes e homologação
        6. Orçamento DETALHADO para implementação em 3 ambientes de cloud distintos:
           a) AWS - detalhando serviços específicos da AWS incluindo:
              - Nomes técnicos exatos dos serviços (EC2, Lambda, RDS, etc)
              - Especificações técnicas completas (família de instâncias, vCPUs, RAM, etc)
              - Tipo de armazenamento (SSD, HDD, capacidade em GB/TB)
              - Largura de banda/networking
              - Custos estimados com valores em Reais
           b) Azure - detalhando serviços específicos com as mesmas especificações:
              - Nomes técnicos exatos dos serviços Azure
              - Especificações técnicas completas
              - Custos estimados em Reais
           c) GCP - detalhando serviços específicos com as mesmas especificações:
              - Nomes técnicos exatos dos serviços GCP
              - Especificações técnicas completas
              - Custos estimados em Reais
        7. Opção detalhada de implementação em VPS, especificando:
           - Modelos exatos de servidores
           - CPUs (modelo, núcleos, velocidade)
           - RAM (quantidade, tipo, velocidade)
           - Armazenamento (tipo, capacidade, RAID se aplicável)
           - Sistema operacional e versões específicas
           - Software necessário com licenciamento
           - Configurações de rede e segurança
           - Backup e redundância
        8. Detalhamento da equipe necessária com grande especificidade:
           - Cargos/funções dos profissionais
           - Senioridade exigida (júnior, pleno, sênior)
           - Certificações recomendadas
           - Quantidade de horas estimadas por profissional/fase
           - Valor/hora para cada tipo de profissional
        9. Cronograma detalhado com marcos e prazos
        10. Condições de pagamento estruturadas
        11. Observações adicionais incluindo considerações de segurança, performance, e manutenção pós-implantação
        
        Forneça valores em Reais (R$) realistas para o mercado brasileiro atual.
        Seja extremamente técnico e específico em cada componente (hardware, software, serviços).
        IMPORTANTE: garanta que sejam incluídas opções claras e completas para AWS, Azure, GCP e VPS, cada uma 
        com especificações técnicas detalhadas e comparáveis.
      `;
      
      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            scope: { type: "string" },
            requirements: { 
              type: "array", 
              items: { type: "string" } 
            },
            methodology: {
              type: "object",
              properties: {
                name: { type: "string" },
                description: { type: "string" },
                phases: { 
                  type: "array", 
                  items: { 
                    type: "object", 
                    properties: { 
                      name: { type: "string" },
                      description: { type: "string" },
                      duration: { type: "number" }
                    }
                  }
                },
                meetings: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      frequency: { type: "string" },
                      participants: { type: "string" },
                      purpose: { type: "string" }
                    }
                  }
                }
              }
            },
            cloud_options: {
              type: "object",
              properties: {
                aws: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      service_name: { type: "string" },
                      specifications: { type: "string" },
                      unit_price: { type: "number" },
                      quantity: { type: "number" },
                      period: { type: "string" },
                      total: { type: "number" }
                    }
                  }
                },
                azure: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      service_name: { type: "string" },
                      specifications: { type: "string" },
                      unit_price: { type: "number" },
                      quantity: { type: "number" },
                      period: { type: "string" },
                      total: { type: "number" }
                    }
                  }
                },
                gcp: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      service_name: { type: "string" },
                      specifications: { type: "string" },
                      unit_price: { type: "number" },
                      quantity: { type: "number" },
                      period: { type: "string" },
                      total: { type: "number" }
                    }
                  }
                },
                vps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      description: { type: "string" },
                      specifications: { type: "string" },
                      unit_price: { type: "number" },
                      quantity: { type: "number" },
                      period: { type: "string" },
                      total: { type: "number" }
                    }
                  }
                }
              }
            },
            team: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: { type: "string" },
                  seniority: { type: "string" },
                  hourly_rate: { type: "number" },
                  hours: { type: "number" },
                  total: { type: "number" }
                }
              }
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  description: { type: "string" },
                  type: { type: "string" },
                  unit_price: { type: "number" },
                  quantity: { type: "number" },
                  total: { type: "number" }
                }
              }
            },
            proposed_deadline: { type: "number" },
            payment_terms: { type: "string" },
            additional_notes: { type: "string" }
          }
        }
      });
      
      let combinedItems = [];
      
      if (response.cloud_options?.aws) {
        response.cloud_options.aws.forEach(service => {
          combinedItems.push({
            description: `AWS: ${service.description} (${service.service_name}) - ${service.specifications}`,
            type: "serviço",
            unit_price: service.unit_price,
            quantity: service.quantity,
            total: service.total
          });
        });
      }
      
      if (response.cloud_options?.azure) {
        response.cloud_options.azure.forEach(service => {
          combinedItems.push({
            description: `Azure: ${service.description} (${service.service_name}) - ${service.specifications}`,
            type: "serviço",
            unit_price: service.unit_price,
            quantity: service.quantity,
            total: service.total
          });
        });
      }
      
      if (response.cloud_options?.gcp) {
        response.cloud_options.gcp.forEach(service => {
          combinedItems.push({
            description: `GCP: ${service.description} (${service.service_name}) - ${service.specifications}`,
            type: "serviço",
            unit_price: service.unit_price,
            quantity: service.quantity,
            total: service.total
          });
        });
      }
      
      if (response.cloud_options?.vps) {
        response.cloud_options.vps.forEach(service => {
          combinedItems.push({
            description: `VPS: ${service.description} - ${service.specifications}`,
            type: "serviço",
            unit_price: service.unit_price,
            quantity: service.quantity,
            total: service.total
          });
        });
      }
      
      if (response.team) {
        response.team.forEach(member => {
          combinedItems.push({
            description: `Profissional: ${member.role} (${member.seniority})`,
            type: "mão_de_obra",
            unit_price: member.hourly_rate,
            quantity: member.hours,
            total: member.total
          });
        });
      }
      
      if (response.items) {
        combinedItems = [...combinedItems, ...response.items];
      }
      
      const total = combinedItems.reduce((sum, item) => sum + item.total, 0);
      
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + response.proposed_deadline);
      
      let additionalNotes = response.additional_notes || '';
      
      if (response.methodology) {
        additionalNotes += `\n\n===== METODOLOGIA DE PROJETO =====\n`;
        additionalNotes += `${response.methodology.name}: ${response.methodology.description}\n\n`;
        
        if (response.methodology.phases && response.methodology.phases.length > 0) {
          additionalNotes += "FASES DO PROJETO:\n";
          response.methodology.phases.forEach((phase, index) => {
            additionalNotes += `${index+1}. ${phase.name} (${phase.duration} dias): ${phase.description}\n`;
          });
          additionalNotes += "\n";
        }
        
        if (response.methodology.meetings && response.methodology.meetings.length > 0) {
          additionalNotes += "REUNIÕES RECORRENTES:\n";
          response.methodology.meetings.forEach((meeting, index) => {
            additionalNotes += `${index+1}. ${meeting.name} (${meeting.frequency}): ${meeting.purpose}\n   Participantes: ${meeting.participants}\n`;
          });
        }
      }
      
      setBudget({
        ...budget,
        title: response.title,
        description: response.description,
        scope: response.scope,
        requirements: response.requirements,
        items: combinedItems,
        total_value: total,
        proposed_deadline: response.proposed_deadline,
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
        payment_terms: response.payment_terms,
        additional_notes: additionalNotes,
        ai_generated: true
      });
      
      setShowPromptDialog(false);
    } catch (error) {
      console.error("Erro ao gerar orçamento com IA:", error);
      alert("Ocorreu um erro ao gerar o orçamento. Por favor, tente novamente.");
    } finally {
      setAiGenerating(false);
    }
  };
  
  const addRequirement = () => {
    if (!currentRequirement.trim()) return;
    
    setBudget(prev => ({
      ...prev,
      requirements: [...prev.requirements, currentRequirement]
    }));
    
    setCurrentRequirement("");
  };
  
  const removeRequirement = (index) => {
    setBudget(prev => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index)
    }));
  };
  
  const handleItemChange = (e) => {
    const { name, value } = e.target;
    
    setCurrentItem(prev => {
      const updatedItem = { ...prev, [name]: name === "unit_price" || name === "quantity" ? parseFloat(value) || 0 : value };
      
      if (name === "unit_price" || name === "quantity") {
        updatedItem.total = updatedItem.unit_price * updatedItem.quantity;
      }
      
      return updatedItem;
    });
  };
  
  const addItem = () => {
    if (!currentItem.description.trim()) return;
    
    setBudget(prev => {
      const updatedItems = [...prev.items, currentItem];
      const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: updatedItems,
        total_value: newTotal
      };
    });
    
    setCurrentItem({
      description: "",
      type: "serviço",
      unit_price: 0,
      quantity: 1,
      total: 0
    });
  };
  
  const removeItem = (index) => {
    setBudget(prev => {
      const updatedItems = prev.items.filter((_, i) => i !== index);
      const newTotal = updatedItems.reduce((sum, item) => sum + item.total, 0);
      
      return {
        ...prev,
        items: updatedItems,
        total_value: newTotal
      };
    });
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setBudget(prev => ({ ...prev, [name]: value }));
  };
  
  const saveBudget = async () => {
    if (!budget.title || !budget.client_name || !budget.client_email || !budget.scope || budget.items.length === 0) {
      alert("Por favor, preencha todos os campos obrigatórios e adicione pelo menos um item ao orçamento.");
      return;
    }
    
    try {
      setLoading(true);
      
      const today = new Date().toISOString().split('T')[0];
      const newBudget = {
        ...budget,
        created_date: today,
        last_modified_date: today
      };
      
      const createdBudget = await Budget.create(newBudget);
      
      navigate(createPageUrl("Budgets"));
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      alert("Ocorreu um erro ao salvar o orçamento. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    }).format(value);
  };
  
  if (loadingProjects) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(createPageUrl("Budgets"))}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {isAIMode ? "Criar Orçamento com IA" : "Criar Orçamento"}
            </h1>
            <p className="text-gray-500 mt-1">
              Preencha os detalhes do orçamento
            </p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex gap-2">
          {isAIMode && (
            <Button 
              variant="outline" 
              onClick={() => setShowPromptDialog(true)} 
              disabled={aiGenerating}
              className="gap-2"
            >
              <Bot className="h-4 w-4" />
              Modificar Prompt
            </Button>
          )}
          
          <Button 
            onClick={saveBudget} 
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Salvar Rascunho
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="title">Título do Orçamento *</Label>
                  <Input 
                    id="title" 
                    name="title" 
                    value={budget.title} 
                    onChange={handleChange} 
                    placeholder="Ex: Desenvolvimento de Sistema ERP" 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="client_name">Nome do Cliente *</Label>
                    <Input 
                      id="client_name" 
                      name="client_name" 
                      value={budget.client_name} 
                      onChange={handleChange} 
                      placeholder="Ex: Empresa ABC Ltda" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="client_email">Email do Cliente *</Label>
                    <Input 
                      id="client_email" 
                      name="client_email" 
                      type="email" 
                      value={budget.client_email} 
                      onChange={handleChange} 
                      placeholder="Ex: contato@empresaabc.com.br" 
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="project_id">Projeto Relacionado (Opcional)</Label>
                  <Select 
                    value={budget.project_id} 
                    onValueChange={(value) => setBudget(prev => ({ ...prev, project_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto (opcional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={null}>Nenhum</SelectItem>
                      {projects.map(project => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Escopo e Requisitos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="description">Descrição Geral</Label>
                <Textarea 
                  id="description" 
                  name="description" 
                  value={budget.description} 
                  onChange={handleChange} 
                  placeholder="Descreva brevemente o projeto" 
                  className="min-h-[80px]"
                />
              </div>
              
              <div>
                <Label htmlFor="scope">Escopo Detalhado *</Label>
                <Textarea 
                  id="scope" 
                  name="scope" 
                  value={budget.scope} 
                  onChange={handleChange} 
                  placeholder="Descreva em detalhes o escopo do projeto, incluindo entregas e limites" 
                  className="min-h-[120px]"
                />
              </div>
              
              <div>
                <Label>Requisitos</Label>
                <div className="flex gap-2 mt-2">
                  <Input 
                    value={currentRequirement} 
                    onChange={(e) => setCurrentRequirement(e.target.value)} 
                    placeholder="Adicionar requisito" 
                    onKeyDown={(e) => e.key === "Enter" && addRequirement()}
                  />
                  <Button variant="outline" onClick={addRequirement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {budget.requirements.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {budget.requirements.map((req, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <span>{req}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeRequirement(index)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Itens do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="item_description">Descrição *</Label>
                  <Input 
                    id="item_description" 
                    name="description" 
                    value={currentItem.description} 
                    onChange={handleItemChange} 
                    placeholder="Ex: Desenvolvimento Frontend" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="item_type">Tipo</Label>
                  <Select 
                    value={currentItem.type} 
                    onValueChange={(value) => setCurrentItem(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="serviço">Serviço</SelectItem>
                      <SelectItem value="produto">Produto</SelectItem>
                      <SelectItem value="licença">Licença</SelectItem>
                      <SelectItem value="mão_de_obra">Mão de Obra</SelectItem>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="item_unit_price">Preço Unitário (R$)</Label>
                  <Input 
                    id="item_unit_price" 
                    name="unit_price" 
                    type="number" 
                    value={currentItem.unit_price} 
                    onChange={handleItemChange} 
                    placeholder="0.00" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="item_quantity">Quantidade</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="item_quantity" 
                      name="quantity" 
                      type="number" 
                      value={currentItem.quantity} 
                      onChange={handleItemChange} 
                      placeholder="1" 
                    />
                    <Button onClick={addItem} className="shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              {budget.items.length > 0 ? (
                <div className="mt-4 border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Preço Unit.</TableHead>
                        <TableHead>Qtd</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budget.items.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.description}</TableCell>
                          <TableCell>{item.type}</TableCell>
                          <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell className="font-medium">{formatCurrency(item.total)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 border border-dashed rounded-md">
                  <FileText className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-gray-500">Nenhum item adicionado ao orçamento</p>
                  <p className="text-sm text-gray-400">Adicione itens utilizando o formulário acima</p>
                </div>
              )}
              
              {budget.items.length > 0 && (
                <div className="flex justify-end pt-4 border-t">
                  <div className="text-right">
                    <div className="text-sm text-gray-500">Valor Total:</div>
                    <div className="text-xl font-bold">{formatCurrency(budget.total_value)}</div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Condições e Prazos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="proposed_deadline">Prazo Proposto (dias) *</Label>
                <Input 
                  id="proposed_deadline" 
                  name="proposed_deadline" 
                  type="number" 
                  value={budget.proposed_deadline} 
                  onChange={handleChange} 
                  min="1"
                />
              </div>
              
              <div>
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  name="start_date"
                  value={budget.start_date}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <Label>Data de Término</Label>
                <Input
                  type="date"
                  name="end_date"
                  value={budget.end_date}
                  onChange={handleChange}
                />
              </div>
              
              <div>
                <Label htmlFor="payment_terms">Condições de Pagamento</Label>
                <Textarea 
                  id="payment_terms" 
                  name="payment_terms" 
                  value={budget.payment_terms} 
                  onChange={handleChange} 
                  placeholder="Ex: 50% na assinatura, 50% na entrega" 
                />
              </div>
              
              <div>
                <Label htmlFor="validity_period">Validade do Orçamento (dias)</Label>
                <Input 
                  id="validity_period" 
                  name="validity_period" 
                  type="number" 
                  value={budget.validity_period} 
                  onChange={handleChange} 
                  min="1"
                />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Observações Adicionais</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea 
                name="additional_notes" 
                value={budget.additional_notes} 
                onChange={handleChange} 
                placeholder="Quaisquer informações adicionais relevantes para o orçamento" 
                className="min-h-[120px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={showPromptDialog} onOpenChange={setShowPromptDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Gerar Orçamento Técnico Detalhado com IA</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Label htmlFor="ai_prompt" className="mb-2 block">
              Descreva detalhadamente o projeto de TI para o qual deseja criar um orçamento
            </Label>
            <Textarea 
              id="ai_prompt" 
              value={aiPrompt} 
              onChange={(e) => setAiPrompt(e.target.value)} 
              placeholder="Ex: Desenvolvimento de um sistema ERP completo para gestão de uma indústria de manufatura com 50 funcionários, incluindo módulos de produção, estoque, vendas, compras, financeiro e RH. O sistema deve ter acesso web e mobile, além de dashboards para gestão." 
              className="min-h-[150px]"
            />
            
            <div className="mt-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
              <span className="text-sm text-gray-500">
                Para resultados mais precisos, forneça informações detalhadas sobre o escopo, requisitos técnicos, escala do projeto, e quaisquer tecnologias específicas desejadas. A IA gerará um orçamento técnico completo com opções para AWS, Azure, GCP e VPS, além do detalhamento de profissionais e custos.
              </span>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                if (isAIMode && !budget.title) {
                  navigate(createPageUrl("Budgets"));
                } else {
                  setShowPromptDialog(false);
                }
              }}
            >
              {isAIMode && !budget.title ? "Cancelar" : "Fechar"}
            </Button>
            <Button 
              onClick={generateWithAI} 
              disabled={aiGenerating || !aiPrompt.trim()}
              className="gap-2"
            >
              {aiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Gerar Orçamento Técnico
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

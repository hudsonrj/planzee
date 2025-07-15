
import React, { useState, useEffect } from "react";
import { Project, Infrastructure, Task } from "@/api/entities"; 
import { InvokeLLM } from "@/api/integrations";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Server,
  Cloud,
  HardDrive,
  Database,
  Network,
  Shield,
  Users,
  Gauge,
  Trash2,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Bot,
  ServerCrash,
  FileBarChart,
  DollarSign,
  CloudCog,
  CloudRain,
  Brain,
  HelpCircle,
  PlusIcon,
  Settings, // Added for manual mode button
  Save, // Added for save manual plan button
  Plus // Added for add resource button
} from "lucide-react";

export default function InfrastructurePage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);
  const [infrastructurePlans, setInfrastructurePlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isCreatingPlan, setIsCreatingPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("aws");
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [deletingPlanId, setDeletingPlanId] = useState(null);
  const [tasks, setTasks] = useState([]);
  
  const [manualMode, setManualMode] = useState(false); // New state for manual mode
  const [manualPlan, setManualPlan] = useState({
    project_id: "",
    created_date: new Date().toISOString().split('T')[0],
    requirements: {
      user_type: "business",
      concurrent_users: 50,
      data_volume: "medium",
      traffic_pattern: "business_hours",
      compliance_requirements: [],
      high_availability: false,
      disaster_recovery: false,
      additional_info: ""
    },
    environments: {
      development: true,
      staging: true,
      production: true
    },
    selected_provider: "aws", // Default provider for manual
    monthly_cost: 0,
    resources: [], // Array to hold manually added resources
    architecture_recommendations: "",
    security_recommendations: "",
    status: "draft"
  });
  
  const [currentResource, setCurrentResource] = useState({
    name: "",
    type: "servidor",
    specifications: "",
    monthly_cost: 0,
    environment: "production"
  });

  const [newPlan, setNewPlan] = useState({
    project_id: "",
    requirements: {
      user_type: "business",
      concurrent_users: 50,
      data_volume: "medium",
      traffic_pattern: "business_hours",
      compliance_requirements: [],
      high_availability: false,
      disaster_recovery: false,
      additional_info: ""
    },
    environments: {
      development: true,
      staging: true,
      production: true
    }
  });
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    if (selectedProjectId) {
      const project = projects.find(p => p.id === selectedProjectId);
      setSelectedProject(project);
      loadInfrastructurePlans(selectedProjectId);
      loadProjectTasks(selectedProjectId);
      // Update newPlan and manualPlan project_id when selectedProjectId changes
      setNewPlan(prev => ({ ...prev, project_id: selectedProjectId }));
      setManualPlan(prev => ({ ...prev, project_id: selectedProjectId }));
    } else {
      setSelectedProject(null);
      setInfrastructurePlans([]);
      setTasks([]);
    }
  }, [selectedProjectId, projects]); // Added projects to dependency array

  // Reset steps and mode when creating plan starts or ends
  useEffect(() => {
    if (!isCreatingPlan) {
      setCurrentStep(1);
      setError("");
    }
  }, [isCreatingPlan]);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      const projectsData = await Project.list();
      setProjects(projectsData);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      setError("Erro ao carregar projetos. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadInfrastructurePlans = async (projectId) => {
    try {
      setIsLoading(true);
      const plans = await Infrastructure.filter({ project_id: projectId });
      setInfrastructurePlans(plans);
    } catch (error) {
            console.error("Erro ao carregar planos de infraestrutura:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const loadProjectTasks = async (projectId) => {
    try {
      const tasksData = await Task.filter({ project_id: projectId });
      setTasks(tasksData);
    } catch (error) {
      console.error("Erro ao carregar tarefas do projeto:", error);
    }
  };
  
  const handleProjectSelect = (projectId) => {
    setSelectedProjectId(projectId);
    setNewPlan(prev => ({ ...prev, project_id: projectId }));
    setManualPlan(prev => ({ ...prev, project_id: projectId })); // Update manualPlan too
    setCurrentStep(1);
  };
  
  const handleStartPlanCreation = () => {
    setManualMode(false); // Ensure AI mode
    setIsCreatingPlan(true);
    setCurrentStep(1);
    setNewPlan(prev => ({ ...prev, project_id: selectedProjectId })); // Ensure project ID is set for new AI plan
  };

  const handleStartManualCreation = () => {
    setManualMode(true); // Enable manual mode
    setIsCreatingPlan(true);
    setCurrentStep(1);
    setManualPlan(prev => ({ ...prev, project_id: selectedProjectId })); // Ensure project ID is set for new manual plan
  };
  
  const handleRequirementChange = (field, value) => {
    setNewPlan(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }));
  };
  
  const handleComplianceToggle = (value) => {
    setNewPlan(prev => {
      const currentCompliance = prev.requirements.compliance_requirements || [];
      const newCompliance = currentCompliance.includes(value)
        ? currentCompliance.filter(v => v !== value)
        : [...currentCompliance, value];
      
      return {
        ...prev,
        requirements: {
          ...prev.requirements,
          compliance_requirements: newCompliance
        }
      };
    });
  };
  
  const handleEnvironmentToggle = (env, checked) => {
    setNewPlan(prev => ({
      ...prev,
      environments: {
        ...prev.environments,
        [env]: checked
      }
    }));
  };

  // Manual Mode handlers
  const handleManualRequirementChange = (field, value) => {
    setManualPlan(prev => ({
      ...prev,
      requirements: {
        ...prev.requirements,
        [field]: value
      }
    }));
  };

  const handleManualComplianceToggle = (value) => {
    setManualPlan(prev => {
      const currentCompliance = prev.requirements.compliance_requirements || [];
      const newCompliance = currentCompliance.includes(value)
        ? currentCompliance.filter(v => v !== value)
        : [...currentCompliance, value];
      
      return {
        ...prev,
        requirements: {
          ...prev.requirements,
          compliance_requirements: newCompliance
        }
      };
    });
  };

  const handleManualEnvironmentToggle = (env, checked) => {
    setManualPlan(prev => ({
      ...prev,
      environments: {
        ...prev.environments,
        [env]: checked
      }
    }));
  };

  const handleResourceChange = (field, value) => {
    setCurrentResource(prev => ({
      ...prev,
      [field]: field === 'monthly_cost' ? parseFloat(value) || 0 : value
    }));
  };

  const addResource = () => {
    if (!currentResource.name || !currentResource.specifications) {
      setError("Por favor, preencha o nome e as especificações do recurso.");
      return;
    }

    setManualPlan(prev => {
      const updatedResources = [...prev.resources, currentResource];
      const newTotalCost = updatedResources.reduce((sum, resource) => sum + resource.monthly_cost, 0);
      
      return {
        ...prev,
        resources: updatedResources,
        monthly_cost: newTotalCost
      };
    });

    setCurrentResource({
      name: "",
      type: "servidor",
      specifications: "",
      monthly_cost: 0,
      environment: "production" // Default to production, but can be changed
    });
    setError("");
  };

  const removeResource = (index) => {
    setManualPlan(prev => {
      const updatedResources = prev.resources.filter((_, i) => i !== index);
      const newTotalCost = updatedResources.reduce((sum, resource) => sum + resource.monthly_cost, 0);
      
      return {
        ...prev,
        resources: updatedResources,
        monthly_cost: newTotalCost
      };
    });
  };
  
  const nextStep = () => {
    setError(""); // Clear previous errors
    
    if (manualMode) {
      if (currentStep === 1) {
        if (!selectedProjectId) {
          setError("Por favor, selecione um projeto para continuar.");
          return;
        }
      } else if (currentStep === 2) {
        if (!manualPlan.requirements.user_type || !manualPlan.requirements.concurrent_users) {
          setError("Por favor, preencha todos os campos obrigatórios.");
          return;
        }
      } else if (currentStep === 3) {
        if (!manualPlan.environments.development && 
            !manualPlan.environments.staging && 
            !manualPlan.environments.production) {
          setError("Por favor, selecione pelo menos um ambiente.");
          return;
        }
        if (!manualPlan.selected_provider) {
          setError("Por favor, selecione um provedor de infraestrutura.");
          return;
        }
      }
      setCurrentStep(prev => prev + 1);
      return;
    }

    // AI Mode logic
    if (currentStep === 1) {
      if (!selectedProjectId) {
        setError("Por favor, selecione um projeto para continuar.");
        return;
      }
    } else if (currentStep === 2) {
      if (!newPlan.requirements.user_type || !newPlan.requirements.concurrent_users) {
        setError("Por favor, preencha todos os campos obrigatórios.");
        return;
      }
    } else if (currentStep === 3) {
      if (!newPlan.environments.development && 
          !newPlan.environments.staging && 
          !newPlan.environments.production) {
        setError("Por favor, selecione pelo menos um ambiente.");
        return;
      }
      generateInfrastructureRecommendations();
      return;
    }
    
    setCurrentStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
    setError("");
  };
  
  const generateInfrastructureRecommendations = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      if (!selectedProject) {
        setError("Selecione um projeto primeiro");
        return;
      }
      
      const promptPart1 = `
        Você é um arquiteto de soluções cloud especializado em infraestrutura para projetos de inovação digital. Preciso de sua ajuda para criar um plano de infraestrutura detalhado para um projeto com os seguintes requisitos:
        
        Detalhes do projeto:
        - Título: ${selectedProject.title}
        - Descrição: ${selectedProject.description}
        - Status atual: ${selectedProject.status}
        - Prazo final: ${selectedProject.deadline || "Não definido"}
        
        Requisitos de infraestrutura especificados:
        - Tipo de usuários: ${newPlan.requirements.user_type || "Não especificado"}
        - Usuários concorrentes: ${newPlan.requirements.concurrent_users || "Não especificado"}
        - Volume de dados: ${newPlan.requirements.data_volume || "Não especificado"}
        - Padrão de tráfego: ${newPlan.requirements.traffic_pattern || "Não especificado"}
        - Requisitos de conformidade: ${newPlan.requirements.compliance_requirements?.join(", ") || "Nenhum"}
        - Alta disponibilidade necessária: ${newPlan.requirements.high_availability ? "Sim" : "Não"}
        - Recuperação de desastres necessária: ${newPlan.requirements.disaster_recovery ? "Sim" : "Não"}
        - Informações adicionais: ${newPlan.requirements.additional_info || "Nenhuma"}
        
        Ambientes necessários:
        - Desenvolvimento: ${newPlan.environments.development ? "Sim" : "Não"}
        - Homologação: ${newPlan.environments.staging ? "Sim" : "Não"}
        - Produção: ${newPlan.environments.production ? "Sim" : "Não"}
        
        Para os provedores de nuvem AWS e Azure apenas, forneça uma solução detalhada com:
        
        1. Componentes específicos para cada ambiente ativo (desenvolvimento, homologação e produção), considerando que:
          - Ambiente de desenvolvimento: recursos mínimos necessários para desenvolvimento e testes
          - Ambiente de homologação: similar ao de produção, mas com capacidade reduzida
          - Ambiente de produção: recursos completos para atender aos requisitos
          
        2. Para cada componente, especifique:
          - Nome do recurso (ex: EC2 t3.medium, Azure App Service B2, etc.)
          - Tipo (servidor, banco de dados, rede, armazenamento, etc.)
          - Especificações técnicas (CPU, RAM, capacidade, etc.)
          - Custo mensal estimado em BRL (R$)
          
        3. Para cada provedor, forneça:
          - Custo mensal total
          
        Os componentes devem ser realistas e específicos de cada provedor, não genéricos.
        Os preços devem refletir o mercado brasileiro atual.
      `;
      
      const responsePart1 = await InvokeLLM({
        prompt: promptPart1,
        response_json_schema: {
          type: "object",
          properties: {
            aws_solution: {
              type: "object",
              properties: {
                monthly_cost: { type: "number" },
                resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      specifications: { type: "string" },
                      monthly_cost: { type: "number" },
                      environment: { type: "string", enum: ["development", "staging", "production"] }
                    }
                  }
                }
              }
            },
            azure_solution: {
              type: "object",
              properties: {
                monthly_cost: { type: "number" },
                resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      specifications: { type: "string" },
                      monthly_cost: { type: "number" },
                      environment: { type: "string", enum: ["development", "staging", "production"] }
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      const promptPart2 = `
        Você é um arquiteto de soluções cloud especializado em infraestrutura para projetos de inovação digital. Preciso de sua ajuda para criar um plano de infraestrutura detalhado para um projeto com os seguintes requisitos:
        
        Detalhes do projeto:
        - Título: ${selectedProject.title}
        - Descrição: ${selectedProject.description}
        - Status atual: ${selectedProject.status}
        - Prazo final: ${selectedProject.deadline || "Não definido"}
        
        Requisitos de infraestrutura especificados:
        - Tipo de usuários: ${newPlan.requirements.user_type || "Não especificado"}
        - Usuários concorrentes: ${newPlan.requirements.concurrent_users || "Não especificado"}
        - Volume de dados: ${newPlan.requirements.data_volume || "Não especificado"}
        - Padrão de tráfego: ${newPlan.requirements.traffic_pattern || "Não especificado"}
        - Requisitos de conformidade: ${newPlan.requirements.compliance_requirements?.join(", ") || "Nenhum"}
        - Alta disponibilidade necessária: ${newPlan.requirements.high_availability ? "Sim" : "Não"}
        - Recuperação de desastres necessária: ${newPlan.requirements.disaster_recovery ? "Sim" : "Não"}
        - Informações adicionais: ${newPlan.requirements.additional_info || "Nenhuma"}
        
        Ambientes necessários:
        - Desenvolvimento: ${newPlan.environments.development ? "Sim" : "Não"}
        - Homologação: ${newPlan.environments.staging ? "Sim" : "Não"}
        - Produção: ${newPlan.environments.production ? "Sim" : "Não"}
        
        Para o provedor de nuvem GCP e para um modelo de VPS tradicional apenas, forneça uma solução detalhada com:
        
        1. Componentes específicos para cada ambiente ativo (desenvolvimento, homologação e produção), considerando que:
          - Ambiente de desenvolvimento: recursos mínimos necessários para desenvolvimento e testes
          - Ambiente de homologação: similar ao de produção, mas com capacidade reduzida
          - Ambiente de produção: recursos completos para atender aos requisitos
          
        2. Para cada componente, especifique:
          - Nome do recurso (ex: GCE n1-standard-2, VPS 4 cores, etc.)
          - Tipo (servidor, banco de dados, rede, armazenamento, etc.)
          - Especificações técnicas (CPU, RAM, capacidade, etc.)
          - Custo mensal estimado em BRL (R$)
          
        3. Para cada provedor, forneça:
          - Custo mensal total
        
        Os componentes devem ser realistas e específicos de cada provedor, não genéricos.
        Os preços devem refletir o mercado brasileiro atual.
      `;
      
      const responsePart2 = await InvokeLLM({
        prompt: promptPart2,
        response_json_schema: {
          type: "object",
          properties: {
            gcp_solution: {
              type: "object",
              properties: {
                monthly_cost: { type: "number" },
                resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      specifications: { type: "string" },
                      monthly_cost: { type: "number" },
                      environment: { type: "string", enum: ["development", "staging", "production"] }
                    }
                  }
                }
              }
            },
            vps_solution: {
              type: "object",
              properties: {
                monthly_cost: { type: "number" },
                resources: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: { type: "string" },
                      specifications: { type: "string" },
                      monthly_cost: { type: "number" },
                      environment: { type: "string", enum: ["development", "staging", "production"] }
                    }
                  }
                }
              }
            }
          }
        }
      });
      
      const promptPart3 = `
        Você é um arquiteto de soluções cloud especializado em infraestrutura para projetos de inovação digital. Com base nos requisitos abaixo, forneça recomendações gerais de arquitetura e segurança:
        
        Detalhes do projeto:
        - Título: ${selectedProject.title}
        - Descrição: ${selectedProject.description}
        - Status atual: ${selectedProject.status}
        
        Requisitos de infraestrutura especificados:
        - Tipo de usuários: ${newPlan.requirements.user_type || "Não especificado"}
        - Usuários concorrentes: ${newPlan.requirements.concurrent_users || "Não especificado"}
        - Volume de dados: ${newPlan.requirements.data_volume || "Não especificado"}
        - Padrão de tráfego: ${newPlan.requirements.traffic_pattern || "Não especificado"}
        - Requisitos de conformidade: ${newPlan.requirements.compliance_requirements?.join(", ") || "Nenhum"}
        - Alta disponibilidade necessária: ${newPlan.requirements.high_availability ? "Sim" : "Não"}
        - Recuperação de desastres necessária: ${newPlan.requirements.disaster_recovery ? "Sim" : "Não"}
        
        Forneça apenas:
        1. Recomendações gerais de arquitetura (independente do provedor)
        2. Recomendações de segurança (independente do provedor)
        
        Seja detalhado, específico e técnico nas recomendações.
      `;
      
      const responsePart3 = await InvokeLLM({
        prompt: promptPart3,
        response_json_schema: {
          type: "object",
          properties: {
            architecture_recommendations: { type: "string" },
            security_recommendations: { type: "string" }
          }
        }
      });
      
      setCurrentPlan({
        ...newPlan,
        aws_solution: responsePart1.aws_solution,
        azure_solution: responsePart1.azure_solution,
        gcp_solution: responsePart2.gcp_solution,
        vps_solution: responsePart2.vps_solution,
        architecture_recommendations: responsePart3.architecture_recommendations,
        security_recommendations: responsePart3.security_recommendations
      });
      
      setCurrentStep(4);
      
    } catch (error) {
      console.error("Erro ao gerar recomendações:", error);
      setError("Erro ao gerar recomendações. Por favor, tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };
  
  const savePlan = async (selectedProvider) => {
    try {
      setIsLoading(true);
      
      let monthlyCost = 0;
      
      switch (selectedProvider) {
        case "aws":
          monthlyCost = currentPlan.aws_solution?.monthly_cost || 0;
          break;
        case "azure":
          monthlyCost = currentPlan.azure_solution?.monthly_cost || 0;
          break;
        case "gcp":
          monthlyCost = currentPlan.gcp_solution?.monthly_cost || 0;
          break;
        case "vps":
          monthlyCost = currentPlan.vps_solution?.monthly_cost || 0;
          break;
      }
      
      const finalPlan = {
        ...currentPlan,
        created_date: new Date().toISOString().split('T')[0],
        selected_provider: selectedProvider,
        monthly_cost: monthlyCost,
        status: "active"
      };
      
      await Infrastructure.create(finalPlan);
      
      const tasksCost = tasks.reduce((sum, task) => sum + (task.total_cost || 0), 0);
      
      await Project.update(selectedProjectId, {
        infrastructure_cost: monthlyCost,
        infrastructure_provider: selectedProvider,
        total_estimated_cost: tasksCost + monthlyCost
      });
      
      loadInfrastructurePlans(selectedProjectId);
      loadData();
      
      setIsCreatingPlan(false);
      setManualMode(false); // Reset manual mode
      setCurrentPlan(null);
      setNewPlan({
        project_id: selectedProjectId,
        requirements: {
          user_type: "business",
          concurrent_users: 50,
          data_volume: "medium",
          traffic_pattern: "business_hours",
          compliance_requirements: [],
          high_availability: false,
          disaster_recovery: false,
          additional_info: ""
        },
        environments: {
          development: true,
          staging: true,
          production: true
        }
      });
      
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      setError("Ocorreu um erro ao salvar o plano. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const saveManualPlan = async () => {
    try {
      setIsLoading(true);
      
      if (!manualPlan.project_id || manualPlan.resources.length === 0) {
        setError("Por favor, selecione um projeto e adicione pelo menos um recurso.");
        return;
      }

      // Prepare the manual plan to fit the Infrastructure entity schema
      // Only the selected_provider solution will have resources. Others will be empty.
      const finalPlan = {
        ...manualPlan,
        created_date: new Date().toISOString().split('T')[0],
        status: "active",
        aws_solution: undefined,
        azure_solution: undefined,
        gcp_solution: undefined,
        vps_solution: undefined,
      };

      // Populate the specific solution based on selected_provider
      const solutionKey = `${manualPlan.selected_provider}_solution`;
      finalPlan[solutionKey] = {
        monthly_cost: manualPlan.monthly_cost,
        resources: manualPlan.resources
      };

      await Infrastructure.create(finalPlan);
      
      const tasksCost = tasks.reduce((sum, task) => sum + (task.total_cost || 0), 0);
      
      await Project.update(selectedProjectId, {
        infrastructure_cost: manualPlan.monthly_cost,
        infrastructure_provider: manualPlan.selected_provider,
        total_estimated_cost: tasksCost + manualPlan.monthly_cost
      });

      loadInfrastructurePlans(selectedProjectId);
      loadData();
      
      setIsCreatingPlan(false);
      setManualMode(false);
      setCurrentPlan(null); // Clear currentPlan from AI mode
      setManualPlan({ // Reset manual plan state
        project_id: selectedProjectId, // Keep current project
        created_date: new Date().toISOString().split('T')[0],
        requirements: {
          user_type: "business",
          concurrent_users: 50,
          data_volume: "medium",
          traffic_pattern: "business_hours",
          compliance_requirements: [],
          high_availability: false,
          disaster_recovery: false,
          additional_info: ""
        },
        environments: {
          development: true,
          staging: true,
          production: true
        },
        selected_provider: "aws",
        monthly_cost: 0,
        resources: [],
        architecture_recommendations: "",
        security_recommendations: "",
        status: "draft"
      });
      setCurrentResource({ // Reset current resource state
        name: "",
        type: "servidor",
        specifications: "",
        monthly_cost: 0,
        environment: "production"
      });
      
    } catch (error) {
      console.error("Erro ao salvar plano manual:", error);
      setError("Ocorreu um erro ao salvar o plano. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDeletePlan = async (planId) => {
    setDeletingPlanId(planId);
    setConfirmationOpen(true);
  };
  
  const confirmDeletePlan = async () => {
    try {
      setIsLoading(true);
      
      const planToDelete = infrastructurePlans.find(p => p.id === deletingPlanId);
      
      await Infrastructure.delete(deletingPlanId);
      
      if (planToDelete && planToDelete.status === "active") {
        await Project.update(selectedProjectId, {
          infrastructure_cost: 0,
          infrastructure_provider: null,
          total_estimated_cost: tasks.reduce((sum, task) => sum + (task.total_cost || 0), 0)
        });
      }
      
      loadInfrastructurePlans(selectedProjectId);
      loadData();
      
      setConfirmationOpen(false);
      setDeletingPlanId(null);
      
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
      setError("Ocorreu um erro ao excluir o plano. Por favor, tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const renderManualStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-medium">Configuração Manual de Infraestrutura</h2>
              <p className="text-gray-500">
                Configure manualmente os recursos e especificações da infraestrutura.
              </p>
              
              <Select 
                value={selectedProjectId} 
                onValueChange={(value) => {
                  setSelectedProjectId(value);
                  setManualPlan(prev => ({ ...prev, project_id: value }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProject && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedProject.title}</CardTitle>
                  <CardDescription>
                    <Badge className="mr-2">{selectedProject.status}</Badge>
                    <Badge variant="outline">
                      {selectedProject.deadline ? format(new Date(selectedProject.deadline), 'dd/MM/yyyy') : 'Sem prazo'}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">{selectedProject.description || 'Sem descrição'}</p>
                </CardContent>
              </Card>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium">Requisitos de Infraestrutura</h2>
              <p className="text-gray-500 mb-4">
                Defina os requisitos básicos para a infraestrutura.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="manual_user_type">Tipo de Usuários</Label>
                  <Select 
                    value={manualPlan.requirements.user_type} 
                    onValueChange={(value) => handleManualRequirementChange('user_type', value)}
                  >
                    <SelectTrigger id="manual_user_type">
                      <SelectValue placeholder="Selecione o tipo de usuários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Internos (Colaboradores)</SelectItem>
                      <SelectItem value="public">Públicos (Clientes/Externos)</SelectItem>
                      <SelectItem value="mixed">Mistos (Internos e Externos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="manual_concurrent_users">Usuários Concorrentes Estimados</Label>
                  <Input 
                    id="manual_concurrent_users" 
                    type="number" 
                    min="1"
                    value={manualPlan.requirements.concurrent_users} 
                    onChange={(e) => handleManualRequirementChange('concurrent_users', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="manual_data_volume">Volume de Dados Esperado</Label>
                  <Select 
                    value={manualPlan.requirements.data_volume} 
                    onValueChange={(value) => handleManualRequirementChange('data_volume', value)}
                  >
                    <SelectTrigger id="manual_data_volume">
                      <SelectValue placeholder="Selecione o volume de dados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeno (&lt; 50GB)</SelectItem>
                      <SelectItem value="medium">Médio (50GB - 500GB)</SelectItem>
                      <SelectItem value="large">Grande (500GB - 5TB)</SelectItem>
                      <SelectItem value="very_large">Muito Grande (&gt; 5TB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Requisitos de Compliance</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manual_lgpd" 
                        checked={manualPlan.requirements.compliance_requirements?.includes("LGPD")}
                        onCheckedChange={(checked) => handleManualComplianceToggle("LGPD")}
                      />
                      <Label htmlFor="manual_lgpd">LGPD</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manual_pci_dss" 
                        checked={manualPlan.requirements.compliance_requirements?.includes("PCI-DSS")}
                        onCheckedChange={(checked) => handleManualComplianceToggle("PCI-DSS")}
                      />
                      <Label htmlFor="manual_pci_dss">PCI-DSS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manual_hipaa" 
                        checked={manualPlan.requirements.compliance_requirements?.includes("HIPAA")}
                        onCheckedChange={(checked) => handleManualComplianceToggle("HIPAA")}
                      />
                      <Label htmlFor="manual_hipaa">HIPAA</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manual_iso_27001" 
                        checked={manualPlan.requirements.compliance_requirements?.includes("ISO 27001")}
                        onCheckedChange={(checked) => handleManualComplianceToggle("ISO 27001")}
                      />
                      <Label htmlFor="manual_iso_27001">ISO 27001</Label>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Alta Disponibilidade</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manual_high_availability" 
                        checked={manualPlan.requirements.high_availability}
                        onCheckedChange={(checked) => handleManualRequirementChange('high_availability', !!checked)}
                      />
                      <Label htmlFor="manual_high_availability">Necessário</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Recuperação de Desastres</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="manual_disaster_recovery" 
                        checked={manualPlan.requirements.disaster_recovery}
                        onCheckedChange={(checked) => handleManualRequirementChange('disaster_recovery', !!checked)}
                      />
                      <Label htmlFor="manual_disaster_recovery">Necessário</Label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium">Ambientes e Provedor</h2>
              <p className="text-gray-500 mb-4">
                Selecione os ambientes e o provedor de infraestrutura.
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-3 block">Ambientes de Implantação</Label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="manual_env_development" 
                      checked={manualPlan.environments.development}
                      onCheckedChange={(checked) => handleManualEnvironmentToggle('development', !!checked)}
                    />
                    <div>
                      <Label htmlFor="manual_env_development" className="font-medium">Ambiente de Desenvolvimento</Label>
                      <p className="text-sm text-gray-500">Usado para desenvolvimento e testes iniciais.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="manual_env_staging" 
                      checked={manualPlan.environments.staging}
                      onCheckedChange={(checked) => handleManualEnvironmentToggle('staging', !!checked)}
                    />
                    <div>
                      <Label htmlFor="manual_env_staging" className="font-medium">Ambiente de Homologação</Label>
                      <p className="text-sm text-gray-500">Usado para testes de aceitação de usuário.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="manual_env_production" 
                      checked={manualPlan.environments.production}
                      onCheckedChange={(checked) => handleManualEnvironmentToggle('production', !!checked)}
                    />
                    <div>
                      <Label htmlFor="manual_env_production" className="font-medium">Ambiente de Produção</Label>
                      <p className="text-sm text-gray-500">Ambiente final onde os usuários utilizarão o sistema.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="manual_provider">Provedor de Infraestrutura</Label>
                <Select 
                  value={manualPlan.selected_provider} 
                  onValueChange={(value) => setManualPlan(prev => ({ ...prev, selected_provider: value }))}
                >
                  <SelectTrigger id="manual_provider">
                    <SelectValue placeholder="Selecione o provedor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aws">Amazon Web Services (AWS)</SelectItem>
                    <SelectItem value="azure">Microsoft Azure</SelectItem>
                    <SelectItem value="gcp">Google Cloud Platform (GCP)</SelectItem>
                    <SelectItem value="vps">VPS (Servidor Virtual Privado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium">Recursos da Infraestrutura</h2>
              <p className="text-gray-500 mb-4">
                Adicione e configure os recursos necessários para a infraestrutura.
              </p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Adicionar Recurso</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="resource_name">Nome do Recurso *</Label>
                    <Input 
                      id="resource_name" 
                      value={currentResource.name} 
                      onChange={(e) => handleResourceChange('name', e.target.value)}
                      placeholder="Ex: EC2 t3.medium, Azure VM B2s"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="resource_type">Tipo</Label>
                    <Select 
                      value={currentResource.type} 
                      onValueChange={(value) => handleResourceChange('type', value)}
                    >
                      <SelectTrigger id="resource_type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="servidor">Servidor</SelectItem>
                        <SelectItem value="banco_dados">Banco de Dados</SelectItem>
                        <SelectItem value="armazenamento">Armazenamento</SelectItem>
                        <SelectItem value="rede">Rede</SelectItem>
                        <SelectItem value="balanceador">Balanceador de Carga</SelectItem>
                        <SelectItem value="cdn">CDN</SelectItem>
                        <SelectItem value="monitoramento">Monitoramento</SelectItem>
                        <SelectItem value="backup">Backup</SelectItem>
                        <SelectItem value="seguranca">Segurança</SelectItem>
                        <SelectItem value="outro">Outro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="resource_environment">Ambiente</Label>
                  <Select 
                    value={currentResource.environment} 
                    onValueChange={(value) => handleResourceChange('environment', value)}
                  >
                    <SelectTrigger id="resource_environment">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {manualPlan.environments.development && (
                        <SelectItem value="development">Desenvolvimento</SelectItem>
                      )}
                      {manualPlan.environments.staging && (
                        <SelectItem value="staging">Homologação</SelectItem>
                      )}
                      {manualPlan.environments.production && (
                        <SelectItem value="production">Produção</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="resource_specifications">Especificações *</Label>
                  <Textarea 
                    id="resource_specifications" 
                    value={currentResource.specifications} 
                    onChange={(e) => handleResourceChange('specifications', e.target.value)}
                    placeholder="Ex: 2 vCPUs, 4GB RAM, 20GB SSD, Ubuntu 22.04"
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <Label htmlFor="resource_cost">Custo Mensal (R$)</Label>
                  <Input 
                    id="resource_cost" 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={currentResource.monthly_cost} 
                    onChange={(e) => handleResourceChange('monthly_cost', e.target.value)}
                    placeholder="0.00"
                  />
                </div>

                <Button onClick={addResource} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Recurso
                </Button>
              </CardContent>
            </Card>

            {manualPlan.resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recursos Adicionados</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nome</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Ambiente</TableHead>
                        <TableHead>Especificações</TableHead>
                        <TableHead>Custo Mensal</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualPlan.resources.map((resource, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{resource.name}</TableCell>
                          <TableCell>{resource.type}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {resource.environment === "development" ? "Desenvolvimento" : 
                                resource.environment === "staging" ? "Homologação" : "Produção"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{resource.specifications}</TableCell>
                          <TableCell>{formatCurrency(resource.monthly_cost)}</TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeResource(index)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="flex justify-end pt-4 border-t mt-4">
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Custo Total Mensal:</div>
                      <div className="text-xl font-bold">{formatCurrency(manualPlan.monthly_cost)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="architecture_notes">Notas de Arquitetura (Opcional)</Label>
                <Textarea 
                  id="architecture_notes" 
                  value={manualPlan.architecture_recommendations} 
                  onChange={(e) => setManualPlan(prev => ({ ...prev, architecture_recommendations: e.target.value }))}
                  placeholder="Adicione observações sobre a arquitetura proposta..."
                  className="min-h-[100px]"
                />
              </div>
              
              <div>
                <Label htmlFor="security_notes">Notas de Segurança (Opcional)</Label>
                <Textarea 
                  id="security_notes" 
                  value={manualPlan.security_recommendations} 
                  onChange={(e) => setManualPlan(prev => ({ ...prev, security_recommendations: e.target.value }))}
                  placeholder="Adicione observações sobre segurança..."
                  className="min-h-[100px]"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderStepContent = () => {
    if (manualMode) {
      return renderManualStepContent();
    }
    
    // AI mode rendering logic
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <h2 className="text-xl font-medium">Selecione um Projeto</h2>
              <p className="text-gray-500">
                Escolha o projeto para o qual deseja criar um plano de infraestrutura.
              </p>
              
              <Select 
                value={selectedProjectId} 
                onValueChange={handleProjectSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedProject && (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedProject.title}</CardTitle>
                  <CardDescription>
                    <Badge className="mr-2">{selectedProject.status}</Badge>
                    <Badge variant="outline">
                      {selectedProject.deadline ? format(new Date(selectedProject.deadline), 'dd/MM/yyyy') : 'Sem prazo'}
                    </Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-500 mb-4">{selectedProject.description || 'Sem descrição'}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium">Tarefas:</p>
                      <p>{tasks.length}</p>
                    </div>
                    <div>
                      <p className="font-medium">Custo atual de infraestrutura:</p>
                      <p>{formatCurrency(selectedProject.infrastructure_cost || 0)}/mês</p>
                    </div>
                    <div>
                      <p className="font-medium">Provedor atual:</p>
                      <p>{selectedProject.infrastructure_provider || 'Nenhum'}</p>
                    </div>
                    <div>
                      <p className="font-medium">Progresso:</p>
                      <p>{selectedProject.progress || 0}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium">Requisitos de Infraestrutura</h2>
              <p className="text-gray-500 mb-4">
                Forneça informações sobre os requisitos de infraestrutura para o projeto.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user_type">Tipo de Usuários</Label>
                  <Select 
                    value={newPlan.requirements.user_type} 
                    onValueChange={(value) => handleRequirementChange('user_type', value)}
                  >
                    <SelectTrigger id="user_type">
                      <SelectValue placeholder="Selecione o tipo de usuários" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business">Internos (Colaboradores)</SelectItem>
                      <SelectItem value="public">Públicos (Clientes/Externos)</SelectItem>
                      <SelectItem value="mixed">Mistos (Internos e Externos)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="concurrent_users">Usuários Concorrentes Estimados</Label>
                  <Input 
                    id="concurrent_users" 
                    type="number" 
                    min="1"
                    value={newPlan.requirements.concurrent_users} 
                    onChange={(e) => handleRequirementChange('concurrent_users', parseInt(e.target.value))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="data_volume">Volume de Dados Esperado</Label>
                  <Select 
                    value={newPlan.requirements.data_volume} 
                    onValueChange={(value) => handleRequirementChange('data_volume', value)}
                  >
                    <SelectTrigger id="data_volume">
                      <SelectValue placeholder="Selecione o volume de dados" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Pequeno (&lt; 50GB)</SelectItem>
                      <SelectItem value="medium">Médio (50GB - 500GB)</SelectItem>
                      <SelectItem value="large">Grande (500GB - 5TB)</SelectItem>
                      <SelectItem value="very_large">Muito Grande (&gt; 5TB)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="traffic_pattern">Padrão de Tráfego</Label>
                  <Select 
                    value={newPlan.requirements.traffic_pattern} 
                    onValueChange={(value) => handleRequirementChange('traffic_pattern', value)}
                  >
                    <SelectTrigger id="traffic_pattern">
                      <SelectValue placeholder="Selecione o padrão de tráfego" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="business_hours">Horário Comercial</SelectItem>
                      <SelectItem value="24_7">24/7 (Uso Constante)</SelectItem>
                      <SelectItem value="peak_times">Picos de Horário</SelectItem>
                      <SelectItem value="variable">Variável/Sazonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block">Requisitos de Compliance</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="lgpd" 
                        checked={newPlan.requirements.compliance_requirements?.includes("LGPD")}
                        onCheckedChange={(checked) => handleComplianceToggle("LGPD")}
                      />
                      <Label htmlFor="lgpd">LGPD</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="pci_dss" 
                        checked={newPlan.requirements.compliance_requirements?.includes("PCI-DSS")}
                        onCheckedChange={(checked) => handleComplianceToggle("PCI-DSS")}
                      />
                      <Label htmlFor="pci_dss">PCI-DSS</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="hipaa" 
                        checked={newPlan.requirements.compliance_requirements?.includes("HIPAA")}
                        onCheckedChange={(checked) => handleComplianceToggle("HIPAA")}
                      />
                      <Label htmlFor="hipaa">HIPAA</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="iso_27001" 
                        checked={newPlan.requirements.compliance_requirements?.includes("ISO 27001")}
                        onCheckedChange={(checked) => handleComplianceToggle("ISO 27001")}
                      />
                      <Label htmlFor="iso_27001">ISO 27001</Label>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="mb-2 block">Alta Disponibilidade</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="high_availability" 
                        checked={newPlan.requirements.high_availability}
                        onCheckedChange={(checked) => handleRequirementChange('high_availability', !!checked)}
                      />
                      <Label htmlFor="high_availability">Necessário</Label>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="mb-2 block">Recuperação de Desastres</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="disaster_recovery" 
                        checked={newPlan.requirements.disaster_recovery}
                        onCheckedChange={(checked) => handleRequirementChange('disaster_recovery', !!checked)}
                      />
                      <Label htmlFor="disaster_recovery">Necessário</Label>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="additional_info">Informações Adicionais (opcional)</Label>
                  <Textarea 
                    id="additional_info" 
                    value={newPlan.requirements.additional_info || ''} 
                    onChange={(e) => handleRequirementChange('additional_info', e.target.value)}
                    placeholder="Informe requisitos específicos adicionais, tecnologias necessárias, etc."
                  />
                </div>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium">Ambientes de Implantação</h2>
              <p className="text-gray-500 mb-4">
                Selecione quais ambientes deseja implantar para o projeto.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="env_development" 
                  checked={newPlan.environments.development}
                  onCheckedChange={(checked) => handleEnvironmentToggle('development', !!checked)}
                />
                <div>
                  <Label htmlFor="env_development" className="font-medium">Ambiente de Desenvolvimento</Label>
                  <p className="text-sm text-gray-500">
                    Usado para desenvolvimento e testes iniciais.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="env_staging" 
                  checked={newPlan.environments.staging}
                  onCheckedChange={(checked) => handleEnvironmentToggle('staging', !!checked)}
                />
                <div>
                  <Label htmlFor="env_staging" className="font-medium">Ambiente de Homologação</Label>
                  <p className="text-sm text-gray-500">
                    Usado para testes de aceitação de usuário e validação final.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="env_production" 
                  checked={newPlan.environments.production}
                  onCheckedChange={(checked) => handleEnvironmentToggle('production', !!checked)}
                />
                <div>
                  <Label htmlFor="env_production" className="font-medium">Ambiente de Produção</Label>
                  <p className="text-sm text-gray-500">
                    Ambiente final onde os usuários reais utilizarão o sistema.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-amber-50 p-4 rounded-md border border-amber-200">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-800 font-medium">Observações sobre os ambientes:</p>
                  <ul className="text-sm text-amber-700 list-disc ml-5 mt-1">
                    <li>Ambientes de desenvolvimento e homologação geralmente são menos robustos que o de produção</li>
                    <li>O custo total considerará todos os ambientes selecionados</li>
                    <li>Para projetos menores, considere combinar desenvolvimento e homologação</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-medium">Recomendações de Infraestrutura</h2>
              <p className="text-gray-500 mb-4">
                Revise as opções de infraestrutura geradas e selecione a mais adequada para o projeto.
              </p>
            </div>
            
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="aws" className="flex items-center gap-2">
                  <Cloud className="h-4 w-4" /> AWS
                </TabsTrigger>
                <TabsTrigger value="azure" className="flex items-center gap-2">
                  <CloudCog className="h-4 w-4" /> Azure
                </TabsTrigger>
                <TabsTrigger value="gcp" className="flex items-center gap-2">
                  <CloudRain className="h-4 w-4" /> GCP
                </TabsTrigger>
                <TabsTrigger value="vps" className="flex items-center gap-2">
                  <Server className="h-4 w-4" /> VPS
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="aws">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>AWS</span>
                      <Badge className="ml-2">
                        {formatCurrency(currentPlan?.aws_solution?.monthly_cost || 0)}/mês
                      </Badge>
                    </CardTitle>
                    <CardDescription>Amazon Web Services</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Ambiente</TableHead>
                          <TableHead>Especificações</TableHead>
                          <TableHead className="text-right">Custo Mensal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPlan?.aws_solution?.resources?.map((resource, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{resource.name}</TableCell>
                            <TableCell>{resource.type}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {resource.environment === "development" ? "Desenvolvimento" : 
                                  resource.environment === "staging" ? "Homologação" : "Produção"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{resource.specifications}</TableCell>
                            <TableCell className="text-right">{formatCurrency(resource.monthly_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium">Total Mensal:</p>
                      <p className="text-xl font-bold">{formatCurrency(currentPlan?.aws_solution?.monthly_cost)}</p>
                    </div>
                    <Button onClick={() => savePlan("aws")}>
                      Selecionar AWS
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="azure">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>Azure</span>
                      <Badge className="ml-2">
                        {formatCurrency(currentPlan?.azure_solution?.monthly_cost || 0)}/mês
                      </Badge>
                    </CardTitle>
                    <CardDescription>Microsoft Azure</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Ambiente</TableHead>
                          <TableHead>Especificações</TableHead>
                          <TableHead className="text-right">Custo Mensal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPlan?.azure_solution?.resources?.map((resource, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{resource.name}</TableCell>
                            <TableCell>{resource.type}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {resource.environment === "development" ? "Desenvolvimento" : 
                                  resource.environment === "staging" ? "Homologação" : "Produção"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{resource.specifications}</TableCell>
                            <TableCell className="text-right">{formatCurrency(resource.monthly_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium">Total Mensal:</p>
                      <p className="text-xl font-bold">{formatCurrency(currentPlan?.azure_solution?.monthly_cost)}</p>
                    </div>
                    <Button onClick={() => savePlan("azure")}>
                      Selecionar Azure
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="gcp">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>GCP</span>
                      <Badge className="ml-2">
                        {formatCurrency(currentPlan?.gcp_solution?.monthly_cost || 0)}/mês
                      </Badge>
                    </CardTitle>
                    <CardDescription>Google Cloud Platform</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Ambiente</TableHead>
                          <TableHead>Especificações</TableHead>
                          <TableHead className="text-right">Custo Mensal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPlan?.gcp_solution?.resources?.map((resource, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{resource.name}</TableCell>
                            <TableCell>{resource.type}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {resource.environment === "development" ? "Desenvolvimento" : 
                                  resource.environment === "staging" ? "Homologação" : "Produção"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{resource.specifications}</TableCell>
                            <TableCell className="text-right">{formatCurrency(resource.monthly_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium">Total Mensal:</p>
                      <p className="text-xl font-bold">{formatCurrency(currentPlan?.gcp_solution?.monthly_cost)}</p>
                    </div>
                    <Button onClick={() => savePlan("gcp")}>
                      Selecionar GCP
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              
              <TabsContent value="vps">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex justify-between">
                      <span>VPS</span>
                      <Badge className="ml-2">
                        {formatCurrency(currentPlan?.vps_solution?.monthly_cost || 0)}/mês
                      </Badge>
                    </CardTitle>
                    <CardDescription>Servidores Virtuais Privados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Ambiente</TableHead>
                          <TableHead>Especificações</TableHead>
                          <TableHead className="text-right">Custo Mensal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentPlan?.vps_solution?.resources?.map((resource, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{resource.name}</TableCell>
                            <TableCell>{resource.type}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {resource.environment === "development" ? "Desenvolvimento" : 
                                  resource.environment === "staging" ? "Homologação" : "Produção"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{resource.specifications}</TableCell>
                            <TableCell className="text-right">{formatCurrency(resource.monthly_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <div>
                      <p className="text-sm font-medium">Total Mensal:</p>
                      <p className="text-xl font-bold">{formatCurrency(currentPlan?.vps_solution?.monthly_cost)}</p>
                    </div>
                    <Button onClick={() => savePlan("vps")}>
                      Selecionar VPS
                    </Button>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-indigo-500" />
                    Recomendações de Arquitetura
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {currentPlan?.architecture_recommendations || "Nenhuma recomendação disponível."}
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-indigo-500" />
                    Recomendações de Segurança
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">
                    {currentPlan?.security_recommendations || "Nenhuma recomendação disponível."}
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
              <div className="flex items-start gap-2">
                <HelpCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm text-blue-800 font-medium">Comparativo de Provedores:</p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-100 text-indigo-800">AWS: {formatCurrency(currentPlan?.aws_solution?.monthly_cost || 0)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800">Azure: {formatCurrency(currentPlan?.azure_solution?.monthly_cost || 0)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-green-100 text-green-800">GCP: {formatCurrency(currentPlan?.gcp_solution?.monthly_cost || 0)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-800">VPS: {formatCurrency(currentPlan?.vps_solution?.monthly_cost || 0)}</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  const renderPlans = () => {
    if (infrastructurePlans.length === 0) {
      return (
        <div className="text-center py-8">
          <ServerCrash className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900">Nenhum plano de infraestrutura</h3>
          <p className="text-gray-500 mt-1">
            Este projeto ainda não possui planos de infraestrutura.
          </p>
          <div className="mt-4 space-y-2">
            <Button 
              onClick={handleStartPlanCreation}
              className="mr-2"
            >
              <Bot className="h-4 w-4 mr-2" />
              Criar com IA
            </Button>
            <Button 
              onClick={handleStartManualCreation}
              variant="outline"
            >
              <Settings className="h-4 w-4 mr-2" />
              Criar Manualmente
            </Button>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-5">
        {infrastructurePlans.map((plan) => (
          <Card key={plan.id} className={plan.status === "active" ? "border-green-200 bg-green-50" : ""}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {plan.selected_provider === "aws" && <Cloud className="h-5 w-5 text-indigo-500" />}
                    {plan.selected_provider === "azure" && <CloudCog className="h-5 w-5 text-blue-500" />}
                    {plan.selected_provider === "gcp" && <CloudRain className="h-5 w-5 text-green-500" />}
                    {plan.selected_provider === "vps" && <Server className="h-5 w-5 text-orange-500" />}
                    
                    {plan.selected_provider ? (
                      <span>
                        {plan.selected_provider.toUpperCase()} 
                        <Badge className="ml-2" variant={plan.status === "active" ? "default" : "outline"}>
                          {plan.status === "active" ? "Ativo" : plan.status === "draft" ? "Rascunho" : "Arquivado"}
                        </Badge>
                      </span>
                    ) : (
                      <span>
                        Plano de Infraestrutura
                        <Badge className="ml-2" variant="outline">Rascunho</Badge>
                      </span>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Criado em {format(new Date(plan.created_date), 'dd/MM/yyyy')}
                  </CardDescription>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => handleDeletePlan(plan.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-2">Requisitos</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tipo de Usuários:</span>
                      <span>{plan.requirements.user_type === "business" ? "Internos" : 
                        plan.requirements.user_type === "public" ? "Públicos" : "Mistos"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Usuários Concorrentes:</span>
                      <span>{plan.requirements.concurrent_users}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Volume de Dados:</span>
                      <span>{plan.requirements.data_volume === "small" ? "Pequeno" : 
                        plan.requirements.data_volume === "medium" ? "Médio" : 
                        plan.requirements.data_volume === "large" ? "Grande" : "Muito Grande"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Alta Disponibilidade:</span>
                      <span>{plan.requirements.high_availability ? "Sim" : "Não"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recuperação de Desastres:</span>
                      <span>{plan.requirements.disaster_recovery ? "Sim" : "Não"}</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Ambientes</h3>
                  <div className="flex flex-wrap gap-2">
                    {plan.environments.development && (
                      <Badge variant="outline" className="bg-gray-100">Desenvolvimento</Badge>
                    )}
                    {plan.environments.staging && (
                      <Badge variant="outline" className="bg-gray-100">Homologação</Badge>
                    )}
                    {plan.environments.production && (
                      <Badge variant="outline" className="bg-gray-100">Produção</Badge>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-medium mb-2 mt-4">Custo</h3>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-green-500" />
                    <span className="text-lg font-bold">{formatCurrency(plan.monthly_cost)}/mês</span>
                  </div>
                </div>
              </div>
              
              {plan.selected_provider && (
                <div className="mt-4">
                  <Separator className="my-4" />
                  <h3 className="text-sm font-medium mb-2">Recursos</h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Recurso</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Ambiente</TableHead>
                          <TableHead>Especificações</TableHead>
                          <TableHead className="text-right">Custo Mensal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {plan[`${plan.selected_provider}_solution`]?.resources?.map((resource, index) => (
                          <TableRow key={index}>
                            <TableCell className="font-medium">{resource.name}</TableCell>
                            <TableCell>{resource.type}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {resource.environment === "development" ? "Desenvolvimento" : 
                                  resource.environment === "staging" ? "Homologação" : "Produção"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate">{resource.specifications}</TableCell>
                            <TableCell className="text-right">{formatCurrency(resource.monthly_cost)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        
        <div className="mt-4 space-x-2 flex">
          <Button 
            onClick={handleStartPlanCreation} 
            className="flex-1"
          >
            <Bot className="mr-2 h-4 w-4" />
            Criar Novo com IA
          </Button>
          <Button 
            onClick={handleStartManualCreation} 
            variant="outline"
            className="flex-1"
          >
            <Settings className="mr-2 h-4 w-4" />
            Criar Manualmente
          </Button>
        </div>
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate(createPageUrl("Projects"))}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Infraestrutura</h1>
            <p className="text-gray-500 mt-1">
              Configure ambientes de desenvolvimento, homologação e produção
            </p>
          </div>
        </div>
      </div>
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {isLoading && isCreatingPlan ? ( // Show loader specifically for plan creation, not initial load
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        </div>
      ) : isCreatingPlan ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {manualMode ? "Criar Plano Manual de Infraestrutura" : "Criar Plano de Infraestrutura"}
            </CardTitle>
            <CardDescription>
              {manualMode 
                ? "Configure manualmente os recursos e especificações da infraestrutura"
                : "Defina requisitos e obtenha recomendações de infraestrutura para o projeto"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isGenerating && !manualMode ? ( // Only show generating message in AI mode
              <div className="py-12 text-center">
                <Loader2 className="h-10 w-10 animate-spin text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">Gerando recomendações de infraestrutura...</h3>
                <p className="text-gray-500 mt-1">
                  Isso pode levar alguns instantes, estamos analisando os requisitos do projeto.
                </p>
              </div>
            ) : (
              <div>
                <div className="mb-8">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                      <div className={`h-1 w-12 ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                      <div className={`h-1 w-12 ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
                      <div className={`h-1 w-12 ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>4</div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Passo {currentStep} de 4
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    <div className={currentStep === 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}>Projeto</div>
                    <div className={currentStep === 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                      Requisitos
                    </div>
                    <div className={currentStep === 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                      Ambientes
                    </div>
                    <div className={currentStep === 4 ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                      {manualMode ? "Recursos" : "Recomendações"}
                    </div>
                  </div>
                </div>
                
                {renderStepContent()}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            {currentStep > 1 ? (
              <Button variant="outline" onClick={prevStep} disabled={isGenerating || isLoading}>
                Voltar
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsCreatingPlan(false);
                  setManualMode(false);
                  setCurrentStep(1);
                  setError(""); // Clear error on cancel
                }} 
                disabled={isGenerating || isLoading}
              >
                Cancelar
              </Button>
            )}
            
            {currentStep < 4 && (
              <Button onClick={nextStep} disabled={isGenerating || isLoading}>
                {currentStep === 3 && !manualMode ? (
                  <>
                    Gerar Recomendações
                    <Bot className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  'Próximo'
                )}
              </Button>
            )}
            
            {currentStep === 4 && manualMode && (
              <Button onClick={saveManualPlan} disabled={isLoading || manualPlan.resources.length === 0}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Plano
                  </>
                )}
              </Button>
            )}
          </CardFooter>
        </Card>
      ) : (
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Selecione um Projeto</CardTitle>
              <CardDescription>
                Escolha o projeto para o qual deseja gerenciar a infraestrutura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedProjectId} 
                onValueChange={handleProjectSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
          
          {selectedProject && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium">Planos de Infraestrutura</h2>
                {infrastructurePlans.length > 0 && (
                  <div className="space-x-2">
                    <Button 
                      onClick={handleStartPlanCreation} 
                      variant="outline"
                    >
                      <Bot className="mr-2 h-4 w-4" />
                      Novo com IA
                    </Button>
                    <Button 
                      onClick={handleStartManualCreation} 
                      variant="outline"
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Novo Manual
                    </Button>
                  </div>
                )}
              </div>
              
              {renderPlans()}
            </div>
          )}
        </div>
      )}
      
      <Dialog open={confirmationOpen} onOpenChange={setConfirmationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este plano de infraestrutura? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmationOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeletePlan}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

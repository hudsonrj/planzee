
import React, { useState, useEffect, useRef } from "react";
import { Idea, User, Project } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { InvokeLLM } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lightbulb,
  Plus,
  FileText,
  Edit,
  Trash,
  Check,
  X,
  ArrowRight,
  Sparkles,
  BarChart2,
  Target,
  Users,
  DollarSign,
  Rocket,
  ChevronDown,
  ChevronRight,
  Download,
  Printer,
  Calendar,
  FileSearch,
  Search,
  ExternalLink,
  ArrowUpRight,
  Repeat,
  Save,
  PlusCircle,
  XCircle,
  CheckCircle,
  Server,
  Loader2,
  PlayCircle,
  Award,
  Megaphone as SpeakerIcon,
  CheckSquare as CheckBoxSquare,
  BarChart,
  Presentation as PresentationIcon
} from "lucide-react";
import AnalysisReport from "../components/reports/AnalysisReport";

export default function IdeaAnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [ideas, setIdeas] = useState([]);
  const [isCreatingIdea, setIsCreatingIdea] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [isViewingReport, setIsViewingReport] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState("");
  const [progress, setProgress] = useState(0);
  const [analysisToGenerate, setAnalysisToGenerate] = useState([]);
  const [improvementSuggestions, setImprovementSuggestions] = useState([]);
  const [applyingSuggestions, setApplyingSuggestions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [tagInput, setTagInput] = useState("");
  
  const [newIdea, setNewIdea] = useState({
    title: "",
    description: "",
    tags: []
  });

  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    status: "ambiente",
    responsible: "",
    start_date: new Date().toISOString().split('T')[0],
    deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    priority: "média"
  });

  const reportRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    loadIdeas();
    loadCurrentUser();
  }, []);

  const loadIdeas = async () => {
    try {
      setLoading(true);
      const ideaList = await Idea.list();
      setIdeas(ideaList);
    } catch (error) {
      console.error("Erro ao carregar ideias:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as ideias.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadCurrentUser = async () => {
    try {
      const userData = await User.me();
      setCurrentUser(userData);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
      toast({
        title: "Aviso",
        description: "Você não está autenticado ou sua sessão expirou. Algumas funcionalidades podem estar limitadas.",
        variant: "warning"
      });
    }
  };

  const handleCreateIdea = async () => {
    try {
      if (!newIdea.title.trim() || !newIdea.description.trim()) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha o título e a descrição da ideia.",
          variant: "destructive"
        });
        return;
      }

      setLoading(true);
      
      const ideaData = {
        ...newIdea,
        user_email: currentUser?.email,
        created_date: new Date().toISOString(),
        last_modified_date: new Date().toISOString(),
        status: "rascunho",
        tags: Array.isArray(newIdea.tags) ? newIdea.tags : newIdea.tags.split(",").map(tag => tag.trim())
      };
      
      const createdIdea = await Idea.create(ideaData);
      
      setNewIdea({
        title: "",
        description: "",
        tags: []
      });
      
      setIsCreatingIdea(false);
      await loadIdeas();
      
      toast({
        title: "Sucesso!",
        description: "Sua ideia foi criada.",
      });
      
      const updatedIdeas = await Idea.list();
      const createdIdeaFull = updatedIdeas.find(idea => idea.title === ideaData.title);
      if (createdIdeaFull) {
        setSelectedIdea(createdIdeaFull);
      }
    } catch (error) {
      console.error("Erro ao criar ideia:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar a ideia.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteIdea = async () => {
    if (!selectedIdea) return;
    
    try {
      setLoading(true);
      await Idea.delete(selectedIdea.id);
      setSelectedIdea(null);
      setConfirmDelete(false);
      await loadIdeas();
      
      toast({
        title: "Sucesso!",
        description: "Ideia excluída com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao excluir ideia:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir a ideia.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateIdea = async (updatedData) => {
    if (!selectedIdea) return;
    
    try {
      setLoading(true);
      
      const ideaData = {
        ...selectedIdea,
        ...updatedData,
        last_modified_date: new Date().toISOString()
      };
      
      await Idea.update(selectedIdea.id, ideaData);
      
      const updatedIdeas = await Idea.list();
      const updatedIdea = updatedIdeas.find(idea => idea.id === selectedIdea.id);
      
      setSelectedIdea(updatedIdea);
      await loadIdeas();
      
      toast({
        title: "Sucesso!",
        description: "Ideia atualizada com sucesso.",
      });
      
      return updatedIdea;
    } catch (error) {
      console.error("Erro ao atualizar ideia:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a ideia.",
        variant: "destructive"
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleConvertToProject = async () => {
    if (!selectedIdea) return;
    
    try {
      setLoading(true);
      
      const projectData = {
        ...newProject,
        description: newProject.description || selectedIdea.description,
        responsible: newProject.responsible || currentUser?.email,
        participants: [currentUser?.email],
        progress: 0,
        tags: selectedIdea.tags || []
      };
      
      const createdProject = await Project.create(projectData);
      
      await handleUpdateIdea({
        status: "convertida_em_projeto",
        project_id: createdProject.id
      });
      
      setIsCreatingProject(false);
      
      toast({
        title: "Sucesso!",
        description: "Ideia convertida em projeto com sucesso!",
      });
    } catch (error) {
      console.error("Erro ao converter em projeto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível converter a ideia em projeto.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateAnalysis = async (analysisType) => {
    if (!selectedIdea) return;
    
    try {
      setIsGenerating(true);
      setGeneratingType(analysisType);
      setProgress(10);
      
      let prompt = "";
      let responseSchema = {};
      
      switch (analysisType) {
        case "comprehensive":
          prompt = `Realize uma análise abrangente da seguinte ideia de negócio/produto: 
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Forneça uma análise completa, incluindo avaliação de viabilidade, potencial de mercado, 
            principais desafios e oportunidades, posicionamento estratégico sugerido e próximos passos recomendados.
            
            Seja específico, profundo e orientado a ação na sua análise.`;
          
          responseSchema = {
            type: "object",
            properties: {
              comprehensive_analysis: { type: "string" }
            }
          };
          break;
          
        case "mvp_path":
          prompt = `Analise a seguinte ideia de negócio/produto e desenvolva um caminho detalhado para criar um MVP (Produto Mínimo Viável):
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Forneça:
            1. Definição clara dos recursos essenciais para o MVP
            2. Etapas sequenciais para desenvolver o MVP
            3. Cronograma estimado para cada etapa
            4. Métricas-chave para avaliar o sucesso do MVP
            5. Estratégia para coletar feedback de usuários iniciais
            
            Seja específico, realista e orientado a ação na sua análise.`;
          
          responseSchema = {
            type: "object",
            properties: {
              mvp_path: { type: "string" }
            }
          };
          break;
          
        case "usp":
          prompt = `Analise a seguinte ideia de negócio/produto e identifique seus Unique Selling Points (Pontos Únicos de Venda):
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Forneça:
            1. Uma lista detalhada dos possíveis USPs do produto/serviço
            2. Avaliação de cada USP em relação a concorrentes do mercado
            3. Recomendação de quais USPs devem ser enfatizados no marketing
            4. Como cada USP pode ser comunicado de forma eficaz aos clientes-alvo
            
            Seja específico, original e orientado a mercado na sua análise.`;
          
          responseSchema = {
            type: "object",
            properties: {
              usp_analysis: { type: "string" }
            }
          };
          break;
          
        case "customer_persona":
          prompt = `Desenvolva personas de clientes detalhadas para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Para cada persona (crie pelo menos 2-3 personas diferentes), forneça:
            1. Dados demográficos (idade, localização, profissão, renda, etc.)
            2. Comportamentos e hábitos relevantes
            3. Necessidades, desejos e desafios
            4. Processo de decisão de compra
            5. Pontos de contato e canais preferidos
            6. Objeções potenciais ao produto/serviço
            
            Seja específico, detalhado e baseado em dados realistas de mercado.`;
          
          responseSchema = {
            type: "object",
            properties: {
              customer_personas: { type: "string" }
            }
          };
          break;
          
        case "finances":
          prompt = `Desenvolva uma análise financeira detalhada para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Forneça:
            1. Estimativa de investimento inicial necessário (detalhado por categorias)
            2. Projeção de custos operacionais mensais
            3. Estimativa de receita potencial (com diferentes cenários)
            4. Análise de ponto de equilíbrio e prazo para lucro
            5. Principais métricas financeiras a monitorar
            
            Seja realista, detalhado e baseado em dados de mercado atuais.`;
          
          responseSchema = {
            type: "object",
            properties: {
              financial_analysis: { type: "string" }
            }
          };
          break;
          
        case "go_to_market":
          prompt = `Desenvolva uma estratégia de go-to-market abrangente para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Forneça:
            1. Segmentação de mercado detalhada
            2. Estratégia de posicionamento
            3. Canais de distribuição recomendados
            4. Estratégia de preços inicial
            5. Táticas de marketing e promoção
            6. Abordagem de vendas e funil de conversão
            7. Cronograma de lançamento faseado
            
            Seja específico, acionável e alinhado com as atuais tendências de mercado.`;
          
          responseSchema = {
            type: "object",
            properties: {
              go_to_market_strategy: { type: "string" }
            }
          };
          break;
          
        case "swot":
          prompt = `Realize uma análise SWOT completa para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Forneça uma análise detalhada de:
            1. Strengths (Forças): vantagens internas e competências distintas
            2. Weaknesses (Fraquezas): limitações internas e desvantagens
            3. Opportunities (Oportunidades): fatores externos favoráveis e tendências positivas
            4. Threats (Ameaças): desafios externos e tendências negativas
            
            Para cada elemento da SWOT, forneça pelo menos 5 pontos específicos e análise de suas implicações.
            Conclua com recomendações estratégicas baseadas na SWOT.`;
          
          responseSchema = {
            type: "object",
            properties: {
              strengths: { type: "string" },
              weaknesses: { type: "string" },
              opportunities: { type: "string" },
              threats: { type: "string" },
              strategic_recommendations: { type: "string" }
            }
          };
          break;
          
        case "vrio":
          prompt = `Realize uma análise VRIO (Valor, Raridade, Imitabilidade, Organização) para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Para cada elemento da estrutura VRIO, forneça:
            
            1. Valor: Até que ponto os recursos e capacidades da ideia proposta agregam valor aos clientes? Eles permitem explorar oportunidades ou mitigar ameaças?
            
            2. Raridade: Quão raros ou únicos são os recursos e capacidades descritos? Quantos concorrentes já possuem esses recursos?
            
            3. Imitabilidade: Quão difícil ou custoso seria para concorrentes imitar, substituir ou reproduzir esses recursos?
            
            4. Organização: A ideia/empresa está organizada para explorar plenamente esses recursos? Existem processos, políticas e estruturas adequadas?
            
            Conclua com uma avaliação geral da vantagem competitiva sustentável, indicando se a ideia tem potencial para:
            - Desvantagem competitiva
            - Paridade competitiva
            - Vantagem competitiva temporária
            - Vantagem competitiva sustentável`;
          
          responseSchema = {
            type: "object",
            properties: {
              value_analysis: { type: "string" },
              rarity_analysis: { type: "string" },
              imitability_analysis: { type: "string" },
              organization_analysis: { type: "string" },
              vrio_conclusion: { type: "string" }
            }
          };
          break;
          
        case "competitive":
          prompt = `Realize uma análise competitiva aprofundada para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Sua análise deve incluir:
            
            1. Identificação dos principais concorrentes diretos e indiretos (pelo menos 5-7)
            2. Perfis detalhados dos 3 principais concorrentes (pontos fortes, fracos, estratégias, posicionamento)
            3. Análise comparativa da proposta de valor, preços, canais e público-alvo
            4. Lacunas de mercado e oportunidades não atendidas pelos concorrentes
            5. Estratégias recomendadas para diferenciação e criação de vantagens competitivas
            6. Previsão das possíveis reações competitivas ao lançamento da ideia
            
            Seja específico, baseado em dados reais de mercado e estrategicamente orientado.`;
          
          responseSchema = {
            type: "object",
            properties: {
              competitive_analysis: { type: "string" }
            }
          };
          break;
          
        case "pestel":
          prompt = `Realize uma análise PESTEL (Política, Econômica, Social, Tecnológica, Ambiental e Legal) para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Para cada elemento da análise PESTEL, identifique e analise pelo menos 3-5 fatores relevantes que podem impactar o sucesso da ideia:
            
            1. Fatores Políticos: tendências políticas, políticas governamentais, instabilidade, regulações específicas para o setor
            
            2. Fatores Econômicos: tendências econômicas, taxas de juros, inflação, poder de compra, ciclos econômicos
            
            3. Fatores Sociais: tendências demográficas, mudanças culturais, atitudes do consumidor, estilo de vida, educação
            
            4. Fatores Tecnológicos: inovações tecnológicas, automação, P&D, obsolescência tecnológica, transferência de tecnologia
            
            5. Fatores Ambientais: preocupações ecológicas, políticas ambientais, mudanças climáticas, sustentabilidade
            
            6. Fatores Legais: legislação atual e futura, leis trabalhistas, leis de proteção ao consumidor, regulamentações setoriais
            
            Para cada fator, indique se representa uma oportunidade ou ameaça, e sugira formas de mitigar riscos ou explorar oportunidades.`;
          
          responseSchema = {
            type: "object",
            properties: {
              political_factors: { type: "string" },
              economic_factors: { type: "string" },
              social_factors: { type: "string" },
              technological_factors: { type: "string" },
              environmental_factors: { type: "string" },
              legal_factors: { type: "string" }
            }
          };
          break;
          
        case "porter":
          prompt = `Realize uma análise das Cinco Forças de Porter para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Para cada uma das cinco forças, forneça uma análise detalhada:
            
            1. Ameaça de novos entrantes: Quão fácil é para novos concorrentes entrarem no mercado? Existem altas ou baixas barreiras de entrada?
            
            2. Poder de barganha dos fornecedores: Quão poderosos são os fornecedores nesse setor? Eles podem facilmente aumentar preços ou reduzir qualidade?
            
            3. Poder de barganha dos compradores: Quão poderosos são os clientes? Eles podem facilmente forçar a redução de preços ou exigir mais qualidade?
            
            4. Ameaça de produtos ou serviços substitutos: Existem alternativas ao produto/serviço proposto? Quão facilmente os clientes podem mudar?
            
            5. Rivalidade entre competidores existentes: Quão intensa é a competição atual? O mercado é dominado por poucos players ou é fragmentado?
            
            Conclua com uma avaliação geral da atratividade do setor com base nas cinco forças e recomendações estratégicas para navegar nesse ambiente competitivo.`;
          
          responseSchema = {
            type: "object",
            properties: {
              new_entrants_threat: { type: "string" },
              suppliers_power: { type: "string" },
              buyers_power: { type: "string" },
              substitutes_threat: { type: "string" },
              competitive_rivalry: { type: "string" },
              porters_conclusion: { type: "string" }
            }
          };
          break;
          
        case "pitch":
          prompt = `Crie um pitch profissional e persuasivo para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            O pitch deve incluir:
            
            1. Introdução poderosa (hook) que captura atenção em segundos
            2. Apresentação clara do problema que a ideia resolve
            3. Descrição concisa da solução proposta
            4. Explicação do modelo de negócios e como gera receita
            5. Análise do mercado-alvo e seu tamanho (TAM, SAM, SOM)
            6. Vantagens competitivas e diferenciadores únicos
            7. Tração atual ou validação de mercado (se aplicável)
            8. Equipe e capacidades-chave necessárias
            9. Projeções financeiras básicas e ROI esperado
            10. Call-to-action claro para próximos passos
            
            O pitch deve ser estruturado para uma apresentação de 3-5 minutos, profissional, persuasivo e focado em benefícios. Use linguagem dinâmica e assertiva.`;
          
          responseSchema = {
            type: "object",
            properties: {
              pitch: { type: "string" }
            }
          };
          break;
          
        case "infrastructure":
          prompt = `Desenvolva um plano de infraestrutura e investimento tecnológico para a seguinte ideia de negócio/produto:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            Seu plano deve incluir:
            
            1. Requisitos de infraestrutura tecnológica
               - Plataformas e tecnologias recomendadas
               - Arquitetura técnica de alto nível
               - Considerações de escalabilidade e segurança
            
            2. Cenários de desenvolvimento
               - Cenário MVP com recursos mínimos
               - Cenário ideal para lançamento completo
               - Visão de longo prazo e evolução da infraestrutura
            
            3. Estimativas de custos para cada cenário
               - Custos iniciais de desenvolvimento/implementação
               - Custos operacionais mensais (hospedagem, manutenção, etc.)
               - Custos de escalabilidade conforme crescimento
            
            4. Comparação entre opções de implementação
               - Build vs Buy (desenvolver internamente vs soluções prontas)
               - On-premise vs Cloud
               - Diferentes provedores de serviços (AWS, Azure, GCP, etc.)
            
            5. Cronograma de implementação recomendado
            
            Seja específico, realista e forneça justificativas para suas recomendações.`;
          
          responseSchema = {
            type: "object",
            properties: {
              infrastructure_plan: { type: "string" }
            }
          };
          break;
          
        case "improvements":
          prompt = `Analise criticamente a seguinte ideia de negócio/produto e sugira melhorias estratégicas:
            "${selectedIdea.title}". 
            Descrição: ${selectedIdea.description}
            
            ${selectedIdea.analyses ? `
            Com base nas análises já realizadas:
            ${selectedIdea.analyses.comprehensive ? `Análise Abrangente: ${selectedIdea.analyses.comprehensive.substring(0, 500)}...` : ''}
            ${selectedIdea.analyses.swot ? `SWOT - Pontos Fracos: ${selectedIdea.analyses.swot.weaknesses?.substring(0, 300)}...` : ''}
            ${selectedIdea.analyses.competitive ? `Análise Competitiva: ${selectedIdea.analyses.competitive.substring(0, 300)}...` : ''}
            ` : ''}
            
            Forneça 5-7 sugestões de melhoria específicas, abrangendo diferentes aspectos:
            
            Para cada sugestão, indique:
            1. Área específica (ex: modelo de negócio, produto, estratégia de marketing, operações)
            2. Problema ou limitação atual
            3. Melhoria sugerida (detalhada e específica)
            4. Impacto potencial da melhoria (baixo, médio, alto)
            5. Complexidade de implementação (baixa, média, alta)
            
            Concentre-se nas melhorias que teriam maior impacto com esforço razoável. Seja específico, estratégico e orientado a resultados.`;
          
          responseSchema = {
            type: "object",
            properties: {
              improvement_suggestions: { 
                type: "array", 
                items: {
                  type: "object",
                  properties: {
                    area: { type: "string" },
                    problem: { type: "string" },
                    suggestion: { type: "string" },
                    impact: { type: "string", enum: ["baixo", "médio", "alto"] },
                    complexity: { type: "string", enum: ["baixa", "média", "alta"] }
                  }
                }
              }
            }
          };
          break;
          
        default:
          throw new Error("Tipo de análise não suportado");
      }
      
      setProgress(30);
      
      const result = await InvokeLLM({
        prompt: prompt,
        response_json_schema: responseSchema
      });
      
      setProgress(80);
      
      if (result) {
        const analyses = selectedIdea.analyses || {};
        let updatedAnalyses = { ...analyses };
        
        switch (analysisType) {
          case "comprehensive":
            updatedAnalyses.comprehensive = result.comprehensive_analysis;
            break;
          case "mvp_path":
            updatedAnalyses.mvp_path = result.mvp_path;
            break;
          case "usp":
            updatedAnalyses.usp = result.usp_analysis;
            break;
          case "customer_persona":
            updatedAnalyses.customer_persona = result.customer_personas;
            break;
          case "finances":
            updatedAnalyses.finances = result.financial_analysis;
            break;
          case "go_to_market":
            updatedAnalyses.go_to_market = result.go_to_market_strategy;
            break;
          case "swot":
            updatedAnalyses.swot = {
              strengths: result.strengths,
              weaknesses: result.weaknesses,
              opportunities: result.opportunities,
              threats: result.threats
            };
            break;
          case "vrio":
            updatedAnalyses.vrio = {
              value: result.value_analysis,
              rarity: result.rarity_analysis,
              imitability: result.imitability_analysis,
              organization: result.organization_analysis,
              conclusion: result.vrio_conclusion
            };
            break;
          case "competitive":
            updatedAnalyses.competitive = result.competitive_analysis;
            break;
          case "pestel":
            updatedAnalyses.pestel = {
              political: result.political_factors,
              economic: result.economic_factors,
              social: result.social_factors,
              technological: result.technological_factors,
              environmental: result.environmental_factors,
              legal: result.legal_factors
            };
            break;
          case "porter":
            updatedAnalyses.porter = {
              new_entrants: result.new_entrants_threat,
              suppliers_power: result.suppliers_power,
              buyers_power: result.buyers_power,
              substitutes: result.substitutes_threat,
              rivalry: result.competitive_rivalry,
              conclusion: result.porters_conclusion
            };
            break;
          case "pitch":
            updatedAnalyses.pitch = result.pitch;
            break;
          case "infrastructure":
            updatedAnalyses.infrastructure = result.infrastructure_plan;
            break;
          case "improvements":
            updatedAnalyses.improvements = result.improvement_suggestions;
            break;
          default:
            throw new Error("Tipo de análise não suportado");
        }
        
        await handleUpdateIdea({ analyses: updatedAnalyses });
        toast({
          title: "Análise gerada com sucesso!",
          description: `Análise tipo "${analysisType}" realizada com sucesso.`,
        });
      } else {
        toast({
          title: "Erro ao gerar análise",
          description: "Falha ao gerar a análise. Tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`Erro ao gerar análise ${analysisType}:`, error);
      toast({
        title: "Erro",
        description: `Não foi possível gerar a análise. Erro: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    
    if (!newIdea.tags.includes(tagInput.trim())) {
      setNewIdea({
        ...newIdea,
        tags: [...newIdea.tags, tagInput.trim()]
      });
    }
    
    setTagInput("");
  };
  
  const handleRemoveTag = (tagToRemove) => {
    setNewIdea({
      ...newIdea,
      tags: newIdea.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const getCompletedAnalysesCount = (idea) => {
    if (!idea || !idea.analyses) return 0;
    
    let count = 0;
    if (idea.analyses.comprehensive) count++;
    if (idea.analyses.mvp_path) count++;
    if (idea.analyses.usp) count++;
    if (idea.analyses.customer_persona) count++;
    if (idea.analyses.finances) count++;
    if (idea.analyses.go_to_market) count++;
    if (idea.analyses.swot && idea.analyses.swot.strengths) count++;
    if (idea.analyses.vrio && idea.analyses.vrio.value) count++;
    if (idea.analyses.competitive) count++;
    if (idea.analyses.pestel && idea.analyses.pestel.political) count++;
    if (idea.analyses.porter && idea.analyses.porter.new_entrants) count++;
    if (idea.analyses.pitch) count++;
    if (idea.analyses.infrastructure) count++;
    
    return count;
  };

  const handlePrint = () => {
    if (reportRef.current) {
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast({
          title: "Erro ao imprimir",
          description: "Não foi possível abrir a janela de impressão. Verifique se os pop-ups estão permitidos.",
          variant: "destructive"
        });
        return;
      }
      
      const reportContent = reportRef.current.innerHTML;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>Relatório de Análise: ${selectedIdea?.title}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                margin: 20px;
              }
              h1, h2, h3, h4 {
                color: #111;
                margin-top: 20px;
              }
              h1 {
                font-size: 24px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 10px;
              }
              h2 {
                font-size: 20px;
                margin-top: 30px;
              }
              h3 {
                font-size: 18px;
              }
              table {
                border-collapse: collapse;
                width: 100%;
                margin: 20px 0;
              }
              table, th, td {
                border: 1px solid #ddd;
              }
              th, td {
                padding: 12px;
                text-align: left;
              }
              th {
                background-color: #f2f2f2;
              }
              .section {
                margin-bottom: 30px;
              }
              .section-title {
                font-weight: bold;
                margin-bottom: 10px;
              }
              .meta-info {
                color: #666;
                font-size: 14px;
                margin-bottom: 20px;
              }
              @media print {
                body {
                  font-size: 12pt;
                }
              }
            </style>
          </head>
          <body>
            ${reportContent}
          </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Analise sua Ideia</h1>
          <p className="text-gray-500 mt-1">
            Laboratório de ideias e análises para novos projetos
          </p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button onClick={() => setIsCreatingIdea(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nova Ideia
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 lg:col-span-3">
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Lightbulb className="h-5 w-5 text-amber-500 mr-2" />
                Minhas Ideias
              </CardTitle>
              <CardDescription>
                Selecione uma ideia para analisar
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
              ) : ideas.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Lightbulb className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p>Você ainda não tem ideias cadastradas</p>
                  <Button 
                    variant="outline" 
                    className="mt-4" 
                    onClick={() => setIsCreatingIdea(true)}
                  >
                    Criar Primeira Ideia
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="space-y-2">
                    {ideas.map((idea) => (
                      <div 
                        key={idea.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedIdea && selectedIdea.id === idea.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedIdea(idea)}
                      >
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="font-medium line-clamp-1">{idea.title}</h3>
                          <Badge variant="outline">{idea.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                          {idea.description}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>
                            {format(new Date(idea.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                          <div className="flex items-center">
                            <BarChart2 className="h-3 w-3 mr-1" />
                            <span>{getCompletedAnalysesCount(idea)}/10 análises</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:col-span-8 lg:col-span-9">
          {!selectedIdea ? (
            <div className="flex flex-col items-center justify-center border border-dashed rounded-lg p-12 h-[calc(100vh-200px)]">
              <Search className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-800 mb-2">Selecione uma ideia</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Selecione uma ideia da lista à esquerda ou crie uma nova para começar a analisar seu potencial de negócio
              </p>
              <Button onClick={() => setIsCreatingIdea(true)}>
                Criar Nova Ideia
              </Button>
            </div>
          ) : (
            <>
              <Card className="mb-6">
                <CardHeader>
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div>
                      <div className="flex items-center mb-1">
                        <Badge variant="outline">{selectedIdea.status}</Badge>
                        <span className="text-sm text-gray-500 ml-2">
                          Criada em {format(new Date(selectedIdea.created_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                      </div>
                      <CardTitle className="text-xl">{selectedIdea.title}</CardTitle>
                    </div>
                    <div className="flex gap-2 mt-4 md:mt-0">
                      {selectedIdea.status !== 'convertida_em_projeto' && (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setNewProject({
                              ...newProject,
                              title: selectedIdea.title,
                              description: selectedIdea.description,
                              responsible: currentUser?.email || ''
                            });
                            setIsCreatingProject(true);
                          }}
                        >
                          <Rocket className="h-4 w-4 mr-2" />
                          Converter em Projeto
                        </Button>
                      )}
                      <Button onClick={() => setIsViewingReport(true)}>
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Relatório
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium mb-2">Descrição</h3>
                      <div className="bg-gray-50 rounded-md p-4 text-gray-700 whitespace-pre-line">
                        {selectedIdea.description}
                      </div>
                    </div>
                    
                    {selectedIdea.tags && selectedIdea.tags.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedIdea.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="bg-indigo-50">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedIdea.improvement_suggestions && selectedIdea.improvement_suggestions.length > 0 && (
                      <div>
                        <h3 className="font-medium mb-2">Sugestões de Melhoria</h3>
                        <div className="space-y-2">
                          {selectedIdea.improvement_suggestions.map((sugg, index) => (
                            <div 
                              key={index}
                              className={`p-2 rounded-md text-sm ${
                                sugg.implemented 
                                  ? "bg-green-50 border border-green-100" 
                                  : "bg-gray-50 border border-gray-100"
                              }`}
                            >
                              <div className="flex items-start">
                                <div className="flex-1">
                                  <div className="flex items-center">
                                    <Badge className="mr-2" variant="outline">
                                      {sugg.area}
                                    </Badge>
                                    <Badge 
                                      variant="outline" 
                                      className={`${
                                        sugg.impact === 'alto' 
                                          ? "bg-red-50 text-red-700" 
                                          : sugg.impact === 'médio' 
                                          ? "bg-yellow-50 text-yellow-700" 
                                          : "bg-blue-50 text-blue-700"
                                      }`}
                                    >
                                      Impacto {sugg.impact}
                                    </Badge>
                                    
                                    {sugg.implemented && (
                                      <Badge variant="outline" className="ml-2 bg-green-100 text-green-800">
                                        <Check className="h-3 w-3 mr-1" />
                                        Implementada
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="mt-1">{sugg.suggestion}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="border-t">
                  <div className="w-full flex justify-end">
                    <Button 
                      variant="outline"
                      onClick={() => generateAnalysis("improvements")}
                      disabled={isGenerating}
                    >
                      {isGenerating && generatingType === "improvements" ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4 mr-2" />
                      )}
                      Gerar Sugestões de Melhoria
                    </Button>
                  </div>
                </CardFooter>
              </Card>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Sparkles className="h-5 w-5 text-purple-500 mr-2" />
                      Análises Rápidas
                    </CardTitle>
                    <CardDescription>
                      Insights essenciais sobre a ideia
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.comprehensive ? "outline" : "default"}
                        onClick={() => generateAnalysis('comprehensive')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <BarChart className="h-4 w-4 mr-2" />
                          <span>Análise Abrangente</span>
                        </div>
                        {isGenerating && generatingType === 'comprehensive' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.comprehensive ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.mvp_path ? "outline" : "default"}
                        onClick={() => generateAnalysis('mvp_path')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <PlayCircle className="h-4 w-4 mr-2" />
                          <span>Path to MVP</span>
                        </div>
                        {isGenerating && generatingType === 'mvp_path' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.mvp_path ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.usp ? "outline" : "default"}
                        onClick={() => generateAnalysis('usp')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <Award className="h-4 w-4 mr-2" />
                          <span>Unique Selling Points</span>
                        </div>
                        {isGenerating && generatingType === 'usp' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.usp ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.customer_persona ? "outline" : "default"}
                        onClick={() => generateAnalysis('customer_persona')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          <span>Customer Persona</span>
                        </div>
                        {isGenerating && generatingType === 'customer_persona' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.customer_persona ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.finances ? "outline" : "default"}
                        onClick={() => generateAnalysis('finances')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 mr-2" />
                          <span>Análise Financeira</span>
                        </div>
                        {isGenerating && generatingType === 'finances' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.finances ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.go_to_market ? "outline" : "default"}
                        onClick={() => generateAnalysis('go_to_market')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <SpeakerIcon className="h-4 w-4 mr-2" />
                          <span>Go-to-Market</span>
                        </div>
                        {isGenerating && generatingType === 'go_to_market' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.go_to_market ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Target className="h-5 w-5 text-red-500 mr-2" />
                      Análises Estratégicas
                    </CardTitle>
                    <CardDescription>
                      Análises detalhadas de mercado e posicionamento
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.swot ? "outline" : "default"}
                        onClick={() => generateAnalysis('swot')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <BarChart className="h-4 w-4 mr-2" />
                          <span>Análise SWOT</span>
                        </div>
                        {isGenerating && generatingType === 'swot' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.swot ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.vrio ? "outline" : "default"}
                        onClick={() => generateAnalysis('vrio')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <CheckBoxSquare className="h-4 w-4 mr-2" />
                          <span>Análise VRIO</span>
                        </div>
                        {isGenerating && generatingType === 'vrio' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.vrio ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.pestel ? "outline" : "default"}
                        onClick={() => generateAnalysis('pestel')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <BarChart className="h-4 w-4 mr-2" />
                          <span>Análise PESTEL</span>
                        </div>
                        {isGenerating && generatingType === 'pestel' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.pestel ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.porter ? "outline" : "default"}
                        onClick={() => generateAnalysis('porter')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <Target className="h-4 w-4 mr-2" />
                          <span>5 Forças de Porter</span>
                        </div>
                        {isGenerating && generatingType === 'porter' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.porter ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.pitch ? "outline" : "default"}
                        onClick={() => generateAnalysis('pitch')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <PresentationIcon className="h-4 w-4 mr-2" />
                          <span>Pitch Profissional</span>
                        </div>
                        {isGenerating && generatingType === 'pitch' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.pitch ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                      
                      <Button 
                        className="w-full justify-between"
                        variant={selectedIdea.analyses?.infrastructure ? "outline" : "default"}
                        onClick={() => generateAnalysis('infrastructure')}
                        disabled={isGenerating}
                      >
                        <div className="flex items-center">
                          <Server className="h-4 w-4 mr-2" />
                          <span>Infraestrutura & Custos</span>
                        </div>
                        {isGenerating && generatingType === 'infrastructure' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : selectedIdea.analyses?.infrastructure ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>

      <Dialog open={isCreatingIdea} onOpenChange={setIsCreatingIdea}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Ideia</DialogTitle>
            <DialogDescription>
              Descreva sua ideia de negócio para começar a análise
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título da Ideia</Label>
              <Input
                placeholder="Ex: Marketplace de Produtos Orgânicos"
                value={newIdea.title}
                onChange={(e) => setNewIdea({...newIdea, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição Detalhada</Label>
              <Textarea
                placeholder="Descreva sua ideia em detalhes..."
                value={newIdea.description}
                onChange={(e) => setNewIdea({...newIdea, description: e.target.value})}
                rows={5}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Adicionar tag..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                />
                <Button type="button" onClick={handleAddTag}>
                  Adicionar
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {newIdea.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="outline"
                    className="bg-gray-100 cursor-pointer hover:bg-red-100"
                    onClick={() => handleRemoveTag(tag)}
                  >
                    {tag}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreatingIdea(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateIdea} 
              disabled={!newIdea.title || !newIdea.description || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Criar Ideia
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isViewingReport} onOpenChange={setIsViewingReport}>
        <DialogContent className="max-w-5xl max-h-[90vh] w-full">
          <DialogHeader>
            <DialogTitle>Relatório de Análise</DialogTitle>
            <DialogDescription>
              Visualize todas as análises geradas para esta ideia
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 h-[calc(80vh-120px)] pr-4">
            <div ref={reportRef}>
              <AnalysisReport idea={selectedIdea} onPrint={handlePrint} />
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeout(() => setIsViewingReport(false), 0)}>
              Fechar
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCreatingProject} onOpenChange={setIsCreatingProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Converter em Projeto</DialogTitle>
            <DialogDescription>
              Configure as informações iniciais do projeto
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título do Projeto</Label>
              <Input
                value={newProject.title}
                onChange={(e) => setNewProject({...newProject, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                rows={4}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data de Início</Label>
                <Input
                  type="date"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({...newProject, start_date: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Prazo Final</Label>
                <Input
                  type="date"
                  value={newProject.deadline}
                  onChange={(e) => setNewProject({...newProject, deadline: e.target.value})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status Inicial</Label>
                <Select 
                  value={newProject.status}
                  onValueChange={(value) => setNewProject({...newProject, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ambiente">Ambiente</SelectItem>
                    <SelectItem value="poc">POC</SelectItem>
                    <SelectItem value="mvp">MVP</SelectItem>
                    <SelectItem value="desenvolvimento">Desenvolvimento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select 
                  value={newProject.priority}
                  onValueChange={(value) => setNewProject({...newProject, priority: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="média">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreatingProject(false);
              setNewProject({
                title: "",
                description: "",
                status: "ambiente",
                responsible: "",
                start_date: new Date().toISOString().split('T')[0],
                deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
                priority: "média"
              });
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleConvertToProject}
              disabled={!newProject.title || loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Convertendo...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4 mr-2" />
                  Criar Projeto
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lightbulb,
  Rocket,
  Target,
  Users,
  DollarSign,
  BarChart2,
  Award,
  CheckSquare,
  Presentation,
  FileText,
  Server,
  Printer,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  Megaphone,
  BarChart,
  PlayCircle,
  PencilRuler,
  Scale,
  Globe,
  Zap,
  Search,
  FileSearch,
  TrendingUp,
  ArrowUpRight,
  ChevronRight
} from "lucide-react";
import { motion } from "framer-motion";

const AnalysisReport = ({ idea, onPrint }) => {
  const [activeTab, setActiveTab] = useState("overview");

  // Se não existirem análises, mostrar mensagem
  if (!idea || !idea.analyses || Object.keys(idea.analyses).length === 0) {
    return (
      <div className="text-center py-8">
        <Lightbulb className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <h3 className="text-lg font-medium mb-2">Nenhuma análise gerada</h3>
        <p className="text-gray-500 mb-4">Gere análises para a ideia para visualizar o relatório completo.</p>
      </div>
    );
  }

  // Contagem de análises completadas
  const getCompletedAnalysesCount = () => {
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

  // Formatar texto com parágrafos e listas
  const formatText = (text) => {
    if (!text) return null;
    
    // Substituir linhas que começam com "- " ou "* " com elementos de lista
    const formattedText = text
      .split('\n')
      .map((line, i) => {
        if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          return (
            <li key={i} className="ml-5 mb-1 list-disc">
              {line.trim().substring(2)}
            </li>
          );
        } else if (line.trim().startsWith('1. ') || line.trim().startsWith('2. ') || line.trim().startsWith('3. ') ||
                  line.trim().startsWith('4. ') || line.trim().startsWith('5. ') || line.trim().startsWith('6. ') ||
                  line.trim().startsWith('7. ') || line.trim().startsWith('8. ') || line.trim().startsWith('9. ')) {
          const num = line.trim().substring(0, line.trim().indexOf('.'));
          return (
            <li key={i} className="ml-5 mb-1 list-decimal">
              {line.trim().substring(num.length + 2)}
            </li>
          );
        } else if (line.trim().length === 0) {
          return <br key={i} />;
        } else if (line.trim().toUpperCase() === line.trim() && line.trim().length > 5) {
          return <h3 key={i} className="font-bold text-gray-800 mt-4 mb-2">{line}</h3>;
        } else {
          return <p key={i} className="mb-2">{line}</p>;
        }
      });
    
    // Agrupar elementos de lista consecutivos
    const result = [];
    let currentList = null;
    let currentListType = null;
    
    formattedText.forEach((item, index) => {
      if (item.type === 'li' && item.props.className.includes('list-disc')) {
        if (currentListType !== 'ul') {
          if (currentList) {
            result.push(<ul key={`ul-${index}`} className="my-3">{currentList}</ul>);
          }
          currentList = [];
          currentListType = 'ul';
        }
        currentList.push(item);
      } else if (item.type === 'li' && item.props.className.includes('list-decimal')) {
        if (currentListType !== 'ol') {
          if (currentList) {
            result.push(<ol key={`ol-${index}`} className="my-3">{currentList}</ol>);
          }
          currentList = [];
          currentListType = 'ol';
        }
        currentList.push(item);
      } else {
        if (currentList) {
          result.push(
            currentListType === 'ul' 
              ? <ul key={`ul-${index}`} className="my-3">{currentList}</ul>
              : <ol key={`ol-${index}`} className="my-3">{currentList}</ol>
          );
          currentList = null;
          currentListType = null;
        }
        result.push(item);
      }
    });
    
    if (currentList) {
      result.push(
        currentListType === 'ul' 
          ? <ul key="ul-last" className="my-3">{currentList}</ul>
          : <ol key="ol-last" className="my-3">{currentList}</ol>
      );
    }
    
    return result;
  };
  
  return (
    <div className="max-w-5xl mx-auto">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex justify-between items-center mb-6"
      >
        <div>
          <h2 className="text-2xl font-bold">Relatório de Análise: {idea.title}</h2>
          <p className="text-gray-500 mt-1">
            Gerado em {format(new Date(), 'dd MMM yyyy, HH:mm', { locale: ptBR })}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onPrint}>
            <Printer className="h-4 w-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </motion.div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg p-6 border border-indigo-100"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center mb-3">
              <div className="h-4 w-4 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-800">Status:</span>
              <Badge className="ml-2 bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
                {idea.status === 'rascunho' ? 'Rascunho' : 
                 idea.status === 'em_análise' ? 'Em Análise' :
                 idea.status === 'aprovada' ? 'Aprovada' :
                 idea.status === 'rejeitada' ? 'Rejeitada' :
                 idea.status === 'convertida_em_projeto' ? 'Convertida em Projeto' :
                 idea.status}
              </Badge>
            </div>
            <div className="flex items-center">
              <FileSearch className="h-4 w-4 text-indigo-500 mr-2" />
              <span className="text-sm font-medium text-gray-800">Análises Completadas:</span>
              <div className="ml-2 h-5 w-24 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500" 
                  style={{ width: `${(getCompletedAnalysesCount() / 13) * 100}%` }}
                ></div>
              </div>
              <span className="ml-2 text-sm text-gray-600">{getCompletedAnalysesCount()}/13</span>
            </div>
          </div>
          
          {idea.user_email && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Criado por:</span> {idea.user_email}
              <div className="text-xs text-gray-500 mt-1">
                {idea.created_date && format(new Date(idea.created_date), 'dd MMM yyyy', { locale: ptBR })}
              </div>
            </div>
          )}
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <h3 className="font-medium text-gray-800 mb-2">Descrição da Ideia:</h3>
          <div className="text-gray-700 prose">{formatText(idea.description)}</div>
        </div>
        
        {idea.tags && idea.tags.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium text-gray-800 mb-2">Tags:</h3>
            <div className="flex flex-wrap gap-2">
              {idea.tags.map((tag, i) => (
                <Badge key={i} variant="outline" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </motion.div>
      
      <Tabs defaultValue="overview" className="space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="strategic">Estratégia</TabsTrigger>
            <TabsTrigger value="market">Mercado</TabsTrigger>
            <TabsTrigger value="financial">Finanças</TabsTrigger>
            <TabsTrigger value="execution">Execução</TabsTrigger>
          </TabsList>
        </motion.div>
        
        <TabsContent value="overview" className="space-y-6">
          {idea.analyses.comprehensive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="overflow-hidden border-indigo-100">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart2 className="h-5 w-5 text-indigo-600 mr-2" />
                    Análise Abrangente
                  </CardTitle>
                  <CardDescription>Visão geral e potencial da ideia</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {formatText(idea.analyses.comprehensive)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {idea.analyses.pitch && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="overflow-hidden border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <CardTitle className="text-lg flex items-center">
                    <Presentation className="h-5 w-5 text-purple-600 mr-2" />
                    Pitch Profissional
                  </CardTitle>
                  <CardDescription>Apresentação concisa e persuasiva da ideia</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {formatText(idea.analyses.pitch)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {idea.analyses.usp && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="overflow-hidden border-amber-100">
                <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-100">
                  <CardTitle className="text-lg flex items-center">
                    <Award className="h-5 w-5 text-amber-600 mr-2" />
                    Unique Selling Points
                  </CardTitle>
                  <CardDescription>Diferenciais competitivos da ideia</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {formatText(idea.analyses.usp)}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="strategic" className="space-y-6">
          {idea.analyses.swot && idea.analyses.swot.strengths && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="overflow-hidden border-blue-100">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
                  <CardTitle className="text-lg flex items-center">
                    <Target className="h-5 w-5 text-blue-600 mr-2" />
                    Análise SWOT
                  </CardTitle>
                  <CardDescription>Forças, Fraquezas, Oportunidades e Ameaças</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <h3 className="font-bold text-green-800 mb-3 flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
                        Forças
                      </h3>
                      <div className="text-green-900 prose">
                        {formatText(idea.analyses.swot.strengths)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                      <h3 className="font-bold text-red-800 mb-3 flex items-center">
                        <XCircle className="h-5 w-5 mr-2 text-red-600" />
                        Fraquezas
                      </h3>
                      <div className="text-red-900 prose">
                        {formatText(idea.analyses.swot.weaknesses)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                        <ExternalLink className="h-5 w-5 mr-2 text-blue-600" />
                        Oportunidades
                      </h3>
                      <div className="text-blue-900 prose">
                        {formatText(idea.analyses.swot.opportunities)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                      <h3 className="font-bold text-orange-800 mb-3 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-orange-600" />
                        Ameaças
                      </h3>
                      <div className="text-orange-900 prose">
                        {formatText(idea.analyses.swot.threats)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {idea.analyses.vrio && idea.analyses.vrio.value && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="overflow-hidden border-indigo-100">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                  <CardTitle className="text-lg flex items-center">
                    <CheckSquare className="h-5 w-5 text-indigo-600 mr-2" />
                    Análise VRIO
                  </CardTitle>
                  <CardDescription>Valor, Raridade, Imitabilidade e Organização</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                          <DollarSign className="h-5 w-5 mr-2 text-blue-600" />
                          Valor
                        </h3>
                        <div className="text-blue-900 prose">
                          {formatText(idea.analyses.vrio.value)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <h3 className="font-bold text-purple-800 mb-2 flex items-center">
                          <Award className="h-5 w-5 mr-2 text-purple-600" />
                          Raridade
                        </h3>
                        <div className="text-purple-900 prose">
                          {formatText(idea.analyses.vrio.rarity)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <h3 className="font-bold text-green-800 mb-2 flex items-center">
                          <Scale className="h-5 w-5 mr-2 text-green-600" />
                          Imitabilidade
                        </h3>
                        <div className="text-green-900 prose">
                          {formatText(idea.analyses.vrio.imitability)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                        <h3 className="font-bold text-amber-800 mb-2 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-amber-600" />
                          Organização
                        </h3>
                        <div className="text-amber-900 prose">
                          {formatText(idea.analyses.vrio.organization)}
                        </div>
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200 mt-4">
                      <h3 className="font-bold text-gray-800 mb-2">Conclusão da Análise VRIO</h3>
                      <div className="text-gray-900 prose">
                        {formatText(idea.analyses.vrio.conclusion)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {idea.analyses.pestel && idea.analyses.pestel.political && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="overflow-hidden border-green-100">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                  <CardTitle className="text-lg flex items-center">
                    <Globe className="h-5 w-5 text-green-600 mr-2" />
                    Análise PESTEL
                  </CardTitle>
                  <CardDescription>Fatores Políticos, Econômicos, Sociais, Tecnológicos, Ambientais e Legais</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                      <h3 className="font-bold text-red-800 mb-2 flex items-center">
                        <Target className="h-5 w-5 mr-2 text-red-600" />
                        Fatores Políticos
                      </h3>
                      <div className="text-red-900 prose">
                        {formatText(idea.analyses.pestel.political)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                      <h3 className="font-bold text-green-800 mb-2 flex items-center">
                        <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                        Fatores Econômicos
                      </h3>
                      <div className="text-green-900 prose">
                        {formatText(idea.analyses.pestel.economic)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        Fatores Sociais
                      </h3>
                      <div className="text-blue-900 prose">
                        {formatText(idea.analyses.pestel.social)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-bold text-purple-800 mb-2 flex items-center">
                        <Zap className="h-5 w-5 mr-2 text-purple-600" />
                        Fatores Tecnológicos
                      </h3>
                      <div className="text-purple-900 prose">
                        {formatText(idea.analyses.pestel.technological)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
                      <h3 className="font-bold text-emerald-800 mb-2 flex items-center">
                        <Globe className="h-5 w-5 mr-2 text-emerald-600" />
                        Fatores Ambientais
                      </h3>
                      <div className="text-emerald-900 prose">
                        {formatText(idea.analyses.pestel.environmental)}
                      </div>
                    </div>
                    
                    <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
                      <h3 className="font-bold text-yellow-800 mb-2 flex items-center">
                        <Scale className="h-5 w-5 mr-2 text-yellow-600" />
                        Fatores Legais
                      </h3>
                      <div className="text-yellow-900 prose">
                        {formatText(idea.analyses.pestel.legal)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {idea.analyses.porter && idea.analyses.porter.new_entrants && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <Card className="overflow-hidden border-red-100">
                <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
                  <CardTitle className="text-lg flex items-center">
                    <Target className="h-5 w-5 text-red-600 mr-2" />
                    5 Forças de Porter
                  </CardTitle>
                  <CardDescription>Análise do ambiente competitivo</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 rounded-lg p-4 border border-amber-200">
                        <h3 className="font-bold text-amber-800 mb-2 flex items-center">
                          <ArrowUpRight className="h-5 w-5 mr-2 text-amber-600" />
                          Novos Entrantes
                        </h3>
                        <div className="text-amber-900 prose">
                          {formatText(idea.analyses.porter.new_entrants)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
                        <h3 className="font-bold text-green-800 mb-2 flex items-center">
                          <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                          Poder dos Fornecedores
                        </h3>
                        <div className="text-green-900 prose">
                          {formatText(idea.analyses.porter.suppliers_power)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                        <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                          <Users className="h-5 w-5 mr-2 text-blue-600" />
                          Poder dos Compradores
                        </h3>
                        <div className="text-blue-900 prose">
                          {formatText(idea.analyses.porter.buyers_power)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
                        <h3 className="font-bold text-purple-800 mb-2 flex items-center">
                          <PencilRuler className="h-5 w-5 mr-2 text-purple-600" />
                          Produtos Substitutos
                        </h3>
                        <div className="text-purple-900 prose">
                          {formatText(idea.analyses.porter.substitutes)}
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-lg p-4 border border-red-200">
                        <h3 className="font-bold text-red-800 mb-2 flex items-center">
                          <Target className="h-5 w-5 mr-2 text-red-600" />
                          Rivalidade Competitiva
                        </h3>
                        <div className="text-red-900 prose">
                          {formatText(idea.analyses.porter.rivalry)}
                        </div>
                      </div>
                      
                      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-4 border border-gray-200">
                        <h3 className="font-bold text-gray-800 mb-2">Conclusão - 5 Forças de Porter</h3>
                        <div className="text-gray-900 prose">
                          {formatText(idea.analyses.porter.conclusion)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="market" className="space-y-6">
          {idea.analyses.competitive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="overflow-hidden border-indigo-100">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart2 className="h-5 w-5 text-indigo-600 mr-2" />
                    Análise Competitiva
                  </CardTitle>
                  <CardDescription>Análise detalhada do cenário competitivo</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {formatText(idea.analyses.competitive)}
                  </div>
                  
                  <div className="mt-6 grid place-items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="Análise Competitiva" 
                      className="rounded-lg shadow-md max-h-64 object-cover" 
                    />
                    <p className="text-xs text-gray-500 mt-2">Representação ilustrativa de posicionamento competitivo</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        
          {idea.analyses.go_to_market && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="overflow-hidden border-green-100">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                  <CardTitle className="text-lg flex items-center">
                    <Rocket className="h-5 w-5 text-green-600 mr-2" />
                    Estratégia Go-to-Market
                  </CardTitle>
                  <CardDescription>Planejamento para entrada no mercado</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {formatText(idea.analyses.go_to_market)}
                  </div>
                  
                  <div className="mt-6 grid place-items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1507679799987-c73779587ccf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="Go-to-Market" 
                      className="rounded-lg shadow-md max-h-64 object-cover" 
                    />
                    <p className="text-xs text-gray-500 mt-2">Representação ilustrativa de estratégia de entrada no mercado</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        
          {idea.analyses.customer_persona && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Card className="overflow-hidden border-orange-100">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100">
                  <CardTitle className="text-lg flex items-center">
                    <Users className="h-5 w-5 text-orange-600 mr-2" />
                    Persona do Cliente
                  </CardTitle>
                  <CardDescription>Perfil detalhado dos clientes-alvo</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {formatText(idea.analyses.customer_persona)}
                  </div>
                  
                  <div className="mt-6 grid place-items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="Customer Persona" 
                      className="rounded-lg shadow-md max-h-64 object-cover" 
                    />
                    <p className="text-xs text-gray-500 mt-2">Representação ilustrativa do perfil do cliente ideal</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="financial" className="space-y-6">
          {idea.analyses.finances && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="overflow-hidden border-green-100">
                <CardHeader className="bg-gradient-to-r from-green-50 to-green-100">
                  <CardTitle className="text-lg flex items-center">
                    <DollarSign className="h-5 w-5 text-green-600 mr-2" />
                    Análise Financeira
                  </CardTitle>
                  <CardDescription>Projeções e viabilidade financeira</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {formatText(idea.analyses.finances)}
                  </div>
                  
                  <div className="mt-6 grid place-items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="Análise Financeira" 
                      className="rounded-lg shadow-md max-h-64 object-cover" 
                    />
                    <p className="text-xs text-gray-500 mt-2">Representação ilustrativa de análise financeira e projeções</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {idea.analyses.infrastructure && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="overflow-hidden border-indigo-100">
                <CardHeader className="bg-gradient-to-r from-indigo-50 to-indigo-100">
                  <CardTitle className="text-lg flex items-center">
                    <Server className="h-5 w-5 text-indigo-600 mr-2" />
                    Cenários de Infraestrutura
                  </CardTitle>
                  <CardDescription>Necessidades técnicas e investimentos</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {formatText(idea.analyses.infrastructure)}
                  </div>
                  
                  <div className="mt-6 grid place-items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="Infraestrutura" 
                      className="rounded-lg shadow-md max-h-64 object-cover" 
                    />
                    <p className="text-xs text-gray-500 mt-2">Representação ilustrativa de infraestrutura tecnológica</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
        
        <TabsContent value="execution" className="space-y-6">
          {idea.analyses.mvp_path && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Card className="overflow-hidden border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
                  <CardTitle className="text-lg flex items-center">
                    <PlayCircle className="h-5 w-5 text-purple-600 mr-2" />
                    Caminho para MVP
                  </CardTitle>
                  <CardDescription>Roteiro para o Produto Mínimo Viável</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose max-w-none">
                    {formatText(idea.analyses.mvp_path)}
                  </div>
                  
                  <div className="mt-6 grid place-items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1531403009284-440f080d1e12?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="MVP Path" 
                      className="rounded-lg shadow-md max-h-64 object-cover" 
                    />
                    <p className="text-xs text-gray-500 mt-2">Representação ilustrativa de processo de desenvolvimento de MVP</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
          
          {idea.improvement_suggestions && idea.improvement_suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <Card className="overflow-hidden border-yellow-100">
                <CardHeader className="bg-gradient-to-r from-yellow-50 to-yellow-100">
                  <CardTitle className="text-lg flex items-center">
                    <Zap className="h-5 w-5 text-yellow-600 mr-2" />
                    Sugestões de Melhoria
                  </CardTitle>
                  <CardDescription>Recomendações para aprimoramento</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {idea.improvement_suggestions.map((sugg, index) => (
                      <motion.div 
                        key={index} 
                        className={`p-4 rounded-lg border ${
                          sugg.implemented 
                            ? "bg-gradient-to-r from-green-50 to-green-100 border-green-200" 
                            : "bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200"
                        }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                                {sugg.area}
                              </Badge>
                              <Badge 
                                className={
                                  sugg.impact === 'alto' 
                                  ? "bg-red-100 text-red-800 hover:bg-red-200" 
                                  : sugg.impact === 'médio' 
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200" 
                                  : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                }
                              >
                                Impacto {sugg.impact}
                              </Badge>
                              {sugg.implemented && (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Implementada
                                </Badge>
                              )}
                            </div>
                            <p className="prose">{formatText(sugg.suggestion)}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                  
                  <div className="mt-6 grid place-items-center">
                    <img 
                      src="https://images.unsplash.com/photo-1432888622747-4eb9a8f5a70d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                      alt="Melhorias" 
                      className="rounded-lg shadow-md max-h-64 object-cover" 
                    />
                    <p className="text-xs text-gray-500 mt-2">Representação ilustrativa de processo de melhoria contínua</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalysisReport;
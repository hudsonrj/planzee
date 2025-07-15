
import React, { useState, useEffect } from 'react';
import { DiagramArchitecture } from "@/api/entities";
import { GenerateImage } from "@/api/integrations";
import { Project } from "@/api/entities";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { 
  RefreshCw, 
  Download, 
  ZoomIn, 
  ZoomOut, 
  Loader2,
  Network,
  Database,
  Server,
  GitMerge,
  CodeSquare,
  Workflow,
  Share2
} from "lucide-react";

export default function ProjectDiagrams({ project }) {
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedDiagramType, setSelectedDiagramType] = useState("architecture");
  const [zoomLevel, setZoomLevel] = useState(100);

  useEffect(() => {
    loadDiagrams();
  }, [project.id]);

  const loadDiagrams = async () => {
    try {
      setLoading(true);
      const diagramsData = await DiagramArchitecture.filter({ project_id: project.id });
      setDiagrams(diagramsData);
    } catch (error) {
      console.error("Erro ao carregar diagramas:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateDiagram = async () => {
    try {
      setGenerating(true);
      
      let prompt;
      
      switch (selectedDiagramType) {
        case "architecture":
          prompt = `Gere um diagrama de arquitetura técnica para o projeto "${project.title}".
          Considere:
          - Arquitetura moderna e escalável
          - Microsserviços
          - APIs RESTful
          - Bancos de dados
          - Cache
          - Message brokers
          - Load balancers
          - Serviços de monitoramento
          
          Use um estilo profissional e limpo, com cores suaves e ícones modernos.
          O diagrama deve ser claro e fácil de entender.`;
          break;

        case "database":
          prompt = `Crie um diagrama de modelo de dados para o projeto "${project.title}".
          Inclua:
          - Tabelas principais
          - Relacionamentos
          - Chaves primárias e estrangeiras
          - Cardinalidade
          - Atributos importantes
          
          Use notação de banco de dados padrão, com um design limpo e profissional.`;
          break;

        case "deployment":
          prompt = `Desenvolva um diagrama de deployment para o projeto "${project.title}".
          Mostre:
          - Ambientes (dev, staging, prod)
          - Serviços cloud
          - Containers
          - Redes
          - Segurança
          - Backup e DR
          
          Use ícones e cores dos provedores cloud quando apropriado.`;
          break;

        case "sequence":
          prompt = `Crie um diagrama de sequência para os principais fluxos do projeto "${project.title}".
          Inclua:
          - Atores
          - Sistemas
          - Mensagens
          - Ordem de execução
          - Loops e condições
          
          Use notação UML padrão com design moderno.`;
          break;

        case "components":
          prompt = `Gere um diagrama de componentes para o projeto "${project.title}".
          Mostre:
          - Principais módulos
          - Dependências
          - Interfaces
          - Integrações
          - Camadas da aplicação
          
          Use cores e ícones modernos, mantendo clareza e legibilidade.`;
          break;
      }

      const response = await GenerateImage({
        prompt: prompt
      });

      if (response?.url) {
        // Salvar o diagrama gerado
        await DiagramArchitecture.create({
          project_id: project.id,
          image_url: response.url,
          generated_date: new Date().toISOString(),
          title: `Diagrama de ${getDiagramTypeLabel(selectedDiagramType)}`,
          description: prompt
        });

        await loadDiagrams();

        toast({
          title: "Diagrama gerado",
          description: "O diagrama foi gerado e salvo com sucesso!",
        });
      }
    } catch (error) {
      console.error("Erro ao gerar diagrama:", error);
      toast({
        title: "Erro ao gerar diagrama",
        description: "Não foi possível gerar o diagrama. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const getDiagramTypeLabel = (type) => {
    if (!type) return '';
    const types = {
      architecture: "Arquitetura",
      database: "Banco de Dados",
      deployment: "Deployment",
      sequence: "Sequência",
      components: "Componentes"
    };
    return types[type] || type;
  };

  const getDiagramIcon = (type) => {
    if (!type) return <Network className="h-4 w-4" />;
    const icons = {
      architecture: <Network className="h-4 w-4" />,
      database: <Database className="h-4 w-4" />,
      deployment: <Server className="h-4 w-4" />,
      sequence: <Workflow className="h-4 w-4" />,
      components: <Share2 className="h-4 w-4" />
    };
    return icons[type] || <Network className="h-4 w-4" />;
  };

  const handleZoomIn = () => {
    if (zoomLevel < 200) {
      setZoomLevel(zoomLevel + 10);
    }
  };

  const handleZoomOut = () => {
    if (zoomLevel > 50) {
      setZoomLevel(zoomLevel - 10);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Diagramas do Projeto</CardTitle>
          <div className="flex gap-2">
            <Select value={selectedDiagramType} onValueChange={setSelectedDiagramType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de diagrama" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="architecture">
                  <div className="flex items-center gap-2">
                    <Network className="h-4 w-4" />
                    <span>Arquitetura</span>
                  </div>
                </SelectItem>
                <SelectItem value="database">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span>Banco de Dados</span>
                  </div>
                </SelectItem>
                <SelectItem value="deployment">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4" />
                    <span>Deployment</span>
                  </div>
                </SelectItem>
                <SelectItem value="sequence">
                  <div className="flex items-center gap-2">
                    <Workflow className="h-4 w-4" />
                    <span>Sequência</span>
                  </div>
                </SelectItem>
                <SelectItem value="components">
                  <div className="flex items-center gap-2">
                    <Share2 className="h-4 w-4" />
                    <span>Componentes</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={handleGenerateDiagram} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Gerar Diagrama
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {diagrams.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <Network className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">
              Nenhum diagrama gerado ainda. Selecione um tipo e clique em "Gerar Diagrama".
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="px-2 py-1 bg-gray-100 rounded text-sm">
                {zoomLevel}%
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-6">
              {diagrams.map((diagram) => (
                <div key={diagram.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      {getDiagramIcon(
                        diagram.title && diagram.title.toLowerCase().includes("arquitetura") ? "architecture" : 
                        diagram.title && diagram.title.toLowerCase().includes("banco") ? "database" :
                        diagram.title && diagram.title.toLowerCase().includes("deployment") ? "deployment" :
                        diagram.title && diagram.title.toLowerCase().includes("sequência") ? "sequence" :
                        "components"
                      )}
                      <h3 className="font-medium">{diagram.title || 'Diagrama'}</h3>
                    </div>
                    <div className="text-sm text-gray-500">
                      Gerado em: {diagram.generated_date ? new Date(diagram.generated_date).toLocaleDateString() : 'Data não disponível'}
                    </div>
                  </div>

                  <div 
                    style={{ 
                      transform: `scale(${zoomLevel / 100})`,
                      transformOrigin: 'top left',
                      width: `${100 / (zoomLevel / 100)}%`
                    }}
                  >
                    {diagram.image_url && (
                      <img 
                        src={diagram.image_url} 
                        alt={diagram.title || 'Diagrama do projeto'}
                        className="w-full rounded-md shadow-md"
                      />
                    )}
                  </div>

                  {diagram.description && (
                    <p className="mt-4 text-sm text-gray-600">{diagram.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

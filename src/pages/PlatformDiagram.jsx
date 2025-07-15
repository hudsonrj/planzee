import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { 
  Copy, 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  GitMerge, 
  Database, 
  Server, 
  Layers, 
  Bot,
  CheckCircle2
} from "lucide-react";

export default function PlatformDiagram() {
  const [copiedDiagram, setCopiedDiagram] = useState('');

  const copyToClipboard = (code, diagramName) => {
    navigator.clipboard.writeText(code);
    setCopiedDiagram(diagramName);
    setTimeout(() => setCopiedDiagram(''), 2000);
  };

  const diagrams = {
    system: `
flowchart TD
    A[Frontend React] --> B[API Gateway]
    B --> C[Microserviços]
    C --> D[PostgreSQL]
    C --> E[Sistema de IA]
    C --> F[Redis Cache]
    C --> G[Storage S3]
    
    E --> H[Processamento NLP]
    E --> I[Geração de Conteúdo]
    E --> J[Análise Preditiva]
    
    subgraph "Infraestrutura Cloud"
        D
        F
        G
    end
    
    subgraph "Serviços de IA"
        H
        I
        J
    end
    `,
    
    data: `
erDiagram
    PROJECT ||--o{ TASK : contains
    PROJECT ||--o{ MEETING : has
    PROJECT ||--o{ BUDGET : estimates
    PROJECT ||--o{ CHECKLIST : includes
    
    USER ||--o{ TASK : assigned_to
    USER ||--o{ PROJECT : responsible_for
    USER }|--|| AREA : belongs_to
    
    TASK ||--|| ROLE : requires
    ROLE ||--o{ SENIORITY_LEVEL : has
    
    PROJECT {
        string id PK
        string title
        string description
        string status
        string responsible FK
        date start_date
        date deadline
        number progress
    }
    
    TASK {
        string id PK
        string project_id FK
        string title
        string status
        string assigned_to FK
        number estimated_hours
        number hourly_rate
    }
    
    USER {
        string id PK
        string email
        string full_name
        string position
        string area_id FK
    }
    `,
    
    ai: `
flowchart LR
    A[Entrada do Usuário] --> B[Processador NLP]
    B --> C{Tipo de Solicitação}
    
    C -->|Criar Projeto| D[Gerador de Projetos]
    C -->|Criar Tarefas| E[Gerador de Tarefas]
    C -->|Análise| F[Analisador Contexto]
    C -->|Relatório| G[Gerador Relatórios]
    
    D --> H[Base de Conhecimento]
    E --> H
    F --> H
    G --> H
    
    H --> I[Modelo de IA]
    I --> J[Resposta Estruturada]
    J --> K[Interface do Usuário]
    
    subgraph "Serviços IA"
        D
        E
        F
        G
    end
    `,
    
    cloud: `
graph TB
    subgraph "Load Balancer"
        LB[Application Load Balancer]
    end
    
    subgraph "Frontend"
        CF[CloudFront CDN]
        S3F[S3 Static Hosting]
        CF --> S3F
    end
    
    subgraph "Application Tier"
        ECS1[ECS Container 1]
        ECS2[ECS Container 2]
        ECS3[ECS Container 3]
        LB --> ECS1
        LB --> ECS2
        LB --> ECS3
    end
    
    subgraph "Database Tier"
        RDS[(RDS PostgreSQL)]
        REDIS[(ElastiCache Redis)]
    end
    
    subgraph "Storage"
        S3[(S3 Bucket)]
    end
    
    ECS1 --> RDS
    ECS2 --> RDS
    ECS3 --> RDS
    ECS1 --> REDIS
    ECS2 --> REDIS
    ECS3 --> REDIS
    ECS1 --> S3
    ECS2 --> S3
    ECS3 --> S3
    `
  };

  const diagramTypes = [
    {
      id: "system",
      name: "Arquitetura do Sistema",
      description: "Visão geral da arquitetura técnica da plataforma",
      icon: <Server className="h-5 w-5" />,
      components: [
        { name: "Frontend React", description: "Interface de usuário construída com React, Tailwind e Shadcn/UI" },
        { name: "API Gateway", description: "Gerencia todas as solicitações de API e roteia para os serviços apropriados" },
        { name: "Microserviços", description: "Arquitetura de microserviços para escalonamento e manutenção eficientes" },
        { name: "Base de Dados", description: "PostgreSQL para dados estruturados com esquema flexível" },
        { name: "Sistema de IA", description: "Serviços de IA para análise preditiva, processamento de linguagem e geração de conteúdo" }
      ]
    },
    {
      id: "data",
      name: "Modelo de Dados",
      description: "Estrutura e relacionamentos entre as entidades de dados",
      icon: <Database className="h-5 w-5" />,
      entities: [
        { name: "Projeto", relationships: ["Tarefas (1:n)", "Reuniões (1:n)", "Orçamentos (1:n)"] },
        { name: "Tarefa", relationships: ["Projeto (n:1)", "Usuário (n:1)"] },
        { name: "Reunião", relationships: ["Projeto (n:1)", "Usuários (n:m)"] },
        { name: "Usuário", relationships: ["Projetos (n:m)", "Tarefas (1:n)", "Reuniões (n:m)"] }
      ]
    },
    {
      id: "ai",
      name: "Arquitetura de IA",
      description: "Componentes e fluxo do sistema de inteligência artificial",
      icon: <Bot className="h-5 w-5" />,
      components: [
        { name: "Processador NLP", description: "Processa linguagem natural e identifica intenções" },
        { name: "Gerador de Projetos", description: "Cria projetos automaticamente com base em descrições" },
        { name: "Gerador de Tarefas", description: "Identifica e cria tarefas a partir de contexto" },
        { name: "Analisador de Contexto", description: "Extrai insights e padrões dos dados" }
      ]
    },
    {
      id: "cloud",
      name: "Infraestrutura Cloud",
      description: "Componentes de infraestrutura na nuvem",
      icon: <GitMerge className="h-5 w-5" />,
      components: [
        { name: "Load Balancer", description: "Distribui tráfego entre instâncias da aplicação" },
        { name: "ECS Containers", description: "Serviços em containers gerenciados pelo AWS ECS" },
        { name: "RDS PostgreSQL", description: "Banco de dados relacional gerenciado" },
        { name: "ElastiCache Redis", description: "Cache distribuído para sessões e dados temporários" }
      ]
    }
  ];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">Diagramas da Plataforma Planzee</h1>
      <p className="text-gray-500 mb-8">Visualização técnica da arquitetura usando diagramas Mermaid</p>
      
      <Tabs defaultValue="system" className="mb-6">
        <TabsList className="mb-4 flex-wrap h-auto">
          {diagramTypes.map((diagram) => (
            <TabsTrigger key={diagram.id} value={diagram.id} className="flex items-center gap-2">
              {diagram.icon}
              <span className="hidden sm:inline">{diagram.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>
        
        {diagramTypes.map((diagram) => (
          <TabsContent key={diagram.id} value={diagram.id}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Diagrama */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {diagram.icon}
                        {diagram.name}
                      </CardTitle>
                      <CardDescription>{diagram.description}</CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(diagrams[diagram.id], diagram.name)}
                    >
                      {copiedDiagram === diagram.name ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <Textarea
                      value={diagrams[diagram.id].trim()}
                      readOnly
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </div>
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Como usar:</strong> Copie o código acima e cole em ferramentas como GitHub, 
                      Mermaid Live Editor, ou qualquer plataforma que suporte diagramas Mermaid.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Componentes */}
              <Card>
                <CardHeader>
                  <CardTitle>Componentes-chave</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {diagram.components && diagram.components.map((component, index) => (
                        <div key={index} className="p-3 bg-white rounded-md border">
                          <h4 className="text-sm font-semibold">{component.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">{component.description}</p>
                        </div>
                      ))}
                      
                      {diagram.entities && diagram.entities.map((entity, index) => (
                        <div key={index} className="p-3 bg-white rounded-md border">
                          <h4 className="text-sm font-semibold">{entity.name}</h4>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {entity.relationships.map((rel, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {rel}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
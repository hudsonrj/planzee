import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, RefreshCw } from 'lucide-react';
import { InvokeLLM } from '@/api/integrations';

export default function DiagramGenerator({ project, onDiagramGenerated }) {
  const [loading, setLoading] = useState(false);
  const [mermaidCode, setMermaidCode] = useState('');
  const [diagramType, setDiagramType] = useState('flowchart');

  const generateDiagram = async () => {
    if (!project) return;

    try {
      setLoading(true);
      
      const prompt = `
        Baseado no seguinte projeto: "${project.title}"
        Descrição: ${project.description || 'Sem descrição'}
        
        Gere um diagrama Mermaid do tipo ${diagramType} que represente a arquitetura ou fluxo deste projeto.
        
        Seja específico e técnico. Use nomes reais de tecnologias e componentes.
        
        Tipos de diagrama disponíveis:
        - flowchart: Para fluxos de processo e arquitetura
        - sequenceDiagram: Para interações entre sistemas
        - erDiagram: Para modelo de dados
        - gitgraph: Para fluxo de desenvolvimento
        
        Retorne APENAS o código Mermaid válido, sem explicações adicionais.
      `;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            mermaid_code: {
              type: "string",
              description: "Código Mermaid válido para o diagrama"
            },
            title: {
              type: "string", 
              description: "Título do diagrama"
            },
            description: {
              type: "string",
              description: "Descrição do que o diagrama representa"
            }
          }
        }
      });

      setMermaidCode(response.mermaid_code);
      
      if (onDiagramGenerated) {
        onDiagramGenerated({
          code: response.mermaid_code,
          title: response.title,
          description: response.description,
          type: diagramType
        });
      }

    } catch (error) {
      console.error('Erro ao gerar diagrama:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(mermaidCode);
  };

  const renderMermaidDiagram = () => {
    if (!mermaidCode) return null;

    return (
      <div className="bg-white p-4 rounded-lg border">
        <div className="text-center">
          <div 
            className="mermaid"
            dangerouslySetInnerHTML={{ 
              __html: `<div class="mermaid">${mermaidCode}</div>` 
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerador de Diagramas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={diagramType === 'flowchart' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDiagramType('flowchart')}
          >
            Fluxograma
          </Button>
          <Button
            variant={diagramType === 'sequenceDiagram' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDiagramType('sequenceDiagram')}
          >
            Sequência
          </Button>
          <Button
            variant={diagramType === 'erDiagram' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDiagramType('erDiagram')}
          >
            Banco de Dados
          </Button>
          <Button
            variant={diagramType === 'gitgraph' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setDiagramType('gitgraph')}
          >
            Git Flow
          </Button>
        </div>

        <Button onClick={generateDiagram} disabled={loading} className="w-full">
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Gerando...
            </>
          ) : (
            'Gerar Diagrama'
          )}
        </Button>

        {mermaidCode && (
          <div className="space-y-4">
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b flex justify-between items-center">
                <Badge variant="secondary">Código Mermaid</Badge>
                <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                className="min-h-[200px] border-0"
                placeholder="Código Mermaid aparecerá aqui..."
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Como usar este diagrama:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Copie o código Mermaid acima</li>
                <li>Cole em ferramentas como GitHub, GitLab, Notion ou Mermaid Live Editor</li>
                <li>O diagrama será renderizado automaticamente</li>
              </ol>
              <p className="text-sm text-gray-600 mt-2">
                Você pode editar o código diretamente para personalizar o diagrama.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
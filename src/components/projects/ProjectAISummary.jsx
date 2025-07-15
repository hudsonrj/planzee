import React, { useState, useEffect } from 'react';
import { InvokeLLM } from '@/api/integrations';
import { Loader2, Wand2 } from 'lucide-react';

export default function ProjectAISummary({ project, tasks }) {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generateSummary = async () => {
      if (!project) return;
      
      setLoading(true);
      try {
        const taskCounts = tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {});

        const prompt = `
          Como um gerente de projetos sênior, analise os seguintes dados do projeto de TI e forneça um resumo executivo extremamente conciso (2-3 frases no máximo).

          Projeto: ${project.title}
          Status Atual: ${project.status}
          Progresso: ${project.progress || 0}%
          Prazo: ${project.deadline ? new Date(project.deadline).toLocaleDateString() : 'N/A'}
          Tarefas Pendentes: ${taskCounts.pendente || 0}
          Tarefas Bloqueadas: ${taskCounts.bloqueada || 0}
          Tarefas Concluídas: ${taskCounts.concluída || 0}

          O resumo deve cobrir:
          1. O estado geral atual do projeto.
          2. O principal risco ou ponto de atenção no momento.
          3. A próxima ação recomendada.

          Seja direto e foque em informações acionáveis para um executivo (CEO/CTO).
        `;

        const response = await InvokeLLM({ prompt });
        setSummary(response);
      } catch (error) {
        console.error("Erro ao gerar resumo de IA:", error);
        setSummary("Não foi possível gerar a análise do projeto no momento.");
      } finally {
        setLoading(false);
      }
    };

    generateSummary();
  }, [project.id]); 

  return (
    <div className="w-full">
      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-gray-700">
        <Wand2 className="h-4 w-4 text-teal-600" />
        Análise Executiva (IA)
      </h4>
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Analisando dados...</span>
        </div>
      ) : (
        <p className="text-sm text-gray-600 italic">
          "{summary}"
        </p>
      )}
    </div>
  );
}
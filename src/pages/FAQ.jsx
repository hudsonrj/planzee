import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from "lucide-react";

export default function FAQ() {
  const [searchQuery, setSearchQuery] = React.useState("");
  
  const categories = [
    { id: "general", name: "Geral" },
    { id: "projects", name: "Projetos" },
    { id: "tasks", name: "Tarefas" },
    { id: "meetings", name: "Reuniões" },
    { id: "ai", name: "IA" },
    { id: "reports", name: "Relatórios" }
  ];
  
  const faqs = [
    {
      id: "faq1",
      category: "general",
      question: "Como faço para alterar meu perfil?",
      answer: "Você pode alterar suas informações de perfil clicando no ícone de usuário no canto superior direito e selecionando 'Perfil'. Lá você pode atualizar seu nome, foto e outras preferências."
    },
    {
      id: "faq2",
      category: "general",
      question: "Como funciona a barra de pesquisa?",
      answer: "A barra de pesquisa no topo da página permite buscar em todo o sistema. Você pode pesquisar projetos, tarefas, reuniões, usuários e documentos. Basta digitar e pressionar Enter, ou usar o atalho Ctrl+K para abrir a pesquisa."
    },
    {
      id: "faq3",
      category: "projects",
      question: "Como criar um novo projeto?",
      answer: "Para criar um novo projeto, acesse a página de Projetos e clique no botão 'Novo Projeto'. Preencha as informações necessárias como título, descrição, prazo e responsável. Você também pode usar o assistente de IA para ajudar na configuração do projeto."
    },
    {
      id: "faq4",
      category: "projects",
      question: "Como atualizar o progresso de um projeto?",
      answer: "Existem duas formas de atualizar o progresso: manualmente, editando o projeto e ajustando o percentual de conclusão; ou automaticamente, baseado nas tarefas concluídas. A atualização automática é calculada pela proporção de tarefas concluídas em relação ao total."
    },
    {
      id: "faq5",
      category: "tasks",
      question: "Como criar tarefas em lote?",
      answer: "Você pode criar várias tarefas de uma vez usando a função 'Importar Tarefas' na página de Tarefas. Também é possível gerar tarefas automaticamente a partir de anotações de reuniões usando a IA integrada."
    },
    {
      id: "faq6",
      category: "tasks",
      question: "Como atribuir tarefas a outros usuários?",
      answer: "Ao criar ou editar uma tarefa, você pode selecionar o responsável no campo 'Atribuído a'. Você também pode arrastar tarefas para usuários na visualização de quadro (Kanban)."
    },
    {
      id: "faq7",
      category: "meetings",
      question: "Como melhorar automaticamente as anotações de reunião?",
      answer: "Após registrar as anotações de uma reunião, clique no botão 'Melhorar Anotações' para que a IA reformule e estruture o texto, tornando-o mais claro e organizado."
    },
    {
      id: "faq8",
      category: "meetings",
      question: "Como gerar tarefas a partir de uma reunião?",
      answer: "Nas anotações da reunião, clique no botão 'Detectar Tarefas'. A IA analisará o conteúdo e sugerirá tarefas que devem ser criadas, incluindo detalhes como responsável, estimativa de horas e dependências."
    },
    {
      id: "faq9",
      category: "ai",
      question: "Como o Assistente de IA ajuda na criação de projetos?",
      answer: "O Assistente de IA pode sugerir estruturas de projeto, estimar prazos e custos, identificar riscos potenciais e recomendar equipes com base na descrição do projeto que você fornecer."
    },
    {
      id: "faq10",
      category: "ai",
      question: "A IA tem acesso aos meus dados confidenciais?",
      answer: "A IA só tem acesso aos dados que você explicitamente compartilha com ela. Informações confidenciais marcadas como tal no sistema não são utilizadas para treinamento ou sugestões."
    },
    {
      id: "faq11",
      category: "reports",
      question: "Como exportar relatórios?",
      answer: "Em cada página de relatório, você encontrará um botão 'Exportar' que permite salvar os dados em formato PDF, Excel ou CSV. Você também pode programar envios automáticos de relatórios para stakeholders."
    },
    {
      id: "faq12",
      category: "reports",
      question: "Como personalizar os dashboards?",
      answer: "Você pode personalizar seus dashboards clicando no ícone de engrenagem em cada widget. É possível adicionar, remover e reorganizar widgets conforme sua necessidade, além de ajustar os filtros de dados."
    }
  ];
  
  const filteredFaqs = searchQuery.trim() === "" 
    ? faqs 
    : faqs.filter(faq => 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-2">Perguntas Frequentes</h1>
      <p className="text-gray-500 mb-8">Encontre respostas rápidas para dúvidas comuns sobre a plataforma</p>
      
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        <Input 
          placeholder="Pesquisar perguntas..." 
          className="pl-10"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      <Tabs defaultValue="all" className="mb-8">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          {categories.map(category => (
            <TabsTrigger key={category.id} value={category.id}>
              {category.name}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <ScrollArea className="h-[calc(100vh-20rem)]">
            <Accordion type="single" collapsible className="w-full">
              {filteredFaqs.map(faq => (
                <AccordionItem key={faq.id} value={faq.id}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-start">
                      <div className="text-left font-medium">{faq.question}</div>
                      <Badge className="ml-3 bg-gray-100 text-gray-700 text-xs">{
                        categories.find(c => c.id === faq.category)?.name
                      }</Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-2 pb-3 px-1 text-gray-600">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        </TabsContent>
        
        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-6">
            <ScrollArea className="h-[calc(100vh-20rem)]">
              <Accordion type="single" collapsible className="w-full">
                {filteredFaqs
                  .filter(faq => faq.category === category.id)
                  .map(faq => (
                    <AccordionItem key={faq.id} value={faq.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="text-left font-medium">{faq.question}</div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pt-2 pb-3 px-1 text-gray-600">
                          {faq.answer}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
              </Accordion>
            </ScrollArea>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
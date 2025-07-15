import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { InvokeLLM, UploadFile, ExtractDataFromUploadedFile } from "@/api/integrations";
import { User } from "@/api/entities";
import {
  Send,
  Upload,
  FileText,
  Bot,
  Loader2,
  File,
  CheckCircle,
  AlertCircle,
  Building2,
  Shield,
  BookOpen,
  Trash2,
  Eye,
  Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function GabihAlliedIT() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedDocuments, setUploadedDocuments] = useState([]);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentCategory, setDocumentCategory] = useState("");
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  const documentCategories = [
    "Políticas Internas",
    "Processos e Procedimentos",
    "Normas de Segurança",
    "Recursos Humanos",
    "Compliance",
    "Manual do Funcionário",
    "Estrutura Organizacional",
    "Projetos e Metodologias",
    "Tecnologia e TI",
    "Financeiro",
    "Comercial",
    "Outros"
  ];

  const suggestions = [
    "Qual é a política de trabalho remoto da AlliedIT?",
    "Como funciona o processo de aprovação de projetos?",
    "Quais são as normas de segurança da informação?",
    "Como solicitar férias?",
    "Qual é a estrutura hierárquica da empresa?",
    "Como é o processo de onboarding de novos funcionários?",
    "Quais são os benefícios oferecidos pela empresa?"
  ];

  useEffect(() => {
    loadUserData();
    loadDocuments();
  }, []);

  const loadUserData = async () => {
    try {
      const userData = await User.me();
      setUser(userData);
    } catch (error) {
      console.error("Erro ao carregar usuário:", error);
    }
  };

  const loadDocuments = async () => {
    // Simular carregamento de documentos do banco vetorial
    // Em uma implementação real, isso viria de uma API específica
    const mockDocuments = [
      {
        id: "1",
        title: "Manual do Funcionário 2024",
        category: "Recursos Humanos",
        uploadDate: "2024-01-15",
        fileType: "PDF",
        status: "processed"
      },
      {
        id: "2",
        title: "Política de Segurança da Informação",
        category: "Normas de Segurança",
        uploadDate: "2024-01-10",
        fileType: "PDF",
        status: "processed"
      }
    ];
    setUploadedDocuments(mockDocuments);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setDocumentTitle(file.name.replace(/\.[^/.]+$/, "")); // Remove extensão
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !documentTitle || !documentCategory) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(10);
      setError(null);

      // Upload do arquivo
      const uploadResult = await UploadFile({ file: selectedFile });
      setUploadProgress(40);

      // Extrair texto do documento
      const extractResult = await ExtractDataFromUploadedFile({
        file_url: uploadResult.file_url,
        json_schema: {
          type: "object",
          properties: {
            content: { type: "string" },
            sections: { 
              type: "array", 
              items: { type: "string" } 
            }
          }
        }
      });
      setUploadProgress(70);

      // Simular processamento para banco vetorial
      await new Promise(resolve => setTimeout(resolve, 2000));
      setUploadProgress(100);

      // Adicionar documento à lista
      const newDocument = {
        id: Date.now().toString(),
        title: documentTitle,
        category: documentCategory,
        uploadDate: new Date().toISOString().split('T')[0],
        fileType: selectedFile.type.includes('pdf') ? 'PDF' : 'DOC',
        status: "processed",
        file_url: uploadResult.file_url
      };

      setUploadedDocuments(prev => [newDocument, ...prev]);
      
      // Reset form
      setSelectedFile(null);
      setDocumentTitle("");
      setDocumentCategory("");
      setUploadDialogOpen(false);
      setUploadProgress(0);

    } catch (error) {
      console.error("Erro no upload:", error);
      setError("Erro ao fazer upload do documento. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  const handleSendMessage = async (text = inputMessage) => {
    if (!text.trim()) return;

    setError(null);

    const userMessage = {
      content: text,
      type: "user",
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      // Criar contexto baseado nos documentos carregados
      const documentsContext = uploadedDocuments.map(doc => ({
        title: doc.title,
        category: doc.category,
        summary: `Documento: ${doc.title} - Categoria: ${doc.category}`
      }));

      const prompt = `
        Você é Gabih na AlliedIT, assistente especializada em políticas, processos e conhecimento corporativo da AlliedIT.
        
        IMPORTANTE: Você deve responder APENAS perguntas relacionadas a:
        - Políticas internas da empresa
        - Processos e procedimentos corporativos
        - Normas e regulamentos
        - Informações sobre a estrutura da empresa
        - Recursos humanos e benefícios
        - Documentos corporativos

        Se a pergunta não estiver relacionada a esses temas, responda educadamente que você é especializada apenas em conhecimento corporativo da AlliedIT.

        Documentos disponíveis na base de conhecimento:
        ${JSON.stringify(documentsContext)}

        Usuário atual: ${user?.full_name || "Funcionário"}
        Email: ${user?.email || ""}

        Pergunta do usuário: "${text}"

        Responda de forma profissional, precisa e baseada nas políticas e documentos da AlliedIT.
        Se você não tiver informações específicas sobre o assunto perguntado, mencione que o documento relevante pode não estar na base de conhecimento atual e sugira entrar em contato com RH ou a área responsável.

        Sempre termine suas respostas com "Gabih na AlliedIT 🏢"
      `;

      const aiResponse = await InvokeLLM({
        prompt: prompt,
        add_context_from_internet: false // Não usar internet, apenas conhecimento interno
      });

      const assistantMessage = {
        content: aiResponse,
        type: "assistant",
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      setError("Ocorreu um erro ao processar sua pergunta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = (docId) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== docId));
  };

  const formatMessageContent = (content) => {
    return content.replace(/\n/g, '<br>');
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Chat Principal */}
        <div className="flex-1">
          <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between items-start">
            <div className="flex items-center gap-3">
              <Avatar className="h-12 w-12 border-2 border-blue-200">
                <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" alt="Gabih" />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">GA</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Building2 className="h-6 w-6 text-blue-600" />
                  Gabih na AlliedIT
                </h1>
                <p className="text-sm text-gray-600">Assistente de Conhecimento Corporativo</p>
              </div>
            </div>

            <Button 
              onClick={() => setUploadDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Upload className="h-4 w-4" />
              Upload Documento
            </Button>
          </div>

          <Card className="h-[calc(100vh-280px)] border-blue-200 shadow-lg">
            <CardContent className="p-0 flex flex-col h-full">
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-blue-50/30 to-purple-50/30">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Avatar className="h-24 w-24 mb-5 border-4 border-blue-200">
                      <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" alt="Gabih" />
                      <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-3xl">GA</AvatarFallback>
                    </Avatar>
                    <h3 className="text-2xl font-bold text-blue-800 mb-2">Gabih na AlliedIT</h3>
                    <p className="text-gray-600 max-w-md mb-4">
                      Olá! Sou sua assistente especializada em conhecimento corporativo da AlliedIT. 
                      Posso ajudar com políticas, processos, normas e informações da empresa.
                    </p>
                    <div className="bg-gradient-to-r from-blue-100 to-purple-100 p-4 rounded-lg border border-blue-200 shadow-sm">
                      <p className="text-blue-700 font-medium flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Pergunte sobre políticas, processos ou documentos corporativos!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.type === "user" ? 'justify-end' : 'justify-start'} mb-4`}
                      >
                        <div className={`flex ${message.type === "user" ? 'flex-row-reverse' : 'flex-row'} items-start gap-2 max-w-[85%]`}>
                          <Avatar className="h-8 w-8">
                            {message.type === "user" ? (
                              <AvatarFallback className="bg-blue-600 text-white text-sm">
                                {user?.full_name?.[0] || 'U'}
                              </AvatarFallback>
                            ) : (
                              <AvatarImage src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/193f06a99_gabih.jpg" alt="Gabih" />
                            )}
                          </Avatar>
                          <div className={`p-3 rounded-lg ${
                            message.type === "user" 
                              ? 'bg-blue-600 text-white rounded-br-none' 
                              : 'bg-white border border-blue-100 text-gray-800 rounded-bl-none shadow-sm'
                          }`}>
                            <div 
                              className="text-sm"
                              dangerouslySetInnerHTML={{ __html: formatMessageContent(message.content) }}
                            />
                            <div className="text-xs opacity-70 mt-1">
                              {new Date(message.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {error && (
                <Alert variant="destructive" className="mx-4 mb-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="p-4 border-t border-blue-100 bg-white">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Pergunte sobre políticas, processos ou documentos da AlliedIT..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    className="min-h-[60px] border-blue-200 focus-visible:ring-blue-400"
                  />
                  <Button
                    onClick={() => handleSendMessage()}
                    disabled={loading || !inputMessage.trim()}
                    className="h-[60px] w-[60px] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Documentos e Sugestões */}
        <div className="w-full lg:w-80 space-y-6">
          {/* Sugestões */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Sugestões de Perguntas
              </h3>
              <div className="space-y-2">
                {suggestions.map((suggestion, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start text-left h-auto py-2 px-3 text-xs border-blue-200 hover:bg-blue-50"
                    onClick={() => handleSendMessage(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Documentos Carregados */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Base de Conhecimento ({uploadedDocuments.length})
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {uploadedDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{doc.title}</div>
                      <div className="text-gray-500 flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {doc.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full" title="Processado"></div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteDocument(doc.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog de Upload */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload de Documento Corporativo
            </DialogTitle>
            <DialogDescription>
              Faça upload de políticas, processos e documentos da AlliedIT para enriquecer a base de conhecimento.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="file-upload">Arquivo</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".pdf,.doc,.docx,.txt"
                onChange={handleFileSelect}
                className="mt-1"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Arquivo selecionado: {selectedFile.name}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="doc-title">Título do Documento</Label>
              <Input
                id="doc-title"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                placeholder="Ex: Manual do Funcionário 2024"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="doc-category">Categoria</Label>
              <select
                id="doc-category"
                value={documentCategory}
                onChange={(e) => setDocumentCategory(e.target.value)}
                className="mt-1 w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Selecione uma categoria</option>
                {documentCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando documento...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUploadDocument} 
              disabled={!selectedFile || !documentTitle || !documentCategory || uploading}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? 'Processando...' : 'Fazer Upload'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
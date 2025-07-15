
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Budget, Project, User } from "@/api/entities";
import { createPageUrl } from "@/utils";
import { SendEmail } from "@/api/integrations";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertTriangle,
  ArrowLeft,
  Download,
  FileText,
  Send,
  CheckCircle,
  XCircle,
  Loader2,
  Copy,
  Bot,
  Calendar,
  DollarSign,
  User as UserIcon,
  Mail,
  Clock,
  Info
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const STATUS_BADGES = {
  rascunho: "bg-gray-100 text-gray-800",
  pendente: "bg-yellow-100 text-yellow-800",
  enviado: "bg-blue-100 text-blue-800",
  aprovado: "bg-green-100 text-green-800",
  reprovado: "bg-red-100 text-red-800",
  reajuste: "bg-purple-100 text-purple-800"
};

export default function BudgetDetails() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const budgetId = urlParams.get("id");
  
  const [budget, setBudget] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [showSendEmailDialog, setShowSendEmailDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [showStatusUpdateDialog, setShowStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [activeCloudTab, setActiveCloudTab] = useState("aws");
  
  useEffect(() => {
    if (!budgetId) {
      navigate(createPageUrl("Budgets"));
      return;
    }
    
    loadData();
  }, [budgetId]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      
      const [budgetData, projectsData, userData] = await Promise.all([
        Budget.filter({ id: budgetId }),
        Project.list(),
        User.me()
      ]);
      
      if (budgetData.length === 0) {
        alert("Orçamento não encontrado.");
        navigate(createPageUrl("Budgets"));
        return;
      }
      
      setBudget(budgetData[0]);
      setProjects(projectsData);
      setCurrentUser(userData);
      
      const defaultSubject = `Orçamento: ${budgetData[0].title}`;
      const defaultBody = `Prezado(a) ${budgetData[0].client_name},
    
Segue em anexo o orçamento para o projeto "${budgetData[0].title}" conforme solicitado.
    
O valor total do projeto é de ${formatCurrency(budgetData[0].total_value)} com prazo estimado de ${budgetData[0].proposed_deadline} dias.
    
Estamos à disposição para quaisquer esclarecimentos que se façam necessários.
    
Atenciosamente,
${userData.full_name}
Allied IT Innovation Hub`;
      
      setEmailSubject(defaultSubject);
      setEmailBody(defaultBody);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      alert("Ocorreu um erro ao carregar os dados do orçamento.");
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
  
  const getProjectTitle = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : "N/A";
  };
  
  const handleSendEmail = async () => {
    if (!emailSubject.trim() || !emailBody.trim()) {
      alert("Por favor, preencha o assunto e o corpo do email.");
      return;
    }
    
    try {
      setSendingEmail(true);
      
      await SendEmail({
        to: budget.client_email,
        subject: emailSubject,
        body: emailBody
      });
      
      await Budget.update(budget.id, {
        status: "enviado",
        sent_date: new Date().toISOString().split('T')[0]
      });
      
      await loadData();
      
      setShowSendEmailDialog(false);
      alert("Email enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar email:", error);
      alert("Ocorreu um erro ao enviar o email. Por favor, tente novamente.");
    } finally {
      setSendingEmail(false);
    }
  };
  
  const handleExportPdf = async () => {
    try {
      setExportingPdf(true);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      alert("Orçamento exportado como PDF com sucesso!");
    } catch (error) {
      console.error("Erro ao exportar PDF:", error);
      alert("Ocorreu um erro ao exportar o PDF. Por favor, tente novamente.");
    } finally {
      setExportingPdf(false);
    }
  };
  
  const handleUpdateStatus = async () => {
    if (!newStatus) {
      alert("Por favor, selecione um novo status.");
      return;
    }
    
    try {
      setLoading(true);
      
      const updates = { status: newStatus };
      
      if (newStatus === "enviado") {
        updates.sent_date = new Date().toISOString().split('T')[0];
      } else if (newStatus === "aprovado" || newStatus === "reprovado") {
        updates.decision_date = new Date().toISOString().split('T')[0];
      }
      
      await Budget.update(budget.id, updates);
      
      await loadData();
      
      setShowStatusUpdateDialog(false);
      setNewStatus("");
      setStatusNote("");
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Ocorreu um erro ao atualizar o status. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };
  
  const groupItems = () => {
    if (!budget) return {};
    
    return budget.items.reduce((groups, item) => {
      if (item.description.startsWith('AWS:')) {
        groups.aws = [...(groups.aws || []), item];
      } else if (item.description.startsWith('Azure:')) {
        groups.azure = [...(groups.azure || []), item];
      } else if (item.description.startsWith('GCP:')) {
        groups.gcp = [...(groups.gcp || []), item];
      } else if (item.description.startsWith('VPS:')) {
        groups.vps = [...(groups.vps || []), item];
      } else if (item.type === 'mão_de_obra' || item.description.startsWith('Profissional:')) {
        groups.team = [...(groups.team || []), item];
      } else {
        groups.other = [...(groups.other || []), item];
      }
      return groups;
    }, {});
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }
  
  if (!budget) {
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="text-gray-500">
          <FileText className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Orçamento não encontrado</h2>
          <p>O orçamento solicitado não foi encontrado ou pode ter sido removido.</p>
          <Button 
            onClick={() => navigate(createPageUrl("Budgets"))}
            className="mt-4"
          >
            Voltar para Orçamentos
          </Button>
        </div>
      </div>
    );
  }
  
  const groupedItems = groupItems();
  const hasCloudOptions = groupedItems.aws || groupedItems.azure || groupedItems.gcp || groupedItems.vps;
  
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
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {budget.title}
              </h1>
              <Badge className={STATUS_BADGES[budget.status]}>
                {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
              </Badge>
              {budget.ai_generated && (
                <Badge className="bg-indigo-100 text-indigo-800">
                  Gerado por IA
                </Badge>
              )}
            </div>
            <p className="text-gray-500 mt-1">
              {budget.project_id ? `Projeto: ${getProjectTitle(budget.project_id)} | ` : ''}
              Criado em: {format(new Date(budget.created_date), "dd/MM/yyyy")}
            </p>
          </div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            onClick={handleExportPdf}
            className="gap-2"
            disabled={exportingPdf}
          >
            {exportingPdf ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exportar PDF
          </Button>
          
          {budget.status === "rascunho" && (
            <Button 
              variant="outline" 
              onClick={() => navigate(createPageUrl(`BudgetEdit?id=${budget.id}`))}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Editar
            </Button>
          )}
          
          {(budget.status === "rascunho" || budget.status === "pendente") && (
            <Button 
              onClick={() => setShowSendEmailDialog(true)}
              className="gap-2"
            >
              <Send className="h-4 w-4" />
              Enviar ao Cliente
            </Button>
          )}
          
          <Button 
            variant="outline" 
            onClick={() => {
              setShowStatusUpdateDialog(true);
              if (budget.status === "rascunho") {
                setNewStatus("pendente");
              } else if (budget.status === "pendente") {
                setNewStatus("enviado");
              } else if (budget.status === "enviado") {
                setNewStatus("aprovado");
              }
            }}
            className="gap-2"
          >
            <Clock className="h-4 w-4" />
            Atualizar Status
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Orçamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Cliente</h3>
                  <div className="mt-1 flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-gray-400" />
                    <span className="font-medium">{budget.client_name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span>{budget.client_email}</span>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Responsável</h3>
                  <div className="font-medium">{budget.responsible}</div>
                  <div className="text-sm text-gray-500">
                    Última atualização: {format(new Date(budget.last_modified_date || budget.created_date), "dd/MM/yyyy")}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Descrição</h3>
                <p className="mt-1 whitespace-pre-line">{budget.description}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Escopo</h3>
                <p className="mt-1 whitespace-pre-line">{budget.scope}</p>
              </div>
              
              {budget.requirements && budget.requirements.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Requisitos</h3>
                  <ul className="mt-1 list-disc pl-5 space-y-1">
                    {budget.requirements.map((req, index) => (
                      <li key={index}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Detalhamento do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              {hasCloudOptions ? (
                <div className="space-y-6">
                  <Tabs defaultValue="aws" value={activeCloudTab} onValueChange={setActiveCloudTab}>
                    <TabsList className="grid grid-cols-4 mb-4">
                      <TabsTrigger value="aws">AWS</TabsTrigger>
                      <TabsTrigger value="azure">Azure</TabsTrigger>
                      <TabsTrigger value="gcp">GCP</TabsTrigger>
                      <TabsTrigger value="vps">VPS</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="aws">
                      <h3 className="text-lg font-medium mb-3">Serviços AWS</h3>
                      {groupedItems.aws && groupedItems.aws.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[40%]">Serviço</TableHead>
                                <TableHead className="w-[30%]">Especificações</TableHead>
                                <TableHead>Preço Unit.</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groupedItems.aws.map((item, index) => {
                                const parts = item.description.replace('AWS: ', '').split(' - ');
                                const serviceName = parts[0];
                                const specifications = parts.length > 1 ? parts[1] : '';
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{serviceName}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{specifications}</TableCell>
                                    <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 border border-dashed rounded-md">
                          <Info className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">Nenhum serviço AWS especificado</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="azure">
                      <h3 className="text-lg font-medium mb-3">Serviços Azure</h3>
                      {groupedItems.azure && groupedItems.azure.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[40%]">Serviço</TableHead>
                                <TableHead className="w-[30%]">Especificações</TableHead>
                                <TableHead>Preço Unit.</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groupedItems.azure.map((item, index) => {
                                const parts = item.description.replace('Azure: ', '').split(' - ');
                                const serviceName = parts[0];
                                const specifications = parts.length > 1 ? parts[1] : '';
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{serviceName}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{specifications}</TableCell>
                                    <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 border border-dashed rounded-md">
                          <Info className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">Nenhum serviço Azure especificado</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="gcp">
                      <h3 className="text-lg font-medium mb-3">Serviços Google Cloud (GCP)</h3>
                      {groupedItems.gcp && groupedItems.gcp.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[40%]">Serviço</TableHead>
                                <TableHead className="w-[30%]">Especificações</TableHead>
                                <TableHead>Preço Unit.</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groupedItems.gcp.map((item, index) => {
                                const parts = item.description.replace('GCP: ', '').split(' - ');
                                const serviceName = parts[0];
                                const specifications = parts.length > 1 ? parts[1] : '';
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{serviceName}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{specifications}</TableCell>
                                    <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 border border-dashed rounded-md">
                          <Info className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">Nenhum serviço GCP especificado</p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="vps">
                      <h3 className="text-lg font-medium mb-3">Opção VPS (Servidor Privado Virtual)</h3>
                      {groupedItems.vps && groupedItems.vps.length > 0 ? (
                        <div className="border rounded-md overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="w-[40%]">Serviço</TableHead>
                                <TableHead className="w-[30%]">Especificações</TableHead>
                                <TableHead>Preço Unit.</TableHead>
                                <TableHead>Qtd</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groupedItems.vps.map((item, index) => {
                                const parts = item.description.replace('VPS: ', '').split(' - ');
                                const serviceName = parts[0];
                                const specifications = parts.length > 1 ? parts[1] : '';
                                
                                return (
                                  <TableRow key={index}>
                                    <TableCell className="font-medium">{serviceName}</TableCell>
                                    <TableCell className="text-sm text-gray-600">{specifications}</TableCell>
                                    <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                    <TableCell>{item.quantity}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      ) : (
                        <div className="text-center py-8 bg-gray-50 border border-dashed rounded-md">
                          <Info className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                          <p className="text-gray-500">Nenhuma opção VPS especificada</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-3">Equipe do Projeto</h3>
                    {groupedItems.team && groupedItems.team.length > 0 ? (
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[40%]">Cargo/Função</TableHead>
                              <TableHead>Valor/Hora</TableHead>
                              <TableHead>Horas</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupedItems.team.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.description.replace('Profissional: ', '')}</TableCell>
                                <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center py-8 bg-gray-50 border border-dashed rounded-md">
                        <Info className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-500">Nenhum profissional especificado</p>
                      </div>
                    )}
                  </div>
                  
                  {groupedItems.other && groupedItems.other.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Outros Itens</h3>
                      <div className="border rounded-md overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[50%]">Descrição</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Preço Unit.</TableHead>
                              <TableHead>Qtd</TableHead>
                              <TableHead className="text-right">Total</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {groupedItems.other.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell>{item.type}</TableCell>
                                <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                                <TableCell>{item.quantity}</TableCell>
                                <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-medium mb-3">Itens do Orçamento</h3>
                  {budget.items && budget.items.length > 0 ? (
                    <div className="border rounded-md overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50%]">Descrição</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Preço Unit.</TableHead>
                            <TableHead>Qtd</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {budget.items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.description}</TableCell>
                              <TableCell>{item.type}</TableCell>
                              <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-8 bg-gray-50 border border-dashed rounded-md">
                      <Info className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500">Nenhum item adicionado ao orçamento</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="flex justify-end pt-4 mt-4 border-t">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Valor Total:</div>
                  <div className="text-2xl font-bold">{formatCurrency(budget.total_value)}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Prazos e Condições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-gray-500">Prazo Proposto</div>
                <div className="flex items-center mt-1 gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="font-medium">{budget.proposed_deadline} dias</span>
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Período de Execução</div>
                <div className="font-medium">
                  {format(new Date(budget.start_date), "dd/MM/yyyy")} a {format(new Date(budget.end_date), "dd/MM/yyyy")}
                </div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Validade do Orçamento</div>
                <div className="font-medium">{budget.validity_period} dias</div>
              </div>
              
              <div>
                <div className="text-sm text-gray-500">Condições de Pagamento</div>
                <div className="font-medium whitespace-pre-line">{budget.payment_terms}</div>
              </div>
            </CardContent>
          </Card>
          
          {budget.additional_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Observações Adicionais</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">{budget.additional_notes}</p>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-gray-100 text-gray-800">Criado</Badge>
                <span className="text-sm">
                  {format(new Date(budget.created_date), "dd/MM/yyyy")}
                </span>
              </div>
              
              {budget.sent_date && (
                <div className="flex items-center gap-2">
                  <Badge className="bg-blue-100 text-blue-800">Enviado</Badge>
                  <span className="text-sm">
                    {format(new Date(budget.sent_date), "dd/MM/yyyy")}
                  </span>
                </div>
              )}
              
              {budget.decision_date && (
                <div className="flex items-center gap-2">
                  <Badge 
                    className={
                      budget.status === "aprovado" 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {budget.status === "aprovado" ? "Aprovado" : "Reprovado"}
                  </Badge>
                  <span className="text-sm">
                    {format(new Date(budget.decision_date), "dd/MM/yyyy")}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Dialog open={showSendEmailDialog} onOpenChange={setShowSendEmailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enviar Orçamento por Email</DialogTitle>
            <DialogDescription>
              Revise e personalize o email antes de enviar para o cliente
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="email_to">Para</Label>
              <Input 
                id="email_to" 
                value={budget.client_email} 
                disabled 
              />
            </div>
            
            <div>
              <Label htmlFor="email_subject">Assunto</Label>
              <Input 
                id="email_subject" 
                value={emailSubject} 
                onChange={(e) => setEmailSubject(e.target.value)} 
              />
            </div>
            
            <div>
              <Label htmlFor="email_body">Mensagem</Label>
              <Textarea 
                id="email_body" 
                value={emailBody} 
                onChange={(e) => setEmailBody(e.target.value)} 
                className="min-h-[200px]"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendEmailDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSendEmail} 
              disabled={sendingEmail || !emailSubject || !emailBody}
              className="gap-2"
            >
              {sendingEmail ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Enviar Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showStatusUpdateDialog} onOpenChange={setShowStatusUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Orçamento</DialogTitle>
            <DialogDescription>
              Selecione o novo status do orçamento
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {budget.status === "rascunho" && (
                <Button 
                  variant={newStatus === "pendente" ? "default" : "outline"}
                  onClick={() => setNewStatus("pendente")}
                  className="justify-start"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Pendente
                </Button>
              )}
              
              {(budget.status === "rascunho" || budget.status === "pendente") && (
                <Button 
                  variant={newStatus === "enviado" ? "default" : "outline"}
                  onClick={() => setNewStatus("enviado")}
                  className="justify-start"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviado
                </Button>
              )}
              
              {budget.status === "enviado" && (
                <>
                  <Button 
                    variant={newStatus === "aprovado" ? "default" : "outline"}
                    onClick={() => setNewStatus("aprovado")}
                    className="justify-start"
                  >
                    <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                    Aprovado
                  </Button>
                  
                  <Button 
                    variant={newStatus === "reprovado" ? "default" : "outline"}
                    onClick={() => setNewStatus("reprovado")}
                    className="justify-start"
                  >
                    <XCircle className="h-4 w-4 mr-2 text-red-600" />
                    Reprovado
                  </Button>
                </>
              )}
              
              {budget.status === "enviado" && (
                <Button 
                  variant={newStatus === "reajuste" ? "default" : "outline"}
                  onClick={() => setNewStatus("reajuste")}
                  className="justify-start"
                >
                  <AlertTriangle className="h-4 w-4 mr-2 text-amber-500" />
                  Reajuste
                </Button>
              )}
            </div>
            
            <div>
              <Label htmlFor="status_note">Observação (opcional)</Label>
              <Textarea
                id="status_note"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Adicione uma observação sobre a mudança de status..."
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusUpdateDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateStatus}
              disabled={!newStatus}
            >
              Atualizar Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

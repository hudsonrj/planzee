
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Budget, Project, User, Role } from "@/api/entities";
import { createPageUrl, SendEmail } from "@/utils";
import { sendBudgetEmail } from "@/api/functions"; // Added new import
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  TabsContent,
  TabsList,
  TabsTrigger,
  Tabs
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Loader2,
  Plus,
  FileText,
  MoreVertical,
  Search,
  Filter,
  DollarSign,
  Send,
  Trash,
  Edit,
  Copy,
  CheckCircle,
  XCircle,
  RotateCcw,
  Calendar,
  FileCheck,
  Bot,
  Clock,
  Users,
  Mail,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Status do orçamento e suas cores correspondentes
const STATUS_BADGES = {
  rascunho: "bg-gray-100 text-gray-800",
  pendente: "bg-yellow-100 text-yellow-800",
  enviado: "bg-blue-100 text-blue-800",
  aprovado: "bg-green-100 text-green-800",
  reprovado: "bg-red-100 text-red-800",
  reajuste: "bg-purple-100 text-purple-800"
};

export default function Budgets() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [budgetToDelete, setBudgetToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [showSendDialog, setShowSendDialog] = useState(false);
  const [budgetToSend, setBudgetToSend] = useState(null);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [budgetsData, projectsData, usersData] = await Promise.all([
        Budget.list('-created_date'),
        Project.list(),
        User.list()
      ]);

      setBudgets(budgetsData);
      setProjects(projectsData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (budget) => {
    setBudgetToDelete(budget);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!budgetToDelete) return;

    try {
      setIsDeleting(true);
      setError(null);
      await Budget.delete(budgetToDelete.id);
      await loadData();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      setError("Ocorreu um erro ao excluir o orçamento. Por favor, tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  // New function to confirm sending email
  const confirmSend = (budget) => {
    setBudgetToSend(budget);
    setShowSendDialog(true);
  };

  // Updated sendBudgetEmail function
  const handleSendBudgetEmail = async () => {
    if (!budgetToSend) return;
    
    try {
      setIsSending(true);
      setError(null);

      const { data } = await sendBudgetEmail({
        budgetId: budgetToSend.id
      });

      // The external sendBudgetEmail function (from @/api/functions/sendBudgetEmail)
      // is responsible for updating the budget status and sent_date.
      // We just need to reload the data to reflect changes in the UI.
      await loadData();
      setShowSendDialog(false);
      
      alert('Orçamento enviado com sucesso!'); // Success message
      
    } catch (error) {
      console.error("Erro ao enviar orçamento:", error);
      setError(`Erro ao enviar orçamento: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // New helper function to get user name - (no longer directly used by send email logic in this component)
  const getUserName = (email) => {
    const user = users.find(u => u.email === email);
    return user?.full_name || email.split('@')[0];
  };

  const getFilteredBudgets = () => {
    return budgets.filter(budget => {
      // Filtrar por status
      if (activeTab !== "todos" && budget.status !== activeTab) {
        return false;
      }

      // Filtrar por termo de busca
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          budget.title.toLowerCase().includes(searchLower) ||
          budget.client_name.toLowerCase().includes(searchLower) ||
          budget.client_email.toLowerCase().includes(searchLower)
        );
      }

      return true;
    });
  };

  const getProjectTitle = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : "N/A";
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusDate = (budget) => {
    if (budget.status === "enviado" && budget.sent_date) {
      return `Enviado em ${format(new Date(budget.sent_date), "dd/MM/yyyy")}`;
    } else if ((budget.status === "aprovado" || budget.status === "reprovado") && budget.decision_date) {
      return `${budget.status === "aprovado" ? "Aprovado" : "Reprovado"} em ${format(new Date(budget.decision_date), "dd/MM/yyyy")}`;
    }
    return `Criado em ${format(new Date(budget.created_date), "dd/MM/yyyy")}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const filteredBudgets = getFilteredBudgets();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Orçamentos</h1>
          <p className="text-gray-500 mt-1">Gerencie e acompanhe orçamentos para clientes</p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button
            onClick={() => navigate(createPageUrl("BudgetCreate"))}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Orçamento
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(createPageUrl("BudgetCreate?ai=true"))}
            className="gap-2"
          >
            <Bot className="h-4 w-4" />
            Gerar com IA
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <AlertTriangle className="inline-block h-5 w-5 mr-2" />
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
          <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setError(null)}>
            <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
          </span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            placeholder="Buscar orçamentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 md:grid-cols-7">
            <TabsTrigger value="todos">Todos</TabsTrigger>
            <TabsTrigger value="rascunho">Rascunhos</TabsTrigger>
            <TabsTrigger value="pendente">Pendentes</TabsTrigger>
            <TabsTrigger value="enviado">Enviados</TabsTrigger>
            <TabsTrigger value="aprovado">Aprovados</TabsTrigger>
            <TabsTrigger value="reprovado">Reprovados</TabsTrigger>
            <TabsTrigger value="reajuste">Reajuste</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {filteredBudgets.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed">
          <FileText className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum orçamento encontrado</h3>
          <p className="text-gray-500">
            {searchTerm
              ? `Não há orçamentos correspondentes à sua busca "${searchTerm}"`
              : activeTab !== "todos"
                ? `Não há orçamentos com status "${activeTab}"`
                : "Você ainda não criou nenhum orçamento."}
          </p>
          {!searchTerm && (
            <Button
              onClick={() => navigate(createPageUrl("BudgetCreate"))}
              className="mt-4"
            >
              Criar Orçamento
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBudgets.map(budget => (
            <Card key={budget.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="pr-10">
                    <CardTitle className="line-clamp-1">{budget.title}</CardTitle>
                    <CardDescription className="mt-1">{budget.client_name}</CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => navigate(createPageUrl(`BudgetDetails?id=${budget.id}`))}>
                        <FileText className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </DropdownMenuItem>

                      {budget.status === "rascunho" && (
                        <DropdownMenuItem onClick={() => navigate(createPageUrl(`BudgetEdit?id=${budget.id}`))}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                      )}

                      {/* New DropdownMenuItem for sending email */}
                      {(budget.status === "rascunho" || budget.status === "pendente" || budget.status === "reajuste") && (
                        <DropdownMenuItem onClick={() => confirmSend(budget)}>
                          <Send className="h-4 w-4 mr-2" />
                          Enviar por E-mail
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem onClick={() => navigate(createPageUrl(`BudgetCreate`))}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      <DropdownMenuItem
                        onClick={() => confirmDelete(budget)}
                        className="text-red-600"
                      >
                        <Trash className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className={STATUS_BADGES[budget.status]}>
                    {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                  </Badge>

                  {budget.ai_generated && (
                    <Badge className="bg-indigo-100 text-indigo-800">
                      IA
                    </Badge>
                  )}
                </div>

                <div className="text-sm text-gray-500 mb-2">
                  <div className="flex items-center gap-1 mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{getStatusDate(budget)}</span>
                  </div>
                  {budget.project_id && (
                    <div className="flex items-center gap-1 mb-1">
                      <FileCheck className="h-3.5 w-3.5" />
                      <span>Projeto: {getProjectTitle(budget.project_id)}</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-3">
                  <div className="text-sm font-semibold">
                    Prazo: {budget.proposed_deadline} dias
                  </div>
                  <div className="text-lg font-bold">
                    {formatCurrency(budget.total_value)}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="bg-gray-50 border-t px-6 py-3">
                <Button
                  variant="ghost"
                  className="w-full text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                  onClick={() => navigate(createPageUrl(`BudgetDetails?id=${budget.id}`))}
                >
                  Ver Detalhes
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Orçamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o orçamento "{budgetToDelete?.title}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Updated Dialog for sending email confirmation */}
      <Dialog open={showSendDialog} onOpenChange={setShowSendDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Orçamento por E-mail</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja enviar o orçamento "{budgetToSend?.title}" para "{budgetToSend?.client_email}"? 
              O cliente receberá um PDF profissional com todos os detalhes da proposta.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSendDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendBudgetEmail}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

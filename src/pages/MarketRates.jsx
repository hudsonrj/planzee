
import React, { useState, useEffect } from 'react';
import { Role } from '@/api/entities';
import { User } from '@/api/entities';
import { InvokeLLM } from "@/api/integrations";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Search,
  Filter,
  RefreshCw,
  Wand2,
  Plus,
  Pencil,
  Trash,
  ChevronDown,
  PlusCircle,
  MinusCircle
} from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

export default function MarketRates() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeniority, setSelectedSeniority] = useState('all');
  const [error, setError] = useState(null);
  const [updatingMarketValues, setUpdatingMarketValues] = useState(false);

  // Estados para gerenciamento de cargo (função)
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    title: "",
    description: "",
    category: "desenvolvimento",
    seniority_levels: [
      { level: "junior", hourly_rate: 0, monthly_salary: 0 },
      { level: "pleno", hourly_rate: 0, monthly_salary: 0 },
      { level: "senior", hourly_rate: 0, monthly_salary: 0 }
    ],
    status: "active"
  });

  useEffect(() => {
    loadRoles();
  }, []);

  const loadRoles = async () => {
    try {
      setLoading(true);
      const rolesData = await Role.list();
      setRoles(rolesData);
    } catch (error) {
      console.error("Erro ao carregar cargos:", error);
      setError("Erro ao carregar dados. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const updateMarketValues = async () => {
    try {
      setUpdatingMarketValues(true);

      const prompt = `
        Como especialista em mercado de TI no Brasil, forneça valores atualizados de mercado para os seguintes cargos:
        ${roles.map(role => `- ${role.title} (${role.category})`).join('\n')}

        Para cada cargo, considere os seguintes níveis:
        - Júnior (0-2 anos de experiência)
        - Pleno (2-5 anos de experiência)
        - Sênior (5-8 anos de experiência)
        - Especialista (8+ anos de experiência)

        Considere:
        1. Valores praticados por empresas de médio e grande porte
        2. Mercado atual brasileiro de TI
        3. Demanda atual por cada tipo de profissional
        4. Complexidade e responsabilidade de cada cargo
        5. Valores para regime CLT (salário mensal) e PJ (valor hora)

        Forneça valores realistas e atualizados para 2024, baseados em pesquisas salariais recentes.
      `;

      const response = await InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            roles: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  seniority_levels: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        level: { type: "string" },
                        hourly_rate: { type: "number" },
                        monthly_salary: { type: "number" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Atualizar cada cargo com os novos valores
      const updatePromises = response.roles.map(async (roleData) => {
        const existingRole = roles.find(r => r.title.toLowerCase() === roleData.title.toLowerCase());
        if (existingRole) {
          await Role.update(existingRole.id, {
            ...existingRole,
            seniority_levels: roleData.seniority_levels
          });
        }
      });

      await Promise.all(updatePromises);
      await loadRoles();

      toast({
        title: "Valores atualizados",
        description: "Os valores de mercado foram atualizados com sucesso!",
      });

    } catch (error) {
      console.error("Erro ao atualizar valores:", error);
      toast({
        title: "Erro ao atualizar valores",
        description: "Não foi possível atualizar os valores de mercado. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUpdatingMarketValues(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!roleFormData.title) {
        toast({
          title: "Erro ao salvar",
          description: "O título do cargo é obrigatório",
          variant: "destructive",
        });
        return;
      }

      setLoading(true);

      if (currentRole) {
        // Atualizar cargo existente
        await Role.update(currentRole.id, roleFormData);
        toast({
          title: "Cargo atualizado",
          description: `O cargo ${roleFormData.title} foi atualizado com sucesso!`,
        });
      } else {
        // Criar novo cargo
        await Role.create(roleFormData);
        toast({
          title: "Cargo criado",
          description: `O cargo ${roleFormData.title} foi criado com sucesso!`,
        });
      }

      resetRoleForm();
      setIsRoleDialogOpen(false);
      await loadRoles();
    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o cargo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!currentRole) return;

    try {
      setLoading(true);
      await Role.delete(currentRole.id);

      toast({
        title: "Cargo excluído",
        description: `O cargo ${currentRole.title} foi excluído com sucesso!`,
      });

      resetRoleForm();
      setIsDeleteDialogOpen(false);
      await loadRoles();
    } catch (error) {
      console.error("Erro ao excluir cargo:", error);
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao excluir o cargo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditRole = (role) => {
    setCurrentRole(role);
    setRoleFormData({
      title: role.title || "",
      description: role.description || "",
      category: role.category || "desenvolvimento",
      seniority_levels: role.seniority_levels || [
        { level: "junior", hourly_rate: 0, monthly_salary: 0 },
        { level: "pleno", hourly_rate: 0, monthly_salary: 0 },
        { level: "senior", hourly_rate: 0, monthly_salary: 0 }
      ],
      status: role.status || "active"
    });
    setIsRoleDialogOpen(true);
  };

  const openDeleteRole = (role) => {
    setCurrentRole(role);
    setIsDeleteDialogOpen(true);
  };

  const resetRoleForm = () => {
    setCurrentRole(null);
    setRoleFormData({
      title: "",
      description: "",
      category: "desenvolvimento",
      seniority_levels: [
        { level: "junior", hourly_rate: 0, monthly_salary: 0 },
        { level: "pleno", hourly_rate: 0, monthly_salary: 0 },
        { level: "senior", hourly_rate: 0, monthly_salary: 0 }
      ],
      status: "active"
    });
  };

  const handleAddSeniorityLevel = () => {
    // Verificar quais níveis ainda não estão na lista
    const currentLevels = roleFormData.seniority_levels.map(level => level.level);
    const availableLevels = ["junior", "pleno", "senior", "especialista", "coordenador", "gerente"]
      .filter(level => !currentLevels.includes(level));

    if (availableLevels.length === 0) {
      toast({
        title: "Limite alcançado",
        description: "Todos os níveis de senioridade já foram adicionados.",
      });
      return;
    }

    setRoleFormData({
      ...roleFormData,
      seniority_levels: [
        ...roleFormData.seniority_levels,
        { level: availableLevels[0], hourly_rate: 0, monthly_salary: 0 }
      ]
    });
  };

  const handleRemoveSeniorityLevel = (index) => {
    if (roleFormData.seniority_levels.length <= 1) {
      toast({
        title: "Operação não permitida",
        description: "É necessário manter pelo menos um nível de senioridade.",
      });
      return;
    }

    const updatedLevels = [...roleFormData.seniority_levels];
    updatedLevels.splice(index, 1);

    setRoleFormData({
      ...roleFormData,
      seniority_levels: updatedLevels
    });
  };

  const handleSeniorityChange = (index, field, value) => {
    const updatedLevels = [...roleFormData.seniority_levels];

    if (field === "level") {
      updatedLevels[index][field] = value;
    } else {
      // Converter para número quando for valor monetário
      updatedLevels[index][field] = parseFloat(value) || 0;
    }

    setRoleFormData({
      ...roleFormData,
      seniority_levels: updatedLevels
    });
  };

  const getFilteredRoles = () => {
    return roles.filter(role => {
      const roleTitle = (role.title || "").toLowerCase();
      const search = (searchTerm || "").toLowerCase();

      const matchesSearch = roleTitle.includes(search);
      const matchesCategory = selectedCategory === 'all' || role.category === selectedCategory;
      let matchesSeniority = true;
      if (selectedSeniority !== 'all') {
        matchesSeniority = role.seniority_levels?.some(level => level.level === selectedSeniority) || false;
      }
      return matchesSearch && matchesCategory && matchesSeniority;
    });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const categoryLabels = {
    desenvolvimento: "Desenvolvimento",
    design: "Design",
    dados: "Dados",
    infraestrutura: "Infraestrutura",
    gestao: "Gestão",
    seguranca: "Segurança",
    qualidade: "Qualidade",
    produto: "Produto"
  };

  const seniorityLabels = {
    junior: "Júnior",
    pleno: "Pleno",
    senior: "Sênior",
    especialista: "Especialista",
    coordenador: "Coordenador",
    gerente: "Gerente"
  };

  if (loading && roles.length === 0) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  const filteredRoles = getFilteredRoles();

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Valores de Mercado</h1>
          <p className="text-gray-500 mt-1">Consulte os valores praticados no mercado por cargo e senioridade</p>
        </div>

        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              resetRoleForm();
              setIsRoleDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Novo Cargo
          </Button>

          <Button
            onClick={updateMarketValues}
            disabled={updatingMarketValues}
          >
            {updatingMarketValues ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Atualizando valores...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Atualizar Valores com IA
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-6">
        <div className="md:col-span-5 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Buscar cargos..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="md:col-span-3">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {Object.entries(categoryLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-4">
          <Select value={selectedSeniority} onValueChange={setSelectedSeniority}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por senioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as senioridades</SelectItem>
              {Object.entries(seniorityLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredRoles.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhum cargo encontrado com os filtros selecionados.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredRoles.map((role) => (
            <Card key={role.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-bold">{role.title}</CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">
                        {categoryLabels[role.category] || role.category}
                      </Badge>
                      {role.status === "inactive" && (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditRole(role)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDeleteRole(role)}>
                      <Trash className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nível</TableHead>
                        <TableHead>Valor Hora</TableHead>
                        <TableHead>Salário Mensal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {role.seniority_levels?.map((level) => (
                        <TableRow key={level.level}>
                          <TableCell className="font-medium">
                            {seniorityLabels[level.level] || level.level}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(level.hourly_rate)}
                          </TableCell>
                          <TableCell>
                            {formatCurrency(level.monthly_salary)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {role.description && (
                  <p className="mt-4 text-sm text-gray-600">{role.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal para Criar/Editar Cargo */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentRole ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
            <DialogDescription>
              {currentRole
                ? "Atualize as informações do cargo e seus níveis de senioridade."
                : "Preencha as informações para criar um novo cargo."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="role-title">Título do Cargo *</Label>
              <Input
                id="role-title"
                placeholder="Ex: Desenvolvedor Full Stack"
                value={roleFormData.title}
                onChange={(e) => setRoleFormData({...roleFormData, title: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="role-category">Categoria</Label>
              <Select
                value={roleFormData.category}
                onValueChange={(value) => setRoleFormData({...roleFormData, category: value})}
              >
                <SelectTrigger id="role-category">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="role-description">Descrição</Label>
              <Textarea
                id="role-description"
                placeholder="Descreva as responsabilidades e habilidades requeridas para este cargo"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex justify-between items-center">
                <Label>Níveis de Senioridade</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddSeniorityLevel}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Adicionar
                </Button>
              </div>

              {roleFormData.seniority_levels.map((level, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-center border p-3 rounded-md">
                  <div className="col-span-12 md:col-span-4">
                    <Select
                      value={level.level}
                      onValueChange={(value) => handleSeniorityChange(index, "level", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Nível" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(seniorityLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-5 md:col-span-3">
                    <Input
                      type="number"
                      placeholder="R$/hora"
                      value={level.hourly_rate}
                      onChange={(e) => handleSeniorityChange(index, "hourly_rate", e.target.value)}
                    />
                  </div>

                  <div className="col-span-5 md:col-span-3">
                    <Input
                      type="number"
                      placeholder="Salário"
                      value={level.monthly_salary}
                      onChange={(e) => handleSeniorityChange(index, "monthly_salary", e.target.value)}
                    />
                  </div>

                  <div className="col-span-2 md:col-span-2 flex justify-end">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSeniorityLevel(index)}
                    >
                      <MinusCircle className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="role-status">Status</Label>
              <Select
                value={roleFormData.status}
                onValueChange={(value) => setRoleFormData({...roleFormData, status: value})}
              >
                <SelectTrigger id="role-status">
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Ativo</SelectItem>
                  <SelectItem value="inactive">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                resetRoleForm();
                setIsRoleDialogOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreateRole} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                currentRole ? "Atualizar" : "Criar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cargo "{currentRole?.title}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentRole(null);
                setIsDeleteDialogOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteRole}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

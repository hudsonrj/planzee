
import React, { useState, useEffect } from "react";
import { User, UserRole, UserRoleAssignment, Project, Position } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  UserPlus,
  Shield,
  Settings,
  Trash2,
  Edit2,
  CheckCircle2,
  XCircle,
  Lock,
  LockKeyhole,
  Key,
  FileText,
  ChevronDown,
  UserCheck,
  Briefcase,
  Users,
  Building,
  Info,
  Calendar,
  DollarSign,
  Sparkles,
  User as UserIcon,
  Plus,
  Crown
} from "lucide-react";
import { PERMISSIONS } from "@/components/permissions/PermissionUtils";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [userRoles, setUserRoles] = useState([]);
  const [userRoleAssignments, setUserRoleAssignments] = useState([]);
  const [projects, setProjects] = useState([]);
  const [positions, setPositions] = useState([]); // New state for positions
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estado para criar ou editar papel
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState(null);
  const [roleFormData, setRoleFormData] = useState({
    name: "",
    description: "",
    permissions: [],
    access_level: 50,
    is_active: true
  });

  // Estado para atribuir papel a usuário
  const [isAssignRoleDialogOpen, setIsAssignRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedUserAssignments, setSelectedUserAssignments] = useState([]);
  const [assignRoleForm, setAssignRoleForm] = useState({
    role_id: "",
    project_id: "",
    start_date: new Date().toISOString().split('T')[0],
    end_date: ""
  });

  // Estado para convidar usuário
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteFormData, setInviteFormData] = useState({
    email: "",
    name: "",
    default_role: ""
  });

  // Estados para editar cargo do usuário
  const [isEditUserPositionDialogOpen, setIsEditUserPositionDialogOpen] = useState(false); // Renamed to avoid conflict
  const [userToEditPosition, setUserToEditPosition] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState("");

  // Estados para gerenciar cargos (CRUD de cargos)
  const [isPositionDialogOpen, setIsPositionDialogOpen] = useState(false);
  const [isDeletePositionDialogOpen, setIsDeletePositionDialogOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(null);
  const [positionFormData, setPositionFormData] = useState({
    title: "",
    description: "",
    department: "tecnologia",
    level: "junior",
    permissions: [],
    is_executive: false,
    status: "active"
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = users.filter(user => {
        const fullName = (user.full_name || "").toLowerCase();
        const email = (user.email || "").toLowerCase();
        const query = searchQuery.toLowerCase();

        return fullName.includes(query) || email.includes(query);
      });
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [users, searchQuery]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [userData, userRoleData, userRoleAssignmentData, projectData, positionData] = await Promise.all([
        User.list(),
        UserRole.list().catch(() => []),
        UserRoleAssignment.list().catch(() => []),
        Project.list(),
        Position.list().catch(() => []) // Fetch positions
      ]);

      setUsers(userData);
      setFilteredUsers(userData);
      setUserRoles(userRoleData);
      setUserRoleAssignments(userRoleAssignmentData);
      setProjects(projectData);
      setPositions(positionData); // Set positions state

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      setError("Ocorreu um erro ao carregar os dados. Por favor, recarregue a página.");
    } finally {
      setLoading(false);
    }
  };

  // Function to load assignments for a specific user
  const loadUserAssignments = async (user) => {
    try {
      const assignments = userRoleAssignments.filter(assignment => assignment.user_email === user.email);
      setSelectedUserAssignments(assignments);
    } catch (error) {
      console.error("Erro ao carregar atribuições do usuário:", error);
      setError("Erro ao carregar papéis do usuário");
    }
  };

  const handleCreateRole = async () => {
    try {
      setLoading(true);

      if (currentRole) {
        await UserRole.update(currentRole.id, roleFormData);
      } else {
        await UserRole.create(roleFormData);
      }

      await loadData();
      resetRoleForm();
      setIsRoleDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar papel:", error);
      setError("Ocorreu um erro ao salvar o papel.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async () => {
    try {
      setLoading(true);

      await UserRoleAssignment.create({
        ...assignRoleForm,
        user_email: selectedUser.email
      });

      await loadData();
      await loadUserAssignments(selectedUser);
      resetAssignRoleForm();
    } catch (error) {
      console.error("Erro ao atribuir papel:", error);
      setError("Ocorreu um erro ao atribuir o papel.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    try {
      setLoading(true);

      await UserRoleAssignment.delete(assignmentId);
      await loadData();
      await loadUserAssignments(selectedUser);
    } catch (error) {
      console.error("Erro ao remover atribuição:", error);
      setError("Ocorreu um erro ao remover a atribuição.");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    try {
      setLoading(true);

      // Aqui você adicionaria a lógica para enviar um convite
      // Como não temos uma API direta para isso, vamos mostrar um alerta de sucesso

      setError("Funcionalidade de convite será implementada em breve. Contate o administrador.");
      setIsInviteDialogOpen(false);
      resetInviteForm();
    } catch (error) {
      console.error("Erro ao convidar usuário:", error);
      setError("Ocorreu um erro ao enviar o convite.");
    } finally {
      setLoading(false);
    }
  };

  // Function to update a user's position
  const handleEditUserPosition = async () => { // Renamed from handleEditPosition
    if (!userToEditPosition) return; // Allow selectedPosition to be "not_defined"

    try {
      setLoading(true);

      // Convert "not_defined" to null for the backend
      await User.update(userToEditPosition.id, {
        position: selectedPosition === "not_defined" ? null : selectedPosition
      });

      await loadData();
      setIsEditUserPositionDialogOpen(false); // Use renamed state
      setUserToEditPosition(null);
      setSelectedPosition("not_defined"); // Reset to the "not defined" value
    } catch (error) {
      console.error("Erro ao atualizar cargo do usuário:", error);
      setError("Ocorreu um erro ao atualizar o cargo do usuário.");
    } finally {
      setLoading(false);
    }
  };

  const openEditRole = (role) => {
    setCurrentRole(role);
    setRoleFormData({
      name: role.name || "",
      description: role.description || "",
      permissions: role.permissions || [],
      access_level: role.access_level || 50,
      is_active: role.is_active !== false
    });
    setIsRoleDialogOpen(true);
  };

  const openAssignRole = (user) => {
    setSelectedUser(user);
    loadUserAssignments(user);
    setIsAssignRoleDialogOpen(true);
  };

  const openEditUserPosition = (user) => { // Renamed from openEditPosition
    setUserToEditPosition(user);
    setSelectedPosition(user.position || "not_defined"); // Use "not_defined" for initial empty state
    setIsEditUserPositionDialogOpen(true); // Use renamed state
  };

  const resetRoleForm = () => {
    setCurrentRole(null);
    setRoleFormData({
      name: "",
      description: "",
      permissions: [],
      access_level: 50,
      is_active: true
    });
  };

  const resetAssignRoleForm = () => {
    setAssignRoleForm({
      role_id: "",
      project_id: "",
      start_date: new Date().toISOString().split('T')[0],
      end_date: ""
    });
  };

  const resetInviteForm = () => {
    setInviteFormData({
      email: "",
      name: "",
      default_role: ""
    });
  };

  const handlePermissionChange = (permission) => {
    setRoleFormData(prev => {
      const permissions = [...prev.permissions];

      if (permissions.includes(permission)) {
        return {
          ...prev,
          permissions: permissions.filter(p => p !== permission)
        };
      } else {
        return {
          ...prev,
          permissions: [...permissions, permission]
        };
      }
    });
  };

  const getRoleName = (roleId) => {
    const role = userRoles.find(r => r.id === roleId);
    return role ? role.name : "Papel não encontrado";
  };

  const getProjectName = (projectId) => {
    if (!projectId) return "Todos os projetos";
    const project = projects.find(p => p.id === projectId);
    return project ? project.title : "Projeto não encontrado";
  };

  // Funções para gerenciar cargos (CRUD de cargos)
  const handleCreatePosition = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors

      if (!positionFormData.title.trim()) {
        setError("O título do cargo é obrigatório.");
        return;
      }

      if (currentPosition) {
        await Position.update(currentPosition.id, positionFormData);
      } else {
        await Position.create(positionFormData);
      }

      await loadData();
      resetPositionForm();
      setIsPositionDialogOpen(false);
    } catch (error) {
      console.error("Erro ao salvar cargo:", error);
      setError("Ocorreu um erro ao salvar o cargo.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePosition = async () => {
    if (!currentPosition) return;

    try {
      setLoading(true);
      setError(null); // Clear previous errors

      // Verificar se há usuários usando este cargo
      const usersWithPosition = users.filter(user => user.position === currentPosition.title);
      if (usersWithPosition.length > 0) {
        setError(`Não é possível excluir o cargo "${currentPosition.title}" pois há ${usersWithPosition.length} usuário(s) usando este cargo. Por favor, reatribua os usuários antes de excluir.`);
        setIsDeletePositionDialogOpen(false);
        setLoading(false);
        return;
      }

      await Position.delete(currentPosition.id);
      await loadData();
      setCurrentPosition(null);
      setIsDeletePositionDialogOpen(false);
    } catch (error) {
      console.error("Erro ao excluir cargo:", error);
      setError("Ocorreu um erro ao excluir o cargo.");
    } finally {
      setLoading(false);
    }
  };

  const openEditPosition = (position) => { // For editing an actual position entity
    setCurrentPosition(position);
    setPositionFormData({
      title: position.title || "",
      description: position.description || "",
      department: position.department || "tecnologia",
      level: position.level || "junior",
      permissions: position.permissions || [],
      is_executive: position.is_executive || false,
      status: position.status || "active"
    });
    setIsPositionDialogOpen(true);
  };

  const openDeletePosition = (position) => {
    setCurrentPosition(position);
    setIsDeletePositionDialogOpen(true);
  };

  const resetPositionForm = () => {
    setCurrentPosition(null);
    setPositionFormData({
      title: "",
      description: "",
      department: "tecnologia",
      level: "junior",
      permissions: [],
      is_executive: false,
      status: "active"
    });
  };

  // Agrupamento de permissões por categoria
  const permissionGroups = {
    projects: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('PROJECT_')),
    tasks: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('TASK_')),
    meetings: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('MEETING_')),
    budgets: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('BUDGET_')),
    reports: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('REPORT_')),
    users: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('USER_')),
    settings: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('SETTINGS_')),
    ai: Object.entries(PERMISSIONS).filter(([key]) => key.startsWith('AI_'))
  };

  // Labels para campos de cargo
  const departmentLabels = {
    tecnologia: "Tecnologia",
    marketing: "Marketing",
    vendas: "Vendas",
    rh: "Recursos Humanos",
    financeiro: "Financeiro",
    operacoes: "Operações",
    diretoria: "Diretoria",
  };

  const levelLabels = {
    junior: "Júnior",
    pleno: "Pleno",
    senior: "Sênior",
    coordenador: "Coordenador",
    gerente: "Gerente",
    diretor: "Diretor",
    executivo: "Executivo",
  };

  if (loading && users.length === 0 && positions.length === 0) { // Adjusted loading condition
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Usuários e Permissões</h1>
          <p className="text-gray-500 mt-1">Gerencie usuários, cargos e permissões</p>
        </div>
        <div className="mt-4 md:mt-0 space-x-2">
          <Button variant="outline" onClick={() => setIsInviteDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Convidar Usuário
          </Button>
          <Button onClick={() => {
            resetRoleForm();
            setIsRoleDialogOpen(true);
          }}>
            <Shield className="mr-2 h-4 w-4" /> Novo Papel
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="positions">
            <Briefcase className="h-4 w-4 mr-2" />
            Cargos
          </TabsTrigger>
          <TabsTrigger value="roles">
            <Shield className="h-4 w-4 mr-2" />
            Papéis
          </TabsTrigger>
        </TabsList>

        {/* Aba de Usuários */}
        <TabsContent value="users">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Lista de Usuários</CardTitle>
                <div className="relative w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Buscar usuários..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Cargo</TableHead>
                    <TableHead>Papéis</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => {
                      const userPositionData = positions.find(p => p.title === user.position);
                      const isExecutiveUser = userPositionData?.is_executive || false;

                      return (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback className="bg-teal-500 text-white">
                                  {user.full_name ? user.full_name[0] : (user.email ? user.email[0].toUpperCase() : 'U')}
                                </AvatarFallback>
                              </Avatar>
                              <span>{user.full_name || "Sem nome"}</span>
                            </div>
                          </TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                variant="outline"
                                className={
                                  isExecutiveUser ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                }
                              >
                                {user.position || 'Não definido'}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditUserPosition(user)} // Use renamed function
                                className="h-6 w-6 p-0"
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {userRoleAssignments
                                .filter(assignment => assignment.user_email === user.email)
                                .map(assignment => {
                                  const role = userRoles.find(r => r.id === assignment.role_id);
                                  return role ? (
                                    <Badge key={assignment.id} variant="outline" className="bg-blue-50">
                                      {role.name} {assignment.project_id ? `(${getProjectName(assignment.project_id)})` : ''}
                                    </Badge>
                                  ) : null;
                                })}
                              {userRoleAssignments.filter(assignment => assignment.user_email === user.email).length === 0 && (
                                <Badge variant="outline" className="text-gray-400">Nenhum papel</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800">
                              Ativo
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openAssignRole(user)}
                              >
                                <Shield className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Cargos */}
        <TabsContent value="positions">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Cargos da Empresa</CardTitle>
                  <CardDescription>
                    Gerencie os cargos disponíveis no sistema
                  </CardDescription>
                </div>
                <Button onClick={() => {
                  resetPositionForm();
                  setIsPositionDialogOpen(true);
                }}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cargo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Departamento</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Usuários</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {positions.length > 0 ? (
                      positions.map((position) => {
                        const usersWithPosition = users.filter(user => user.position === position.title);

                        return (
                          <TableRow key={position.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div>
                                  <div className="font-medium">{position.title}</div>
                                  {position.description && (
                                    <div className="text-sm text-gray-500">{position.description}</div>
                                  )}
                                </div>
                                {position.is_executive && (
                                  <Crown className="h-4 w-4 text-yellow-500" title="Cargo Executivo" />
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {departmentLabels[position.department] || "Não definido"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                position.level === 'executivo' ? 'bg-purple-100 text-purple-800' :
                                position.level === 'diretor' ? 'bg-blue-100 text-blue-800' :
                                position.level === 'gerente' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }>
                                {levelLabels[position.level] || "Não definido"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{usersWithPosition.length}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={
                                position.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }>
                                {position.status === 'active' ? 'Ativo' : 'Inativo'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditPosition(position)} // For editing position entity
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDeletePosition(position)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center">
                            <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
                            <p className="text-gray-500">Nenhum cargo cadastrado</p>
                            <Button
                              className="mt-4"
                              onClick={() => {
                                resetPositionForm();
                                setIsPositionDialogOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Criar primeiro cargo
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba de Papéis */}
        <TabsContent value="roles">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Papéis e Permissões</CardTitle>
              <CardDescription>
                Defina os diferentes níveis de acesso para os usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userRoles.length > 0 ? (
                  userRoles.map(role => (
                    <Card key={role.id} className={`overflow-hidden ${!role.is_active ? 'opacity-60' : ''}`}>
                      <CardHeader className="bg-gray-50 pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base font-semibold flex items-center">
                              <Shield className="h-4 w-4 mr-2 text-blue-600" />
                              {role.name}
                            </CardTitle>
                            <CardDescription className="text-xs mt-1">
                              Nível de acesso: {role.access_level}/100
                            </CardDescription>
                          </div>
                          <div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditRole(role)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3">
                        <div className="text-sm text-gray-500 mb-2">{role.description}</div>

                        <div className="mt-3">
                          <h4 className="text-xs font-medium text-gray-500 mb-1.5">Permissões:</h4>
                          <div className="flex flex-wrap gap-1">
                            {role.permissions && role.permissions.length > 0 ? (
                              <>
                                {role.permissions.slice(0, 5).map((permission, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {permission.split(':')[1]}
                                  </Badge>
                                ))}
                                {role.permissions.length > 5 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{role.permissions.length - 5} mais
                                  </Badge>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-400 text-xs">Sem permissões</span>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                          <Badge
                            variant={role.is_active ? "default" : "secondary"}
                            className={role.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                          >
                            {role.is_active ? "Ativo" : "Inativo"}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-full text-center py-8 text-gray-500">
                    <Shield className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>Nenhum papel definido. Clique em "Novo Papel" para criar.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Diálogo para criar/editar papel */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{currentRole ? `Editar Papel: ${currentRole.name}` : "Novo Papel"}</DialogTitle>
            <DialogDescription>
              {currentRole
                ? "Modifique as informações e permissões deste papel"
                : "Defina um novo papel e suas permissões no sistema"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="roleName">Nome do Papel</Label>
                <Input
                  id="roleName"
                  value={roleFormData.name}
                  onChange={(e) => setRoleFormData({...roleFormData, name: e.target.value})}
                  placeholder="Ex: Gerente de Projetos"
                />
              </div>

              <div>
                <Label htmlFor="accessLevel">Nível de Acesso</Label>
                <Select
                  value={roleFormData.access_level.toString()}
                  onValueChange={(value) => setRoleFormData({...roleFormData, access_level: parseInt(value)})}
                >
                  <SelectTrigger id="accessLevel">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">Básico (20)</SelectItem>
                    <SelectItem value="40">Padrão (40)</SelectItem>
                    <SelectItem value="60">Elevado (60)</SelectItem>
                    <SelectItem value="80">Gerencial (80)</SelectItem>
                    <SelectItem value="100">Total (100)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="roleDescription">Descrição</Label>
              <Input
                id="roleDescription"
                value={roleFormData.description}
                onChange={(e) => setRoleFormData({...roleFormData, description: e.target.value})}
                placeholder="Descrição das responsabilidades deste papel"
              />
            </div>

            <div>
              <Label className="flex items-center space-x-2 mb-2">
                <Checkbox
                  checked={roleFormData.is_active}
                  onCheckedChange={(checked) => setRoleFormData({...roleFormData, is_active: checked})}
                />
                <span>Papel ativo</span>
              </Label>
            </div>

            <div className="mt-2">
              <h3 className="text-sm font-medium mb-2">Permissões</h3>

              {Object.entries(permissionGroups).map(([group, perms]) => (
                <div key={group} className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2 capitalize flex items-center">
                    {
                      group === 'projects' ? <Briefcase className="h-4 w-4 mr-1" /> :
                      group === 'tasks' ? <CheckCircle2 className="h-4 w-4 mr-1" /> :
                      group === 'meetings' ? <Calendar className="h-4 w-4 mr-1" /> :
                      group === 'budgets' ? <DollarSign className="h-4 w-4 mr-1" /> :
                      group === 'reports' ? <FileText className="h-4 w-4 mr-1" /> :
                      group === 'users' ? <Users className="h-4 w-4 mr-1" /> :
                      group === 'settings' ? <Settings className="h-4 w-4 mr-1" /> :
                      <Sparkles className="h-4 w-4 mr-1" />
                    }
                    {group}
                  </h4>

                  <div className="grid grid-cols-2 gap-2">
                    {perms.map(([key, value]) => (
                      <div key={key} className="flex items-center space-x-2">
                        <Checkbox
                          id={key}
                          checked={roleFormData.permissions.includes(value)}
                          onCheckedChange={() => handlePermissionChange(value)}
                        />
                        <label htmlFor={key} className="text-sm">
                          {value.split(':')[1]}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleCreateRole} disabled={!roleFormData.name.trim()}>
              {currentRole ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para atribuir papel a usuário */}
      <Dialog open={isAssignRoleDialogOpen} onOpenChange={setIsAssignRoleDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Atribuir Papel ao Usuário</DialogTitle>
            <DialogDescription>
              Atribua papéis e permissões para {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Papel</Label>
              <Select
                value={assignRoleForm.role_id}
                onValueChange={(value) => setAssignRoleForm({...assignRoleForm, role_id: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  {userRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Projeto (Opcional)</Label>
              <Select
                value={assignRoleForm.project_id || "all_projects"}
                onValueChange={(value) => setAssignRoleForm({...assignRoleForm, project_id: value === "all_projects" ? null : value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_projects">Todos os projetos</SelectItem>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Data de Início</Label>
              <Input
                type="date"
                value={assignRoleForm.start_date}
                onChange={(e) => setAssignRoleForm({...assignRoleForm, start_date: e.target.value})}
              />
            </div>

            <div className="grid gap-2">
              <Label>Data de Término (Opcional)</Label>
              <Input
                type="date"
                value={assignRoleForm.end_date}
                onChange={(e) => setAssignRoleForm({...assignRoleForm, end_date: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignRoleDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAssignRole} disabled={!assignRoleForm.role_id}>
              Atribuir Papel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Current User Roles Table is shown when Assign Role dialog is open */}
      {isAssignRoleDialogOpen && (
        <div className="mt-6">
          <h3 className="text-lg font-medium mb-4">Atribuições Atuais de {selectedUser?.full_name || selectedUser?.email}</h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Papel</TableHead>
                <TableHead>Projeto</TableHead>
                <TableHead>Data de Início</TableHead>
                <TableHead>Data de Término</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {selectedUserAssignments.length > 0 ? (
                selectedUserAssignments.map((assignment) => {
                  return (
                    <TableRow key={assignment.id}>
                      <TableCell>{getRoleName(assignment.role_id)}</TableCell>
                      <TableCell>{getProjectName(assignment.project_id)}</TableCell>
                      <TableCell>{assignment.start_date}</TableCell>
                      <TableCell>{assignment.end_date || '-'}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                    Nenhuma atribuição para este usuário.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Diálogo para editar cargo do usuário */}
      <Dialog open={isEditUserPositionDialogOpen} onOpenChange={setIsEditUserPositionDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Cargo do Usuário</DialogTitle>
            <DialogDescription>
              Altere o cargo de {userToEditPosition?.full_name || userToEditPosition?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="position">Cargo</Label>
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger id="position">
                  <SelectValue placeholder="Selecione um cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not_defined">Não definido</SelectItem>
                  {positions.map(position => (
                    <SelectItem key={position.id} value={position.title}>
                      {position.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedPosition && selectedPosition !== "not_defined" && positions.find(p => p.title === selectedPosition)?.is_executive && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2 text-blue-700 font-medium text-sm">
                  <Info className="h-4 w-4" />
                  Cargo Executivo
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  Este cargo possui permissões especiais no sistema
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserPositionDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUserPosition} disabled={!selectedPosition}>
              Atualizar Cargo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para criar/editar cargo (CRUD de cargos) */}
      <Dialog open={isPositionDialogOpen} onOpenChange={setIsPositionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{currentPosition ? "Editar Cargo" : "Novo Cargo"}</DialogTitle>
            <DialogDescription>
              {currentPosition
                ? "Atualize as informações do cargo."
                : "Preencha as informações para criar um novo cargo."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="position-title">Título do Cargo *</Label>
              <Input
                id="position-title"
                placeholder="Ex: Desenvolvedor Full Stack"
                value={positionFormData.title}
                onChange={(e) => setPositionFormData({...positionFormData, title: e.target.value})}
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="position-description">Descrição</Label>
              <Textarea
                id="position-description"
                placeholder="Descreva as responsabilidades deste cargo"
                value={positionFormData.description}
                onChange={(e) => setPositionFormData({...positionFormData, description: e.target.value})}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="position-department">Departamento</Label>
                <Select
                  value={positionFormData.department}
                  onValueChange={(value) => setPositionFormData({...positionFormData, department: value})}
                >
                  <SelectTrigger id="position-department">
                    <SelectValue placeholder="Selecione o departamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(departmentLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="position-level">Nível</Label>
                <Select
                  value={positionFormData.level}
                  onValueChange={(value) => setPositionFormData({...positionFormData, level: value})}
                >
                  <SelectTrigger id="position-level">
                    <SelectValue placeholder="Selecione o nível" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(levelLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Label className="flex items-center space-x-2">
                <Checkbox
                  checked={positionFormData.is_executive}
                  onCheckedChange={(checked) => setPositionFormData({...positionFormData, is_executive: checked})}
                />
                <span>Cargo executivo (permissões especiais)</span>
              </Label>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Label htmlFor="position-status">Status</Label>
              <Select
                value={positionFormData.status}
                onValueChange={(value) => setPositionFormData({...positionFormData, status: value})}
              >
                <SelectTrigger id="position-status">
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
                resetPositionForm();
                setIsPositionDialogOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreatePosition} disabled={!positionFormData.title.trim()}>
              {currentPosition ? "Atualizar" : "Criar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de confirmação para excluir cargo */}
      <Dialog open={isDeletePositionDialogOpen} onOpenChange={setIsDeletePositionDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o cargo "{currentPosition?.title}"?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCurrentPosition(null);
                setIsDeletePositionDialogOpen(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePosition}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


import React from "react";
import { useState, useEffect } from "react";
import { User } from "@/api/entities";
import { Role } from "@/api/entities";
import { Area } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

import { getCurrentDate, getFutureDate } from "@/components/project/ProjectUtils";

export default function TaskForm({ task, projects = [], roles = [], areas = [], onSubmit, onCancel, updating }) {
  console.log("TaskForm: task recebido:", task); // Debugging

  // Initialize formData with proper default values
  const getDefaultFormData = () => ({
    id: '',
    title: '',
    description: '',
    project_id: projects[0]?.id || '',
    status: 'pendente',
    assigned_to: '',
    role_id: '',
    seniority_level: '',
    estimated_hours: 0,
    hourly_rate: 0,
    total_cost: 0,
    priority: 'média',
    start_date: getFutureDate(1),
    deadline: getFutureDate(7),
    completion_date: '',
    area_id: areas[0]?.id || '',
  });

  const [formData, setFormData] = useState(getDefaultFormData());
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [seniorityOptions, setSeniorityOptions] = useState([]);

  // Load users when component mounts
  useEffect(() => {
    loadUsers();
  }, []);

  // Initialize form data when task prop changes - CORRIGIDO PARA RESETAR QUANDO NULL
  useEffect(() => {
    console.log("TaskForm: Inicializando form com task:", task);
    
    if (task && task.id) {
      // Editing existing task - populate all fields
      const taskData = {
        id: task.id,
        title: task.title || '',
        description: task.description || '',
        project_id: task.project_id || '',
        status: task.status || 'pendente',
        assigned_to: task.assigned_to || '',
        role_id: task.role_id || '',
        seniority_level: task.seniority_level || '',
        estimated_hours: task.estimated_hours || 0,
        hourly_rate: task.hourly_rate || 0,
        total_cost: task.total_cost || 0,
        priority: task.priority || 'média',
        start_date: task.start_date || '',
        deadline: task.deadline || '',
        completion_date: task.completion_date || '',
        area_id: task.area_id || '',
      };
      
      setFormData(taskData);
      console.log("TaskForm: Dados do form após inicialização (EDIÇÃO):", taskData);
    } else {
      // Creating new task OR task is null - reset to defaults
      const defaultData = getDefaultFormData();
      setFormData(defaultData);
      console.log("TaskForm: Dados do form após inicialização (NOVO/RESET):", defaultData);
    }
  }, [task, projects, areas]);

  // Update seniority options when role changes
  useEffect(() => {
    if (formData.role_id && roles && roles.length > 0) {
      updateSeniorityOptions(formData.role_id);
    }
  }, [formData.role_id, roles]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await User.list();
      setUsers(usersData || []);
      console.log("TaskForm: Usuários carregados:", usersData);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateSeniorityOptions = (roleId) => {
    const selectedRole = roles.find(role => role.id === roleId);

    if (selectedRole?.seniority_levels) {
      setSeniorityOptions(selectedRole.seniority_levels);

      // If editing and already has seniority level, keep it
      if (formData.seniority_level) {
        const seniorityData = selectedRole.seniority_levels.find(
          level => level.level === formData.seniority_level
        );

        if (seniorityData) {
          setFormData(prev => ({
            ...prev,
            hourly_rate: seniorityData.hourly_rate || 0,
            total_cost: (seniorityData.hourly_rate || 0) * (prev.estimated_hours || 0)
          }));
        }
      } else if (!task && selectedRole.seniority_levels.length > 0) {
        // Only set default for new tasks
        const firstLevel = selectedRole.seniority_levels[0];
        setFormData(prev => ({
          ...prev,
          seniority_level: firstLevel.level,
          hourly_rate: firstLevel.hourly_rate || 0,
          total_cost: (firstLevel.hourly_rate || 0) * (prev.estimated_hours || 0)
        }));
      }
    } else {
      setSeniorityOptions([]);
      setFormData(prev => ({
        ...prev,
        seniority_level: "",
        hourly_rate: 0,
        total_cost: 0
      }));
    }
  };

  // Generic change handler
  const handleChange = (field, value) => {
    console.log(`TaskForm: Alterando ${field} de "${formData[field]}" para "${value}"`);
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      console.log(`TaskForm: Estado após alteração:`, newData);
      return newData;
    });
  };

  const handleSeniorityChange = (level) => {
    setFormData(prev => ({ ...prev, seniority_level: level }));

    if (formData.role_id) {
      const selectedRole = roles.find(role => role.id === formData.role_id);
      if (selectedRole) {
        const seniorityData = selectedRole.seniority_levels?.find(
          sl => sl.level === level
        );

        if (seniorityData) {
          const hourlyRate = seniorityData.hourly_rate || 0;
          const totalCost = hourlyRate * (formData.estimated_hours || 0);

          setFormData(prev => ({
            ...prev,
            hourly_rate: hourlyRate,
            total_cost: totalCost
          }));
        }
      }
    }
  };

  const handleHoursChange = (hours) => {
    const parsedHours = parseFloat(hours) || 0;
    const totalCost = parsedHours * (formData.hourly_rate || 0);

    setFormData(prev => ({
      ...prev,
      estimated_hours: parsedHours,
      total_cost: totalCost
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("=== SUBMIT DO FORMULÁRIO ===");
    console.log("1. FormData no submit:", formData);
    console.log("2. assigned_to no submit:", formData.assigned_to);
    console.log("3. priority no submit:", formData.priority);
    onSubmit(formData);
  };

  const getSeniorityLabel = (level) => {
    const labels = {
      junior: "Júnior",
      pleno: "Pleno",
      senior: "Sênior",
      especialista: "Especialista",
      coordenador: "Coordenador", 
      gerente: "Gerente"
    };
    return labels[level] || level;
  };

  console.log("TaskForm render - formData atual:", formData);

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50/50 to-teal-50/50 rounded-2xl">
      <div className="bg-white rounded-2xl shadow-lg border border-blue-100 p-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[65vh] overflow-y-auto pr-4">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-700 font-semibold">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                required
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700 font-semibold">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={3}
                className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project_id" className="text-gray-700 font-semibold">Projeto</Label>
              <Select
                value={formData.project_id}
                onValueChange={(value) => handleChange("project_id", value)}
              >
                <SelectTrigger className="border-gray-200 focus:border-blue-500 rounded-xl">
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {projects && projects.map((project) => (
                    <SelectItem key={project.id} value={project.id} className="hover:bg-blue-50">
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_id" className="text-gray-700 font-semibold">Área da Tarefa</Label>
              <Select
                value={formData.area_id || ""}
                onValueChange={(value) => handleChange("area_id", value)}
              >
                <SelectTrigger className="border-gray-200 focus:border-blue-500 rounded-xl">
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id} className="hover:bg-blue-50">
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-700 font-semibold">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => handleChange("status", value)}
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="pendente" className="hover:bg-yellow-50">Pendente</SelectItem>
                    <SelectItem value="em_andamento" className="hover:bg-blue-50">Em Andamento</SelectItem>
                    <SelectItem value="concluída" className="hover:bg-green-50">Concluída</SelectItem>
                    <SelectItem value="bloqueada" className="hover:bg-red-50">Bloqueada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority" className="text-gray-700 font-semibold">Prioridade</Label>
                <Select
                  key={`priority-${formData.priority}`}
                  value={formData.priority}
                  onValueChange={(value) => handleChange("priority", value)}
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value="baixa" className="hover:bg-green-50">Baixa</SelectItem>
                    <SelectItem value="média" className="hover:bg-yellow-50">Média</SelectItem>
                    <SelectItem value="alta" className="hover:bg-orange-50">Alta</SelectItem>
                    <SelectItem value="urgente" className="hover:bg-red-50">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assigned_to" className="text-gray-700 font-semibold">Responsável</Label>
              <Select
                key={`assigned-${formData.assigned_to}`}
                value={formData.assigned_to}
                onValueChange={(value) => handleChange("assigned_to", value)}
              >
                <SelectTrigger className="border-gray-200 focus:border-blue-500 rounded-xl">
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-gray-200">
                  <SelectItem value={null} className="hover:bg-gray-50">Nenhum responsável</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.email} className="hover:bg-blue-50">
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date" className="text-gray-700 font-semibold">Data de Início</Label>
                <Input
                  type="date"
                  id="start_date"
                  name="start_date"
                  value={formData.start_date}
                  onChange={(e) => handleChange("start_date", e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline" className="text-gray-700 font-semibold">Prazo de Entrega</Label>
                <Input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={(e) => handleChange("deadline", e.target.value)}
                  className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role_id" className="text-gray-700 font-semibold">Cargo</Label>
                <Select
                  value={formData.role_id}
                  onValueChange={(value) => handleChange("role_id", value)}
                >
                  <SelectTrigger className="border-gray-200 focus:border-blue-500 rounded-xl">
                    <SelectValue placeholder="Selecione um cargo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-gray-200">
                    <SelectItem value={null} className="hover:bg-gray-50">Nenhum</SelectItem>
                    {roles && roles.map((role) => (
                      <SelectItem key={role.id} value={role.id} className="hover:bg-blue-50">
                        {role.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.role_id && seniorityOptions.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="seniority_level" className="text-gray-700 font-semibold">Senioridade</Label>
                  <Select
                    value={formData.seniority_level}
                    onValueChange={handleSeniorityChange}
                  >
                    <SelectTrigger className="border-gray-200 focus:border-blue-500 rounded-xl">
                      <SelectValue placeholder="Selecione a senioridade" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-gray-200">
                      {seniorityOptions.map(level => (
                        <SelectItem key={level.level} value={level.level} className="hover:bg-blue-50">
                          {getSeniorityLabel(level.level)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {formData.role_id && formData.seniority_level && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="estimated_hours" className="text-gray-700 font-semibold">Horas Estimadas</Label>
                  <Input
                    type="number"
                    id="estimated_hours"
                    min="0"
                    step="0.5"
                    value={formData.estimated_hours}
                    onChange={(e) => handleHoursChange(e.target.value)}
                    className="border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                  />
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-sm text-gray-500">Valor por Hora:</div>
                      <div className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(formData.hourly_rate)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Custo Total Estimado:</div>
                      <div className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(formData.total_cost)}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 col-span-full border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              className="border-gray-200 hover:bg-gray-50 rounded-xl px-6"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updating}
              className="planzee-button-primary px-6"
            >
              {updating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                task ? 'Atualizar Tarefa' : 'Criar Tarefa'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

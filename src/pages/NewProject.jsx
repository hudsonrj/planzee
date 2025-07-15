import React, { useState, useEffect } from 'react';
import { Project, User, Area, ProjectType, ProjectStatus } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function NewProject() {
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    type_id: '',
    status_id: '',
    area_id: '',
    responsible: '',
    start_date: '',
    deadline: '',
    priority: 'média',
    tags: []
  });

  const [users, setUsers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [projectStatusList, setProjectStatusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [usersData, areasData, typesData, statusData] = await Promise.all([
        User.list(),
        Area.list(),
        ProjectType.list(),
        ProjectStatus.list()
      ]);

      setUsers(usersData || []);
      setAreas(areasData || []);
      setProjectTypes(typesData || []);
      setProjectStatusList(statusData || []);

      // Set default type and status
      if (typesData?.length > 0) {
        setNewProject(prev => ({ ...prev, type_id: typesData[0].id }));
      }
      if (statusData?.length > 0) {
        setNewProject(prev => ({ ...prev, status_id: statusData[0].id }));
      }

    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados para criação do projeto.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({ ...newProject, [name]: value });
  };

  const handleSelectChange = (name, value) => {
    setNewProject({ ...newProject, [name]: value });
  };

  const handleTagsChange = (e) => {
    const tags = e.target.value.split(',').map(tag => tag.trim());
    setNewProject({ ...newProject, tags });
  };

  const handleCreateProject = async () => {
    try {
      if (!newProject.title || !newProject.responsible || !newProject.start_date || !newProject.deadline || !newProject.type_id || !newProject.status_id) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios.",
          variant: "destructive"
        });
        return;
      }

      const projectToCreate = {
        ...newProject,
        participants: [],
        links: [],
        progress: 0,
        tags: newProject.tags.filter(Boolean),
      };

      const createdProject = await Project.create(projectToCreate);
      toast({
        title: "Projeto criado!",
        description: `O projeto "${createdProject.title}" foi criado com sucesso.`,
      });
      // Reset form or redirect
      setNewProject({
        title: '',
        description: '',
        type_id: projectTypes.length > 0 ? projectTypes[0].id : '',
        status_id: projectStatusList.length > 0 ? projectStatusList[0].id : '',
        area_id: '',
        responsible: '',
        start_date: '',
        deadline: '',
        priority: 'média',
        tags: []
      });

    } catch (error) {
      console.error('Erro ao criar projeto:', error);
      toast({
        title: "Erro ao criar projeto",
        description: error.message || 'Ocorreu um erro inesperado.',
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Criar Novo Projeto</CardTitle>
          <CardDescription>Preencha os detalhes abaixo para iniciar um novo projeto.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <label htmlFor="title" className="font-medium">Título do Projeto *</label>
            <Input id="title" name="title" value={newProject.title} onChange={handleInputChange} />
          </div>
          <div className="grid gap-2">
            <label htmlFor="description" className="font-medium">Descrição</label>
            <Textarea id="description" name="description" value={newProject.description} onChange={handleInputChange} rows={4} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <label htmlFor="type_id" className="font-medium">Tipo *</label>
              <Select name="type_id" value={newProject.type_id} onValueChange={(value) => handleSelectChange('type_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {projectTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="status_id" className="font-medium">Status *</label>
              <Select name="status_id" value={newProject.status_id} onValueChange={(value) => handleSelectChange('status_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {projectStatusList.filter(s => s.is_active && !s.is_final).map(status => (
                    <SelectItem key={status.id} value={status.id}>{status.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <label htmlFor="area_id" className="font-medium">Área Responsável</label>
              <Select name="area_id" value={newProject.area_id} onValueChange={(value) => handleSelectChange('area_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a área" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map(area => (
                    <SelectItem key={area.id} value={area.id}>{area.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="responsible" className="font-medium">Responsável (email) *</label>
              <Select name="responsible" value={newProject.responsible} onValueChange={(value) => handleSelectChange('responsible', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>{user.full_name || user.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <label htmlFor="start_date" className="font-medium">Data de Início *</label>
              <Input id="start_date" name="start_date" type="date" value={newProject.start_date} onChange={handleInputChange} />
            </div>
            <div className="grid gap-2">
              <label htmlFor="deadline" className="font-medium">Prazo de Entrega *</label>
              <Input id="deadline" name="deadline" type="date" value={newProject.deadline} onChange={handleInputChange} />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <label htmlFor="priority" className="font-medium">Prioridade</label>
              <Select name="priority" value={newProject.priority} onValueChange={(value) => handleSelectChange('priority', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="média">Média</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <label htmlFor="tags" className="font-medium">Tags (separadas por vírgula)</label>
              <Input id="tags" name="tags" value={newProject.tags.join(', ')} onChange={handleTagsChange} />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={handleCreateProject}>Criar Projeto</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
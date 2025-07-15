import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogFooter } from "@/components/ui/dialog";

export default function AgileTaskForm({ 
  task, 
  users, 
  projects, 
  selectedProject, 
  onProjectChange,
  onSubmit, 
  onCancel 
}) {
  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    status: task?.status || "to_do",
    priority: task?.priority || "medium",
    task_type: task?.task_type || "task",
    estimate: task?.estimate || 0,
    assigned_to: task?.assigned_to || "",
    project_id: task?.project_id || selectedProject || "",
    due_date: task?.due_date || ""
  });

  useEffect(() => {
    if (selectedProject && !formData.project_id) {
      setFormData(prev => ({ ...prev, project_id: selectedProject }));
    }
  }, [selectedProject]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'project_id' && onProjectChange) {
      onProjectChange(value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {projects && projects.length > 1 && (
        <div className="space-y-2">
          <Label htmlFor="project_id">Projeto</Label>
          <Select
            value={formData.project_id}
            onValueChange={(value) => handleChange("project_id", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um projeto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Título</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => handleChange("title", e.target.value)}
          placeholder="Título da tarefa"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleChange("description", e.target.value)}
          placeholder="Detalhes da tarefa..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="task_type">Tipo</Label>
          <Select
            value={formData.task_type}
            onValueChange={(value) => handleChange("task_type", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Tipo de tarefa" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="story">História</SelectItem>
              <SelectItem value="task">Tarefa</SelectItem>
              <SelectItem value="bug">Bug</SelectItem>
              <SelectItem value="epic">Epic</SelectItem>
              <SelectItem value="spike">Spike</SelectItem>
              <SelectItem value="tech_debt">Dívida Técnica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Prioridade</Label>
          <Select
            value={formData.priority}
            onValueChange={(value) => handleChange("priority", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lowest">Muito Baixa</SelectItem>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="highest">Muito Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="assigned_to">Responsável</Label>
          <Select
            value={formData.assigned_to}
            onValueChange={(value) => handleChange("assigned_to", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione um responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="unassigned">Não atribuído</SelectItem>
              {users.map(user => (
                <SelectItem key={user.id} value={user.email}>
                  {user.full_name || user.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="estimate">Estimativa (pontos)</Label>
          <Input
            id="estimate"
            type="number"
            min="0"
            value={formData.estimate}
            onChange={(e) => handleChange("estimate", Number(e.target.value))}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="due_date">Data de Vencimento</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date}
          onChange={(e) => handleChange("due_date", e.target.value)}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {task ? 'Atualizar Tarefa' : 'Criar Tarefa'}
        </Button>
      </DialogFooter>
    </form>
  );
}
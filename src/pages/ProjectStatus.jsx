import React, { useState, useEffect } from 'react';
import { ProjectStatus } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Settings,
  Play,
  Pause,
  CheckCircle,
  AlertTriangle,
  Clock,
  Archive,
  RefreshCw,
  Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_STATUS = [
  { name: 'Ambiente', description: 'Preparação do ambiente', color: '#6B7280', icon: 'Settings', order: 1, is_final: false },
  { name: 'POC', description: 'Proof of Concept', color: '#F59E0B', icon: 'Play', order: 2, is_final: false },
  { name: 'MVP', description: 'Minimum Viable Product', color: '#3B82F6', icon: 'Target', order: 3, is_final: false },
  { name: 'Desenvolvimento', description: 'Em desenvolvimento', color: '#8B5CF6', icon: 'RefreshCw', order: 4, is_final: false },
  { name: 'Produção', description: 'Em produção', color: '#10B981', icon: 'CheckCircle', order: 5, is_final: false },
  { name: 'Concluído', description: 'Projeto concluído', color: '#059669', icon: 'CheckCircle', order: 6, is_final: true },
  { name: 'Arquivado', description: 'Projeto arquivado', color: '#6B7280', icon: 'Archive', order: 7, is_final: true }
];

const ICON_OPTIONS = [
  'Settings', 'Play', 'Pause', 'CheckCircle', 'AlertTriangle', 'Clock', 
  'Archive', 'RefreshCw', 'Target', 'Zap', 'Activity', 'Calendar'
];

const COLOR_OPTIONS = [
  '#4F7CFF', '#00C896', '#FFC700', '#FF6B6B', '#9C88FF', '#FF9F43',
  '#E74C3C', '#2ECC71', '#3498DB', '#9B59B6', '#F39C12', '#1ABC9C',
  '#34495E', '#E67E22', '#95A5A6', '#16A085', '#2980B9', '#8E44AD',
  '#6B7280', '#059669', '#DC2626', '#7C3AED'
];

export default function ProjectStatusPage() {
  const [statusList, setStatusList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusToDelete, setStatusToDelete] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0],
    icon: ICON_OPTIONS[0],
    is_active: true,
    is_final: false,
    order: 1
  });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      const statusData = await ProjectStatus.list();
      
      if (statusData.length === 0) {
        // Primeira execução - criar status padrão
        await createDefaultStatus();
        const newStatusData = await ProjectStatus.list();
        setStatusList(newStatusData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      } else {
        setStatusList(statusData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os status de projeto.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultStatus = async () => {
    try {
      for (const status of DEFAULT_STATUS) {
        await ProjectStatus.create(status);
      }
      toast({
        title: 'Status criados',
        description: 'Status padrão de projeto foram criados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar status padrão:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Erro',
          description: 'Nome do status é obrigatório.',
          variant: 'destructive'
        });
        return;
      }

      const statusData = {
        ...formData,
        order: formData.order || statusList.length + 1
      };

      if (editingStatus) {
        await ProjectStatus.update(editingStatus.id, statusData);
        toast({
          title: 'Sucesso',
          description: 'Status de projeto atualizado com sucesso.',
        });
      } else {
        await ProjectStatus.create(statusData);
        toast({
          title: 'Sucesso',
          description: 'Status de projeto criado com sucesso.',
        });
      }

      setShowDialog(false);
      setEditingStatus(null);
      resetForm();
      await loadStatus();
    } catch (error) {
      console.error('Erro ao salvar status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o status de projeto.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (status) => {
    setEditingStatus(status);
    setFormData({
      name: status.name || '',
      description: status.description || '',
      color: status.color || COLOR_OPTIONS[0],
      icon: status.icon || ICON_OPTIONS[0],
      is_active: status.is_active !== false,
      is_final: status.is_final === true,
      order: status.order || 1
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!statusToDelete) return;

    try {
      await ProjectStatus.delete(statusToDelete.id);
      toast({
        title: 'Sucesso',
        description: 'Status de projeto excluído com sucesso.',
      });
      setShowDeleteConfirm(false);
      setStatusToDelete(null);
      await loadStatus();
    } catch (error) {
      console.error('Erro ao excluir status:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o status de projeto.',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: COLOR_OPTIONS[0],
      icon: ICON_OPTIONS[0],
      is_active: true,
      is_final: false,
      order: statusList.length + 1
    });
  };

  const renderIcon = (iconName, size = 'h-5 w-5') => {
    const iconMap = {
      Settings, Play, Pause, CheckCircle, AlertTriangle, Clock,
      Archive, RefreshCw, Target
    };
    
    const IconComponent = iconMap[iconName] || Settings;
    return <IconComponent className={size} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Status de Projeto</h1>
          <p className="text-gray-500">Gerencie os status de projeto disponíveis no sistema</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Status
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Situação</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {statusList.map((status) => (
                  <motion.tr
                    key={status.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div style={{ color: status.color }}>
                          {renderIcon(status.icon)}
                        </div>
                        <span className="font-medium">{status.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{status.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: status.color }}
                        />
                        <span className="text-sm font-mono">{status.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.is_final ? 'destructive' : 'default'}>
                        {status.is_final ? 'Final' : 'Ativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.is_active ? 'default' : 'secondary'}>
                        {status.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{status.order || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(status)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setStatusToDelete(status);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog de Criação/Edição */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingStatus ? 'Editar Status' : 'Novo Status de Projeto'}
            </DialogTitle>
            <DialogDescription>
              {editingStatus ? 'Altere as informações do status de projeto.' : 'Crie um novo status de projeto.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do status"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do status"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="color">Cor</Label>
                <div className="flex gap-2 flex-wrap">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={`w-8 h-8 rounded border-2 ${
                        formData.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      onClick={() => setFormData({ ...formData, color })}
                    />
                  ))}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="icon">Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>
                        <div className="flex items-center gap-2">
                          {renderIcon(icon, 'h-4 w-4')}
                          <span>{icon}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_final"
                  checked={formData.is_final}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_final: checked })}
                />
                <Label htmlFor="is_final">Status Final</Label>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="order">Ordem</Label>
                <Input
                  id="order"
                  type="number"
                  value={formData.order}
                  onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              <Save className="w-4 h-4 mr-2" />
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o status "{statusToDelete?.name}"? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
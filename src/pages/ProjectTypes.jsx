import React, { useState, useEffect } from 'react';
import { ProjectType } from '@/api/entities';
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
  Palette,
  Settings,
  Package,
  Wrench,
  Zap,
  TestTube,
  Server,
  Shield,
  Eye,
  HeadphonesIcon,
  Lightbulb
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';

const DEFAULT_TYPES = [
  { name: 'Produto', description: 'Desenvolvimento de produtos', color: '#4F7CFF', icon: 'Package', order: 1 },
  { name: 'Melhoria', description: 'Melhorias em sistemas existentes', color: '#00C896', icon: 'Wrench', order: 2 },
  { name: 'MVP', description: 'Minimum Viable Product', color: '#FFC700', icon: 'Zap', order: 3 },
  { name: 'POC', description: 'Proof of Concept', color: '#FF6B6B', icon: 'TestTube', order: 4 },
  { name: 'Infraestrutura', description: 'Projetos de infraestrutura', color: '#9C88FF', icon: 'Server', order: 5 },
  { name: 'NOC', description: 'Network Operations Center', color: '#FF9F43', icon: 'Eye', order: 6 },
  { name: 'SOC', description: 'Security Operations Center', color: '#E74C3C', icon: 'Shield', order: 7 },
  { name: 'Implementação', description: 'Implementação de sistemas', color: '#2ECC71', icon: 'Settings', order: 8 },
  { name: 'Service Desk', description: 'Projetos de atendimento', color: '#3498DB', icon: 'HeadphonesIcon', order: 9 }
];

const ICON_OPTIONS = [
  'Package', 'Wrench', 'Zap', 'TestTube', 'Server', 'Eye', 'Shield', 'Settings', 
  'HeadphonesIcon', 'Lightbulb', 'Target', 'Briefcase', 'Code', 'Database', 
  'Cloud', 'Monitor', 'Smartphone', 'Globe', 'Lock', 'Users'
];

const COLOR_OPTIONS = [
  '#4F7CFF', '#00C896', '#FFC700', '#FF6B6B', '#9C88FF', '#FF9F43',
  '#E74C3C', '#2ECC71', '#3498DB', '#9B59B6', '#F39C12', '#1ABC9C',
  '#34495E', '#E67E22', '#95A5A6', '#16A085', '#2980B9', '#8E44AD'
];

export default function ProjectTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: COLOR_OPTIONS[0],
    icon: ICON_OPTIONS[0],
    is_active: true,
    order: 1
  });

  useEffect(() => {
    loadTypes();
  }, []);

  const loadTypes = async () => {
    try {
      setLoading(true);
      const typesData = await ProjectType.list();
      
      if (typesData.length === 0) {
        // Primeira execução - criar tipos padrão
        await createDefaultTypes();
        const newTypesData = await ProjectType.list();
        setTypes(newTypesData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      } else {
        setTypes(typesData.sort((a, b) => (a.order || 0) - (b.order || 0)));
      }
    } catch (error) {
      console.error('Erro ao carregar tipos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os tipos de projeto.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTypes = async () => {
    try {
      for (const type of DEFAULT_TYPES) {
        await ProjectType.create(type);
      }
      toast({
        title: 'Tipos criados',
        description: 'Tipos padrão de projeto foram criados com sucesso.',
      });
    } catch (error) {
      console.error('Erro ao criar tipos padrão:', error);
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Erro',
          description: 'Nome do tipo é obrigatório.',
          variant: 'destructive'
        });
        return;
      }

      const typeData = {
        ...formData,
        order: formData.order || types.length + 1
      };

      if (editingType) {
        await ProjectType.update(editingType.id, typeData);
        toast({
          title: 'Sucesso',
          description: 'Tipo de projeto atualizado com sucesso.',
        });
      } else {
        await ProjectType.create(typeData);
        toast({
          title: 'Sucesso',
          description: 'Tipo de projeto criado com sucesso.',
        });
      }

      setShowDialog(false);
      setEditingType(null);
      resetForm();
      await loadTypes();
    } catch (error) {
      console.error('Erro ao salvar tipo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o tipo de projeto.',
        variant: 'destructive'
      });
    }
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setFormData({
      name: type.name || '',
      description: type.description || '',
      color: type.color || COLOR_OPTIONS[0],
      icon: type.icon || ICON_OPTIONS[0],
      is_active: type.is_active !== false,
      order: type.order || 1
    });
    setShowDialog(true);
  };

  const handleDelete = async () => {
    if (!typeToDelete) return;

    try {
      await ProjectType.delete(typeToDelete.id);
      toast({
        title: 'Sucesso',
        description: 'Tipo de projeto excluído com sucesso.',
      });
      setShowDeleteConfirm(false);
      setTypeToDelete(null);
      await loadTypes();
    } catch (error) {
      console.error('Erro ao excluir tipo:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o tipo de projeto.',
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
      order: types.length + 1
    });
  };

  const renderIcon = (iconName, size = 'h-5 w-5') => {
    const iconMap = {
      Package, Wrench, Zap, TestTube, Server, Eye, Shield, Settings, 
      HeadphonesIcon, Lightbulb
    };
    
    const IconComponent = iconMap[iconName] || Package;
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
          <h1 className="text-2xl font-bold">Tipos de Projeto</h1>
          <p className="text-gray-500">Gerencie os tipos de projeto disponíveis no sistema</p>
        </div>
        <Button onClick={() => { resetForm(); setShowDialog(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tipos Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tipo</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Cor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ordem</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence>
                {types.map((type) => (
                  <motion.tr
                    key={type.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div style={{ color: type.color }}>
                          {renderIcon(type.icon)}
                        </div>
                        <span className="font-medium">{type.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{type.description || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: type.color }}
                        />
                        <span className="text-sm font-mono">{type.color}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.is_active ? 'default' : 'secondary'}>
                        {type.is_active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>{type.order || '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(type)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setTypeToDelete(type);
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
              {editingType ? 'Editar Tipo' : 'Novo Tipo de Projeto'}
            </DialogTitle>
            <DialogDescription>
              {editingType ? 'Altere as informações do tipo de projeto.' : 'Crie um novo tipo de projeto.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nome do tipo"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do tipo"
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

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
                <Label htmlFor="is_active">Ativo</Label>
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
              Tem certeza que deseja excluir o tipo "{typeToDelete?.name}"? Esta ação não pode ser desfeita.
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
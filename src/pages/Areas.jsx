import React, { useState, useEffect } from "react";
import { Area, User } from "@/api/entities";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Plus, Edit, Trash2, Loader2, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function AreasPage() {
  const [areas, setAreas] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentArea, setCurrentArea] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [areasData, usersData] = await Promise.all([Area.list(), User.list()]);
      setAreas(areasData);
      setUsers(usersData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro ao carregar dados",
        description: "Não foi possível buscar as áreas e usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (area = null) => {
    if (area) {
      setIsEditing(true);
      setCurrentArea(area);
    } else {
      setIsEditing(false);
      setCurrentArea({ name: "", responsible_email: "" });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentArea(null);
  };

  const handleSubmit = async () => {
    if (!currentArea.name || !currentArea.responsible_email) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e o responsável da área.",
        variant: "warning",
      });
      return;
    }

    try {
      if (isEditing) {
        await Area.update(currentArea.id, {
          name: currentArea.name,
          responsible_email: currentArea.responsible_email,
        });
        toast({ title: "Área atualizada com sucesso!" });
      } else {
        await Area.create(currentArea);
        toast({ title: "Área criada com sucesso!" });
      }
      handleCloseDialog();
      loadData();
    } catch (error) {
      console.error("Erro ao salvar área:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar a área.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (area) => {
    setAreaToDelete(area);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await Area.delete(areaToDelete.id);
      toast({ title: "Área excluída com sucesso!" });
      setIsDeleteConfirmOpen(false);
      setAreaToDelete(null);
      loadData();
    } catch (error) {
      console.error("Erro ao excluir área:", error);
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a área. Verifique se ela não está associada a projetos ou tarefas.",
        variant: "destructive",
      });
    }
  };

  const getUserName = (email) => {
    const user = users.find(u => u.email === email);
    return user ? user.full_name : email;
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Áreas</h1>
          <p className="text-gray-500">Adicione, edite e remova as áreas da organização.</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Nova Área
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Áreas Cadastradas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome da Área</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {areas.map((area) => (
                  <TableRow key={area.id}>
                    <TableCell className="font-medium">{area.name}</TableCell>
                    <TableCell>{getUserName(area.responsible_email)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(area)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(area)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog para Criar/Editar Área */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Área" : "Nova Área"}</DialogTitle>
            <DialogDescription>
              Preencha as informações abaixo para {isEditing ? "atualizar a" : "criar uma nova"} área.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nome da Área</Label>
              <Input
                id="name"
                value={currentArea?.name || ""}
                onChange={(e) => setCurrentArea({ ...currentArea, name: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="responsible_email">Responsável</Label>
              <Select
                value={currentArea?.responsible_email || ""}
                onValueChange={(value) => setCurrentArea({ ...currentArea, responsible_email: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um responsável" />
                </SelectTrigger>
                <SelectContent>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSubmit}>{isEditing ? "Salvar Alterações" : "Criar Área"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog para Confirmar Exclusão */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Exclusão</DialogTitle>
          </DialogHeader>
          <p>
            Tem certeza que deseja excluir a área{" "}
            <strong>{areaToDelete?.name}</strong>? Esta ação não pode ser desfeita.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { AlertTriangle, Calendar } from 'lucide-react';
import { ProjectLog, User } from '@/api/entities';
import { useToast } from '@/components/ui/use-toast';

export default function DateChangeDialog({ 
    open, 
    onOpenChange, 
    onConfirm, 
    changeInfo,
    projectId,
    taskId = null,
    taskTitle = null
}) {
    const [justification, setJustification] = useState('');
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleConfirm = async () => {
        if (!justification.trim()) {
            toast({
                title: "Justificativa obrigatória",
                description: "Por favor, forneça uma justificativa para a mudança de data.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            // Obter usuário atual
            const currentUser = await User.me();
            
            // Criar log da mudança
            await ProjectLog.create({
                project_id: projectId,
                action: taskId ? 'task_date_change' : 'date_change',
                description: `${changeInfo.field} alterada de ${changeInfo.oldValue || 'não definida'} para ${changeInfo.newValue}`,
                justification: justification.trim(),
                old_value: changeInfo.oldValue || '',
                new_value: changeInfo.newValue,
                changed_by: currentUser.email,
                task_id: taskId,
                task_title: taskTitle,
                change_type: changeInfo.field
            });

            // Executar a mudança
            await onConfirm(justification.trim());
            
            // Limpar estado
            setJustification('');
            onOpenChange(false);
            
            toast({
                title: "Data alterada com sucesso",
                description: "A mudança foi registrada no histórico do projeto."
            });
        } catch (error) {
            console.error("Erro ao registrar mudança de data:", error);
            toast({
                title: "Erro ao alterar data",
                description: "Não foi possível registrar a mudança. Tente novamente.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setJustification('');
        onOpenChange(false);
    };

    const formatFieldName = (field) => {
        const fieldNames = {
            'start_date': 'Data de Início',
            'deadline': 'Prazo Final',
            'completion_date': 'Data de Conclusão'
        };
        return fieldNames[field] || field;
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Não definida';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR');
        } catch {
            return dateString;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                        Confirmação de Mudança de Data
                    </DialogTitle>
                    <DialogDescription>
                        Uma justificativa é obrigatória para mudanças de datas. 
                        Esta alteração será registrada no histórico do projeto.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Informações da mudança */}
                    <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <Calendar className="h-4 w-4" />
                            Detalhes da Alteração
                        </div>
                        
                        {taskTitle && (
                            <div className="text-sm">
                                <span className="font-medium">Tarefa:</span> {taskTitle}
                            </div>
                        )}
                        
                        <div className="text-sm">
                            <span className="font-medium">Campo:</span> {formatFieldName(changeInfo?.field)}
                        </div>
                        
                        <div className="text-sm">
                            <span className="font-medium">De:</span> {formatDate(changeInfo?.oldValue)}
                        </div>
                        
                        <div className="text-sm">
                            <span className="font-medium">Para:</span> {formatDate(changeInfo?.newValue)}
                        </div>
                    </div>

                    {/* Campo de justificativa */}
                    <div className="space-y-2">
                        <Label htmlFor="justification">
                            Justificativa da Mudança *
                        </Label>
                        <Textarea
                            id="justification"
                            placeholder="Explique o motivo da mudança de data (ex: alteração no escopo, dependência externa, mudança de prioridade...)"
                            value={justification}
                            onChange={(e) => setJustification(e.target.value)}
                            className="min-h-[100px]"
                        />
                        <p className="text-xs text-gray-500">
                            Esta justificativa será permanentemente registrada no histórico do projeto.
                        </p>
                    </div>
                </div>

                <DialogFooter>
                    <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        onClick={handleConfirm}
                        disabled={loading || !justification.trim()}
                    >
                        {loading ? 'Registrando...' : 'Confirmar Alteração'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
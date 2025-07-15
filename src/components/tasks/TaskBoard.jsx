import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Calendar,
    User,
    Clock,
    DollarSign,
    AlertTriangle,
    Pencil,
    Trash2,
    CheckCircle,
    Circle,
    ArrowUpCircle,
    Square
} from 'lucide-react';
import { motion } from 'framer-motion';
import { canEditTask, canDeleteTask } from '@/components/permissions/PermissionUtils';

const TASK_COLUMNS = {
    pendente: {
        title: 'Pendentes',
        color: 'bg-gray-100',
        icon: Circle,
        borderColor: 'border-gray-300'
    },
    em_andamento: {
        title: 'Em Andamento',
        color: 'bg-blue-100',
        icon: ArrowUpCircle,
        borderColor: 'border-blue-300'
    },
    concluída: {
        title: 'Concluídas',
        color: 'bg-green-100',
        icon: CheckCircle,
        borderColor: 'border-green-300'
    },
    bloqueada: {
        title: 'Bloqueadas',
        color: 'bg-red-100',
        icon: Square,
        borderColor: 'border-red-300'
    }
};

const PRIORITY_COLORS = {
    baixa: 'bg-blue-100 text-blue-800',
    média: 'bg-yellow-100 text-yellow-800',
    alta: 'bg-orange-100 text-orange-800',
    urgente: 'bg-red-100 text-red-800'
};

export default function TaskBoard({ 
    tasks, 
    onTaskUpdate, 
    onTaskEdit, 
    onTaskDelete, 
    currentUser, 
    projectResponsible,
    users = []
}) {
    // Organizar tarefas por coluna
    const tasksByStatus = Object.keys(TASK_COLUMNS).reduce((acc, status) => {
        acc[status] = tasks.filter(task => task.status === status);
        return acc;
    }, {});

    const handleDragEnd = (result) => {
        const { destination, source, draggableId } = result;

        // Se não há destino ou se moveu para o mesmo lugar
        if (!destination || 
            (destination.droppableId === source.droppableId && 
             destination.index === source.index)) {
            return;
        }

        const task = tasks.find(t => t.id === draggableId);
        if (!task) return;

        // Verificar permissão para mover a tarefa
        if (!canEditTask(task, currentUser?.email, currentUser?.position, projectResponsible)) {
            return;
        }

        // Atualizar status da tarefa
        const newStatus = destination.droppableId;
        const updatedTask = {
            ...task,
            status: newStatus,
            // Se movendo para concluída, adicionar data de conclusão
            completion_date: newStatus === 'concluída' ? new Date().toISOString().split('T')[0] : task.completion_date
        };

        onTaskUpdate(updatedTask);
    };

    const getUserName = (email) => {
        const user = users.find(u => u.email === email);
        return user?.full_name || email || 'Não atribuído';
    };

    const getInitials = (email) => {
        if (!email) return '?';
        const user = users.find(u => u.email === email);
        if (user?.full_name) {
            const names = user.full_name.split(' ');
            return names.length > 1 ? 
                `${names[0][0]}${names[names.length-1][0]}`.toUpperCase() : 
                names[0].substring(0, 2).toUpperCase();
        }
        return email.substring(0, 2).toUpperCase();
    };

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { 
            style: 'currency', 
            currency: 'BRL' 
        }).format(value || 0);
    };

    const isOverdue = (task) => {
        if (!task.deadline || task.status === 'concluída') return false;
        return new Date(task.deadline) < new Date();
    };

    const TaskCard = ({ task, index }) => {
        const canEdit = canEditTask(task, currentUser?.email, currentUser?.position, projectResponsible);
        const canDelete = canDeleteTask(task, currentUser?.email, currentUser?.position, projectResponsible);
        const overdue = isOverdue(task);

        return (
            <Draggable 
                draggableId={task.id} 
                index={index}
                isDragDisabled={!canEdit}
            >
                {(provided, snapshot) => (
                    <motion.div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className={`mb-3 ${snapshot.isDragging ? 'rotate-2 shadow-xl' : ''}`}
                    >
                        <Card className={`hover:shadow-md transition-all duration-200 ${
                            overdue ? 'border-l-4 border-l-red-500' : ''
                        } ${!canEdit ? 'opacity-70' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2">
                                        {task.title}
                                    </h4>
                                    <div className="flex gap-1 ml-2">
                                        {canEdit && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-400 hover:text-blue-600"
                                                onClick={() => onTaskEdit(task)}
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        )}
                                        {canDelete && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-gray-400 hover:text-red-600"
                                                onClick={() => onTaskDelete(task)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                {task.description && (
                                    <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                        {task.description}
                                    </p>
                                )}

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <Badge 
                                            variant="outline" 
                                            className={`text-xs ${PRIORITY_COLORS[task.priority] || PRIORITY_COLORS.média}`}
                                        >
                                            {task.priority || 'média'}
                                        </Badge>
                                        
                                        {overdue && (
                                            <Badge variant="destructive" className="text-xs">
                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                Atrasada
                                            </Badge>
                                        )}
                                    </div>

                                    {task.assigned_to && (
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Avatar className="h-5 w-5">
                                                <AvatarFallback className="text-xs bg-gray-200">
                                                    {getInitials(task.assigned_to)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="truncate">{getUserName(task.assigned_to)}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-between text-xs text-gray-500">
                                        {task.deadline && (
                                            <div className={`flex items-center gap-1 ${overdue ? 'text-red-600 font-medium' : ''}`}>
                                                <Calendar className="h-3 w-3" />
                                                <span>{new Date(task.deadline).toLocaleDateString()}</span>
                                            </div>
                                        )}

                                        {task.estimated_hours > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                <span>{task.estimated_hours}h</span>
                                            </div>
                                        )}
                                    </div>

                                    {task.total_cost > 0 && (
                                        <div className="flex items-center gap-1 text-xs text-gray-600">
                                            <DollarSign className="h-3 w-3" />
                                            <span className="font-medium">{formatCurrency(task.total_cost)}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </Draggable>
        );
    };

    return (
        <DragDropContext onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(TASK_COLUMNS).map(([status, column]) => {
                    const Icon = column.icon;
                    const columnTasks = tasksByStatus[status] || [];
                    
                    return (
                        <div key={status} className="flex flex-col">
                            <div className={`${column.color} ${column.borderColor} border-2 rounded-t-lg p-3`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-gray-600" />
                                        <h3 className="font-semibold text-gray-800">{column.title}</h3>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {columnTasks.length}
                                    </Badge>
                                </div>
                            </div>

                            <Droppable droppableId={status}>
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.droppableProps}
                                        className={`flex-1 p-3 border-2 border-t-0 ${column.borderColor} rounded-b-lg min-h-[200px] transition-colors ${
                                            snapshot.isDraggingOver ? 'bg-gray-50' : 'bg-white'
                                        }`}
                                    >
                                        {columnTasks.map((task, index) => (
                                            <TaskCard key={task.id} task={task} index={index} />
                                        ))}
                                        {provided.placeholder}
                                        
                                        {columnTasks.length === 0 && (
                                            <div className="text-center text-gray-400 text-sm py-8">
                                                Nenhuma tarefa
                                            </div>
                                        )}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    );
                })}
            </div>
        </DragDropContext>
    );
}
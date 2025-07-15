import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    CheckCircle2,
    Circle,
    ArrowUpCircle,
    Pencil,
    Trash2,
    User,
    Briefcase,
    Clock,
    DollarSign,
    AlertTriangle
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TaskItem({ task, onEdit, onDelete }) {
    const statusIcons = {
        pendente: <Circle className="w-5 h-5 text-gray-400" />,
        em_andamento: <ArrowUpCircle className="w-5 h-5 text-blue-500" />,
        concluída: <CheckCircle2 className="w-5 h-5 text-green-500" />,
        bloqueada: <Circle className="w-5 h-5 text-red-500" />
    };
    
    const priorityConfig = {
      baixa: { label: "Baixa", className: "bg-blue-100 text-blue-800 border-blue-200" },
      média: { label: "Média", className: "bg-green-100 text-green-800 border-green-200" },
      alta: { label: "Alta", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
      urgente: { label: "Urgente", className: "bg-red-100 text-red-800 border-red-300 font-bold" },
    };
    const currentPriority = priorityConfig[task.priority] || priorityConfig.média;

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
    };

    const isOverdue = !task.completion_date && task.deadline && new Date(task.deadline) < new Date();

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card className="planzee-card transition-all duration-300">
                <div className="p-4 flex items-start gap-4">
                    <div className="mt-1">
                        {statusIcons[task.status] || statusIcons.pendente}
                    </div>
                    <div className="flex-1">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className={`font-semibold text-gray-800 ${task.status === 'concluída' ? 'line-through text-gray-400' : ''}`}>
                                    {task.title}
                                </h3>
                                {task.description && (
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">{task.description}</p>
                                )}
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" onClick={() => onEdit?.(task)} className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50">
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => onDelete?.(task)} className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-600">
                            <Badge variant="outline" className={`capitalize ${currentPriority.className}`}>{currentPriority.label}</Badge>
                            
                            {task.assigned_to && (
                                <div className="flex items-center gap-1.5">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{task.assigned_to}</span>
                                </div>
                            )}

                            {task.deadline && (
                                <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-yellow-600 font-semibold' : ''}`}>
                                    {isOverdue && <AlertTriangle className="h-4 w-4 text-yellow-500 animate-pulse" />}
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    <span>{new Date(task.deadline).toLocaleDateString()}</span>
                                </div>
                            )}

                            {task.estimated_hours > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>{task.estimated_hours}h est.</span>
                                </div>
                            )}
                            
                            {(task.total_cost > 0) && (
                                <div className="flex items-center gap-1.5">
                                    <DollarSign className="h-4 w-4 text-gray-400" />
                                    <span className="font-medium">{formatCurrency(task.total_cost)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </motion.div>
    );
}
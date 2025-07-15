import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1 },
};

export default function TaskCard({ task, onEdit, onDelete, isKanban = false }) {
  const priorityConfig = {
    baixa: { label: "Baixa", className: "bg-blue-100 text-blue-800" },
    média: { label: "Média", className: "bg-green-100 text-green-800" },
    alta: { label: "Alta", className: "bg-yellow-100 text-yellow-800 animate-pulse" },
    urgente: { label: "Urgente", className: "bg-red-100 text-red-800 font-bold animate-pulse" },
  };

  const statusColors = {
    pendente: 'border-l-4 border-gray-400',
    em_andamento: 'border-l-4 border-blue-500',
    concluída: 'border-l-4 border-green-500',
    bloqueada: 'border-l-4 border-red-500',
  };

  const currentPriority = priorityConfig[task.priority] || priorityConfig.média;

  return (
    <motion.div variants={itemVariants} className="h-full">
        <Card className={`planzee-card h-full flex flex-col transition-all duration-300 hover:shadow-lg ${statusColors[task.status]}`}>
            <CardHeader className="flex flex-row items-start justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-gray-800 line-clamp-2">{task.title}</CardTitle>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-700">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onEdit(task)}><Edit className="mr-2 h-4 w-4" /> Editar</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(task)} className="text-red-500"><Trash2 className="mr-2 h-4 w-4" /> Excluir</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            <CardContent className="flex-grow py-0 space-y-3">
                <p className="text-xs text-gray-500 line-clamp-2">
                    {task.description || 'Sem descrição detalhada.'}
                </p>
                <div>
                   <Badge variant="outline" className={`capitalize ${currentPriority.className}`}>{currentPriority.label}</Badge>
                </div>
            </CardContent>
            <CardFooter className="pt-3 flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-1">
                   <Calendar className="h-3 w-3" />
                   <span>{task.deadline ? new Date(task.deadline).toLocaleDateString() : 'N/D'}</span>
                </div>
                {task.assigned_to ? (
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">{task.assigned_to?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </div>
                ) : <div/>}
            </CardFooter>
        </Card>
    </motion.div>
  );
}
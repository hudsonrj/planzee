import React, { useState, useEffect } from 'react';
import { ProjectLog, User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    History, 
    Calendar, 
    User as UserIcon, 
    FileText, 
    Clock,
    AlertTriangle,
    CheckCircle,
    Edit,
    Plus
} from 'lucide-react';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

export default function ProjectLogs({ projectId }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        if (projectId) {
            loadLogs();
        }
    }, [projectId]);

    const loadLogs = async () => {
        try {
            setLoading(true);
            const [logsData, usersData] = await Promise.all([
                ProjectLog.filter({ project_id: projectId }),
                User.list()
            ]);
            
            // Ordenar logs por data (mais recente primeiro)
            const sortedLogs = (logsData || []).sort((a, b) => 
                new Date(b.created_date) - new Date(a.created_date)
            );
            
            setLogs(sortedLogs);
            setUsers(usersData || []);
        } catch (error) {
            console.error("Erro ao carregar logs:", error);
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (email) => {
        const user = users.find(u => u.email === email);
        return user?.full_name || email;
    };

    const getActionIcon = (action) => {
        const icons = {
            'date_change': <Calendar className="h-4 w-4" />,
            'task_date_change': <Clock className="h-4 w-4" />,
            'status_change': <CheckCircle className="h-4 w-4" />,
            'project_created': <Plus className="h-4 w-4" />,
            'project_updated': <Edit className="h-4 w-4" />,
            'task_created': <Plus className="h-4 w-4" />,
            'task_updated': <Edit className="h-4 w-4" />
        };
        return icons[action] || <FileText className="h-4 w-4" />;
    };

    const getActionColor = (action) => {
        const colors = {
            'date_change': 'bg-amber-100 text-amber-800',
            'task_date_change': 'bg-blue-100 text-blue-800',
            'status_change': 'bg-green-100 text-green-800',
            'project_created': 'bg-purple-100 text-purple-800',
            'project_updated': 'bg-gray-100 text-gray-800',
            'task_created': 'bg-emerald-100 text-emerald-800',
            'task_updated': 'bg-indigo-100 text-indigo-800'
        };
        return colors[action] || 'bg-gray-100 text-gray-800';
    };

    const getActionLabel = (action) => {
        const labels = {
            'date_change': 'Mudança de Data',
            'task_date_change': 'Data da Tarefa',
            'status_change': 'Mudança de Status',
            'project_created': 'Projeto Criado',
            'project_updated': 'Projeto Atualizado',
            'task_created': 'Tarefa Criada',
            'task_updated': 'Tarefa Atualizada'
        };
        return labels[action] || action;
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <History className="h-5 w-5" />
                        Histórico do Projeto
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Histórico do Projeto
                    <Badge variant="secondary">{logs.length}</Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                {logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Nenhum registro encontrado no histórico</p>
                    </div>
                ) : (
                    <ScrollArea className="h-[400px] pr-4">
                        <div className="space-y-4">
                            {logs.map((log, index) => (
                                <div key={log.id || index} className="border-l-2 border-gray-200 pl-4 pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-3">
                                            <div className="bg-white border-2 border-gray-200 rounded-full p-1 -ml-6">
                                                {getActionIcon(log.action)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge className={getActionColor(log.action)}>
                                                        {getActionLabel(log.action)}
                                                    </Badge>
                                                    {log.task_title && (
                                                        <Badge variant="outline" className="text-xs">
                                                            {log.task_title}
                                                        </Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-900 mb-1">
                                                    {log.description}
                                                </p>
                                                {log.justification && (
                                                    <div className="bg-amber-50 border border-amber-200 rounded-md p-2 mt-2">
                                                        <div className="flex items-start gap-2">
                                                            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                                            <div>
                                                                <p className="text-xs font-medium text-amber-800 mb-1">
                                                                    Justificativa:
                                                                </p>
                                                                <p className="text-xs text-amber-700">
                                                                    {log.justification}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                                {(log.old_value || log.new_value) && (
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        {log.old_value && (
                                                            <span>De: <strong>{log.old_value}</strong> </span>
                                                        )}
                                                        {log.new_value && (
                                                            <span>Para: <strong>{log.new_value}</strong></span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 ml-9">
                                        <div className="flex items-center gap-1">
                                            <UserIcon className="h-3 w-3" />
                                            {getUserName(log.changed_by)}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-3 w-3" />
                                            {format(new Date(log.created_date), 'dd/MM/yyyy HH:mm', { locale: pt })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Trash2, AlertTriangle, CheckCircle, Copy, Building } from 'lucide-react';
import { cleanOrphanData } from '@/api/functions';
import { cleanDuplicateAreas } from '@/api/functions';

export default function DataCleanup() {
    const [projectTitle, setProjectTitle] = useState('Projeto de teste do Bruno');
    const [projectId, setProjectId] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    
    // Estados para limpeza de áreas
    const [areasLoading, setAreasLoading] = useState(false);
    const [areasResult, setAreasResult] = useState(null);
    const [areasError, setAreasError] = useState(null);

    const handleCleanup = async () => {
        if (!projectTitle && !projectId) {
            setError('Forneça pelo menos o título ou ID do projeto');
            return;
        }

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const response = await cleanOrphanData({
                projectTitle: projectTitle.trim(),
                projectId: projectId.trim()
            });

            setResult(response.data);
        } catch (err) {
            setError(`Erro na limpeza: ${err.message}`);
            console.error('Erro na limpeza:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAreaCleanup = async () => {
        setAreasLoading(true);
        setAreasError(null);
        setAreasResult(null);

        try {
            const response = await cleanDuplicateAreas();
            setAreasResult(response.data.results);
        } catch (err) {
            setAreasError(`Erro na limpeza de áreas: ${err.message}`);
            console.error('Erro na limpeza de áreas:', err);
        } finally {
            setAreasLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Trash2 className="h-6 w-6 text-red-500" />
                    Limpeza de Dados
                </h1>
                <p className="text-gray-600 mt-1">
                    Ferramentas para limpeza e manutenção dos dados do sistema
                </p>
            </div>

            <Tabs defaultValue="projects" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="projects">Limpeza de Projetos</TabsTrigger>
                    <TabsTrigger value="areas">Limpeza de Áreas</TabsTrigger>
                </TabsList>

                <TabsContent value="projects">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Trash2 className="h-5 w-5 text-red-500" />
                                Limpeza de Dados Órfãos de Projetos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Esta função remove completamente um projeto e TODOS os seus dados relacionados de todas as entidades do sistema.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Título do Projeto</label>
                                    <Input
                                        value={projectTitle}
                                        onChange={(e) => setProjectTitle(e.target.value)}
                                        placeholder="Digite o título do projeto a ser removido"
                                    />
                                </div>

                                <div>
                                    <label className="text-sm font-medium">ID do Projeto (opcional)</label>
                                    <Input
                                        value={projectId}
                                        onChange={(e) => setProjectId(e.target.value)}
                                        placeholder="Digite o ID do projeto se conhecido"
                                    />
                                </div>

                                <Button 
                                    onClick={handleCleanup}
                                    disabled={loading || (!projectTitle && !projectId)}
                                    className="w-full"
                                    variant="destructive"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Executando Limpeza...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Executar Limpeza Completa
                                        </>
                                    )}
                                </Button>
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {result && (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="space-y-2">
                                            <p className="font-medium">Limpeza concluída com sucesso!</p>
                                            <p>Total de itens removidos: {result.totalDeleted}</p>
                                            <div className="text-sm">
                                                <p>• Projetos: {result.deletedItems.projects}</p>
                                                <p>• Tarefas: {result.deletedItems.tasks}</p>
                                                <p>• Reuniões: {result.deletedItems.meetings}</p>
                                                <p>• Orçamentos: {result.deletedItems.budgets}</p>
                                                <p>• Checklists: {result.deletedItems.checklists}</p>
                                                <p>• Notas: {result.deletedItems.notes}</p>
                                                <p>• Mensagens de Chat: {result.deletedItems.chatmessages}</p>
                                                <p>• Outros dados: {result.totalDeleted - result.deletedItems.projects - result.deletedItems.tasks - result.deletedItems.meetings - result.deletedItems.budgets - result.deletedItems.checklists - result.deletedItems.notes - result.deletedItems.chatmessages}</p>
                                            </div>
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="areas">
                    <Card className="max-w-2xl">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-blue-500" />
                                Limpeza de Áreas Duplicadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Alert>
                                <Copy className="h-4 w-4" />
                                <AlertDescription>
                                    Esta função remove áreas órfãs (não referenciadas) e consolida áreas duplicadas, mantendo apenas uma de cada nome.
                                </AlertDescription>
                            </Alert>

                            <div className="space-y-2">
                                <h4 className="font-medium text-sm">O que será feito:</h4>
                                <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                                    <li>Identificar áreas não referenciadas por projetos ou tarefas</li>
                                    <li>Remover áreas órfãs</li>
                                    <li>Identificar áreas com nomes duplicados</li>
                                    <li>Consolidar referências na área mais usada</li>
                                    <li>Remover áreas duplicadas</li>
                                </ul>
                            </div>

                            <Button 
                                onClick={handleAreaCleanup}
                                disabled={areasLoading}
                                className="w-full"
                                variant="default"
                            >
                                {areasLoading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Limpando Áreas...
                                    </>
                                ) : (
                                    <>
                                        <Building className="h-4 w-4 mr-2" />
                                        Limpar Áreas Duplicadas
                                    </>
                                )}
                            </Button>

                            {areasError && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>{areasError}</AlertDescription>
                                </Alert>
                            )}

                            {areasResult && (
                                <Alert>
                                    <CheckCircle className="h-4 w-4" />
                                    <AlertDescription>
                                        <div className="space-y-2">
                                            <p className="font-medium">Limpeza de áreas concluída!</p>
                                            <div className="text-sm space-y-1">
                                                <p>• Áreas órfãs removidas: {areasResult.orphanAreasDeleted}</p>
                                                <p>• Áreas duplicadas removidas: {areasResult.duplicateAreasDeleted}</p>
                                                <p>• Total de áreas após limpeza: {areasResult.totalAreasAfter}</p>
                                            </div>
                                            
                                            {areasResult.areasKept.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="font-medium text-sm">Áreas mantidas:</p>
                                                    <ul className="text-xs space-y-1">
                                                        {areasResult.areasKept.map((area, i) => (
                                                            <li key={i}>• {area.name} ({area.responsible})</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}

                                            {areasResult.areasDeleted.length > 0 && (
                                                <div className="mt-3">
                                                    <p className="font-medium text-sm">Áreas removidas:</p>
                                                    <ul className="text-xs space-y-1">
                                                        {areasResult.areasDeleted.map((area, i) => (
                                                            <li key={i}>• {area.name} ({area.reason})</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </AlertDescription>
                                </Alert>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
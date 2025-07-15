
import { User } from '@/api/entities';
import React from 'react';

// Cargos com permissões especiais
export const EXECUTIVE_POSITIONS = {
    CEO: {
        name: 'CEO',
        canViewAllProjects: true,
        canEditAllProjects: true,
        canViewAllTasks: true,
        canEditAllTasks: true,
        canManageUsers: true
    },
    CTO: {
        name: 'CTO',
        canViewAllProjects: true,
        canEditAllProjects: true,
        canViewAllTasks: true,
        canEditAllTasks: true,
        canManageUsers: false
    },
    'Gerente de Projetos': {
        name: 'Gerente de Projetos',
        canViewAllProjects: true,
        canEditAllProjects: true,
        canViewAllTasks: true, // Changed from false to true
        canEditAllTasks: true, // Changed from false to true
        canManageUsers: false
    }
};

// Definição de permissões do sistema
export const PERMISSIONS = {
    // Projetos
    PROJECT_VIEW_ALL: 'project:view_all',
    PROJECT_CREATE: 'project:create',
    PROJECT_EDIT_ALL: 'project:edit_all',
    PROJECT_DELETE: 'project:delete',
    PROJECT_MANAGE_BUDGET: 'project:manage_budget',
    
    // Tarefas
    TASK_VIEW_ALL: 'task:view_all',
    TASK_CREATE: 'task:create',
    TASK_EDIT_ALL: 'task:edit_all',
    TASK_DELETE: 'task:delete',
    TASK_ASSIGN: 'task:assign',
    
    // Reuniões
    MEETING_VIEW_ALL: 'meeting:view_all',
    MEETING_CREATE: 'meeting:create',
    MEETING_EDIT: 'meeting:edit',
    MEETING_DELETE: 'meeting:delete',
    
    // Orçamentos
    BUDGET_VIEW: 'budget:view',
    BUDGET_CREATE: 'budget:create',
    BUDGET_EDIT: 'budget:edit',
    BUDGET_APPROVE: 'budget:approve',
    
    // Relatórios
    REPORT_VIEW: 'report:view',
    REPORT_CREATE: 'report:create',
    REPORT_EXPORT: 'report:export',
    
    // Usuários
    USER_VIEW: 'user:view',
    USER_CREATE: 'user:create',
    USER_EDIT: 'user:edit',
    USER_DELETE: 'user:delete',
    USER_MANAGE_ROLES: 'user:manage_roles',
    
    // Configurações
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',
    SETTINGS_SYSTEM: 'settings:system',
    
    // IA
    AI_USE_ASSISTANT: 'ai:use_assistant',
    AI_GENERATE_CONTENT: 'ai:generate_content',
    AI_ANALYZE_DATA: 'ai:analyze_data'
};

// Função para verificar se o usuário tem permissões executivas
export const hasExecutivePermission = (userPosition, permission) => {
    const position = EXECUTIVE_POSITIONS[userPosition];
    return position ? position[permission] : false;
};

// Função para filtrar projetos baseado na posição do usuário
export const filterProjectsByUserAccess = (projects, tasks, userEmail, userPosition) => {
    // Se é cargo executivo com permissão total, retorna todos os projetos
    if (hasExecutivePermission(userPosition, 'canViewAllProjects')) {
        return projects;
    }

    // Para usuários normais, filtra apenas projetos onde:
    // 1. É responsável pelo projeto
    // 2. Tem tarefas atribuídas no projeto
    // 3. É participante do projeto
    return projects.filter(project => {
        // Verifica se é responsável pelo projeto
        if (project.responsible === userEmail) {
            return true;
        }

        // Verifica se é participante do projeto
        if (project.participants && project.participants.includes(userEmail)) {
            return true;
        }

        // Verifica se tem tarefas atribuídas no projeto
        const userTasks = tasks.filter(task => 
            task.project_id === project.id && task.assigned_to === userEmail
        );
        
        return userTasks.length > 0;
    });
};

// Função para filtrar tarefas baseado na posição do usuário
export const filterTasksByUserAccess = (tasks, userEmail, userPosition, projectResponsible = null) => {
    // Se é cargo executivo com permissão total, retorna todas as tarefas
    if (hasExecutivePermission(userPosition, 'canViewAllTasks')) {
        return tasks;
    }

    // Se é responsável pelo projeto, pode ver todas as tarefas do projeto
    if (projectResponsible === userEmail) {
        return tasks;
    }

    // Para usuários normais, filtra apenas tarefas atribuídas a eles
    return tasks.filter(task => task.assigned_to === userEmail);
};

// Função para verificar se o usuário pode editar um projeto
export const canEditProject = (project, userEmail, userPosition) => {
    // Cargos executivos podem editar todos os projetos
    if (hasExecutivePermission(userPosition, 'canEditAllProjects')) {
        return true;
    }

    // Usuários normais só podem editar projetos que são responsáveis
    return project.responsible === userEmail;
};

// Função para verificar se o usuário pode editar uma tarefa
export const canEditTask = (task, userEmail, userPosition, projectResponsible = null) => {
    // Cargos executivos podem editar todas as tarefas
    if (hasExecutivePermission(userPosition, 'canEditAllTasks')) {
        return true;
    }

    // Se é responsável pelo projeto, pode editar todas as tarefas do projeto
    if (projectResponsible === userEmail) {
        return true;
    }

    // Usuários normais só podem editar tarefas atribuídas a eles
    return task.assigned_to === userEmail;
};

// Função para verificar se o usuário pode deletar uma tarefa
export const canDeleteTask = (task, userEmail, userPosition, projectResponsible = null) => {
    // Cargos executivos podem deletar todas as tarefas
    if (hasExecutivePermission(userPosition, 'canEditAllTasks')) { // Using canEditAllTasks as a proxy for delete permission
        return true;
    }

    // Se é responsável pelo projeto, pode deletar todas as tarefas do projeto
    if (projectResponsible === userEmail) {
        return true;
    }

    // Usuários normais só podem deletar tarefas atribuídas a eles
    return task.assigned_to === userEmail;
};

// Hook para obter informações do usuário atual
export const useCurrentUser = () => {
    const [currentUser, setCurrentUser] = React.useState(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const loadCurrentUser = async () => {
            try {
                const user = await User.me();
                setCurrentUser(user);
            } catch (error) {
                console.error('Erro ao carregar usuário atual:', error);
            } finally {
                setLoading(false);
            }
        };
        loadCurrentUser();
    }, []);

    return { currentUser, loading };
};

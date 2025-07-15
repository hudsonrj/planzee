
import { Task, Project } from "@/api/entities";

/**
 * Obtém a data atual no formato ISO (YYYY-MM-DD)
 */
export const getCurrentDate = () => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Obtém uma data futura baseada em dias a partir de hoje
 * @param {number} daysFromNow - Número de dias a partir de hoje
 * @returns {string} Data no formato YYYY-MM-DD
 */
export const getFutureDate = (daysFromNow = 7) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

/**
 * Verifica se uma data está no passado
 * @param {string} dateString - Data no formato YYYY-MM-DD
 * @returns {boolean} True se a data for do passado
 */
export const isDateInPast = (dateString) => {
  if (!dateString) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateString < today;
};

/**
 * Ajusta uma data para o futuro APENAS se ela estiver no passado E for criação por IA
 * @param {string} dateString - Data original
 * @param {number} minDaysFromNow - Mínimo de dias a partir de hoje (padrão: 7)
 * @param {boolean} isAIGenerated - Se é geração por IA (padrão: true para compatibilidade)
 * @returns {string} Data ajustada
 */
export const adjustDateToFuture = (dateString, minDaysFromNow = 7, isAIGenerated = true) => {
  // Se não é geração por IA, mantém a data original
  if (!isAIGenerated) {
    return dateString;
  }
  
  // Se é geração por IA e a data está no passado, ajusta para o futuro
  if (!dateString || isDateInPast(dateString)) {
    return getFutureDate(minDaysFromNow);
  }
  return dateString;
};

/**
 * REMOVIDA - Não atualizar mais datas automaticamente
 * A função foi removida pois não queremos mais atualizar datas existentes
 */

/**
 * Atualiza o status de uma tarefa e, se bem-sucedido, recalcula o progresso do projeto associado.
 * @param {string} taskId - O ID da tarefa a ser atualizada.
 * @param {string} newStatus - O novo status da tarefa (ex: 'concluída', 'em andamento').
 * @returns {Promise<boolean>} True se a atualização e o recálculo forem bem-sucedidos, false caso contrário.
 */
export const updateTaskStatus = async (taskId, newStatus) => {
  if (!taskId || !newStatus) {
    console.warn("updateTaskStatus: taskId ou newStatus não fornecidos.");
    return false;
  }

  try {
    const task = await Task.findById(taskId); // Assumindo que Task.findById está disponível
    if (!task) {
      console.error(`Tarefa com ID ${taskId} não encontrada.`);
      return false;
    }

    // Atualiza o status da tarefa e a data de última modificação
    await Task.update(taskId, {
      status: newStatus,
      last_modified_date: getCurrentDate()
    });

    console.log(`Status da tarefa ${taskId} atualizado para '${newStatus}'.`);

    // Recalcula o progresso do projeto ao qual esta tarefa pertence
    await calculateAndUpdateProjectProgress(task.project_id);

    return true;
  } catch (error) {
    console.error(`Erro ao atualizar o status da tarefa ${taskId}:`, error);
    return false;
  }
};

/**
 * Calcula o progresso de um projeto com base em suas tarefas e atualiza a entidade Project.
 * @param {string} projectId - O ID do projeto.
 * @returns {Promise<number|undefined>} O progresso calculado ou undefined em caso de erro/nenhum progresso.
 */
export const calculateAndUpdateProjectProgress = async (projectId) => {
  if (!projectId) {
    console.warn("calculateAndUpdateProjectProgress: projectId não fornecido");
    return undefined;
  }

  try {
    // Buscar todas as tarefas do projeto
    const projectTasks = await Task.filter({ project_id: projectId });
    
    if (!projectTasks || projectTasks.length === 0) {
      console.log(`Nenhuma tarefa encontrada para o projeto ${projectId}`);
      return 0;
    }

    // Calcular progresso baseado em tarefas concluídas
    const completedTasks = projectTasks.filter(task => task.status === 'concluída' || task.status === 'done');
    const progressPercentage = Math.round((completedTasks.length / projectTasks.length) * 100);

    // Atualizar o progresso no projeto
    await Project.update(projectId, { 
      progress: progressPercentage,
      last_modified_date: getCurrentDate()
    });

    console.log(`Progresso do projeto ${projectId} atualizado para ${progressPercentage}%`);
    return progressPercentage;

  } catch (error) {
    console.error(`Erro ao calcular progresso do projeto ${projectId}:`, error);
    return undefined;
  }
};

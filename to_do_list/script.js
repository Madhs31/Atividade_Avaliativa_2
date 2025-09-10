document.addEventListener('DOMContentLoaded', function() {
// Elementos do DOM
const taskForm = document.getElementById('task-form');
const tasksContainer = document.getElementById('tasks-container');
const emptyState = document.getElementById('empty-state');
const categoryFilter = document.getElementById('category-filter');
const sortBy = document.getElementById('sort-by');
const themeToggle = document.getElementById('theme-toggle');
const clearCompletedBtn = document.getElementById('clear-completed');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notification-text');

// Contadores
const totalTasksEl = document.getElementById('total-tasks');
const pendingTasksEl = document.getElementById('pending-tasks');
const completedTasksEl = document.getElementById('completed-tasks');

// Array para armazenar as tarefas
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Inicializar a aplicação
function init() {
    renderTasks();
    updateTaskCounter();
    
    // Verificar preferência de tema salva
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.checked = true;
    }
}

// Mostrar notificação
function showNotification(message) {
    notificationText.textContent = message;
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Adicionar nova tarefa
taskForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const taskName = document.getElementById('task-name').value;
    const taskCategory = document.getElementById('task-category').value;
    const taskPriority = document.getElementById('task-priority').value;
    const taskDate = document.getElementById('task-date').value;
    
    if (!taskName || !taskCategory || !taskPriority || !taskDate) {
        showNotification('Por favor, preencha todos os campos.');
        return;
    }
    
    const newTask = {
        id: Date.now(),
        name: taskName,
        category: taskCategory,
        priority: taskPriority,
        date: taskDate,
        completed: false
    };
    
    tasks.push(newTask);
    saveTasks();
    renderTasks();
    updateTaskCounter();
    
    // Resetar o formulário
    taskForm.reset();
    
    showNotification('Tarefa adicionada com sucesso!');
});

// Filtragem e ordenação
categoryFilter.addEventListener('change', renderTasks);
sortBy.addEventListener('change', renderTasks);

// Limpar tarefas concluídas
clearCompletedBtn.addEventListener('click', function() {
    const completedCount = tasks.filter(task => task.completed).length;
    
    if (completedCount === 0) {
        showNotification('Não há tarefas concluídas para remover.');
        return;
    }
    
    if (confirm(`Deseja remover ${completedCount} tarefa(s) concluída(s)?`)) {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTaskCounter();
        showNotification('Tarefas concluídas removidas com sucesso!');
    }
});

// Alternar tema claro/escuro
themeToggle.addEventListener('change', function() {
    document.body.classList.toggle('dark-mode');
    const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
    localStorage.setItem('theme', theme);
});

// Salvar tarefas no localStorage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Renderizar as tarefas na tela
function renderTasks() {
    // Aplicar filtros
    let filteredTasks = [...tasks];
    
    // Filtrar por categoria
    const categoryValue = categoryFilter.value;
    if (categoryValue !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === categoryValue);
    }
    
    // Ordenar tarefas
    const sortValue = sortBy.value;
    if (sortValue === 'date') {
        filteredTasks.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortValue === 'priority') {
        const priorityOrder = { high: 1, medium: 2, low: 3 };
        filteredTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }
    
    // Limpar o container
    tasksContainer.innerHTML = '';
    
    // Verificar se há tarefas para exibir
    if (filteredTasks.length === 0) {
        tasksContainer.appendChild(emptyState);
        emptyState.style.display = 'block';
        return;
    }
    
    emptyState.style.display = 'none';
    
    // Criar os cards de tarefa
    filteredTasks.forEach(task => {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card priority-${task.priority} ${task.completed ? 'completed' : ''}`;
        
        // Formatar a data para exibição
        const formattedDate = new Date(task.date).toLocaleDateString('pt-BR');
        
        // Verificar se a tarefa está próxima do vencimento
        const today = new Date();
        const taskDate = new Date(task.date);
        const diffTime = taskDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 2 && diffDays >= 0 && !task.completed) {
            taskCard.classList.add('due-soon');
        }
        
        // Ícone de prioridade
        let priorityIcon = '';
        if (task.priority === 'high') {
            priorityIcon = '<span class="priority-indicator high-priority"></span> Alta';
        } else if (task.priority === 'medium') {
            priorityIcon = '<span class="priority-indicator medium-priority"></span> Média';
        } else {
            priorityIcon = '<span class="priority-indicator low-priority"></span> Baixa';
        }
        
        taskCard.innerHTML = `
            <h3 class="task-title">${task.name}</h3>
            <span class="task-category">${task.category}</span>
            <p class="task-date"><i class="far fa-calendar"></i> Data limite: ${formattedDate}</p>
            <p><i class="fas fa-signal"></i> Prioridade: ${priorityIcon}</p>
            <br>
            <div class="task-actions">
                <button class="btn-complete" data-id="${task.id}">
                    <i class="fas fa-${task.completed ? 'redo' : 'check'}"></i> ${task.completed ? 'Reabrir' : 'Concluir'}
                </button>
                <button class="btn-delete" data-id="${task.id}">
                    <i class="fas fa-trash"></i> Excluir
                </button>
            </div>
        `;
        
        tasksContainer.appendChild(taskCard);
    });
    
    // Adicionar event listeners aos botões
    document.querySelectorAll('.btn-complete').forEach(button => {
        button.addEventListener('click', function() {
            const taskId = parseInt(this.getAttribute('data-id'));
            toggleTaskCompletion(taskId);
        });
    });
    
    document.querySelectorAll('.btn-delete').forEach(button => {
        button.addEventListener('click', function() {
            const taskId = parseInt(this.getAttribute('data-id'));
            deleteTask(taskId);
        });
    });
}

// Alternar status de conclusão da tarefa
function toggleTaskCompletion(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasks();
    renderTasks();
    updateTaskCounter();
    
    const task = tasks.find(t => t.id === taskId);
    showNotification(`Tarefa "${task.name}" ${task.completed ? 'concluída' : 'reaberta'}!`);
}

// Excluir tarefa
function deleteTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    
    if (confirm(`Tem certeza que deseja excluir a tarefa "${task.name}"?`)) {
        tasks = tasks.filter(task => task.id !== taskId);
        saveTasks();
        renderTasks();
        updateTaskCounter();
        showNotification('Tarefa excluída com sucesso!');
    }
}

// Atualizar contador de tarefas
function updateTaskCounter() {
const totalTasks = tasks.length;
const completedTasks = tasks.filter(task => task.completed).length;
const pendingTasks = totalTasks - completedTasks;
    
totalTasksEl.textContent = totalTasks;
pendingTasksEl.textContent = pendingTasks;
completedTasksEl.textContent = completedTasks;
}

// Inicializar a aplicação
init();
});
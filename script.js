const STORAGE_KEY = "taskPlannerTasks";
const THEME_STORAGE_KEY = "taskPlannerTheme";

const elements = {
  form: document.getElementById("task-form"),
  input: document.getElementById("task-input"),
  list: document.getElementById("task-list"),
  counter: document.getElementById("task-counter"),
  clearCompleted: document.getElementById("clear-completed"),
  emptyState: document.getElementById("empty-state"),
  filterButtons: document.querySelectorAll(".filter-button"),
  themeToggle: document.getElementById("theme-toggle"),
  themeToggleText: document.querySelector(".theme-toggle__text"),
  themeToggleIcon: document.querySelector(".theme-toggle__icon"),
};

const state = {
  tasks: loadTasks(),
  filter: "all",
  theme: loadTheme(),
};

initializeApp();

function initializeApp() {
  applyTheme();
  renderTasks();
  bindEvents();
}

function bindEvents() {
  // Подписываемся на отправку формы для добавления задачи
  elements.form.addEventListener("submit", handleAddTask);

  // Используем делегирование событий для действий внутри списка
  elements.list.addEventListener("click", handleTaskListClick);
  elements.list.addEventListener("change", handleTaskListChange);

  // Очищаем только завершённые задачи
  elements.clearCompleted.addEventListener("click", clearCompletedTasks);

  // Переключаем активный фильтр списка задач
  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  // Сохраняем выбранную тему оформления
  elements.themeToggle.addEventListener("click", toggleTheme);
}

function handleAddTask(event) {
  event.preventDefault();

  const title = elements.input.value.trim();

  if (!title) {
    elements.input.focus();
    return;
  }

  const newTask = {
    id: Date.now().toString(),
    title,
    completed: false,
  };

  state.tasks.unshift(newTask);
  saveTasks();
  renderTasks();
  elements.form.reset();
  elements.input.focus();
}

function handleTaskListClick(event) {
  const deleteButton = event.target.closest("[data-action='delete']");

  if (!deleteButton) {
    return;
  }

  const { id } = deleteButton.dataset;
  deleteTask(id);
}

function handleTaskListChange(event) {
  const checkbox = event.target.closest("[data-action='toggle']");

  if (!checkbox) {
    return;
  }

  const { id } = checkbox.dataset;
  toggleTask(id);
}

function setFilter(filter) {
  state.filter = filter;

  elements.filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  renderTasks();
}

function toggleTask(taskId) {
  state.tasks = state.tasks.map((task) =>
    task.id === taskId ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  renderTasks();
}

function deleteTask(taskId) {
  state.tasks = state.tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function clearCompletedTasks() {
  state.tasks = state.tasks.filter((task) => !task.completed);
  saveTasks();
  renderTasks();
}

function getFilteredTasks() {
  switch (state.filter) {
    case "active":
      return state.tasks.filter((task) => !task.completed);
    case "completed":
      return state.tasks.filter((task) => task.completed);
    default:
      return state.tasks;
  }
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  elements.list.innerHTML = filteredTasks
    .map((task) => createTaskTemplate(task))
    .join("");

  const activeTasksCount = state.tasks.filter((task) => !task.completed).length;
  elements.counter.textContent = `${activeTasksCount} task${activeTasksCount === 1 ? "" : "s"} left`;

  const isEmpty = filteredTasks.length === 0;
  elements.emptyState.classList.toggle("is-hidden", !isEmpty);
  elements.emptyState.textContent = getEmptyStateMessage();
}

function toggleTheme() {
  state.theme = state.theme === "dark" ? "light" : "dark";
  saveTheme();
  applyTheme();
}

function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);

  const isDarkTheme = state.theme === "dark";
  elements.themeToggleText.textContent = isDarkTheme ? "Dark" : "Light";
  elements.themeToggleIcon.innerHTML = isDarkTheme ? "&#9790;" : "&#9728;";
  elements.themeToggle.setAttribute(
    "aria-label",
    isDarkTheme ? "Switch to light theme" : "Switch to dark theme"
  );
}

function createTaskTemplate(task) {
  const checkedAttribute = task.completed ? "checked" : "";
  const completedClass = task.completed ? "is-completed" : "";
  const safeTitle = escapeHtml(task.title);

  return `
    <li class="task-item ${completedClass}">
      <input
        class="task-checkbox"
        type="checkbox"
        ${checkedAttribute}
        data-action="toggle"
        data-id="${task.id}"
        aria-label="Mark task as completed"
      >
      <p class="task-title">${safeTitle}</p>
      <button
        class="task-delete"
        type="button"
        data-action="delete"
        data-id="${task.id}"
        aria-label="Delete task"
      >
        &times;
      </button>
    </li>
  `;
}

function getEmptyStateMessage() {
  if (state.tasks.length === 0) {
    return "No tasks yet. Add the first one to get started.";
  }

  if (state.filter === "active") {
    return "There are no active tasks right now.";
  }

  if (state.filter === "completed") {
    return "Completed tasks will appear here.";
  }

  return "No tasks match the selected filter.";
}

function loadTasks() {
  try {
    const savedTasks = localStorage.getItem(STORAGE_KEY);
    return savedTasks ? JSON.parse(savedTasks) : [];
  } catch (error) {
    console.error("Failed to load tasks from localStorage:", error);
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.tasks));
}

function loadTheme() {
  const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
  return savedTheme === "dark" ? "dark" : "light";
}

function saveTheme() {
  localStorage.setItem(THEME_STORAGE_KEY, state.theme);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

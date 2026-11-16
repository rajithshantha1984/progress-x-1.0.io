(() => {
  "use strict";

  const STORAGE_KEY = "progress-x-1.0-tasks";
  const form = document.getElementById("taskForm");
  const input = document.getElementById("taskInput");
  const taskList = document.getElementById("taskList");
  const emptyState = document.getElementById("emptyState");
  const clearCompletedBtn = document.getElementById("clearCompletedBtn");
  const totalTasksEl = document.getElementById("totalTasks");
  const completedTasksEl = document.getElementById("completedTasks");
  const remainingTasksEl = document.getElementById("remainingTasks");
  const progressPercentEl = document.getElementById("progressPercent");
  const progressRing = document.getElementById("progressRing");
  const progressFill = document.getElementById("progressFill");
  const progressCaption = document.getElementById("progressCaption");
  const progressTrack = document.querySelector(".progress-track");
  const taskCountLabel = document.getElementById("taskCountLabel");
  const toast = document.getElementById("toast");

  let tasks = loadTasks();
  let toastTimeout;

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(saved)) return [];
      return saved.filter(task =>
        task && typeof task.id === "string" &&
        typeof task.text === "string" &&
        typeof task.completed === "boolean"
      );
    } catch (error) {
      return [];
    }
  }

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
      showToast("Could not save tasks in this browser.");
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove("show"), 2300);
  }

  function makeTask(text) {
    return {
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() :
        `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      text,
      completed: false,
      createdAt: new Date().toISOString()
    };
  }

  function addTask(text) {
    const cleanText = text.trim();
    if (!cleanText) {
      showToast("Please enter a task first.");
      input.focus();
      return;
    }
    tasks.unshift(makeTask(cleanText));
    saveTasks();
    render();
    input.value = "";
    input.focus();
    showToast("Task added successfully.");
  }

  function toggleTask(id) {
    tasks = tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
    saveTasks();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(task => task.id !== id);
    saveTasks();
    render();
    showToast("Task deleted.");
  }

  function clearCompleted() {
    const completedCount = tasks.filter(task => task.completed).length;
    if (!completedCount) return;
    tasks = tasks.filter(task => !task.completed);
    saveTasks();
    render();
    showToast(`${completedCount} completed task${completedCount === 1 ? "" : "s"} cleared.`);
  }

  function formatDate(iso) {
    if (!iso) return "Task";
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return "Task";
    return `Added ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }

  function renderTasks() {
    taskList.replaceChildren();
    tasks.forEach(task => {
      const row = document.createElement("div");
      row.className = `task-item${task.completed ? " is-complete" : ""}`;

      const check = document.createElement("button");
      check.type = "button";
      check.className = "task-check";
      check.setAttribute("aria-label", task.completed ? `Mark ${task.text} as incomplete` : `Complete ${task.text}`);
      check.setAttribute("aria-pressed", String(task.completed));
      check.textContent = task.completed ? "✓" : "";
      check.addEventListener("click", () => toggleTask(task.id));

      const content = document.createElement("div");
      content.className = "task-text";
      const title = document.createElement("div");
      title.textContent = task.text;
      const date = document.createElement("span");
      date.className = "task-date";
      date.textContent = formatDate(task.createdAt);
      content.append(title, date);

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "delete-button";
      remove.setAttribute("aria-label", `Delete ${task.text}`);
      remove.title = "Delete task";
      remove.textContent = "×";
      remove.addEventListener("click", () => deleteTask(task.id));

      row.append(check, content, remove);
      taskList.append(row);
    });
    emptyState.hidden = tasks.length > 0;
    clearCompletedBtn.hidden = !tasks.some(task => task.completed);
    taskCountLabel.textContent = `(${tasks.length})`;
  }

  function renderStats() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const remaining = total - completed;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    totalTasksEl.textContent = total;
    completedTasksEl.textContent = completed;
    remainingTasksEl.textContent = remaining;
    progressPercentEl.textContent = `${percent}%`;
    progressFill.style.width = `${percent}%`;
    progressRing.style.background = `conic-gradient(var(--green) ${percent * 3.6}deg, #263b57 ${percent * 3.6}deg)`;
    progressRing.setAttribute("aria-label", `${percent} percent complete`);
    progressCaption.textContent = `${completed} of ${total} tasks`;
    progressTrack.setAttribute("aria-valuenow", String(percent));
  }

  function render() {
    renderStats();
    renderTasks();
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    addTask(input.value);
  });
  clearCompletedBtn.addEventListener("click", clearCompleted);

  render();
})();
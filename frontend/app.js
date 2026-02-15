const apiBase = "http://127.0.0.1:8080";

const defaultMembers = [
  { id: "m1", name: "Ana", role: "Responsável" },
  { id: "m2", name: "Pedro", role: "Responsável" },
  { id: "m3", name: "Lia", role: "Filho(a)" },
];

const defaultTasks = [
  {
    id: "t1",
    title: "Organizar brinquedos",
    category: "Organização",
    ownerId: "m3",
    frequency: "Diária",
    completed: true,
  },
  {
    id: "t2",
    title: "Preparar o jantar",
    category: "Cozinha",
    ownerId: "m2",
    frequency: "Diária",
    completed: false,
  },
  {
    id: "t3",
    title: "Limpar banheiro",
    category: "Limpeza",
    ownerId: "m1",
    frequency: "Semanal",
    completed: false,
  },
];

const state = {
  members: [...defaultMembers],
  tasks: [...defaultTasks],
  apiOnline: false,
};

const memberForm = document.getElementById("member-form");
const taskForm = document.getElementById("task-form");
const memberList = document.getElementById("member-list");
const taskOwnerSelect = document.getElementById("task-owner");
const taskList = document.getElementById("task-list");
const statsGrid = document.getElementById("stats-grid");
const categorySummary = document.getElementById("category-summary");
const rankingList = document.getElementById("ranking-list");
const apiStatus = document.getElementById("api-status");

const createId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const getSafeFieldValue = (formData, key) => {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
};

const createMetaChip = (label, value) => {
  const chip = document.createElement("span");
  chip.textContent = `${label}: ${value}`;
  return chip;
};

const fetchJSON = async (path) => {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) {
    throw new Error(`Falha em ${path}`);
  }
  return response.json();
};

const loadFromApi = async () => {
  try {
    const [members, tasks] = await Promise.all([
      fetchJSON("/api/members"),
      fetchJSON("/api/tasks"),
    ]);

    if (Array.isArray(members) && Array.isArray(tasks)) {
      state.members = members;
      state.tasks = tasks;
      state.apiOnline = true;
      apiStatus.textContent = "Status da API: conectada em /api/*";
    }
  } catch {
    state.apiOnline = false;
    apiStatus.textContent = "Status da API: offline (modo local de demonstração)";
  }
};

const renderMembers = () => {
  memberList.innerHTML = "";
  taskOwnerSelect.innerHTML = "";

  if (!state.members.length) {
    const emptyOption = document.createElement("option");
    emptyOption.value = "";
    emptyOption.textContent = "Cadastre um familiar primeiro";
    taskOwnerSelect.appendChild(emptyOption);
    taskOwnerSelect.disabled = true;
    return;
  }

  taskOwnerSelect.disabled = false;

  state.members.forEach((member) => {
    const pill = document.createElement("li");
    pill.className = "pill";
    pill.textContent = `${member.name} · ${member.role}`;
    memberList.appendChild(pill);

    const option = document.createElement("option");
    option.value = member.id;
    option.textContent = `${member.name} (${member.role})`;
    taskOwnerSelect.appendChild(option);
  });
};

const renderTasks = () => {
  taskList.innerHTML = "";

  if (!state.tasks.length) {
    taskList.innerHTML = '<p class="muted">Nenhuma tarefa cadastrada.</p>';
    return;
  }

  state.tasks.forEach((task) => {
    const owner = state.members.find((member) => member.id === task.ownerId);
    const card = document.createElement("article");
    card.className = "task-card";

    const title = document.createElement("strong");
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.appendChild(createMetaChip("Categoria", task.category));
    meta.appendChild(createMetaChip("Frequência", task.frequency));
    meta.appendChild(createMetaChip("Responsável", owner?.name ?? "Não atribuído"));

    card.appendChild(title);
    card.appendChild(meta);

    if (task.completed) {
      const doneTag = document.createElement("span");
      doneTag.className = "pill";
      doneTag.textContent = "Concluída";
      card.appendChild(doneTag);
    } else {
      const doneButton = document.createElement("button");
      doneButton.type = "button";
      doneButton.textContent = "Marcar como concluída";
      doneButton.addEventListener("click", () => {
        task.completed = true;
        render();
      });
      card.appendChild(doneButton);
    }

    taskList.appendChild(card);
  });
};

const renderStats = () => {
  statsGrid.innerHTML = "";
  categorySummary.innerHTML = "";

  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter((task) => task.completed).length;
  const completionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  state.members.forEach((member) => {
    const memberTasks = state.tasks.filter((task) => task.ownerId === member.id);
    const memberCompleted = memberTasks.filter((task) => task.completed).length;
    const memberRate = memberTasks.length
      ? Math.round((memberCompleted / memberTasks.length) * 100)
      : 0;

    const card = document.createElement("div");
    card.className = "stat-card";

    const memberName = document.createElement("strong");
    memberName.textContent = member.name;

    const memberRole = document.createElement("span");
    memberRole.className = "muted";
    memberRole.textContent = member.role;

    const value = document.createElement("span");
    value.className = "stat-value";
    value.textContent = `${memberCompleted}/${memberTasks.length}`;

    const rateLabel = document.createElement("span");
    rateLabel.className = "muted";
    rateLabel.textContent = `Taxa de conclusão: ${memberRate}%`;

    const progressBar = document.createElement("div");
    progressBar.className = "progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "progress-fill";
    progressFill.style.width = `${memberRate}%`;

    progressBar.appendChild(progressFill);
    card.append(memberName, memberRole, value, rateLabel, progressBar);
    statsGrid.appendChild(card);
  });

  const categoryMap = state.tasks.reduce((acc, task) => {
    acc[task.category] = acc[task.category] ?? { total: 0, completed: 0 };
    acc[task.category].total += 1;
    if (task.completed) {
      acc[task.category].completed += 1;
    }
    return acc;
  }, {});

  const totalRow = document.createElement("div");
  totalRow.className = "category-row";
  totalRow.innerHTML = `<strong>Total de tarefas</strong><strong>${completedTasks}/${totalTasks} (${completionRate}%)</strong>`;
  categorySummary.appendChild(totalRow);

  Object.entries(categoryMap).forEach(([category, data]) => {
    const row = document.createElement("div");
    row.className = "category-row";
    const rate = data.total ? Math.round((data.completed / data.total) * 100) : 0;

    const categoryName = document.createElement("span");
    categoryName.textContent = category;

    const categoryRate = document.createElement("span");
    categoryRate.textContent = `${data.completed}/${data.total} (${rate}%)`;

    row.append(categoryName, categoryRate);
    categorySummary.appendChild(row);
  });
};

const renderRanking = () => {
  rankingList.innerHTML = "";

  const ranking = state.members
    .map((member) => {
      const memberTasks = state.tasks.filter((task) => task.ownerId === member.id);
      const completed = memberTasks.filter((task) => task.completed).length;
      const rate = memberTasks.length ? Math.round((completed / memberTasks.length) * 100) : 0;
      return { ...member, completed, total: memberTasks.length, rate };
    })
    .sort((a, b) => b.completed - a.completed || b.rate - a.rate);

  ranking.forEach((member, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}º ${member.name} — ${member.completed}/${member.total} tarefas (${member.rate}%)`;
    rankingList.appendChild(item);
  });
};

const render = () => {
  renderMembers();
  renderTasks();
  renderStats();
  renderRanking();
};

memberForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(memberForm);
  const name = getSafeFieldValue(formData, "memberName");
  const role = getSafeFieldValue(formData, "memberRole") || "Outro";

  if (!name) {
    return;
  }

  state.members.push({
    id: createId("member"),
    name,
    role,
  });

  memberForm.reset();
  render();
});

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!state.members.length) {
    return;
  }

  const formData = new FormData(taskForm);
  const title = getSafeFieldValue(formData, "taskTitle");

  if (!title) {
    return;
  }

  state.tasks.unshift({
    id: createId("task"),
    title,
    category: getSafeFieldValue(formData, "taskCategory") || "Outros",
    ownerId: getSafeFieldValue(formData, "taskOwner"),
    frequency: getSafeFieldValue(formData, "taskFrequency") || "Diária",
    completed: false,
  });

  taskForm.reset();
  render();
});

(async () => {
  await loadFromApi();
  render();
})();

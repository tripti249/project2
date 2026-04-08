(function initializeSharedPageShell() {
  const navRight = document.querySelector(".p-nav-right");
  if (!navRight) return;

  const pageKey = document.body.dataset.page || "pages";
  const token = localStorage.getItem("adc_token");
  const user = JSON.parse(localStorage.getItem("adc_user") || "{}");
  const avatarUrl = localStorage.getItem("adc_avatar");
  const shortcutKey = "adc_dashboard_shortcut";

  const pageMetaMap = {
    about: {
      title: "About AapkaDINACHARYA",
      copy: "Explore the story, mission, feedback flow, and contact points behind the product."
    },
    learn: {
      title: "Learn and Grow",
      copy: "Browse guides, tutorials, and productivity explainers that connect directly to the main app."
    },
    gallery: {
      title: "Feature Gallery",
      copy: "Preview the visual system, motion, AI assistant, profile tools, and core dashboard screens."
    }
  };

  const pageMeta = pageMetaMap[pageKey] || {
    title: "Project Command Center",
    copy: "Move across the product with the same upgraded dashboard language and quick actions."
  };

  function formatMemberSince(dateValue) {
    if (!dateValue) return "Theme synced with the updated dashboard.";
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return "Theme synced with the updated dashboard.";
    return `Member since ${date.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`;
  }

  function getInitial(name) {
    return (name || "A").trim().charAt(0).toUpperCase();
  }

  function currentPathName() {
    return window.location.pathname.replace(/\/+$/, "") || "/";
  }

  function pathMatches(target) {
    const current = currentPathName();
    const normalizedTarget = target.replace(/\/+$/, "") || "/";
    return current === normalizedTarget || current === `${normalizedTarget}.html`;
  }

  function showShellToast(message, tone) {
    let toast = document.getElementById("p-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "p-toast";
      toast.className = "p-toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = `p-toast show ${tone || ""}`.trim();
    clearTimeout(showShellToast._timer);
    showShellToast._timer = setTimeout(() => {
      toast.className = "p-toast";
    }, 2400);
  }

  function goTo(url, samePageMessage) {
    if (pathMatches(url)) {
      closeProfile();
      if (samePageMessage) showShellToast(samePageMessage);
      return Promise.resolve();
    }

    window.location.assign(url);
    return Promise.resolve();
  }

  function routeToDashboard(shortcut, message) {
    if (shortcut) localStorage.setItem(shortcutKey, shortcut);
    window.location.assign("/");
    if (message) showShellToast(message);
    return Promise.resolve();
  }

  const panelMarkup = `
    <div id="profile-overlay" class="profile-overlay" aria-hidden="true"></div>
    <aside id="profile-panel" class="profile-panel" role="complementary" aria-label="Project command center">
      <div class="pp-topbar">
        <h2 class="pp-heading">Command Center</h2>
        <button id="close-profile-btn" class="pp-close-btn" type="button" aria-label="Close command center">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="pp-hero">
        <div class="pp-avatar-wrap pp-avatar-wrap-static">
          <div class="pp-avatar" id="pp-avatar">${getInitial(user.name)}</div>
          <div class="pp-avatar-ring"></div>
        </div>
        <h3 class="pp-name" id="pp-name">${user.name || "Guest Preview"}</h3>
        <p class="pp-email" id="pp-email">${user.email || "Open the app to unlock full workspace controls."}</p>
        <p class="pp-since" id="pp-since">${formatMemberSince(user.createdAt)}</p>
        <p class="pp-hero-note">${pageMeta.title}</p>
      </div>

      <div class="pp-stats-row">
        <div class="pp-stat-card">
          <span class="pp-stat-num" id="pp-total">0</span>
          <span class="pp-stat-lbl">Total</span>
        </div>
        <div class="pp-stat-card green">
          <span class="pp-stat-num" id="pp-done">0</span>
          <span class="pp-stat-lbl">Done</span>
        </div>
        <div class="pp-stat-card blue">
          <span class="pp-stat-num" id="pp-active">0</span>
          <span class="pp-stat-lbl">Active</span>
        </div>
        <div class="pp-stat-card red">
          <span class="pp-stat-num" id="pp-overdue">0</span>
          <span class="pp-stat-lbl">Overdue</span>
        </div>
      </div>

      <div class="pp-progress-wrap">
        <div class="pp-progress-label">
          <span>Completion Rate</span>
          <span class="pp-progress-pct" id="pp-pct">0%</span>
        </div>
        <div class="pp-progress-bar">
          <div class="pp-progress-fill" id="pp-fill"></div>
        </div>
      </div>

      <div id="react-profile-tools"></div>

      <div class="pp-section">
        <h4 class="pp-section-title">Page Focus</h4>
        <div class="pp-page-card">
          <div class="pp-page-kicker">Current surface</div>
          <div class="pp-page-title">${pageMeta.title}</div>
          <p class="pp-page-copy">${pageMeta.copy}</p>
        </div>
      </div>

      <div class="pp-section pp-page-actions">
        <button id="pp-open-app-btn" class="pp-btn-primary" type="button">Open Dashboard</button>
        <button id="pp-auth-btn" class="pp-btn-secondary" type="button">${token ? "Manage Account" : "Sign In / Sign Up"}</button>
      </div>
    </aside>
  `;

  document.body.insertAdjacentHTML("afterbegin", panelMarkup);

  const navUserButton = document.createElement("button");
  navUserButton.type = "button";
  navUserButton.id = "open-profile-btn";
  navUserButton.className = "p-nav-user-btn";
  navUserButton.setAttribute("aria-label", "Open project command center");
  navUserButton.innerHTML = `
    <div class="user-avatar" id="page-user-avatar">${getInitial(user.name)}</div>
    <div class="user-info">
      <span class="user-name" id="page-user-name">${user.name || "Guest Preview"}</span>
      <span class="user-email" id="page-user-email">${user.email || "Open command center"}</span>
    </div>
    <svg class="nav-chevron" viewBox="0 0 20 20" fill="none" width="14" stroke="currentColor" stroke-width="2.2">
      <polyline points="5 8 10 13 15 8"></polyline>
    </svg>
  `;
  navRight.insertAdjacentElement("afterbegin", navUserButton);

  const profilePanel = document.getElementById("profile-panel");
  const profileOverlay = document.getElementById("profile-overlay");
  const closeProfileBtn = document.getElementById("close-profile-btn");
  const ppAvatar = document.getElementById("pp-avatar");
  const pageUserAvatar = document.getElementById("page-user-avatar");
  const ppOpenAppBtn = document.getElementById("pp-open-app-btn");
  const ppAuthBtn = document.getElementById("pp-auth-btn");

  function applyAvatar(target, fallback) {
    if (!target) return;

    if (avatarUrl) {
      target.innerHTML = `<img src="${avatarUrl}" alt="Profile" class="pp-avatar-image">`;
      target.style.fontSize = "0";
      return;
    }

    target.textContent = fallback;
    target.style.fontSize = "";
  }

  applyAvatar(ppAvatar, getInitial(user.name));
  applyAvatar(pageUserAvatar, getInitial(user.name));

  function openProfile() {
    profilePanel.classList.add("open");
    profileOverlay.classList.add("active");
    document.body.classList.add("profile-open");
  }

  function closeProfile() {
    profilePanel.classList.remove("open");
    profileOverlay.classList.remove("active");
    document.body.classList.remove("profile-open");
  }

  navUserButton.addEventListener("click", openProfile);
  closeProfileBtn.addEventListener("click", closeProfile);
  profileOverlay.addEventListener("click", closeProfile);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeProfile();
  });

  ppOpenAppBtn.addEventListener("click", () => goTo("/", "Dashboard is already open."));
  ppAuthBtn.addEventListener("click", () => {
    if (token) {
      routeToDashboard("openProfile");
      return;
    }
    goTo("/auth", "Auth page is already open.");
  });

  async function loadStats() {
    if (!token) return;

    try {
      const response = await fetch("/api/todos", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) return;
      const data = await response.json();
      const todos = Array.isArray(data.todos) ? data.todos : [];
      const today = new Date().toISOString().split("T")[0];
      const total = todos.length;
      const done = todos.filter((todo) => todo.completed).length;
      const active = total - done;
      const overdue = todos.filter((todo) => !todo.completed && todo.endDate && todo.endDate < today).length;
      const pct = total === 0 ? 0 : Math.round((done / total) * 100);

      document.getElementById("pp-total").textContent = total;
      document.getElementById("pp-done").textContent = done;
      document.getElementById("pp-active").textContent = active;
      document.getElementById("pp-overdue").textContent = overdue;
      document.getElementById("pp-pct").textContent = `${pct}%`;
      document.getElementById("pp-fill").style.width = `${pct}%`;
    } catch (error) {
      console.error("Page shell stats load failed:", error);
    }
  }

  loadStats();

  window.ADC_shellMode = "pages";
  window.ADC_actions = {
    openProfilePanel: openProfile,
    closeProfilePanel: closeProfile,
    openNotesPanel: () => routeToDashboard("openNotes"),
    openChatPanel: () => routeToDashboard("openChat"),
    openAccountPanel: () => routeToDashboard("openProfile"),
    scrollToTaskComposer: () => routeToDashboard("scrollComposer"),
    clearCompletedTasks: () => routeToDashboard("clearCompleted"),
    toggleFocusMode: () => routeToDashboard("toggleFocus"),
    setTaskFilter: (value) => routeToDashboard(`filter:${value}`),
    workflowPlan: () => routeToDashboard("workflowPlan"),
    workflowReview: () => routeToDashboard("workflowReview"),
    workflowRecover: () => routeToDashboard("workflowRecover"),
    workflowStudy: () => routeToDashboard("workflowStudy"),
    workflowCareer: () => routeToDashboard("workflowCareer"),
    workflowWeekly: () => routeToDashboard("workflowWeekly"),
    toggleSpeakers: () => routeToDashboard("toggleSpeakers"),
    exportTasksAsJson: () => routeToDashboard("exportTasks"),
    triggerParty: (type) => routeToDashboard(`triggerParty:${type || "success"}`),
    goLearnPage: () => goTo("/learn", "You are already on Learn."),
    goGalleryPage: () => goTo("/gallery", "You are already on Gallery."),
    goAboutPage: () => goTo("/about", "You are already on About.")
  };
})();

/**
 * Side Panel Logic for EchoToDo
 */

document.addEventListener('DOMContentLoaded', async () => {
  console.log("EchoToDo: Side Panel script loaded.");

  // --- DOM Elements ---
  const micBtn = document.getElementById('mic-btn');
  const iconMic = document.getElementById('icon-mic');
  const iconStop = document.getElementById('icon-stop');
  const statusText = document.getElementById('status-text');
  const transcriptPreview = document.getElementById('transcript-preview');
  const domainTag = document.getElementById('current-domain');
  const taskList = document.getElementById('task-list');
  const emptyState = document.getElementById('empty-state');
  
  const totalTasksLabel = document.getElementById('total-tasks');
  const completedTasksLabel = document.getElementById('completed-tasks');
  const completionPercentLabel = document.getElementById('completion-percent');
  const progressCircle = document.getElementById('progress-circle');
  
  const taskSearch = document.getElementById('task-search');
  const filterBtns = document.querySelectorAll('.filter-btn');
  
  const addManualBtn = document.getElementById('add-manual');
  const exportJsonBtn = document.getElementById('export-json');
  
  const manualModal = document.getElementById('manual-modal');
  const manualInput = document.getElementById('manual-input');
  const saveManualBtn = document.getElementById('save-manual');
  const cancelManualBtn = document.getElementById('cancel-manual');

  const editModal = document.getElementById('edit-modal');
  const editInput = document.getElementById('edit-input');
  const saveEditBtn = document.getElementById('save-edit');
  const cancelEditBtn = document.getElementById('cancel-edit');

  // --- State ---
  let currentDomain = "general";
  let tasks = [];
  let currentFilter = "all";
  let searchTerms = "";
  let lastError = null;
  let editingTaskId = null;

  // --- Initialization ---
  async function init() {
    const data = await chrome.storage.local.get(['onboardingCompleted']);
    
    if (data.onboardingCompleted !== true) {
      if (statusText) {
        statusText.innerHTML = `Welcome! <a href="#" id="start-onboarding" style="color:var(--primary);text-decoration:underline;">Please complete setup</a>`;
        const onboardingBtn = document.getElementById('start-onboarding');
        if (onboardingBtn) {
          onboardingBtn.addEventListener('click', (e) => {
            e.preventDefault();
            chrome.tabs.create({ url: "onboarding/index.html" });
          });
        }
      }
      if (micBtn) {
        micBtn.style.opacity = "0.5";
        micBtn.style.cursor = "not-allowed";
      }
      registerEventListeners();
      return;
    }

    if (window.StorageModule) {
      currentDomain = await window.StorageModule.getCurrentDomain();
      if (domainTag) domainTag.textContent = currentDomain;
      tasks = await window.StorageModule.getTasks(currentDomain);
    }
    
    if (window.SpeechModule) {
      window.SpeechModule.init(
        handleSpeechResult,
        handleSpeechEnd,
        handleSpeechError
      );
    }
    
    renderTasks();
    updateStats();
    registerEventListeners();
    initTimer();

    // Listen for tab activation to refresh domain context
    chrome.tabs.onActivated.addListener(async () => {
      if (window.StorageModule) {
        currentDomain = await window.StorageModule.getCurrentDomain();
        if (domainTag) domainTag.textContent = currentDomain;
        tasks = await window.StorageModule.getTasks(currentDomain);
        renderTasks();
        updateStats();
      }
    });

    // Listen for tab navigation status to refresh domain context dynamically
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.active) {
        if (window.StorageModule) {
          currentDomain = await window.StorageModule.getCurrentDomain();
          if (domainTag) domainTag.textContent = currentDomain;
          tasks = await window.StorageModule.getTasks(currentDomain);
          renderTasks();
          updateStats();
        }
      }
    });
  }

  function registerEventListeners() {
    if (micBtn && !micBtn.dataset.listener) {
      micBtn.addEventListener('click', toggleRecording);
      micBtn.dataset.listener = "true";
    }
    if (statusText && !statusText.dataset.listener) {
      statusText.addEventListener('click', toggleRecording);
      statusText.dataset.listener = "true";
    }

    if (taskSearch) {
      taskSearch.addEventListener('input', (e) => {
        searchTerms = e.target.value.toLowerCase();
        renderTasks();
      });
    }
    
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderTasks();
      });
    });
    
    if (addManualBtn) addManualBtn.addEventListener('click', () => manualModal && manualModal.classList.remove('hidden'));
    if (cancelManualBtn) cancelManualBtn.addEventListener('click', () => manualModal && manualModal.classList.add('hidden'));
    if (saveManualBtn) saveManualBtn.addEventListener('click', handleManualAdd);
    
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => {
      if (editModal) editModal.classList.add('hidden');
      editingTaskId = null;
    });
    if (saveEditBtn) saveEditBtn.addEventListener('click', handleSaveEdit);

    if (exportJsonBtn) exportJsonBtn.addEventListener('click', () => window.StorageModule && window.StorageModule.exportData());
  }

  function toggleRecording() {
    if (!window.SpeechModule) return;
    
    if (window.SpeechModule.isRecording) {
      window.SpeechModule.stop();
    } else {
      lastError = null;
      window.SpeechModule.start();
      if (micBtn) micBtn.classList.add('recording');
      if (iconMic) iconMic.classList.add('hidden');
      if (iconStop) iconStop.classList.remove('hidden');
      if (statusText) statusText.textContent = "Listening...";
      if (transcriptPreview) {
        transcriptPreview.classList.remove('hidden');
        transcriptPreview.textContent = "";
      }
    }
  }

  function handleSpeechResult(final, interim) {
    if (transcriptPreview) {
      const text = (final + " " + interim).trim();
      if (text) {
        transcriptPreview.textContent = text;
        transcriptPreview.style.color = interim ? "var(--ink-muted)" : "white";
      } else {
        transcriptPreview.textContent = "Listening... (please speak now)";
      }
    }
  }

  function handleSpeechEnd(finalText) {
    if (micBtn) micBtn.classList.remove('recording');
    if (iconMic) iconMic.classList.remove('hidden');
    if (iconStop) iconStop.classList.add('hidden');
    
    if (!lastError && statusText) {
      statusText.textContent = "Tap to speak tasks";
    }
    
    if (finalText && window.TaskProcessor) {
      const newTasks = window.TaskProcessor.process(finalText);
      if (newTasks && newTasks.length > 0) {
        tasks = [...newTasks, ...tasks];
        saveAndRender();
      }
    }
    
    if (transcriptPreview) {
      transcriptPreview.textContent = "";
      transcriptPreview.classList.add('hidden');
    }
  }

  function handleSpeechError(error) {
    if (micBtn) micBtn.classList.remove('recording');
    if (iconMic) iconMic.classList.remove('hidden');
    if (iconStop) iconStop.classList.add('hidden');
    lastError = error;
    
    if (error === 'not-allowed') {
      if (statusText) {
        statusText.innerHTML = `Mic access denied. <a href="#" id="open-settings" style="color:var(--primary);text-decoration:underline;">Click to fix</a>`;
        const link = document.getElementById('open-settings');
        if (link) link.addEventListener('click', (e) => { e.preventDefault(); chrome.runtime.openOptionsPage(); });
      }
    } else if (statusText) {
      statusText.textContent = "Error: " + error;
    }
  }

  function handleManualAdd() {
    if (!manualInput) return;
    const text = manualInput.value.trim();
    if (text && window.TaskProcessor) {
      const newTasks = window.TaskProcessor.process(text);
      if (newTasks && newTasks.length > 0) {
        tasks = [...newTasks, ...tasks];
        saveAndRender();
        manualInput.value = "";
        if (manualModal) manualModal.classList.add('hidden');
      }
    }
  }

  async function saveAndRender() {
    if (window.StorageModule) {
      await window.StorageModule.saveTasks(currentDomain, tasks);
    }
    renderTasks();
    updateStats();
  }

  function toggleTask(id) {
    tasks = tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    saveAndRender();
  }

  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveAndRender();
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
      tag => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        "'": '&#39;',
        '"': '&quot;'
      }[tag] || tag)
    );
  }

  function renderTasks() {
    if (!taskList) return;
    let filtered = tasks.filter(t => {
      const matchesSearch = t.text.toLowerCase().includes(searchTerms);
      if (!matchesSearch) return false;
      if (currentFilter === "pending") return !t.completed;
      if (currentFilter === "completed") return t.completed;
      if (currentFilter === "high") return t.priority === "High";
      return true;
    });

    if (filtered.length === 0) {
      taskList.innerHTML = "";
      if (emptyState) emptyState.classList.remove('hidden');
    } else {
      if (emptyState) emptyState.classList.add('hidden');
      taskList.innerHTML = filtered.map(t => `
        <li class="task-item ${t.completed ? 'completed' : ''}" data-id="${t.id}">
          <div class="task-checkbox">${t.completed ? '✓' : ''}</div>
          <div class="task-content">
            <span class="task-text">${escapeHTML(t.text)}</span>
            <div class="task-meta">
              <span class="badge badge-priority-${t.priority.toLowerCase()}">${t.priority}</span>
              <span class="badge badge-category">${t.category}</span>
              ${t.dueDate ? `<span class="badge badge-category">📅 ${t.dueDate}</span>` : ''}
            </div>
          </div>
          <div class="task-actions">
            <button class="task-btn edit-btn" title="Edit">✏️</button>
            <button class="task-btn delete-btn" title="Delete">🗑️</button>
          </div>
        </li>
      `).join('');

      document.querySelectorAll('.task-item').forEach(item => {
        const id = item.dataset.id;
        item.querySelector('.task-checkbox').addEventListener('click', () => toggleTask(id));
        item.querySelector('.edit-btn').addEventListener('click', (e) => { 
          e.stopPropagation(); 
          openEditModal(id); 
        });
        item.querySelector('.delete-btn').addEventListener('click', (e) => { 
          e.stopPropagation(); 
          deleteTask(id); 
        });
      });
    }
  }

  function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (task && editModal && editInput) {
      editingTaskId = id;
      editInput.value = task.text;
      editModal.classList.remove('hidden');
      editInput.focus();
    }
  }

  function handleSaveEdit() {
    if (!editingTaskId || !editInput) return;
    const newText = editInput.value.trim();
    if (newText) {
      tasks = tasks.map(t => t.id === editingTaskId ? { ...t, text: newText } : t);
      saveAndRender();
      if (editModal) editModal.classList.add('hidden');
      editingTaskId = null;
    }
  }

  function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    if (totalTasksLabel) totalTasksLabel.textContent = total;
    if (completedTasksLabel) completedTasksLabel.textContent = completed;
    if (completionPercentLabel) completionPercentLabel.textContent = `${percent}%`;
    if (progressCircle) progressCircle.setAttribute('stroke-dasharray', `${percent}, 100`);
  }

  // --- Timer Logic ---
  const timerDisplay = document.getElementById('timer-display');
  const timerToggleBtn = document.getElementById('timer-toggle-btn');
  const timerResetBtn = document.getElementById('timer-reset-btn');
  const stopSoundBtn = document.getElementById('stop-sound-btn');
  const timerModeBtns = document.querySelectorAll('.timer-mode-btn');

  let timerInterval = null;

  async function initTimer() {
    const data = await chrome.storage.local.get(['timerState', 'timerEndTime', 'remainingTime', 'timerDuration', 'alarmSounding']);
    let timerState = data.timerState || 'stopped';
    let timerDuration = data.timerDuration || 1500000;
    let remainingTime = data.remainingTime !== undefined ? data.remainingTime : timerDuration;
    
    updateTimerUI(timerState, data.timerEndTime, remainingTime);
    updateAlarmUI(data.alarmSounding);

    if (timerState === 'running') startInterval();

    if (timerToggleBtn) {
      timerToggleBtn.addEventListener('click', async () => {
        const current = await chrome.storage.local.get(['timerState', 'timerEndTime', 'remainingTime', 'timerDuration']);
        toggleTimer(current.timerState || 'stopped', current.timerEndTime, current.remainingTime !== undefined ? current.remainingTime : (current.timerDuration || 1500000));
      });
    }

    if (timerResetBtn) {
      timerResetBtn.addEventListener('click', () => {
        chrome.storage.local.get(['timerDuration'], (d) => resetTimer(d.timerDuration || 1500000));
      });
    }

    if (stopSoundBtn) {
      stopSoundBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'stop-alarm-sound' });
      });
    }

    timerModeBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const newDuration = parseInt(btn.dataset.time);
        const mode = btn.dataset.mode || 'focus';
        timerModeBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        chrome.storage.local.set({ timerMode: mode });
        resetTimer(newDuration);
      });
    });

    const setCustomBtn = document.getElementById('set-custom-btn');
    const customHrInput = document.getElementById('custom-hr');
    const customMinInput = document.getElementById('custom-min');
    const customSecInput = document.getElementById('custom-sec');

    if (setCustomBtn && customHrInput && customMinInput && customSecInput) {
      setCustomBtn.addEventListener('click', () => {
        const hrs = parseInt(customHrInput.value) || 0;
        const mins = parseInt(customMinInput.value) || 0;
        const secs = parseInt(customSecInput.value) || 0;
        const totalMs = (hrs * 3600000) + (mins * 60000) + (secs * 1000);
        if (totalMs > 0) {
          timerModeBtns.forEach(b => b.classList.remove('active'));
          resetTimer(totalMs);
        }
      });
    }

    chrome.storage.onChanged.addListener((changes) => {
      if (changes.timerState || changes.timerEndTime || changes.remainingTime || changes.alarmSounding) {
        refreshTimerState();
      }
    });
  }

  async function refreshTimerState() {
    const data = await chrome.storage.local.get(['timerState', 'timerEndTime', 'remainingTime', 'alarmSounding']);
    updateTimerUI(data.timerState, data.timerEndTime, data.remainingTime);
    updateAlarmUI(data.alarmSounding);
    if (data.timerState === 'running') startInterval();
    else stopInterval();
  }

  function updateAlarmUI(isSounding) {
    if (!stopSoundBtn) return;
    if (isSounding) stopSoundBtn.classList.remove('hidden');
    else stopSoundBtn.classList.add('hidden');
  }

  function updateTimerUI(state, endTime, remaining) {
    if (!timerDisplay || !timerToggleBtn) return;
    let timeLeft = remaining;
    if (state === 'running') {
      timeLeft = Math.max(0, endTime - Date.now());
      timerToggleBtn.textContent = 'Pause';
      timerToggleBtn.className = 'btn-secondary';
    } else {
      timerToggleBtn.textContent = state === 'paused' ? 'Resume' : 'Start';
      timerToggleBtn.className = 'btn-primary';
    }
    const hrs = Math.floor(timeLeft / 3600000);
    const mins = Math.floor((timeLeft % 3600000) / 60000);
    const secs = Math.floor((timeLeft % 60000) / 1000);
    timerDisplay.textContent = `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  function startInterval() {
    if (timerInterval) return;
    timerInterval = setInterval(async () => {
      const data = await chrome.storage.local.get(['timerState', 'timerEndTime', 'remainingTime']);
      updateTimerUI(data.timerState, data.timerEndTime, data.remainingTime);
      if (data.timerState !== 'running' || data.timerEndTime <= Date.now()) stopInterval();
    }, 1000);
  }

  function stopInterval() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  async function toggleTimer(state, endTime, remaining) {
    if (state === 'running') {
      const newRemaining = Math.max(0, endTime - Date.now());
      await chrome.alarms.clear('productivityTimer');
      await chrome.storage.local.set({ timerState: 'paused', remainingTime: newRemaining });
    } else {
      const newEndTime = Date.now() + remaining;
      await chrome.storage.local.set({ timerState: 'running', timerEndTime: newEndTime });
      chrome.alarms.create('productivityTimer', { when: newEndTime });
    }
  }

  async function resetTimer(duration) {
    await chrome.alarms.clear('productivityTimer');
    await chrome.storage.local.set({ timerState: 'stopped', remainingTime: duration, timerDuration: duration });
  }

  init();
});

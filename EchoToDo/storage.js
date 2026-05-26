/**
 * Core Utilities & Storage Module for EchoToDo
 * Handles domain-specific task management, NLP processing, and notifications.
 */

// --- 1. Task Processor (NLP) ---
const TaskProcessor = {
  process(text) {
    if (!text) return [];
    const separators = /[,\n]|\band\s+also\b|\bthen\b|\balso\b|\bplus\b/gi;
    const phrases = text.split(separators).map(p => p.trim()).filter(p => p.length > 3);

    return phrases.map(phrase => {
      const priority = this.detectPriority(phrase);
      const category = this.detectCategory(phrase);
      const cleanText = this.cleanTaskText(phrase);

      return {
        id: Date.now() + Math.random().toString(36).substr(2, 9),
        text: cleanText,
        completed: false,
        priority: priority,
        category: category,
        createdAt: new Date().toISOString(),
        dueDate: this.detectDueDate(phrase),
        notes: ""
      };
    });
  },

  detectPriority(text) {
    const t = text.toLowerCase();
    if (/\burgent\b|\bimportant\b|\bhigh\b|!high|asap/i.test(t)) return "High";
    if (/\blater\b|\blow\b|!low/i.test(t)) return "Low";
    if (/\btoday\b|\btomorrow\b|\bmedium\b|!med/i.test(t)) return "Medium";
    return "Medium";
  },

  detectCategory(text) {
    const t = text.toLowerCase();
    const rules = [
      { keywords: ["code", "development", "debug", "api", "git", "push", "pull", "repo"], category: "Development" },
      { keywords: ["video", "youtube", "content", "edit", "thumbnail", "record", "upload"], category: "Content" },
      { keywords: ["study", "exam", "learn", "read", "research", "homework", "book"], category: "Education" },
      { keywords: ["shopping", "buy", "order", "grocery", "price", "store"], category: "Personal" },
      { keywords: ["call", "meet", "meeting", "zoom", "email", "send", "reply"], category: "Work" }
    ];
    for (const rule of rules) {
      if (rule.keywords.some(k => t.includes(k))) return rule.category;
    }
    return "General";
  },

  cleanTaskText(text) {
    let cleaned = text.replace(/!high|!med|!low/gi, "");
    cleaned = cleaned.replace(/\burgent\b|\bimportant\b|\basap\b/gi, "");
    return cleaned.trim().charAt(0).toUpperCase() + cleaned.trim().slice(1);
  },

  detectDueDate(text) {
    const t = text.toLowerCase();
    const now = new Date();
    if (t.includes("today")) return now.toISOString().split('T')[0];
    if (t.includes("tomorrow")) {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return tomorrow.toISOString().split('T')[0];
    }
    return null;
  }
};

// --- 2. Notifications ---
const NotificationModule = {
  notify(title, message) {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icon48.png",
      title: title,
      message: message,
      priority: 2
    });
  }
};

// --- 3. Storage Module ---
const StorageModule = {
  async getCurrentDomain() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs.length > 0 && tabs[0].url) {
        const urlString = tabs[0].url;
        if (urlString.startsWith('chrome://') || urlString.startsWith('about:')) return "system";
        const url = new URL(urlString);
        return url.hostname || "general";
      }
    } catch (e) {
      console.warn("Could not determine domain:", e);
    }
    return "general";
  },

  async saveTasks(domain, tasks) {
    const data = await chrome.storage.local.get("allTasks");
    const allTasks = data.allTasks || {};
    allTasks[domain] = tasks;
    await chrome.storage.local.set({ allTasks });
  },

  async getTasks(domain) {
    const data = await chrome.storage.local.get("allTasks");
    const allTasks = data.allTasks || {};
    return allTasks[domain] || [];
  },

  async getAllTasks() {
    const data = await chrome.storage.local.get("allTasks");
    return data.allTasks || {};
  },

  async exportData() {
    const data = await this.getAllTasks();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `echotodo_export_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  }
};

// Global Exports
window.TaskProcessor = TaskProcessor;
window.NotificationModule = NotificationModule;
window.StorageModule = StorageModule;

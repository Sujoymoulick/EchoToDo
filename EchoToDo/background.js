/**
 * Background Service Worker for EchoToDo
 */

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "install") {
    chrome.tabs.create({ url: "onboarding/index.html" });
    chrome.storage.local.set({
      onboardingCompleted: false,
      installDate: new Date().toISOString(),
      permissions: {
        microphone: false,
        notifications: false
      }
    });
  }
  console.log("EchoToDo Extension Installed");
  chrome.contextMenus.create({
    id: "addTaskVoice",
    title: "Add Voice Task",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "addTaskVoice") {
    chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

// --- Productivity Timer Alarm Handler ---
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "productivityTimer") {
    const data = await chrome.storage.local.get(["timerMode", "timerDuration"]);
    const mode = data.timerMode || "focus";
    const soundFile = mode === "focus" ? "assets/focus_alarm.mp3" : "assets/break_alarm.mp3";
    const title = mode === "focus" ? "Focus session complete!" : "Break complete!";

    chrome.notifications.create({
      type: "basic",
      iconUrl: "assets/icon128.png",
      title: title,
      message: "Great job! Time to transition.",
      priority: 2,
      buttons: [{ title: "Stop Alarm" }]
    });

    // Play loud sound via Offscreen API
    await playSound(soundFile);
    await chrome.storage.local.set({ 
      alarmSounding: true,
      timerState: "stopped",
      remainingTime: data.timerDuration || 1500000
    });
  }
});

// Handle notification button clicks
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    stopSound();
  }
});

/**
 * Manage Offscreen Document for Audio
 */
async function playSound(file) {
  const OFFSCREEN_PATH = 'offscreen/audio.html';
  
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL(OFFSCREEN_PATH)]
  });

  if (existingContexts.length === 0) {
    await chrome.offscreen.createDocument({
      url: OFFSCREEN_PATH,
      reasons: ['AUDIO_PLAYBACK'],
      justification: 'Notification sounds for productivity timer'
    });
  }

  chrome.runtime.sendMessage({
    action: 'play-audio',
    file: file
  });
}

async function stopSound() {
  chrome.runtime.sendMessage({ action: 'stop-audio' });
  await chrome.storage.local.set({ alarmSounding: false });
}

// Handle messages from popup/sidepanel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "stop-alarm-sound") {
    stopSound();
  }
});

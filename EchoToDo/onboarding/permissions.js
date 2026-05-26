/**
 * Onboarding Permissions Logic for EchoToDo
 */

document.addEventListener('DOMContentLoaded', () => {
    const grantMicBtn = document.getElementById('grant-mic');
    const micStatus = document.getElementById('mic-status');
    const grantNotifBtn = document.getElementById('grant-notif');
    const notifStatus = document.getElementById('notif-status');

    // 1. Microphone Permission Flow
    grantMicBtn.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Success
            micStatus.textContent = "Granted";
            micStatus.className = "status-badge granted";
            grantMicBtn.style.display = "none";
            
            // Stop tracks
            stream.getTracks().forEach(track => track.stop());

            // Update storage
            const data = await chrome.storage.local.get('permissions');
            const permissions = data.permissions || {};
            permissions.microphone = true;
            await chrome.storage.local.set({ permissions });

        } catch (err) {
            console.warn("Mic denied:", err);
            micStatus.textContent = "Denied";
            micStatus.className = "status-badge denied";
        }
    });

    // 2. Notifications Permission Flow
    grantNotifBtn.addEventListener('click', async () => {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            notifStatus.textContent = "Granted";
            notifStatus.className = "status-badge granted";
            grantNotifBtn.style.display = "none";

            // Update storage
            const data = await chrome.storage.local.get('permissions');
            const permissions = data.permissions || {};
            permissions.notifications = true;
            await chrome.storage.local.set({ permissions });
        } else {
            notifStatus.textContent = "Denied";
            notifStatus.className = "status-badge denied";
        }
    });

    // Check existing states on load
    async function initStates() {
        const data = await chrome.storage.local.get('permissions');
        const p = data.permissions || {};

        if (p.microphone) {
            micStatus.textContent = "Granted";
            micStatus.className = "status-badge granted";
            grantMicBtn.style.display = "none";
        }

        if (p.notifications) {
            notifStatus.textContent = "Granted";
            notifStatus.className = "status-badge granted";
            grantNotifBtn.style.display = "none";
        }
    }

    initStates();
});

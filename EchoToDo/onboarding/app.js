/**
 * Onboarding Navigation Logic for EchoToDo
 */

document.addEventListener('DOMContentLoaded', () => {
    const steps = document.querySelectorAll('.step');
    const progressBar = document.getElementById('progress-bar');
    const nextBtns = document.querySelectorAll('.next-btn');
    const prevBtns = document.querySelectorAll('.prev-btn');
    const finishBtn = document.getElementById('finish-btn');
    const getStartedBtn = document.getElementById('get-started-btn');

    let currentStep = 1;

    function goToStep(stepNumber) {
        steps.forEach(s => s.classList.remove('active'));
        document.getElementById(`step-${stepNumber}`).classList.add('active');
        
        // Update Progress Bar
        const progress = (stepNumber / steps.length) * 100;
        progressBar.style.width = `${progress}%`;
        
        currentStep = stepNumber;
        
        // Final check on Step 3
        if (stepNumber === 3) {
            checkPermissionsState();
        }
    }

    nextBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const next = parseInt(btn.dataset.next);
            goToStep(next);
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const prev = parseInt(btn.dataset.prev);
            goToStep(prev);
        });
    });

    finishBtn.addEventListener('click', () => {
        goToStep(4);
    });

    getStartedBtn.addEventListener('click', async () => {
        // Mark onboarding as complete
        await chrome.storage.local.set({ onboardingCompleted: true });
        window.close();
    });

    // Check if permissions are already granted (for finish btn)
    async function checkPermissionsState() {
        const data = await chrome.storage.local.get('permissions');
        const micGranted = data.permissions?.microphone;
        
        // If mic is granted, enable finish setup
        if (micGranted) {
            finishBtn.disabled = false;
        } else {
            finishBtn.disabled = true;
        }
    }

    // Listen for storage changes from permissions.js
    chrome.storage.onChanged.addListener((changes) => {
        if (changes.permissions) {
            checkPermissionsState();
        }
    });
});

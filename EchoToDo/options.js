/**
 * Options Logic for EchoToDo
 * Used to request microphone permissions
 */

document.getElementById('grant-btn').addEventListener('click', async () => {
    const status = document.getElementById('status');
    const grantBtn = document.getElementById('grant-btn');
    const closeBtn = document.getElementById('close-btn');

    try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // Access granted
        status.textContent = "✓ Microphone access granted! You can now use voice tasks in the popup.";
        status.style.color = "var(--success)";
        grantBtn.style.display = "none";
        closeBtn.style.display = "inline-block";
        
        // Immediately stop the stream
        stream.getTracks().forEach(track => track.stop());
        
    } catch (err) {
        console.warn("Microphone access error:", err);
        status.textContent = "Error: Access denied. Please enable microphone permissions in your browser settings for this extension.";
        status.style.color = "var(--danger)";
    }
});

document.getElementById('close-btn').addEventListener('click', (e) => {
    e.preventDefault();
    window.close();
});

/**
 * Offscreen Audio Logic for EchoToDo
 */

let currentAudio = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'play-audio') {
    if (currentAudio) {
      currentAudio.pause();
    }
    currentAudio = new Audio(chrome.runtime.getURL(message.file));
    currentAudio.volume = 1.0;
    currentAudio.loop = true; // Make it loop until stopped
    currentAudio.play()
      .then(() => console.log('Playing audio:', message.file))
      .catch(err => console.warn('Audio play failed:', err));
  } else if (message.action === 'stop-audio') {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }
  }
});

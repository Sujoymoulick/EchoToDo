/**
 * Speech Recognition Module for EchoToDo
 * Optimized for high accuracy and task-specific keywords.
 */

const SpeechModule = {
  recognition: null,
  isRecording: false,
  finalTranscript: "",
  interimTranscript: "",

  init(onResult, onEnd, onError) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;

    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return false;
    }

    try {
      this.recognition = new SpeechRecognition();
      
      // --- Accuracy Optimizations ---
      this.recognition.continuous = true; 
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US'; // Standard English
      this.recognition.maxAlternatives = 1; // Focus on the most confident result

      // --- Grammar Hinting (Improves word prediction for tasks) ---
      if (SpeechGrammarList) {
        const grammar = '#JSGF V1.0; grammar tasks; public <task> = add | remove | today | tomorrow | next week | urgent | priority | high | medium | low ;';
        const speechRecognitionList = new SpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);
        this.recognition.grammars = speechRecognitionList;
      }

      this.recognition.onstart = () => {
        console.log("Speech Recognition: Active");
        this.isRecording = true;
        this.finalTranscript = "";
        this.interimTranscript = "";
      };

      this.recognition.onresult = (event) => {
        let interim = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const result = event.results[i][0];
          const transcript = result.transcript;
          const confidence = result.confidence;

          // Only process results with a reasonable confidence level
          if (confidence > 0.1) {
            if (event.results[i].isFinal) {
              this.finalTranscript += transcript + " ";
            } else {
              interim += transcript;
            }
          }
        }
        
        this.interimTranscript = interim;
        onResult(this.finalTranscript, this.interimTranscript);
      };

      this.recognition.onend = () => {
        console.log("Speech Recognition: Ended");
        this.isRecording = false;
        const resultText = (this.finalTranscript + " " + this.interimTranscript).trim();
        onEnd(resultText);
      };

      this.recognition.onerror = (event) => {
        console.error("Speech Recognition: Error", event.error);
        this.isRecording = false;
        onError(event.error);
      };

      return true;
    } catch (e) {
      console.error("Speech Recognition initialization failed:", e);
      return false;
    }
  },

  start() {
    if (!this.recognition || this.isRecording) return;
    try {
      this.recognition.start();
    } catch (err) {
      console.error("Speech Recognition: start() failed", err);
      this.isRecording = false;
      if (this.recognition.onerror) {
        this.recognition.onerror({ error: 'not-allowed' });
      }
    }
  },

  stop() {
    if (this.recognition && this.isRecording) {
      try {
        this.recognition.stop();
      } catch (err) {
        console.error("Speech Recognition: stop() failed", err);
      }
    }
  }
};

window.SpeechModule = SpeechModule;

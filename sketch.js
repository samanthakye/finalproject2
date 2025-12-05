let video; // Stores the camera feed
let mic;   // Stores the microphone input
let fft;   // Used for frequency analysis
let audioStarted = false; // To track if audio has been started by user

// --- VISUALS CONSTANTS ---
const NUM_BUBBLES_X = 30;
const NUM_BUBBLES_Y = 20;

// --- SPEECH RECOGNITION SETUP ---
window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;
if (window.SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;

  recognition.onresult = (event) => {
    let finalTranscript = '';
    const transcriptionDiv = document.getElementById('transcription');

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalTranscript += event.results[i][0].transcript.trim() + '. ';
      }
    }
    
    // Update the transcription display
    transcriptionDiv.textContent = finalTranscript;
  };

  recognition.onerror = (event) => {
    console.error('Speech recognition error:', event.error);
    const transcriptionDiv = document.getElementById('transcription');
    transcriptionDiv.textContent = `Speech Error: ${event.error}`;
  };
  
  recognition.onend = () => {
    if (audioStarted) {
      recognition.start(); // Keep it running
    }
  };

}

function setup() {
    createCanvas(windowWidth, windowHeight); 

    video = createCapture(VIDEO); 
    video.size(width, height);
    video.hide(); 

    // Initialize local mic and FFT
    mic = new p5.AudioIn();
    fft = new p5.FFT();
    fft.setInput(mic);
    
    textAlign(CENTER, CENTER);
    textSize(24);
    textFont('monospace');

    if (!window.SpeechRecognition) {
      const transcriptionDiv = document.getElementById('transcription');
      transcriptionDiv.innerHTML = "Speech recognition is not supported in this browser.";
    }
}

function draw() {
    if (!audioStarted) {
        background(0);
        fill(255);
        text("Click to start audio", width / 2, height / 2);
        return;
    }

    // 1. Analyze Local Sound Data
    let volume = mic.getLevel(); 
    let bassEnergy = fft.getEnergy('bass');
    let intensity = map(bassEnergy, 0, 255, 0, 40);

    // 2. Draw the Video Background
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop(); 

    // 3. Apply the 'Hole Punch' Masking Effect
    blendMode(DIFFERENCE);
    noStroke();
    fill(255);

    let xSpacing = width / NUM_BUBBLES_X;
    let ySpacing = height / NUM_BUBBLES_Y;

    for (let i = 0; i < NUM_BUBBLES_X; i++) {
        for (let j = 0; j < NUM_BUBBLES_Y; j++) {
            let baseSize = (xSpacing + ySpacing) / 2 * 0.8; 
            let circleSize = map(volume, 0, 1, baseSize * 0.5, baseSize * 1.5);
            
            let xNoise = map(noise(frameCount * 0.01 + i * 10), 0, 1, -intensity, intensity);
            let yNoise = map(noise(frameCount * 0.02 + j * 5), 0, 1, -intensity, intensity);

            let x = (i * xSpacing) + (xSpacing / 2) + xNoise;
            let y = (j * ySpacing) + (ySpacing / 2) + yNoise; 
            
            circle(x, y, circleSize);
        }
    }
    
    blendMode(BLEND); 
    
    // --- Data Display ---
    noStroke();
    fill(255);
    textSize(16);
    textAlign(LEFT);
    text(`Mic Volume:       ${volume.toFixed(4)}`, 10, height - 60);
    text(`Bass Energy:      ${bassEnergy.toFixed(2)}`, 10, height - 40);
    text(`Glitch Intensity: ${intensity.toFixed(2)}`, 10, height - 20);

    // Visual indicator for Intensity
    fill(255, 0, 0, 150);
    rect(10, 10, intensity * 5, 20);
}

function mousePressed() {
  if (!audioStarted) {
    userStartAudio().then(() => {
        mic.start();
        if (recognition) {
          recognition.start();
          console.log('Speech recognition started.');
        }
        audioStarted = true;
    });
  }
}
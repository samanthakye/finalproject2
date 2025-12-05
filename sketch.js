let video; // Stores the camera feed

// --- DATA FROM SERVER ---
// These variables will be updated by the data coming from the broadcaster phone
let volume = 0;
let bassEnergy = 0;
let intensity = 0;
let transcribedText = 'Waiting for transcription...';

// --- VISUALS CONSTANTS ---
const NUM_BUBBLES_X = 30;
const NUM_BUBBLES_Y = 20;

// --- WEBSOCKET CLIENT SETUP ---
const socket = new WebSocket('ws://localhost:8080');

socket.onopen = () => {
    console.log('Connected to relay server.');
};

socket.onmessage = (event) => {
    const data = JSON.parse(event.data);
    console.log('Received data:', data);

    // Update global variables with data from the server
    volume = data.volume || 0;
    bassEnergy = data.bassEnergy || 0;
    transcribedText = data.text || '';

    // The 'intensity' is now derived from the server's bassEnergy data
    intensity = map(bassEnergy, 0, 255, 0, 40);
};

socket.onerror = (error) => {
    console.error('WebSocket Error:', error);
    transcribedText = 'Connection error. Is the server running?';
};

socket.onclose = () => {
    console.log('Disconnected from relay server.');
    transcribedText = 'Disconnected from server.';
};


function setup() {
    createCanvas(windowWidth, windowHeight); 

    video = createCapture(VIDEO); 
    video.size(width, height);
    video.hide(); 

    // No local mic or FFT needed anymore!
    
    textAlign(CENTER, CENTER);
    textSize(24);
    textFont('monospace');
}

function draw() {
    // No more "Click to start" message, it runs automatically
    
    // The draw loop now continuously uses the 'volume' and 'intensity'
    // variables that are being updated by the WebSocket connection.

    // 1. Draw the Video Background
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop(); 

    // 2. Apply the 'Hole Punch' Masking Effect
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

    // --- VISUALIZATION & DATA DISPLAY ---

    // 1. Display raw data from the server
    fill(255);
    textSize(16);
    textFont('monospace');
    textAlign(LEFT); // Align text to the left
    text(`Live Volume:      ${volume.toFixed(4)}`, 10, height - 60);
    text(`Live Bass Energy: ${bassEnergy.toFixed(2)}`, 10, height - 40);
    text(`Live Intensity:   ${intensity.toFixed(2)}`, 10, height - 20);

    // 2. Visual indicator for Intensity
    fill(255, 0, 0, 150);
    rect(10, 10, intensity * 5, 20);

    // 3. Display the live transcription text
    // The 'transcription' div is still in index.html and styled by style.css
    const transcriptionDiv = document.getElementById('transcription');
    transcriptionDiv.textContent = transcribedText;
}

// mousePressed is no longer needed to start audio, but you could use it
// for other interactions, like this:
function mousePressed() {
    console.log("Mouse pressed. Current intensity:", intensity);
    // Example of reacting to a click: trigger a visual burst
    // This is just an example of how you can still have interactions
    fill(255, 255, 0, 100);
    rect(0, 0, width, height);
}
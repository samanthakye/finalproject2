let mic;
let fft;
let audioStarted = false;

const NUM_BUBBLES_X = 30;
const NUM_BUBBLES_Y = 20;

// Glitch effect variables
const GLITCH_THRESHOLD = 0.8; // Volume threshold for glitch (0 to 1)
const GLITCH_DURATION = 15; // Glitch duration in frames
let glitchActive = false;
let glitchStartFrame = 0;

// Color Palette Shift variables
let bassDominantColor;
let trebleDominantColor;

// Long-Term Average Volume variables
let volumeHistory = [];
const HISTORY_LENGTH = 60; // Keep 60 frames (1 second at 60fps) of volume history
let averageVolume = 0;

// Shockwave Effect variables
let shockwaveActive = false;
let shockwaveStartFrame = 0;
const SHOCKWAVE_DURATION = 30; // Shockwave lasts for 30 frames
let shockwaveRadius = 0;
let shockwaveColor;

function setup() {
    createCanvas(windowWidth, windowHeight); 

    mic = new p5.AudioIn();
    fft = new p5.FFT();
    fft.setInput(mic);
    
    textAlign(CENTER, CENTER);
    textSize(24);
    textFont('monospace');

    // Initialize colors
    bassDominantColor = color(255, 100, 0); // Orange/Red
    trebleDominantColor = color(0, 100, 255); // Blue/Purple
    shockwaveColor = color(255, 255, 0, 150); // Yellow, semi-transparent
}
        
        function draw() {
            if (!audioStarted) {
                background(255);
                fill(0);
                text("Click to start audio", width / 2, height / 2);
                return;
            }
        
            let volume = mic.getLevel(); 
            let spectrum = fft.analyze(); 
            
            let bassEnergy = fft.getEnergy('bass');
            let midEnergy = fft.getEnergy('mid');
            let trebleEnergy = fft.getEnergy('treble');
            let intensity = map(bassEnergy, 0, 255, 0, 80);

            // Update volume history
            volumeHistory.push(volume);
            if (volumeHistory.length > HISTORY_LENGTH) {
                volumeHistory.shift(); // Remove the oldest volume
            }
            // Calculate average volume
            let sumVolume = volumeHistory.reduce((sum, val) => sum + val, 0);
            averageVolume = sumVolume / volumeHistory.length;

            // Check for glitch condition
            if (volume > GLITCH_THRESHOLD && !glitchActive) {
                glitchActive = true;
                glitchStartFrame = frameCount;
            }

            // Check for shockwave trigger: volume significantly higher than average
            if (volume > averageVolume * 2 && !shockwaveActive && averageVolume > 0.05) { // Ensure average is not too low
                shockwaveActive = true;
                shockwaveStartFrame = frameCount;
            }

            // If glitch is active, apply effect
            if (glitchActive) {
                if (frameCount - glitchStartFrame < GLITCH_DURATION) {
                    // Invert background color for glitch
                    background(0); // Temporarily black background during glitch
                } else {
                    glitchActive = false; // Glitch ended
                    background(255); // Reset to white
                }
            } else {
                background(255); // Normal white background
            }
        
            blendMode(BLEND);
        
            // Calculate color based on energy balance
            let mixFactor = constrain(map(trebleEnergy - bassEnergy, -100, 100, 0, 1), 0, 1);
            let currentColor = lerpColor(bassDominantColor, trebleDominantColor, mixFactor);

            // Invert dot colors during glitch
            if (glitchActive && frameCount - glitchStartFrame < GLITCH_DURATION) {
                let invertedColor = color(255 - red(currentColor), 255 - green(currentColor), 255 - blue(currentColor));
                fill(invertedColor); 
            } else {
                fill(currentColor);
            }
            noStroke();
        
            let xSpacing = width / NUM_BUBBLES_X;
            let ySpacing = height / NUM_BUBBLES_Y;
        
            for (let i = 0; i < NUM_BUBBLES_X; i++) {
                for (let j = 0; j < NUM_BUBBLES_Y; j++) {
                    let baseSize = (xSpacing + ySpacing) / 2 * 1.2; 
                    let amplifiedVolume = min(volume * 5, 1.0);
                    let circleSize = map(amplifiedVolume, 0, 1, baseSize * 0.5, baseSize * 2.5);
                    
                    let xNoise = map(noise(frameCount * 0.01 + i * 10), 0, 1, -intensity, intensity);
                    let yNoise = map(noise(frameCount * 0.02 + j * 5), 0, 1, -intensity, intensity);
        
                    let x = (i * xSpacing) + (xSpacing / 2) + xNoise;
                    let y = (j * ySpacing) + (ySpacing / 2) + yNoise; 
                    
                    circle(x, y, circleSize);
                }
            }
            
            blendMode(BLEND); 

            // Draw shockwave if active
            if (shockwaveActive) {
                let shockwaveProgress = (frameCount - shockwaveStartFrame) / SHOCKWAVE_DURATION;
                if (shockwaveProgress <= 1) {
                    shockwaveRadius = map(shockwaveProgress, 0, 1, 0, max(width, height) * 0.8); // Expand to 80% of screen
                    let alpha = map(shockwaveProgress, 0, 1, 150, 0); // Fade out
                    
                    push(); // Isolate settings
                    noFill();
                    stroke(red(shockwaveColor), green(shockwaveColor), blue(shockwaveColor), alpha);
                    strokeWeight(5);
                    circle(width / 2, height / 2, shockwaveRadius * 2); // Diameter is radius * 2
                    pop(); // Restore settings
                } else {
                    shockwaveActive = false; // End shockwave
                }
            }

            // --- Data Display ---
            noStroke();
            fill(0); 
            
            textSize(16);
            textAlign(RIGHT);
            text(`Mic Volume:       ${volume.toFixed(4)}`, width - 10, 30);
            text(`Bass Energy:      ${bassEnergy.toFixed(2)}`, width - 10, 50);
            text(`Mid Energy:       ${midEnergy.toFixed(2)}`, width - 10, 70);
            text(`Treble Energy:    ${trebleEnergy.toFixed(2)}`, width - 10, 90);
            text(`Avg Volume:       ${averageVolume.toFixed(4)}`, width - 10, 110); // Display average volume
            
            // --- Data to Visuals Connection Lines ---
            stroke(0, 50); // Changed to black with transparency
            strokeWeight(0.5);
            let dataDisplayX = 10; 
            let dataDisplayY = 10;
            
            for (let i = 0; i < NUM_BUBBLES_X; i += 6) {
                for (let j = 0; j < NUM_BUBBLES_Y; j+= 6) {
                     let x = (i * xSpacing) + (xSpacing / 2);
                     let y = (j * ySpacing) + (ySpacing / 2);
                     line(dataDisplayX, dataDisplayY, x, y);
                }
            }

            // Visual indicator for Intensity
            fill(255, 0, 0, 150);
            rect(10, 10, intensity * 5, 20);

            // Visualize the full audio spectrum
            noStroke();
            fill(0, 255, 0, 100); // Green for the spectrum
            for (let i = 0; i < spectrum.length; i++) {
                let x = map(log(i), 0, log(spectrum.length), 0, width);
                let h = map(spectrum[i], 0, 255, 0, height * 0.5);
                rect(x, height, 1, -h); // Draw from the bottom up
            }
}

function mousePressed() {
  if (!audioStarted) {
    userStartAudio();
    mic.start();
    audioStarted = true;
  }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

function userStartAudio() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}

let mic;
let fft;
let audioStarted = false;

const NUM_BUBBLES_X = 30;
const NUM_BUBBLES_Y = 20;

// Base colors for blending
let bassColorMain;
let midColorMain;
let trebleColorMain;

let smoothedVolume = 0;
let smoothingFactor = 0.1; // Adjust this value to change the smoothness (0.0 to 1.0)

let bubblePositions;

function initializePositions() {
    bubblePositions = Array(NUM_BUBBLES_X).fill(0).map(() => Array(NUM_BUBBLES_Y).fill(0).map(() => ({x: 0, y: 0, dataCollected: 0})));
    let xSpacing = width / NUM_BUBBLES_X;
    let ySpacing = height / NUM_BUBBLES_Y;
    for (let i = 0; i < NUM_BUBBLES_X; i++) {
        for (let j = 0; j < NUM_BUBBLES_Y; j++) {
            bubblePositions[i][j] = {
                x: (i * xSpacing) + (xSpacing / 2),
                y: (j * ySpacing) + (ySpacing / 2),
                dataCollected: 0
            };
        }
    }
}

function setup() {
    createCanvas(windowWidth, windowHeight); 

    initializePositions();

    mic = new p5.AudioIn();
    fft = new p5.FFT();
    fft.setInput(mic);
    
    textAlign(CENTER, CENTER);
    textSize(24);
    textFont('monospace');

    // Initialize base colors
    bassColorMain = color(20, 20, 100);   // Deep Blue
    midColorMain = color(80, 80, 180);   // Medium Blue/Violet
    trebleColorMain = color(150, 200, 255); // Light Cyan/Blue
}
        
function draw() {
            if (!audioStarted) {
                background(0);        fill(0);
        text("Click to start audio", width / 2, height / 2);
        return;
    }

    background(0);

    let volume = mic.getLevel(); 
    
    // Smooth the volume
    smoothedVolume += (volume - smoothedVolume) * smoothingFactor;
    fft.analyze(); // Analyze the frequency spectrum
    let waveform = fft.waveform(); // Get waveform data
    
    let bassEnergy = fft.getEnergy('bass');
    let midEnergy = fft.getEnergy('mid');
    let trebleEnergy = fft.getEnergy('treble');

    // --- AI Clustering Logic ---
    // 1. Determine dominant frequency
    let dominantEnergy = 'none';
    const energyThreshold = 100; // Only react if energy is significant
    if (bassEnergy > energyThreshold && bassEnergy > midEnergy && bassEnergy > trebleEnergy) {
        dominantEnergy = 'bass';
    } else if (midEnergy > energyThreshold && midEnergy > bassEnergy && midEnergy > trebleEnergy) {
        dominantEnergy = 'mid';
    } else if (trebleEnergy > energyThreshold && trebleEnergy > bassEnergy && trebleEnergy > midEnergy) {
        dominantEnergy = 'treble';
    }
    // --- End AI Logic ---
    
    
    // Intensity of movement is driven by a combination of bass and overall volume
    let intensity = constrain(map(bassEnergy + volume * 100, 0, 255, 0, 80), 0, 80);

    // Normalize energies for blending
    let normBass = map(bassEnergy, 0, 255, 0, 1);
    let normMid = map(midEnergy, 0, 255, 0, 1);
    let normTreble = map(trebleEnergy, 0, 255, 0, 1);

    // Blend colors based on energy levels
    let color1 = lerpColor(bassColorMain, midColorMain, normMid);
    let finalColor = lerpColor(color1, trebleColorMain, normTreble);
    
    fill(finalColor);
    noStroke();

    let xSpacing = width / NUM_BUBBLES_X;
    let ySpacing = height / NUM_BUBBLES_Y;

    for (let i = 0; i < NUM_BUBBLES_X; i++) {
        for (let j = 0; j < NUM_BUBBLES_Y; j++) {
            let baseSize = (xSpacing + ySpacing) / 2 * 1.2; 
            
            // The size of the circle is reactive to the overall volume
            let amplifiedVolume = min(smoothedVolume * 5, 1.0); 
            let circleSize = map(amplifiedVolume, 0, 1, baseSize * 0.1, baseSize * 2.0);
            
            let currentPos = bubblePositions[i][j];

            let xNoise = map(noise(frameCount * 0.01 + i * 10), 0, 1, -intensity, intensity);
            let yNoise = map(noise(frameCount * 0.02 + j * 5), 0, 1, -intensity, intensity);

            let x = (i * xSpacing) + (xSpacing / 2) + xNoise;
            let y = (j * ySpacing) + (ySpacing / 2) + yNoise; 
            
            // --- Aura Logic ---
            currentPos.dataCollected += smoothedVolume;
            currentPos.dataCollected *= 0.995; // Slow decay

            let maxAuraSize = baseSize * 4;
            let auraSize = map(currentPos.dataCollected, 0, 2, circleSize, maxAuraSize);
            auraSize = max(auraSize, circleSize);

            let auraColor = color(red(finalColor), green(finalColor), blue(finalColor), 30);
            fill(auraColor);
            circle(x, y, auraSize);
            // --- End Aura Logic ---

            // Draw the main circle
            fill(finalColor);
            circle(x, y, circleSize);
        }
    }

    // Display AI "thought process"
    push(); // Save current drawing style
    fill(150, 200, 255); // Light Cyan/Blue for text, matching treble color
    textAlign(LEFT, TOP);
    textSize(16); // Smaller text

    text("Input (smooth): " + nf(smoothedVolume, 0, 2), 20, 20);
    text("Dominant Freq: " + dominantEnergy, 20, 40);
    text("Bass Energy: " + nf(bassEnergy, 0, 0), 20, 60);
    text("Mid Energy: " + nf(midEnergy, 0, 0), 20, 80);
    text("Treble Energy: " + nf(trebleEnergy, 0, 0), 20, 100);
    pop(); // Restore previous drawing style

    drawWaveform(waveform);
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
    initializePositions();
}

function userStartAudio() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}

function drawWaveform(waveform) {
    let waveY = height;
    let waveHeight = 150;

    noFill();
    stroke(0, 150, 255, 150);
    strokeWeight(2);
    beginShape();

    for (let i = 0; i < waveform.length; i++) {
        let x = map(i, 0, waveform.length, 0, width);
        let y = map(waveform[i], -1, 1, waveY, waveY - waveHeight);
        vertex(x, y);
    }

    endShape();
}
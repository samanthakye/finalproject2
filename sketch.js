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
    bubblePositions = Array(NUM_BUBBLES_X).fill(0).map(() => Array(NUM_BUBBLES_Y).fill(0).map(() => ({x: 0, y: 0})));
    let xSpacing = width / NUM_BUBBLES_X;
    let ySpacing = height / NUM_BUBBLES_Y;
    for (let i = 0; i < NUM_BUBBLES_X; i++) {
        for (let j = 0; j < NUM_BUBBLES_Y; j++) {
            bubblePositions[i][j] = {
                x: (i * xSpacing) + (xSpacing / 2),
                y: (j * ySpacing) + (ySpacing / 2)
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
    bassColorMain = color(255, 60, 0);   // Deep Orange/Red
    midColorMain = color(0, 200, 100);   // Vibrant Green
    trebleColorMain = color(50, 100, 255); // Bright Blue
}
        
function draw() {
    if (!audioStarted) {
        background(255);
        fill(0);
        text("Click to start audio", width / 2, height / 2);
        return;
    }

    background(255); // White background

    let volume = mic.getLevel(); 
    
    // Smooth the volume
    smoothedVolume += (volume - smoothedVolume) * smoothingFactor;

    fft.analyze(); // Analyze the frequency spectrum
    
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
            
            // --- AI Clustering Logic ---
            // 2. Define home and target positions
            let homeX = (i * xSpacing) + (xSpacing / 2);
            let homeY = (j * ySpacing) + (ySpacing / 2);
            
            let targetX = homeX;
            let targetY = homeY;

            if (dominantEnergy === 'bass') {
                targetX = map(noise(i * 0.2, j * 0.2), 0, 1, 0, width / 3);
                targetY = map(noise(i * 0.2 + 1000, j * 0.2 + 1000), 0, 1, 0, height);
            } else if (dominantEnergy === 'mid') {
                targetX = map(noise(i * 0.2, j * 0.2), 0, 1, width / 3, 2 * width / 3);
                targetY = map(noise(i * 0.2 + 1000, j * 0.2 + 1000), 0, 1, 0, height);
            } else if (dominantEnergy === 'treble') {
                targetX = map(noise(i * 0.2, j * 0.2), 0, 1, 2 * width / 3, width);
                targetY = map(noise(i * 0.2 + 1000, j * 0.2 + 1000), 0, 1, 0, height);
            }

            // 3. Animate movement towards target
            let currentPos = bubblePositions[i][j];
            let lerpFactor = 0.05;
            currentPos.x = lerp(currentPos.x, targetX, lerpFactor);
            currentPos.y = lerp(currentPos.y, targetY, lerpFactor);
            // --- End AI Logic ---

            // The local movement of the circle is based on Perlin noise, influenced by 'intensity'
            let xNoise = map(noise(frameCount * 0.01 + i * 10), 0, 1, -intensity, intensity);
            let yNoise = map(noise(frameCount * 0.02 + j * 5), 0, 1, -intensity, intensity);

            // The final position is the interpolated cluster position plus the local noise
            let x = currentPos.x + xNoise;
            let y = currentPos.y + yNoise; 
            
            circle(x, y, circleSize);
        }
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
    initializePositions();
}

function userStartAudio() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}
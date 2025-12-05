let video; // Stores the camera feed
let mic;   // Stores the microphone input
let fft;   // Used for frequency analysis
let audioStarted = false; // To track if audio has been started by user

// --- VISUALS CONSTANTS ---
const NUM_BUBBLES_X = 30; // Number of bubbles horizontally
const NUM_BUBBLES_Y = 20; // Number of bubbles vertically

function setup() {
    createCanvas(windowWidth, windowHeight); 



    mic = new p5.AudioIn();
    fft = new p5.FFT();
    fft.setInput(mic);
    
    textAlign(CENTER, CENTER);
    textSize(24);
    textFont('monospace');
}

function draw() {
    if (!audioStarted) {
        background(0);
        fill(255);
        text("Click to start audio", width / 2, height / 2);
        return; // Stop the rest of the draw loop
    }

    // 1. Analyze Sound Data
    let volume = mic.getLevel(); 
    let spectrum = fft.analyze(); 
    
    let bassEnergy = fft.getEnergy('bass');
    let midEnergy = fft.getEnergy('mid');
    let trebleEnergy = fft.getEnergy('treble');
    let intensity = map(bassEnergy, 0, 255, 0, 80);

    // 2. Draw the Solid Background
    background(50); 

    // 3. Apply the 'Hole Punch' Masking Effect
    blendMode(DIFFERENCE);

    let r = map(trebleEnergy, 0, 255, 0, 255);
    let g = map(midEnergy, 0, 255, 0, 255);
    let b = map(bassEnergy, 0, 255, 0, 255);
    
    fill(r, g, b);

    let sw = map(bassEnergy, 0, 255, 0, 10);
    strokeWeight(sw);
    stroke(255);


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

    // --- AI/Code "Thought Process" Visualization ---
    // This section shows the data driving the visual effects.

    // 1. Visualize the full audio spectrum
    // The 'spectrum' variable was already calculated at the start of draw()
    noStroke();
    fill(0, 255, 0, 100); // Green for the spectrum
    for (let i = 0; i < spectrum.length; i++) {
        // Use a logarithmic scale for the x-axis for a more conventional frequency representation
        let x = map(log(i), 0, log(spectrum.length), 0, width);
        // Map the spectrum value to a height
        let h = map(spectrum[i], 0, 255, 0, height * 0.5);
        rect(x, height, 1, -h); // Draw from the bottom up
    }


    // --- Data to Visuals Connection Lines ---
    stroke(255, 50);
    strokeWeight(0.5);
    let dataDisplayX = 150; 
    let dataDisplayY = height - 70;
    
    for (let i = 0; i < NUM_BUBBLES_X; i += 6) {
        for (let j = 0; j < NUM_BUBBLES_Y; j+= 6) {
             let x = (i * xSpacing) + (xSpacing / 2);
             let y = (j * ySpacing) + (ySpacing / 2);
             line(dataDisplayX, dataDisplayY, x, y);
        }
    }


    // --- Data Display ---
    noStroke();
    fill(255);
    textSize(20);
    textAlign(LEFT);
    text("AI DATA ANALYSIS", 10, height - 150);
    
    textSize(16);
    text(`Mic Volume:       ${volume.toFixed(4)}`, 10, height - 120);
    text(`Bass Energy:      ${bassEnergy.toFixed(2)}`, 10, height - 100);
    text(`Mid Energy:       ${midEnergy.toFixed(2)}`, 10, height - 80);
    text(`Treble Energy:    ${trebleEnergy.toFixed(2)}`, 10, height - 60);
    text(`Glitch Intensity: ${intensity.toFixed(2)}`, 10, height - 40);
    text(`Stroke Weight:    ${sw.toFixed(2)}`, 10, height - 20);

    // Visual indicator for Intensity
    fill(255, 0, 0, 150);
    rect(10, 10, intensity * 5, 20);
}

function mousePressed() {
  if (!audioStarted) {
    userStartAudio().then(() => {
        mic.start();
        audioStarted = true;
    });
  }
}

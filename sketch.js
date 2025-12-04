let video; // Stores the camera feed
let mic;   // Stores the microphone input
let fft;   // Used for frequency analysis
let audioStarted = false; // To track if audio has been started by user

// --- NEW CONSTANTS FOR SCREEN CROWDING ---
const NUM_BUBBLES_X = 30; // Number of bubbles horizontally
const NUM_BUBBLES_Y = 20; // Number of bubbles vertically
const TOTAL_BUBBLES = NUM_BUBBLES_X * NUM_BUBBLES_Y;

function setup() {
    createCanvas(windowWidth, windowHeight); 

    video = createCapture(VIDEO); 
    video.size(width, height);
    video.hide(); 

    mic = new p5.AudioIn();
    // Note: mic.start() is now called in mousePressed()

    fft = new p5.FFT();
    fft.setInput(mic);
    
    // Set up text for the initial message
    textAlign(CENTER, CENTER);
    textSize(24);
    textFont('monospace');
}

function draw() {
    // If audio hasn't started, show a message and wait.
    if (!audioStarted) {
        background(0);
        fill(255);
        text("Click to start audio", width / 2, height / 2);
        return; // Stop the rest of the draw loop
    }

    // 1. Analyze Sound Data
    let volume = mic.getLevel(); 
    let spectrum = fft.analyze(); 
    
    // Use the low-frequency energy (bass/loud sounds) to control the glitch intensity
    let bassEnergy = fft.getEnergy('bass');
    let intensity = map(bassEnergy, 0, 255, 0, 40); // Increased max distortion for impact

    // 2. Draw the Video Background
    push();
    translate(width, 0);
    scale(-1, 1);
    image(video, 0, 0, width, height);
    pop(); 

    // 3. Apply the 'Hole Punch' Masking Effect
    
    // Set the blend mode to create the visual cut-out effect
    blendMode(DIFFERENCE);

    noStroke();
    fill(255); // Draw circles in white

    // Calculate the spacing for a grid that covers the whole screen
    let xSpacing = width / NUM_BUBBLES_X;
    let ySpacing = height / NUM_BUBBLES_Y;

    // --- NEW: Loop through a 2D grid (X and Y) to cover the screen ---
    for (let i = 0; i < NUM_BUBBLES_X; i++) {
        for (let j = 0; j < NUM_BUBBLES_Y; j++) {
            
            // --- Reaction to Sound ---
            // Base size is now calculated based on grid spacing
            let baseSize = (xSpacing + ySpacing) / 2 * 0.8; 
            
            // Size: Volume affects the size, ensuring a minimum size
            let circleSize = map(volume, 0, 1, baseSize * 0.5, baseSize * 1.5);
            
            // Position: Add noise based on sound intensity to create a 'glitch'
            // Use different noise seeds (i*10 and j*5) to make the movement unique for each circle
            let xNoise = map(noise(frameCount * 0.01 + i * 10), 0, 1, -intensity, intensity);
            let yNoise = map(noise(frameCount * 0.02 + j * 5), 0, 1, -intensity, intensity);

            // Calculate the centered grid position, then add the noise
            let x = (i * xSpacing) + (xSpacing / 2) + xNoise;
            let y = (j * ySpacing) + (ySpacing / 2) + yNoise; 
            
            // Draw the solid circle
            circle(x, y, circleSize);
        }
    }
    
    // Reset blend mode 
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

    // 2. Display raw data as text
    noStroke();
    fill(255);
    textSize(16);
    textFont('monospace');

    // Display the values calculated at the beginning of draw()
    text(`Mic Volume:       ${volume.toFixed(4)}`, 10, height - 60);
    text(`Bass Energy:      ${bassEnergy.toFixed(2)}`, 10, height - 40);
    text(`Glitch Intensity: ${intensity.toFixed(2)}`, 10, height - 20);

    // 3. Visual indicator for Intensity (the red bar)
    fill(255, 0, 0, 150);
    rect(10, 10, intensity * 5, 20);
    fill(255);
    noStroke();
    text('Intensity', (intensity * 5) + 15, 25);
}

function mousePressed() {
  if (!audioStarted) {
    // Start audio on user gesture
    userStartAudio().then(() => {
        mic.start();
        audioStarted = true;
    });
  }
}
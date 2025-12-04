let video; // Stores the camera feed
let mic;   // Stores the microphone input
let fft;   // Used for frequency analysis

// --- NEW CONSTANTS FOR SCREEN CROWDING ---
const NUM_BUBBLES_X = 15; // Number of bubbles horizontally
const NUM_BUBBLES_Y = 10; // Number of bubbles vertically
const TOTAL_BUBBLES = NUM_BUBBLES_X * NUM_BUBBLES_Y;

function setup() {
    createCanvas(windowWidth, windowHeight); 

    video = createCapture(VIDEO); 
    video.size(width, height);
    video.hide(); 

    mic = new p5.AudioIn();
    mic.start();

    fft = new p5.FFT();
    fft.setInput(mic);
}

function draw() {
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

    // Optional: Visualization of Intensity
    fill(255, 0, 0, 150);
    rect(10, 10, intensity * 5, 20);
}
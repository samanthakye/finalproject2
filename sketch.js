let video; // Stores the camera feed
let mic;   // Stores the microphone input
let fft;   // Used for frequency analysis

function setup() {
    // 1. Create the canvas to match the window size
    createCanvas(windowWidth, windowHeight); 

    // 2. Initialize Camera Feed (WebRTC)
    // capture: true enables both video and audio input
    video = createCapture(VIDEO); 
    video.size(width, height);
    video.hide(); // Hide the default HTML video element

    // 3. Initialize Microphone Input (Web Audio API)
    mic = new p5.AudioIn();
    mic.start();

    // 4. Initialize Fast Fourier Transform (FFT) for sound analysis
    // FFT gives us the frequency spectrum data (for glitch/reaction)
    fft = new p5.FFT();
    fft.setInput(mic);
}
function draw() {
    // 1. Analyze Sound Data
    // Get a number between 0 and 1 representing the current volume (amplitude)
    let volume = mic.getLevel(); 
    // Get the frequency spectrum (an array of values for low, mid, high sounds)
    let spectrum = fft.analyze(); 
    
    // Use the low-frequency energy (bass/loud sounds) to control the glitch intensity
    let bassEnergy = fft.getEnergy('bass');
    let intensity = map(bassEnergy, 0, 255, 0, 30); // Map bass to a distortion range

    // 2. Draw the Video Background
    // Puts the video on the canvas.
    image(video, 0, 0, width, height); 

    // 3. Apply the 'Hole Punch' Masking Effect
    
    // Set the blend mode to make the circles cut out the video below them.
    // The DIFFERENCE blend mode can create a similar inversion/hole effect
    // Alternatively, you could draw the circles in white and use the mask() function.
    blendMode(DIFFERENCE);

    noStroke();
    fill(255); // Draw circles in white

    let numBubbles = 10;
    for (let i = 0; i < numBubbles; i++) {
        // --- Reaction to Sound ---
        // Size: The volume directly affects the size of the circles.
        let circleSize = map(volume, 0, 1, 50, 300);
        
        // Position: Add noise based on sound intensity to create a 'glitch'
        let xOffset = map(noise(frameCount * 0.01 + i * 10), 0, 1, -intensity, intensity);
        let yOffset = map(noise(frameCount * 0.02 + i * 5), 0, 1, -intensity, intensity);

        let x = (width / numBubbles) * i + xOffset + (width / numBubbles) / 2;
        let y = height / 2 + yOffset; 
        
        // Draw the solid circle
        circle(x, y, circleSize);
    }
    
    // Reset blend mode for the rest of the drawing (important!)
    blendMode(BLEND); 

    // Optional: Draw a small box to visualize the current sound intensity
    fill(255, 0, 0, 150);
    rect(10, 10, intensity * 5, 20);
}
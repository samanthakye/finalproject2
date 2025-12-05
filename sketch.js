let mic;
let fft;
let audioStarted = false;

const NUM_BUBBLES_X = 30;
const NUM_BUBBLES_Y = 20;

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
        background(255);
        fill(0);
        text("Click to start audio", width / 2, height / 2);
        return;
    }

    background(255); // White background

    let volume = mic.getLevel(); 
    fft.analyze(); // Analyze the frequency spectrum
    
    let bassEnergy = fft.getEnergy('bass');
    let midEnergy = fft.getEnergy('mid');
    let trebleEnergy = fft.getEnergy('treble');
    
    // Intensity of movement is driven by a combination of bass and overall volume
    let intensity = constrain(map(bassEnergy + volume * 100, 0, 255, 0, 80), 0, 80);

    // Color of the dots is mapped to the energy in different frequency bands
    let r = map(bassEnergy, 0, 255, 100, 255);
    let g = map(midEnergy, 0, 255, 50, 200);
    let b = map(trebleEnergy, 0, 255, 150, 255);
    
    fill(r, g, b);
    noStroke();

    let xSpacing = width / NUM_BUBBLES_X;
    let ySpacing = height / NUM_BUBBLES_Y;

    for (let i = 0; i < NUM_BUBBLES_X; i++) {
        for (let j = 0; j < NUM_BUBBLES_Y; j++) {
            let baseSize = (xSpacing + ySpacing) / 2 * 1.2; 
            
            // The size of the circle is reactive to the overall volume
            let amplifiedVolume = min(volume * 5, 1.0); 
            let circleSize = map(amplifiedVolume, 0, 1, baseSize * 0.1, baseSize * 2.0);
            
            // The movement of the circle is based on Perlin noise, influenced by 'intensity'
            let xNoise = map(noise(frameCount * 0.01 + i * 10), 0, 1, -intensity, intensity);
            let yNoise = map(noise(frameCount * 0.02 + j * 5), 0, 1, -intensity, intensity);

            let x = (i * xSpacing) + (xSpacing / 2) + xNoise;
            let y = (j * ySpacing) + (ySpacing / 2) + yNoise; 
            
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
}

function userStartAudio() {
    if (getAudioContext().state !== 'running') {
        getAudioContext().resume();
    }
}
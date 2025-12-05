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
        
            let volume = mic.getLevel(); 
            let spectrum = fft.analyze(); 
            
            let bassEnergy = fft.getEnergy('bass');
            let midEnergy = fft.getEnergy('mid');
            let trebleEnergy = fft.getEnergy('treble');
            let intensity = map(bassEnergy, 0, 255, 0, 80);
        
            background(255); 
        
            blendMode(BLEND);
        
            let r = map(trebleEnergy, 0, 255, 0, 255);
            let g = map(midEnergy, 0, 255, 0, 255);
            let b = map(bassEnergy, 0, 255, 0, 255);
            
            fill(r, g, b);
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

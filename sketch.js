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
                    let circleSize = map(volume, 0, 1, baseSize * 0.5, baseSize * 1.5);
                    
                    let xNoise = map(noise(frameCount * 0.01 + i * 10), 0, 1, -intensity, intensity);
                    let yNoise = map(noise(frameCount * 0.02 + j * 5), 0, 1, -intensity, intensity);
        
                    let x = (i * xSpacing) + (xSpacing / 2) + xNoise;
                    let y = (j * ySpacing) + (ySpacing / 2) + yNoise; 
                    
                    circle(x, y, circleSize);
                }
            }
            
            blendMode(BLEND); 
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

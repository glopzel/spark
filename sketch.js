let mic;
let amplitude;

let particles = [];
let sparks = [];

const NUM_PARTICLES = 500;
const NUM_SPARKS = 120;

let volume = 0;
let energy = 0;

function setup() {

    createCanvas(
        windowWidth,
        windowHeight
    );

    background(0);

    mic = new p5.AudioIn();

    amplitude = new p5.Amplitude();

    userStartAudio();

    mic.start(() => {

        console.log("MIC STARTED");

        amplitude.setInput(mic);

    });

    for (let i = 0; i < NUM_PARTICLES; i++) {

        particles.push(
            new Particle()
        );
    }

    for (let i = 0; i < NUM_SPARKS; i++) {

        sparks.push(
            new Spark(
                random(width),
                random(height)
            )
        );
    }
}


function draw() {
    background(
        2,
        4,
        10,
        45
    );

    volume = amplitude.getLevel();


    /*
      Microphone levels are normally very small.
  
      We amplify the useful range.
  
      Change 0.025 if necessary:
  
      0.015 = more sensitive
      0.025 = normal
      0.050 = less sensitive
    */

    energy = map(
        volume,
        0.002,
        0.025,
        0,
        1
    );

    energy = constrain(
        energy,
        0,
        1
    );


    /*
      Non-linear response.
  
      This makes louder sounds much more
      dramatically different from quiet ones.
    */

    energy = pow(
        energy,
        0.35
    );

    for (let p of particles) {
        p.update(energy);
        p.display(energy);
    }


    for (let s of sparks) {
        s.update();
        s.display();
    }

    drawAudioMeter();
}

class Particle {

    constructor() {

        this.x = random(width);
        this.y = random(height);

        this.vx = random(-0.1, 0.1);
        this.vy = random(-0.1, 0.1);

        this.size = random(
            0.6,
            1.8
        );


        // Every particle reacts at a
        // slightly different volume.

        this.threshold = random(
            0.15,
            0.75
        );


        this.phase = random(
            TWO_PI
        );
    }


    update(sound) {
        let localEnergy = map(
            sound,
            this.threshold,
            1,
            0,
            1
        );

        localEnergy = constrain(
            localEnergy,
            0,
            1
        );

        // CHAOTIC FLOW FIELD
        let angle = noise(
            this.x * 0.004,
            this.y * 0.004,
            frameCount * 0.002
        ) * TWO_PI * 4;

        // SOUND → SPEED
        /*
          This is deliberately exaggerated.
    
          Quiet:
            very slow
    
          Loud:
            extremely fast
        */

        let targetSpeed = lerp(
            0.1,
            12,
            localEnergy
        );


        let targetVX =
            cos(angle) *
            targetSpeed;

        let targetVY =
            sin(angle) *
            targetSpeed;


        // How quickly the particle responds

        let response =
            0.02 +
            localEnergy * 0.4;


        this.vx = lerp(
            this.vx,
            targetVX,
            response
        );

        this.vy = lerp(
            this.vy,
            targetVY,
            response
        );

        // HIGH ENERGY JITTER
        if (localEnergy > 0.3) {

            this.vx +=
                random(-1, 1) *
                localEnergy *
                1.5;

            this.vy +=
                random(-1, 1) *
                localEnergy *
                1.5;
        }

        // MOVE
        this.x += this.vx;
        this.y += this.vy;

        // WRAP
        if (this.x < 0) {
            this.x = width;
        }

        if (this.x > width) {
            this.x = 0;
        }

        if (this.y < 0) {
            this.y = height;
        }

        if (this.y > height) {
            this.y = 0;
        }
    }


    display(sound) {
        // INDIVIDUAL ENERGY
        let localEnergy = map(
            sound,
            this.threshold,
            1,
            0,
            1
        );

        localEnergy = constrain(
            localEnergy,
            0,
            1
        );

        // COLOR
        let r;
        let g;
        let b;


        if (localEnergy < 0.35) {
            // COOL / WEAK
            r = 50;
            g = 110;
            b = 220;

        } else if (localEnergy < 0.7) {

            // ORANGE / HOT
            let t = map(
                localEnergy,
                0.35,
                0.7,
                0,
                1
            );


            r = 255;

            g = lerp(
                100,
                210,
                t
            );

            b = lerp(
                20,
                60,
                t
            );

        } else {
            // WHITE / VERY ENERGETIC
            let t = map(
                localEnergy,
                0.7,
                1,
                0,
                1
            );


            r = 255;

            g = lerp(
                210,
                255,
                t
            );

            b = lerp(
                80,
                255,
                t
            );
        }

        // BRIGHTNESS
        let brightness = lerp(
            70,
            255,
            localEnergy
        );


        noStroke();

        // GLOW
        fill(
            r,
            g,
            b,
            15 +
            localEnergy * 50
        );

        circle(
            this.x,
            this.y,
            this.size *
            (3 + localEnergy * 9)
        );

        // PARTICLE CORE
        fill(
            r,
            g,
            b,
            brightness
        );

        circle(
            this.x,
            this.y,
            this.size +
            localEnergy * 1.5
        );
    }
}

class Spark {

    constructor(x, y) {

        this.x = x;
        this.y = y;

        this.age = random(
            0,
            20
        );

        this.life = random(
            8,
            20
        );

        this.createArcs();
    }


    createArcs() {

        this.arcs = [];

        // FIXED SPARK COMPLEXITY
        let count = floor(
            random(7, 13)
        );


        for (let i = 0; i < count; i++) {

            this.arcs.push(
                new ElectricArc(
                    this.x,
                    this.y,
                    random(TWO_PI),
                    random(3, 9)
                )
            );
        }
    }


    update() {

        this.age++;


        for (let arc of this.arcs) {

            arc.update();
        }

        // RESTART SPARK
        if (this.age >= this.life) {

            this.x = random(width);
            this.y = random(height);

            this.age = 0;

            this.life = random(
                8,
                20
            );

            this.createArcs();
        }
    }


    display() {

        let fade = map(
            this.age,
            0,
            this.life,
            1,
            0
        );

        // TINY GLOW
        noStroke();

        fill(
            50,
            150,
            255,
            25 * fade
        );

        circle(
            this.x,
            this.y,
            14
        );

        // ELECTRIC ARCS
        for (let arc of this.arcs) {

            arc.display(
                fade
            );
        }

        // HOT CORE
        fill(
            255,
            255,
            255,
            255 * fade
        );

        circle(
            this.x,
            this.y,
            2
        );
    }
}

// ELECTRIC ARC
class ElectricArc {

    constructor(
        x,
        y,
        angle,
        length
    ) {

        this.points = [];

        let px = x;
        let py = y;


        let steps = max(
            3,
            floor(length / 1.5)
        );


        for (
            let i = 0;
            i < steps;
            i++
        ) {

            this.points.push({
                x: px,
                y: py
            });


            px +=
                cos(angle) *
                1.5;

            py +=
                sin(angle) *
                1.5;

            // ELECTRICAL JAGGEDNESS
            angle += random(
                -0.9,
                0.9
            );
        }


        this.alpha = random(
            150,
            255
        );
    }


    update() {

        // Flicker

        this.alpha += random(
            -120,
            120
        );

        this.alpha = constrain(
            this.alpha,
            20,
            255
        );
    }


    display(fade) {

        let a =
            this.alpha *
            fade;


        // BLUE PLASMA GLOW
        noFill();

        stroke(
            30,
            120,
            255,
            a * 0.25
        );

        strokeWeight(3);

        this.draw();

        // WHITE ELECTRIC CORE
        stroke(
            220,
            245,
            255,
            a
        );

        strokeWeight(
            0.8
        );

        this.draw();
    }


    draw() {

        beginShape();

        for (
            let p of this.points
        ) {

            vertex(
                p.x,
                p.y
            );
        }

        endShape();
    }
}


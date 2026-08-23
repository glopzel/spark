let mic;
let amplitude;

let particles = [];
let sparks = [];
let waves = [];

const NUM_PARTICLES = 500;
const NUM_SPARKS = 120;
const MAX_WAVES = 12;

let volume = 0;
let energy = 0;

const ENERGY_EXPONENT = 0.7;

let lastWave = 0;


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
      Higher value = more sensitive
      to quiet sounds.

      0.35 = very sensitive
      0.7  = balanced
      1.0  = quiet until louder sound
    */

    energy = pow(
        energy,
        ENERGY_EXPONENT
    );

    let waveInterval = map(
        energy,
        0,
        1,
        1000,
        150
    );

    if (
        energy > 0.15 &&
        millis() - lastWave > waveInterval &&
        waves.length < MAX_WAVES
    ) {
        createWave();
        lastWave = millis();
    }

    for (let p of particles) {
        p.update();
        p.display();
    }

    for (
        let i = waves.length - 1;
        i >= 0;
        i--
    ) {

        waves[i].update();
        waves[i].display();

        if (waves[i].dead()) {
            waves.splice(i, 1);
        }
    }

    for (let s of sparks) {

        s.update(energy);

        s.display(energy);
    }
}

function createWave() {

    let x = random(width);
    let y = random(height);

    waves.push(
        new Wave(
            x,
            y
        )
    );
}

class Wave {

    constructor(x, y) {

        this.x = x;
        this.y = y;

        this.radius = 0;

        this.speed = random(
            3,
            7
        );

        this.maxRadius =
            dist(
                this.x,
                this.y,
                0,
                0
            ) +
            max(
                width,
                height
            );

        this.strength = random(
            20,
            45
        );

        this.life = 255;
    }


    update() {

        this.radius += this.speed;

        this.life -= 1.5;
    }


    display() {

        /*
          The wave itself is invisible.

          It only pushes particles.

          This keeps the visual clean.
        */
    }


    dead() {

        return (
            this.radius >
            this.maxRadius
        );
    }
}

class Particle {

    constructor() {

        this.x = random(width);
        this.y = random(height);

        this.vx = random(
            -0.2,
            0.2
        );

        this.vy = random(
            -0.2,
            0.2
        );

        // Fixed size

        this.size = random(
            0.6,
            1.8
        );

        this.brightness = 20;
    }


    update() {

        let forceX = 0;
        let forceY = 0;
        let strongestWave = 0;

        for (let wave of waves) {

            let dx =
                this.x -
                wave.x;

            let dy =
                this.y -
                wave.y;

            let distance =
                sqrt(
                    dx * dx +
                    dy * dy
                );


            // Distance from the moving wavefront

            let difference =
                abs(
                    distance -
                    wave.radius
                );


            let influence =
                map(
                    difference,
                    0,
                    35,
                    1,
                    0
                );


            influence =
                constrain(
                    influence,
                    0,
                    1
                );


            if (influence > 0) {

                let angle =
                    atan2(
                        dy,
                        dx
                    );


                let force =
                    influence *
                    wave.strength;

                forceX +=
                    cos(angle) *
                    force;

                forceY +=
                    sin(angle) *
                    force;


                strongestWave =
                    max(
                        strongestWave,
                        influence
                    );
            }
        }

        this.vx +=
            forceX *
            0.015;

        this.vy +=
            forceY *
            0.015;

        this.vx *= 0.985;

        this.vy *= 0.985;

        let speedBoost =
            lerp(
                0.2,
                3,
                energy
            );


        this.vx *= speedBoost;
        this.vy *= speedBoost;

        this.x += this.vx;
        this.y += this.vy;

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

        let targetBrightness =
            60 + // strting point brightness
            strongestWave * 245;
        // Sound makes particles more visible,
        // but NOT larger.
        targetBrightness *=
            lerp(
                0.5,
                1,
                energy
            );


        this.brightness =
            lerp(
                this.brightness,
                targetBrightness,
                0.2
            );
    }


    display() {

        noStroke();

        fill(
            255,
            this.brightness
        );

        circle(
            this.x,
            this.y,
            this.size
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

        this.energy = 0;

        this.createArcs();
    }


    createArcs() {

        this.arcs = [];

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


    update(sound) {
        this.energy = sound;
        this.age++;

        for (let arc of this.arcs) {
            arc.update();
        }

        let sparkSpeed = lerp(
            0.15,
            2,
            sound
        );


        this.age += sparkSpeed;


        // ==================================
        // RESTART SPARK
        // ==================================

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


    display(sound) {

        // ==================================
        // NATURAL SPARK FADE
        // ==================================

        let fade = map(
            this.age,
            0,
            this.life,
            1,
            0
        );


        fade = constrain(
            fade,
            0,
            1
        );

        let audioVisibility = map(
            sound,
            0,
            1,
            0.02,
            1
        );


        audioVisibility =
            constrain(
                audioVisibility,
                0.02,
                1
            );


        let finalAlpha =
            fade *
            audioVisibility;

        noStroke();

        fill(
            255,
            25 *
            finalAlpha
        );


        circle(
            this.x,
            this.y,
            14
        );

        for (let arc of this.arcs) {

            arc.display(
                finalAlpha
            );
        }

        fill(
            255,
            255 *
            finalAlpha
        );


        circle(
            this.x,
            this.y,
            2
        );
    }
}

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
            floor(
                length / 1.5
            )
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


            // Jagged electrical movement

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


        this.alpha =
            constrain(
                this.alpha,
                20,
                255
            );
    }


    display(fade) {

        let a =
            this.alpha *
            fade;

        noFill();

        stroke(
            255,
            a * 0.15
        );

        strokeWeight(3);

        this.draw();

        stroke(
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

function windowResized() {

    resizeCanvas(
        windowWidth,
        windowHeight
    );
}

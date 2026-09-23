// controle com as setinhas
const keys = {};

document.addEventListener("keydown", (event) => {

    if (
        event.key === "ArrowUp" ||
        event.key === "ArrowDown" ||
        event.key === "ArrowLeft" ||
        event.key === "ArrowRight"
    ) {

        event.preventDefault();

        keys[event.key] = true;
    }
});

document.addEventListener("keyup", (event) => {

    keys[event.key] = false;
});

class Scene {
    constructor(gl, program) {
        this.renderer = new Renderer(gl, program);

        // Figura que será exibida
        this.helicopterBody = new HelicopterBody();
        this.helicopterTopShaft = new HelicopterTopShaft();
        this.helicopterTail = new HelicopterTail();
        this.helicopterPropellers = new HelicopterPropellers();
        this.helicopterTailPropeller = new HelicopterTailPropeller();
     
        //posição do helicoptero
        this.positionX = 0.0;
        this.positionY = 0.0;

        //rotação das hélices
        this.propellerAngle = 0.0;
        this.tailPropellerAngle = 0.0;
    }

    update() {
        const speed = 0.01;

        if (keys["ArrowUp"]) this.positionY += speed;
        if (keys["ArrowDown"]) this.positionY -= speed;
        if (keys["ArrowLeft"]) this.positionX -= speed;
        if (keys["ArrowRight"]) this.positionX += speed;

        this.propellerAngle += 0.05;
        this.tailPropellerAngle += 0.07;

        // Transformação da posição do helicóptero
        const helicopterTransform = m4.translation(this.positionX, this.positionY, 0);

        this.helicopterBody.update(helicopterTransform);
        this.helicopterTopShaft.update(helicopterTransform);
        this.helicopterTail.update(helicopterTransform);

        // Hélice superior
        let propellerTransform = m4.translation(this.positionX, this.positionY, 0);
        propellerTransform = m4.multiply(propellerTransform, m4.translation(0, 0.35, 0));
        propellerTransform = m4.multiply(propellerTransform, m4.yRotation(this.propellerAngle));
        propellerTransform = m4.multiply(propellerTransform, m4.translation(0, -0.35, 0));

        this.helicopterPropellers.update(propellerTransform);

        // Hélice da cauda
        let tailPropellerTransform = m4.translation(this.positionX, this.positionY, 0);
        tailPropellerTransform = m4.multiply(tailPropellerTransform, m4.translation(0.7, 0, 0.06));
        tailPropellerTransform = m4.multiply(tailPropellerTransform, m4.zRotation(this.tailPropellerAngle));
        tailPropellerTransform = m4.multiply(tailPropellerTransform, m4.translation(-0.7, 0, -0.06));

        this.helicopterTailPropeller.update(tailPropellerTransform);
    }

    draw() {
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);

        this.helicopterBody.draw(this.renderer);
        this.helicopterTopShaft.draw(this.renderer);
        this.helicopterTail.draw(this.renderer);
        this.helicopterPropellers.draw(this.renderer);
        this.helicopterTailPropeller.draw(this.renderer);
    }

    execute() {
        this.update();
        this.draw();

        requestAnimationFrame(() => this.execute());
    }

    init() {
        requestAnimationFrame(() => this.execute());
    }
}
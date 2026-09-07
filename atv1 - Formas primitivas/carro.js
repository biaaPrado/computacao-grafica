(function(){
    const canvas = document.getElementById("canvas1");
    const gl = canvas.getContext("webgl2");

    if (!gl) { throw new Error("WebGL 2 não é suportado."); }

    //1. Gera formas utilizadas

    function gerarArco(cx, cy, raio, anguloInicio, AnguloFim, segmentos){
        const pontos = [];
        const a0 = (anguloInicio*Math.PI)/180;
        const a1 = (AnguloFim*Math.PI)/180;

        for(let i = 0; i <= segmentos; i++){
            const t = i/segmentos;
            const angulo = a0 + (a1-a0)*t;
            const x = cx + Math.cos(angulo) * raio;
            const y = cy + Math.sin(angulo) * raio;
            pontos.push(x, y);
        }
        return pontos;
    }

    function gerarTrapezio(cx, cy, baseSuperior, baseInferior, altura) {
        const h = altura / 2;
        const bs = baseSuperior / 2;
        const bi = baseInferior / 2;

        return [
            cx - bi, cy - h,
            cx + bi, cy - h,
            cx + bs, cy + h,
            cx - bs, cy + h
        ];
    }

    function gerarCirculo(cx, cy, raio, segmentos){
        const pontos = [cx, cy]; //centro do círculo

        for (let i = 0; i <= segmentos; i++) {
            const angulo = (i / segmentos) * 2 * Math.PI;
            const x = cx + raio * Math.cos(angulo);
            const y = cy + raio * Math.sin(angulo);
            pontos.push(x, y);
        }

        return pontos;
    }

    //2. Desenha com base nos pontos
    const desenho = [];
    const corPreta = [0.1, 0.1, 0.1, 1.0];
    const corCarroceria =  [0.85, 0.25, 0.25, 1.0];
    const corJanela = [0.4, 0.75, 0.85, 1.0];     
    const corPneu = [0.15, 0.15, 0.15, 1.0];
    const corAro = [0.8, 0.8, 0.8, 1.0];

    //medidas
    const xEsq = -0.75, xDir = 0.75;
    const yBase = -0.28, yTopo = 0.12;
    const raioCanto = 0.09;
    const alturaTeto = 0.34;
    const cyTeto = yTopo + alturaTeto / 2;

    const CantoInfEsq = gerarArco(xEsq + raioCanto, yBase + raioCanto, raioCanto, 180, 270, 8);
    const CantoInfDir = gerarArco(xDir - raioCanto, yBase + raioCanto, raioCanto, 270, 360, 8);
    const CantoSupDir = gerarArco(xDir - raioCanto, yTopo - raioCanto, raioCanto, 0, 90, 8);
    const CantoSupEsq = gerarArco(xEsq + raioCanto, yTopo - raioCanto, raioCanto, 90, 180, 8);

    //chaci do carro
    const teto = gerarTrapezio(0.07, cyTeto, 0.4, 1, alturaTeto);

    const carroceria = [
        ...CantoInfEsq,
        ...CantoInfDir,
        ...CantoSupDir,
        ...CantoSupEsq
    ];

    desenho.push({
        vertice: carroceria, cor: corCarroceria, tipo: "FAN"
    });
    desenho.push({
        vertice: carroceria, cor: corPreta, tipo: "LINE_LOOP"
    });

    desenho.push({
        vertice: teto, cor: corCarroceria, tipo: "FAN"
    });

    desenho.push({
        vertice: teto, cor: corPreta, tipo: "LINE_LOOP"
    });

    //janela
    const janela = gerarTrapezio(0.07, 0.31, 0.3, 0.66, 0.2);

    desenho.push({ vertice: janela, cor: corJanela, tipo: "FAN" });
    desenho.push({ vertice: janela, cor: corPreta, tipo: "LINE_LOOP" });
    desenho.push({ vertice: [0.07, 0.20, 0.07, 0.42], cor: corPreta, tipo: "LINE_STRIP" });

    //maçaneta
    desenho.push({ vertice: [0.02, 0.02, -0.12, 0.02], cor: [1, 1, 1, 1], tipo: "LINE_STRIP" });
    desenho.push({ vertice: [0.25, 0.02,  0.39, 0.02], cor: [1, 1, 1, 1], tipo: "LINE_STRIP" });

    //rodas
    for (const cx of [-0.42, 0.42]) {
        desenho.push({ 
            vertice: gerarCirculo(cx, yBase, 0.19, 28), 
            cor: corPneu, tipo: "FAN" 
        });
        desenho.push({ 
            vertice: gerarCirculo(cx, yBase, 0.19, 28).slice(2), 
            cor: corPreta, tipo: "LINE_LOOP" 
        });
 
        desenho.push({ 
            vertice: gerarCirculo(cx, yBase, 0.09, 20), 
            cor: corAro, tipo: "FAN" 
        });
        desenho.push({ 
            vertice: gerarCirculo(cx, yBase, 0.09, 20).slice(2), 
            cor: corPreta, tipo: "LINE_LOOP"
        });
    }

    //farol
    desenho.push({
        vertice: gerarCirculo(-0.67, 0.02, 0.088, 32),
        cor: [1.0, 1.0, 0.0, 1.0], tipo: "FAN"
    });
    desenho.push({
        vertice: gerarCirculo(-0.67, 0.02, 0.088, 32).slice(2),
        cor: corPreta, tipo: "LINE_LOOP"
    });

    desenho.push({
        vertice: gerarCirculo(0.68, 0.02, 0.067, 32),
        cor: [1.0, 1.0, 0.0, 1.0], tipo: "FAN"
    });
    desenho.push({
        vertice: gerarCirculo(0.68, 0.02, 0.067, 32).slice(2),
        cor: corPreta, tipo: "LINE_LOOP"
    });


    //3. Cria e compila os Shaders
    const vertexShaderSource = `#version 300 es
    in vec2 aPosition;
    
    void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;

    const fragmentShaderSource = `#version 300 es
    precision mediump float;
    uniform vec4 uColor;
    out vec4 outColor;

    void main(){
        outColor = uColor;
    }`;

    function compileShader(gl, source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Erro ao compilar o shader: " + error);
        }

        return shader;
    }

    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    // 4.Cria e vincula o programa de shaders
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const colorUniformLocation = gl.getUniformLocation(program, "uColor");

    //5. Limpa a tela
    gl.clearColor(0.619, 0.968, 0.619, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //6. Buffers
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.lineWidth(3);

    //7. Desenha
    for (const item of desenho){
        const dados = new Float32Array(item.vertice);

        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, dados, gl.STATIC_DRAW);

        gl.uniform4fv(colorUniformLocation, item.cor);
        const numVertices = dados.length / 2;

        let modo;
        if (item.tipo === "TRIANGLES") {
            modo = gl.TRIANGLES;
        } else if (item.tipo === "LINE_LOOP") {
            modo = gl.LINE_LOOP;
        } else if (item.tipo === "LINE_STRIP") {
            modo = gl.LINE_STRIP;
        }else{
            modo = gl.TRIANGLE_FAN;
        }

        gl.drawArrays(modo, 0, numVertices);
    }
})();
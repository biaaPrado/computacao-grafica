(function () {

    const canvas = document.getElementById("canvas2");
    const gl = canvas.getContext("webgl2");

    if (!gl) { throw new Error("WebGL 2 não é suportado."); }

    // 1. VÉRTICES

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

    function gerarPetalas(cx, cy, angulo, comprimento, largura, segmentos){
        const raioX = largura/2; 
        const raioY = comprimento/2; 
        const offsetY = raioY; //deslocamento vertical para que a pétala fique acima do centro

        const centroLocalX = -offsetY * Math.sin(angulo);
        const centroLocalY = offsetY * Math.cos(angulo);
        const pontos = [cx + centroLocalX, cy + centroLocalY]; //centro da pétala

        for (let i = 0; i <= segmentos; i++) {
            const t = (i/segmentos) * 2 * Math.PI; //ângulo de 0 a π
            const xLocal = raioX * Math.cos(t);
            const yLocal = raioY * Math.sin(t) + raioY; //desloca para cima

            const xRotacionado = cx + xLocal * Math.cos(angulo) - yLocal * Math.sin(angulo);
            const yRotacionado = cy + xLocal * Math.sin(angulo) + yLocal * Math.cos(angulo);

            pontos.push(xRotacionado, yRotacionado);
        }

        return pontos;
    }

    function gerarContornoPetala(cx, cy, angulo, comprimento, largura, segmentos){
        const pontos = gerarPetalas(cx, cy, angulo, comprimento, largura, segmentos);
        return pontos.slice(2);
    }

    function gerarFolha(cx, cy, angulo, comprimento, largura, segmentos){
        const pontos = [cx, cy];

        for (let i = 0; i <= segmentos; i++) {
            const t = (i / segmentos) * 2 * Math.PI; //ângulo de 0 a 2π

            const perfil = Math.sign(Math.sin(t)) * Math.pow(Math.abs(Math.sin(t)), 1.0); //perfil da folha
            
            const xLocal = perfil * (largura / 2);
            const yLocal = (1 - Math.cos(t)) * (comprimento / 2); //desloca para cima

            const xRotacionado = cx + xLocal * Math.cos(angulo) - yLocal * Math.sin(angulo);
            const yRotacionado = cy + xLocal * Math.sin(angulo) + yLocal * Math.cos(angulo);

            pontos.push(xRotacionado, yRotacionado);
        }
    
        return pontos;
    }

    function gerarContornoFolha(cx, cy, angulo, comprimento, largura, segmentos){
        const pontos = gerarFolha(cx, cy, angulo, comprimento, largura, segmentos);
        return pontos.slice(2);
    }

    function gerarDetalhesFolha(cx, cy, angulo, comprimento, largura, segmentos){
        const localY = comprimento;
        const x = cx - localY * Math.sin(angulo);
        const y = cy + localY * Math.cos(angulo);
        const pontos = [cx, cy, x, y];

        return pontos;
    }

    //monta desenho a partir dos pontos
    const desenho = [];
    const numPetalas = 15;
    const comprimentoPetala = 0.4;
    const larguraPetala = 0.12;

    desenho.push({ //caule
        vertices: [
            -0.02, -0.16,
            0.02, -0.16,
            -0.02, -0.9,

            0.02, -0.16,
            0.02, -0.9,
            -0.02, -0.9
        ],
        cor: [0.25, 0.7, 0.25, 1.0], // verde
        tipo: "TRIANGLES"
    });

    for (let i = 0; i < numPetalas; i++) { //repete para todas as pétalas
        const angulo = (i / numPetalas) * 2 * Math.PI;

        desenho.push({
            vertices: gerarPetalas(0.0, 0.0, angulo, comprimentoPetala, larguraPetala, 24), // pétalas
            cor: [1, 1, 0, 1.0], // amarelo
            tipo: "FAN"
        });

        desenho.push({
            vertices: gerarContornoPetala(0.0, 0.0, angulo, comprimentoPetala, larguraPetala, 24), // contorno das pétalas
            cor: [0.55, 0.27, 0.07, 1.0], // marrom
            tipo: "LINE_LOOP"
        });
    }

    desenho.push({
        vertices: gerarCirculo(0.0, 0.0, 0.13, 32), // centro da flor
        cor: [0.55, 0.27, 0.07, 1.0], // marrom
        tipo: "FAN"
    });

    desenho.push({ // contorno do centro da flor
        vertices: gerarCirculo(0.0, 0.0, 0.13, 32).slice(2),
        cor: [0, 0, 0, 1.0], // preto
        tipo: "LINE_LOOP"
    });

    const pontoFolha = { x: 0.0, y: -0.6 };
    const comprimentoFolha = 0.28;
    const larguraFolha = 0.16;

    const anguloFolha = -Math.PI / 2 + 0.5;

    desenho.push({
        vertices: gerarFolha(pontoFolha.x, pontoFolha.y, anguloFolha, comprimentoFolha, larguraFolha, 32), // folha
        cor: [0.25, 0.7, 0.25, 1.0], // verde
        tipo: "FAN"
    });

    desenho.push({
        vertices: gerarContornoFolha(pontoFolha.x, pontoFolha.y, anguloFolha, comprimentoFolha, larguraFolha, 32), // contorno da folha
        cor: [0.0, 0.392, 0.0, 0.7], // marrom
        tipo: "LINE_LOOP"
    });

    desenho.push({
        vertices: gerarDetalhesFolha(pontoFolha.x, pontoFolha.y, anguloFolha, comprimentoFolha, larguraFolha, 32), // detalhes da folha
        cor: [0.1, 0.45, 0.15, 1.0], // verde
        tipo: "LINE_STRIP"
    });

    // 2. CRIAR SHADERS
    const vertexShaderSource = `#version 300 es
    in vec2 aPosition;

    void main(){
        gl_Position = vec4(aPosition, 0.0, 1.0);
    }`;

    const fragmentShaderSource = `#version 300 es
    precision mediump float;
    uniform vec4 uColor;
    out vec4 outColor;

    void main(){
        outColor = uColor;
    }`;

    // 3. COMPILAR SHADERS
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

    // 4. CRIAR PROGRAMA 
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const colorUniformLocation = gl.getUniformLocation(program, "uColor");

    //5. LIMPAR A TELA
    gl.clearColor(0.67, 0.84, 0.84, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    //6. BUFFER
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    gl.useProgram(program);
    gl.lineWidth(3);

    //7. Desenha
    for (const item of desenho) {
        const dados = new Float32Array(item.vertices);

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
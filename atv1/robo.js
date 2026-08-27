(function(){
    const canvas = document.getElementById("canvas3");
    const gl = canvas.getContext("webgl2");

    if (!gl) { throw new Error("WebGL 2 não é suportado."); }

    // 1. Gerando as formas utilizadas no desenho
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

    function gerarRetangulo(cx, cy, largura, altura){
        const w = largura / 2;
        const h = altura / 2;
        return [
            cx + w, cy + h,
            cx - w, cy + h,
            cx - w, cy - h,
            cx + w, cy - h
        ];
    }

    function gerarLinha(x1, y1, x2, y2, largura){
        const dx = x2 - x1;
        const dy = y2 - y1;
        const comprimento = Math.hypot(dx, dy);
        const nx = (-dy / comprimento) * (largura / 2);
        const ny = (dx / comprimento) * (largura / 2);

        const p1 = [x1 + nx, y1 + ny];
        const p2 = [x1 - nx, y1 - ny];
        const p3 = [x2 - nx, y2 - ny];
        const p4 = [x2 + nx, y2 + ny];

        return {
            fill: [...p1, ...p2, ...p4, ...p2, ...p3, ...p4],
            contorno: [...p1, ...p2, ...p3, ...p4]
        };
    }

    //2. Monta desenho a partir dos pontos
    const desenho = [];
    const corPreta = [0.1, 0.1, 0.1, 1.0];
    const corCorpo = [0.85, 0.86, 0.88, 1.0];
    const corSombra = [0.65, 0.67, 0.7, 1.0];
    const corAmarelo = [1.0, 0.75, 0.1, 1.0];
    const corPescoco = [0.55, 0.65, 0.68, 1.0];

    //orelhas atras da cabeça
    for (const sinal of [-1, 1]) {
        desenho.push({
            vertice: gerarCirculo(sinal * 0.46, 0.05, 0.18, 24),
            cor: corSombra, 
            tipo: "FAN"
        });
        desenho.push({
            vertice: gerarCirculo(sinal * 0.46, 0.05, 0.18, 24).slice(2),
            cor: corPreta,
            tipo: "LINE_LOOP"
        });
    }

    desenho.push({
        vertice: gerarCirculo(0.0, 0.3, 0.18, 24),
        cor: corSombra, 
        tipo: "FAN"
    });
    desenho.push({
        vertice: gerarCirculo(0.0, 0.3, 0.18, 24).slice(2),
        cor: corPreta,
        tipo: "LINE_LOOP"
    });

    //antenas 
    const antenas = [
        {base: [-0.5, 0.23],  ponta: [-0.5, 0.6]},
        {base: [0.0, 0.475],    ponta: [0.0, 0.8]} ,
        {base: [0.5, 0.23],  ponta: [0.5, 0.6]},
    ];

    for (const antena of antenas) {
        const haste = gerarLinha(antena.base[0], antena.base[1], antena.ponta[0], antena.ponta[1], 0.025);
        desenho.push({
            vertice: haste.fill, cor: corPreta, tipo: "TRIANGLES"
        });

        desenho.push({
            vertice: haste.contorno, cor: corPreta, tipo: "LINE_LOOP"
        });
    }
    
    //pescoco
    const pescoco = gerarLinha(0.0, -0.15, 0.0, -0.55, 0.37);
    desenho.push({
        vertice: pescoco.fill, cor: corPescoco, tipo: "TRIANGLES"
    });
    desenho.push({
        vertice: pescoco.contorno, cor: corPreta, tipo: "LINE_LOOP"
    });

    //cabeça
    const cabeca = gerarRetangulo(0.0, 0.05, 0.9, 0.65);
    desenho.push({
        vertice: cabeca, cor: corCorpo, tipo: "TRIANGLE_FAN"
    });
    desenho.push({
        vertice: cabeca, cor: corPreta, tipo: "LINE_LOOP"
    });

    //ponta da antena
    for (const antena of antenas) {
        desenho.push({
            vertice: gerarCirculo(antena.ponta[0], antena.ponta[1], 0.07, 16),
            cor: corAmarelo, tipo: "FAN"
        });
        desenho.push({
            vertice: gerarCirculo(antena.ponta[0], antena.ponta[1], 0.07, 16).slice(2),
            cor: corPreta, tipo: "LINE_LOOP"
        });
    }

    //olhos 
    for (const sinal of [-1, 1]) {
        const cxOlho = sinal * 0.22;
        const cyOlho = 0.08;

        desenho.push({
            vertice: gerarCirculo(cxOlho, cyOlho, 0.11, 24),
            cor: [1, 1, 1, 1], tipo: "FAN"
        });
        desenho.push({
            vertice: gerarCirculo(cxOlho, cyOlho, 0.06, 24),
            cor: [0, 0, 0, 0], tipo: "FAN"
        });
        desenho.push({
            vertice: gerarCirculo(cxOlho, cyOlho, 0.11, 24).slice(2),
            cor: corPreta, tipo: "LINE_LOOP"
        });
    }

    //boca
    const boca = gerarRetangulo(0.0, -0.15, 0.34, 0.11);
    desenho.push({
        vertice: boca, cor: corPreta, tipo: "FAN"
    });

    const numDentes = 5;
    const larguraBoca = 0.30;
    for (let i = 0 ; i < numDentes; i++) {
        const x = -larguraBoca / 2 + (i + 0.5) * (larguraBoca / numDentes);
        const dente = gerarLinha(x, -0.11, x, -0.19, 0.035);
        desenho.push({
            vertice: dente.fill, cor: [1, 1, 1, 1], tipo: "TRIANGLES"
        });
    }

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
    gl.clearColor(1.0, 0.9, 0.55, 1.0);
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

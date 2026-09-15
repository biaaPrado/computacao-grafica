(function(){
    const canvas = document.getElementById("canvas");
    const gl = canvas.getContext("webgl2");

    if (!gl) {
        throw new Error("WebGL 2 não é suportado.");
    }

    // 1. GERA AS FORMAS UTILIZADAS
    function gerarCirculo(cx, cy, raio, segmentos){
        const pontos = [cx, cy];
        
        for(let i = 0; i <= segmentos; i++){
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

    // 2. CLASSE PARTE
    class Parte {
        constructor(vertices, cor, tipo){
            this.vertices = vertices;
            this.cor = cor;
            this.tipo = tipo;
        }

        desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matriz){
            const dados = new Float32Array(this.vertices);

            gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
            gl.bufferData(gl.ARRAY_BUFFER, dados, gl.STATIC_DRAW);
            gl.uniformMatrix3fv(matrixLocation, false, matriz);
            gl.uniform4fv(colorUniformLocation, this.cor);

            let modo;
            if(this.tipo === "TRIANGLES"){ modo = gl.TRIANGLES;
            }else if(this.tipo === "LINE_LOOP"){ modo = gl.LINE_LOOP;
            }else{ modo = gl.TRIANGLE_FAN;}

            gl.drawArrays(modo, 0, dados.length / 2);
        }
    }

    // 3. CLASSE ROBÔ
    class Robo {
        constructor(){
            this.corPreta = [0.08, 0.12, 0.14, 1.0];
            this.corAzul = [0.20, 0.65, 0.68, 1.0];
            this.corAzulEscuro = [0.12, 0.45, 0.48, 1.0];
            this.corBraco = [0.65, 0.70, 0.72, 1.0];
            this.corOlho = [0.08, 0.12, 0.14, 1.0];
            this.corBranco = [1.0, 1.0, 1.0, 1.0];

            this.corAmarelo = [1.0, 0.70, 0.15, 1.0];

            // CABEÇA
            this.cabeca = new Parte(gerarRetangulo(0, -0.04, 0.70, 0.48), this.corAzul, "FAN");
            this.contornoCabeca = new Parte(gerarRetangulo(0, -0.04, 0.70, 0.48), this.corPreta, "LINE_LOOP");

            // OLHOS
            this.olhoEsquerdo = new Parte(gerarCirculo(0, -0.04, 0.075, 24), this.corOlho, "FAN");
            this.olhoDireito = new Parte(gerarCirculo(0, -0.04, 0.075, 24), this.corOlho, "FAN");

            // brilho dos olhos
            this.brilhoEsquerdo = new Parte(gerarCirculo(0, -0.04, 0.025, 16), this.corBranco, "FAN");
            this.brilhoDireito = new Parte(gerarCirculo(0, -0.04, 0.025, 16), this.corBranco, "FAN");

            // BOCA
            this.boca = new Parte(gerarRetangulo(0, -0.04, 0.20, 0.035), this.corPreta, "FAN");

            // PESCOÇO
            this.pescoco = new Parte(gerarRetangulo(0, 0, 0.14, 0.14), this.corBraco, "FAN");
            this.contornoPescoco = new Parte(gerarRetangulo(0, 0, 0.14, 0.14), this.corPreta, "LINE_LOOP");

            // CORPO
            this.corpo = new Parte(gerarRetangulo(0, 0, 0.52, 0.60), this.corAzul, "FAN");
            this.contornoCorpo = new Parte(gerarRetangulo(0, 0, 0.52, 0.60), this.corPreta, "LINE_LOOP");

            // PAINEL
            this.painel = new Parte(gerarRetangulo(0, 0, 0.32, 0.23), this.corAzulEscuro, "FAN");
            this.contornoPainel = new Parte(gerarRetangulo(0, 0, 0.32, 0.23), this.corPreta, "LINE_LOOP");

            // BOTÕES
            this.botoes = [];
            const posicoesBotoes = [
                [-0.09, 0.05],
                [ 0.09, 0.05],
                [-0.09, -0.05],
                [ 0.09, -0.05]
            ];

            for(const posicao of posicoesBotoes){
                this.botoes.push(new Parte(gerarCirculo(0, 0, 0.025, 16), this.corAmarelo, "FAN"));
            }

            // BRAÇOS
            this.bracoEsquerdo = new Parte(gerarRetangulo(0, 0, 0.12, 0.42), this.corBraco, "FAN");
            this.contornoBracoEsquerdo = new Parte(gerarRetangulo(0, 0, 0.12, 0.42), this.corPreta, "LINE_LOOP");

            this.bracoDireito = new Parte(gerarRetangulo(0, 0, 0.12, 0.42), this.corBraco, "FAN");
            this.contornoBracoDireito = new Parte(gerarRetangulo(0, 0, 0.12, 0.42), this.corPreta, "LINE_LOOP");

            // MÃOS
            this.maoEsquerda = new Parte(gerarCirculo(0, 0, 0.075, 20), this.corAzulEscuro, "FAN");
            this.maoDireita = new Parte(gerarCirculo(0, 0, 0.075, 20), this.corAzulEscuro, "FAN");

            // PERNAS
            this.pernaEsquerda = new Parte(gerarRetangulo(0, 0, 0.15, 0.41), this.corBraco, "FAN");
            this.contornoPernaEsquerda = new Parte(gerarRetangulo(0, 0, 0.15, 0.41), this.corPreta, "LINE_LOOP");

            this.pernaDireita = new Parte(gerarRetangulo(0, 0, 0.15, 0.41), this.corBraco, "FAN");
            this.contornoPernaDireita = new Parte(gerarRetangulo(0, 0, 0.15, 0.41), this.corPreta, "LINE_LOOP");
           
            // PÉS
            this.peEsquerdo = new Parte(gerarRetangulo(0, 0, 0.22, 0.13), this.corAzul, "FAN");
            this.contornoPeEsquerdo = new Parte(gerarRetangulo(0, 0, 0.22, 0.13), this.corPreta, "LINE_LOOP");

            this.peDireito = new Parte(gerarRetangulo(0, 0, 0.22, 0.13), this.corAzul, "FAN");
            this.contornoPeDireito = new Parte(gerarRetangulo(0, 0, 0.22, 0.13), this.corPreta, "LINE_LOOP");

            // ANTENA
            this.antena = new Parte(gerarRetangulo(0, -0.04, 0.025, 0.12), this.corPreta, "FAN");
            this.luzAntena = new Parte(gerarCirculo(0, -0.04, 0.055, 20), this.corAmarelo, "FAN");
        }

        // DESENHA O ROBÔ
        desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, tempo){
            const identidade = m3.identity();
            
            // CORPO
            let matrizCorpo = m3.translate(identidade, 0, -0.10);
            this.corpo.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizCorpo);
            this.contornoCorpo.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizCorpo);

            // PESCOÇO
            let matrizPescoco = m3.translate(matrizCorpo, 0, 0.37);
            this.pescoco.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPescoco);
            this.contornoPescoco.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPescoco);

            // CABEÇA
            const movimentoCabeca = Math.sin(tempo * 0.002) * 0.10;
            let matrizCabeca = m3.translate(matrizCorpo, movimentoCabeca, 0.72);
            this.cabeca.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizCabeca);
            this.contornoCabeca.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizCabeca);

            // OLHO ESQUERDO
            let matrizOlhoEsquerdo = m3.translate(matrizCabeca, -0.18, 0.02);
            this.olhoEsquerdo.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizOlhoEsquerdo);
            
            let matrizBrilhoEsquerdo = m3.translate(matrizOlhoEsquerdo, -0.02, 0.02);
            this.brilhoEsquerdo.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizBrilhoEsquerdo);

            // OLHO DIREITO
            let matrizOlhoDireito = m3.translate(matrizCabeca, 0.18, 0.02);
            this.olhoDireito.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizOlhoDireito);

            let matrizBrilhoDireito = m3.translate(matrizOlhoDireito, -0.02, 0.02);
            this.brilhoDireito.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizBrilhoDireito);

            // BOCA
            let matrizBoca = m3.translate(matrizCabeca, 0, -0.12);
            this.boca.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizBoca);

            // ANTENA
            let matrizAntena = m3.translate(matrizCabeca, 0, 0.30);
            this.antena.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizAntena);

            let matrizLuzAntena = m3.translate(matrizCabeca, 0, 0.41);
            this.luzAntena.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizLuzAntena);

            // PAINEL
            let matrizPainel = m3.translate(matrizCorpo, 0, -0.02);
            this.painel.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPainel);
            this.contornoPainel.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPainel);

            // BOTÕES
            const posicoesBotoes = [
                [-0.09, 0.05],
                [ 0.09, 0.05],
                [-0.09, -0.05],
                [ 0.09, -0.05]
            ];

            for(let i = 0; i < this.botoes.length; i++){
                let matrizBotao = m3.translate(matrizPainel, posicoesBotoes[i][0], posicoesBotoes[i][1]);
                this.botoes[i].desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizBotao);
            }

            // ANIMAÇÃO DOS BRAÇOS
            const movimentoBracos = Math.sin(tempo * 0.002) * 0.10;

            // BRAÇO ESQUERDO
            let matrizBracoEsquerdo = m3.identity();
            matrizBracoEsquerdo = m3.translate(matrizBracoEsquerdo, 0, -0.21);
            matrizBracoEsquerdo = m3.rotate(matrizBracoEsquerdo, movimentoBracos);
            matrizBracoEsquerdo = m3.translate(matrizBracoEsquerdo, -0.33, 0.10);

            this.bracoEsquerdo.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizBracoEsquerdo);
            this.contornoBracoEsquerdo.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizBracoEsquerdo);

            // MÃO ESQUERDA
            let matrizMaoEsquerda = m3.translate(matrizBracoEsquerdo, 0, -0.25);
            this.maoEsquerda.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizMaoEsquerda);

            // BRAÇO DIREITO
            let matrizBracoDireito = m3.identity();
            matrizBracoDireito = m3.translate(matrizBracoDireito, 0, -0.21);
            matrizBracoDireito = m3.rotate(matrizBracoDireito, -movimentoBracos);
            matrizBracoDireito = m3.translate(matrizBracoDireito, 0.33, 0.10);

            this.bracoDireito.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizBracoDireito);
            this.contornoBracoDireito.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizBracoDireito);

            // MÃO DIREITA
            let matrizMaoDireita = m3.translate(matrizBracoDireito, 0, -0.25);
            this.maoDireita.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizMaoDireita);

            // PERNA ESQUERDA
            let matrizPernaEsquerda = m3.translate(matrizCorpo, -0.14, -0.50);
            this.pernaEsquerda.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPernaEsquerda);
            this.contornoPernaEsquerda.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPernaEsquerda);

            // PERNA DIREITA
            let matrizPernaDireita = m3.translate(matrizCorpo, 0.14, -0.50);
            this.pernaDireita.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPernaDireita);
            this.contornoPernaDireita.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPernaDireita);

            // PÉ ESQUERDO
            let matrizPeEsquerdo = m3.translate(matrizPernaEsquerda, 0, -0.27);
            this.peEsquerdo.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPeEsquerdo);
            this.contornoPeEsquerdo.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPeEsquerdo);

            // PÉ DIREITO
            let matrizPeDireito = m3.translate(matrizPernaDireita, 0, -0.27);
            this.peDireito.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPeDireito);
            this.contornoPeDireito.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, matrizPeDireito);
        }
    }

    // 4. SHADERS
    const vertexShaderSource = `#version 300 es

    in vec2 aPosition;
    uniform mat3 uMatrix;

    void main(){
        vec3 pos = uMatrix * vec3(aPosition, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);

    }`;

    const fragmentShaderSource = `#version 300 es

    precision mediump float;
    uniform vec4 uColor;
    out vec4 outColor;

    void main(){
        outColor = uColor;
    }`;

    // 5. COMPILA OS SHADERS
    function compileShader(gl, source, type){
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);

        if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error("Erro ao compilar o shader: " + error);
        }
        return shader;
    }

    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);

    // 6. PROGRAMA
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if(!gl.getProgramParameter(program, gl.LINK_STATUS)){
        throw new Error(gl.getProgramInfoLog(program));
    }

    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const colorUniformLocation = gl.getUniformLocation(program, "uColor");
    const matrixLocation = gl.getUniformLocation(program, "uMatrix");

    // 7. CONFIGURAÇÕES
    gl.clearColor(0.85, 0.90, 0.92, 1.0);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    gl.lineWidth(3);

    // 8. CRIA O ROBÔ
    const robo = new Robo();

    // 9. ANIMAÇÃO
    function desenhar(tempo){
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        robo.desenhar(gl, buffer, positionLocation, colorUniformLocation, matrixLocation, tempo);
        requestAnimationFrame(desenhar);
    }
    requestAnimationFrame(desenhar);
})();
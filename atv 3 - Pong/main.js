const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
    throw new Error("WebGL 2 não é suportado");
}

// ELEMENTOS DO HTML
const pontosJogador1 = document.getElementById("pontosJogador1");
const pontosJogador2 = document.getElementById("pontosJogador2");
const mensagemVencedor = document.getElementById("mensagemVencedor");
const botaoReiniciar = document.getElementById("botaoReiniciar");

// VERTICES
const verticesBarra = new Float32Array([
    -0.05,  0.20,
    -0.05, -0.20,
     0.05,  0.20,
     0.05,  0.20,
    -0.05, -0.20,
     0.05, -0.20
]);

const verticesBola = [];
const numSegments = 30;
const raioBola = 0.05;

for (let i = 0; i < numSegments; i++) {
    const angulo1 = (i / numSegments) * 2 * Math.PI;
    const angulo2 = ((i + 1) / numSegments) * 2 * Math.PI;

    verticesBola.push(0, 0,
        raioBola * Math.cos(angulo1),
        raioBola * Math.sin(angulo1),
        raioBola * Math.cos(angulo2),
        raioBola * Math.sin(angulo2)
    );
}

const verticesBolaCentro = new Float32Array(verticesBola);

// CORES
const corBarraEsquerda = new Float32Array([0.0, 1.0, 0.0]);
const corBarraDireita = new Float32Array([0.0, 0.0, 1.0]);
const corBola = new Float32Array([1.0, 0.0, 0.0]);

// TRANSFORMAÇÕES
let MbarraEsquerda = m3.translation(-0.9, 0.0);
let MbarraDireita = m3.translation(0.9, 0.0);
let MbolaCentro = m3.translation(0.0, 0.0);

// SHADER DE VÉRTICES
const vertexShaderSource = `#version 300 es

in vec2 aPosition;
uniform mat3 u_transform;

void main() {
    vec3 position = u_transform * vec3(aPosition, 1.0);
    gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

// SHADER DE FRAGMENTOS
const fragmentShaderSource = `#version 300 es

precision mediump float;
uniform vec3 uColor;
out vec4 outColor;

void main() {
    outColor = vec4(uColor, 1.0);
}
`;

// CRIAR SHADER
function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        throw new Error("Erro ao compilar shader");
    }
    return shader;
}

// SHADERS
const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

// PROGRAMA
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(program));
    throw new Error("Erro ao linkar programa");
}

gl.useProgram(program);

// LOCALIZAÇÕES
const positionLocation = gl.getAttribLocation(program, "aPosition");
const colorLocation = gl.getUniformLocation(program, "uColor");
const transformLocation = gl.getUniformLocation(program, "u_transform");

// BUFFER
const verticesBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// CONFIGURAÇÃO DO WEBGL
gl.clearColor(0.0, 0.0, 0.0, 1.0);

// JOGO
let tyBE = 0.0;
let tyBD = 0.0;
const velocidadeBarra = 0.02;
let teclas = {};

// PONTUAÇÃO
let pontuacaoJogador1 = 0;
let pontuacaoJogador2 = 0;
const pontosParaVencer = 5;
let jogoAtivo = true;

// BOLA
let txBola = 0.0;
let tyBola = 0.0;
let txBola_offset = 0.005;
let tyBola_offset = 0.005;

// TECLADO
document.addEventListener("keydown",
    function(event) {
        teclas[event.key] = true;
    }
);

document.addEventListener("keyup",
    function(event) {
        teclas[event.key] = false;
    }
);

// ATUALIZAR PLACAR
function atualizarPlacar() {
    pontosJogador1.textContent = pontuacaoJogador1;
    pontosJogador2.textContent = pontuacaoJogador2;
}

// RESETAR BOLA
function resetarBola(direcao) {
    txBola = 0.0;
    tyBola = 0.0;
    txBola_offset = 0.005 * direcao;
    tyBola_offset = Math.random() < 0.5 ? 0.005 : -0.005;
    MbolaCentro = m3.translation(txBola, tyBola);
}

// MARCAR PONTO
function marcarPonto(jogador) {
    if (!jogoAtivo) { return; }

    if (jogador === 1) { pontuacaoJogador1++;
    } else { pontuacaoJogador2++; }

    atualizarPlacar();

    // VERIFICAR VENCEDOR
    if (pontuacaoJogador1 >= pontosParaVencer) {
        mensagemVencedor.textContent = "Jogador 1 venceu!";
        jogoAtivo = false;
        return;
    }

    if (pontuacaoJogador2 >= pontosParaVencer) {
        mensagemVencedor.textContent = "Jogador 2 venceu!";
        jogoAtivo = false;
        return;
    }

    // REINICIAR BOLA
    if (jogador === 1) { resetarBola(1); } else { resetarBola(-1); }
}

// REINICIAR JOGO
function reiniciarJogo() {
    pontuacaoJogador1 = 0;
    pontuacaoJogador2 = 0;

    tyBE = 0.0;
    tyBD = 0.0;

    mensagemVencedor.textContent = "";
    jogoAtivo = true;

    atualizarPlacar();

    resetarBola(Math.random() < 0.5 ? -1 : 1);
    MbarraEsquerda = m3.translation(-0.9, tyBE);
    MbarraDireita = m3.translation(0.9, tyBD);
}

botaoReiniciar.addEventListener("click", reiniciarJogo);

// DESENHAR BARRA ESQUERDA
function drawBarraEsquerda() {
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesBarra, gl.STATIC_DRAW);
    gl.uniform3fv(colorLocation, corBarraEsquerda);
    gl.uniformMatrix3fv(transformLocation, false, MbarraEsquerda);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// DESENHAR BARRA DIREITA
function drawBarraDireita() {
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesBarra, gl.STATIC_DRAW);
    gl.uniform3fv(colorLocation, corBarraDireita);
    gl.uniformMatrix3fv(transformLocation, false, MbarraDireita);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

// DESENHAR BOLA
function drawBolaCentro() {
    gl.bindBuffer(gl.ARRAY_BUFFER, verticesBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, verticesBolaCentro, gl.STATIC_DRAW);
    gl.uniform3fv(colorLocation, corBola);
    gl.uniformMatrix3fv(transformLocation, false, MbolaCentro);
    gl.drawArrays(gl.TRIANGLES, 0, verticesBolaCentro.length / 2);
}

// ATUALIZAR ANIMAÇÃO
function atualizaAnimacao() {
    if (!jogoAtivo) { return; }

    // JOGADOR 1
    if (teclas["w"] || teclas["W"]) { tyBE += velocidadeBarra; }
    if (teclas["s"] || teclas["S"]) { tyBE -= velocidadeBarra; }

    // JOGADOR 2
    if (teclas["ArrowUp"]) { tyBD += velocidadeBarra; }
    if (teclas["ArrowDown"]) { tyBD -= velocidadeBarra; }

    // LIMITES DAS BARRAS
    if (tyBE > 0.8) { tyBE = 0.8; }
    if (tyBE < -0.8) { tyBE = -0.8; }
    if (tyBD > 0.8) { tyBD = 0.8; }
    if (tyBD < -0.8) { tyBD = -0.8; }

    // TRANSFORMAÇÕES
    MbarraEsquerda = m3.translation(-0.9, tyBE);
    MbarraDireita = m3.translation(0.9, tyBD);

    // MOVIMENTO DA BOLA
    txBola += txBola_offset;
    tyBola += tyBola_offset;

    // Colisão com teto e chão
    if (tyBola + raioBola >= 1.0) {
        tyBola = 1.0 - raioBola;
        tyBola_offset = -Math.abs(tyBola_offset);
    }

    if (tyBola - raioBola <= -1.0) {
        tyBola = -1.0 + raioBola;
        tyBola_offset = Math.abs(tyBola_offset);
    }

    // COLISÃO COM AS BARRAS

    // Barra esquerda
    if (txBola - raioBola <= -0.85 && txBola + raioBola >= -0.95 &&
        tyBola >= tyBE - 0.20 && tyBola <= tyBE + 0.20 && txBola_offset < 0
    ) {
        txBola = -0.85 + raioBola;
        txBola_offset = Math.abs(txBola_offset);
    }

    // Barra direita
    if (txBola + raioBola >= 0.85 && txBola - raioBola <= 0.95 &&
        tyBola >= tyBD - 0.20 && tyBola <= tyBD + 0.20 && txBola_offset > 0
    ) {
        txBola = 0.85 - raioBola;
        txBola_offset = -Math.abs(txBola_offset);
    }

    // PONTO DO JOGADOR 2
    if (txBola < -1.0) {
        marcarPonto(2);
        return;
    }

    // PONTO DO JOGADOR 1
    if (txBola > 1.0) {
        marcarPonto(1);
        return;
    }

    // ATUALIZAR BOLA
    MbolaCentro = m3.translation(txBola, tyBola);
}

// DESENHAR CENA
function drawScene() {
    atualizaAnimacao();
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(program);
    drawBarraEsquerda();
    drawBarraDireita();
    drawBolaCentro();
    requestAnimationFrame(drawScene);
}

// INICIAR JOGO
atualizarPlacar();
drawScene();
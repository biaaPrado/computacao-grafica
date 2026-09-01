const canvas = document.getElementById("canvas");
const gl = canvas.getContext("webgl2");

if (!gl) { throw new Error("WebGL 2 não é suportado"); }

//define a alteração de cores
const cores = [
     [0.0, 0.0, 1.0, 1.0], // 0 - azul (cor inicial)
    [1.0, 0.0, 0.0, 1.0], // 1 - vermelho
    [0.0, 1.0, 0.0, 1.0], // 2 - verde
    [1.0, 1.0, 0.0, 1.0], // 3 - amarelo
    [1.0, 0.0, 1.0, 1.0], // 4 - magenta
    [0.0, 1.0, 1.0, 1.0], // 5 - ciano
    [1.0, 0.5, 0.0, 1.0], // 6 - laranja
    [0.5, 0.0, 1.0, 1.0], // 7 - roxo
    [0.0, 0.0, 0.0, 1.0], // 8 - preto
    [0.5, 0.5, 0.5, 1.0]  // 9 - cinza
];

let corAtual = [...cores[0]];

//algoritmo de bresenham
function bresenham(x1, y1, x2, y2){
    const pontos = [];

    let dx = x2 - x1;
    let dy = y2 - y1;

    if (dx == 0 && dy == 0){
        pontos.push(x1, y1);
        return pontos;
    }

    if (Math.abs(dx) >= Math.abs(dy)){ //caso |m| <= 1: percorre X
        if (x1 > x2){ 
            [x1, x2] = [x2, x1];
            [y1, y2] = [y2, y1];
            dx = x2 - x1;
            dy = y2 - y1;
        }

        const passoY = dy >= 0 ? 1 : -1;
        dy = Math.abs(dy);

        let p = 2 * dy-dx; 
        const incInf = 2 * dy; //incremento inferior
        const incSup = 2 * (dy-dx); //incremento superior

        let x = x1, y = y1;
        pontos.push(x, y);

        while (x < x2){
            if (p < 0){
                p += incInf; //escolhe pixel na mesma linha
            }else{
                p += incSup;
                y += passoY; //escolhe o pixel na linha de cima/baixo
            }
            x++;
            pontos.push(x, y);
        }
    }else{ // caso |m|>1: percorre Y 
        if(y1 > y2){
            [x1, x2] = [x2, x1];
            [y1, y2] = [y2, y1];
            dx = x2 - x1;
            dy = y2 - y1;
        }

        const passoX = dx >= 0 ? 1 : -1;
        dx = Math.abs(dx);

        let p = 2 * dx - dy;
        const incEsq = 2 * dx;
        const incDir = 2 * (dx - dy);

        let x = x1, y = y1;
        pontos.push(x, y);

        while (y < y2){
            if (p < 0){
                p += incEsq; //escolhe pixel na mesma coluna
            }else{
                p += incDir;
                x += passoX; //escolhe o pixel na coluna do lado
            }
            y++;
            pontos.push(x, y);
        }
    }

    return pontos;
}

function convertePixel(px, py){
    const x = (px / canvas.width) * 2 - 1;
    const y = -((py / canvas.height) * 2 - 1);
    return [x, y];
}

// 2. CRIAR SHADERS
const vertexShaderSource = `#version 300 es
in vec2 aPosition;
uniform float uTamanhoPixel;

void main(){
    gl_Position = vec4(aPosition, 0.0, 1.0);
    gl_PointSize = uTamanhoPixel; 
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
const tamanhoPixelLocation = gl.getUniformLocation(program, "uTamanhoPixel");

const buffer = gl.createBuffer();

// estado da linha atual
let pontoInicial = {x:0, y:0};
let pontoFinal = {x:0, y:0};
let aguardarPrimeiroClique = true;

function redesenhar(){
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    const pixelsCanvas = bresenham(pontoInicial.x, pontoInicial.y, 
                                        pontoFinal.x, pontoFinal.y);
    const pixelsWebGL = [];

    for(let i = 0; i < pixelsCanvas.length; i+=2){
        const [x, y] = convertePixel(canvas, pixelsCanvas[i], pixelsCanvas[i+1]);
        pixelsWebGL.push(x, y);
    }

    const dados = new Float32Array(pixelsWebGL);

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
     gl.bufferData(gl.ARRAY_BUFFER, dados, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
 
    gl.useProgram(program);
    gl.uniform4fv(colorUniformLocation, corAtual);
    gl.uniform1f(tamanhoPixelLocation, 1.0); // 1 ponto = 1 pixel de tela
 
    const numPontos = dados.length / 2;
    gl.drawArrays(gl.POINTS, 0, numPontos);
}

//eventos do mouse
canvas.addEventListener("mousedown", (evento) => {
    const x = evento.offsetX;
    const y = evento.offsetY;

    if(aguardarPrimeiroClique){
        pontoInicial = {x, y};
        pontoFinal = {x, y};
    }else{
        pontoFinal = {x, y};
    }

    aguardarPrimeiroClique = !aguardarPrimeiroClique;
    redesenhar();
});

//eventos do teclado
window.addEventListener("keydown", (evento) => {
    const indice = parseInt(evento.key, 10);
    if( !isNaN(indice) && indice >= 0 && indice <= 9){
        corAtual = [...cores[indice]];
        redesenhar();
    }
});

//desenho inicial
redesenhar();
    
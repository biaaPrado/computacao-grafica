//funções que serão utilizadas em comum aos exercícios

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

function bresenhamTriangle(p1, p2, p3){
    const pontos = [];
    pontos.push(...bresenham(p1.x, p1.y, p2.x, p2.y));
    pontos.push(...bresenham(p2.x, p2.y, p3.x, p3.y));
    pontos.push(...bresenham(p3.x, p3.y, p1.x, p1.y));
    return pontos;
}

function convertePixel(canvas, px, py){
    const x = (px / canvas.width) * 2 - 1;
    const y = -((py / canvas.height) * 2 - 1);
    return [x, y];
}

function compileShader(gl, source, type){
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

function criarProgramaPadrao(gl) {
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
 
    const vertexShader = compileShader(gl, vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(gl, fragmentShaderSource, gl.FRAGMENT_SHADER);
 
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
 
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(gl.getProgramInfoLog(program));
    }
 
    return program;
}

// Paleta de cores compartilhada (teclas 0-9)
const PALETA_CORES = [
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
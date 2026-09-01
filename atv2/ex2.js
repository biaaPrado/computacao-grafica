//escolher reta ou triangulo a partir do teclado e trocar a cor

(function(){
    const canvas = document.getElementById("canvas2");
    const gl = canvas.getContext("webgl2");
    if (!gl) { throw new Error("WebGL 2 não é suportado."); }
 
    const program = criarProgramaPadrao(gl);
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const colorUniformLocation = gl.getUniformLocation(program, "uColor");
    const tamanhoPixelLocation = gl.getUniformLocation(program, "uTamanhoPixel");
    const buffer = gl.createBuffer();
 
    let corAtual = [...PALETA_CORES[0]];
 
    // "modo" ativo: 'reta' ou 'triangulo'
    let modo = "reta";
 
    // cliques acumulados pro modo atual
    let cliques = [];
 
    // pixels da figura mostrada atualmente (começa com a linha (0,0)-(0,0) pedida no enunciado)
    let pixelsAtuais = bresenham(0, 0, 0, 0);

    function redesenhaPixel(pixelsCanvas){
        gl.clearColor(1.0, 1.0, 1.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
 
        const pixelsWebGL = [];
        for (let i = 0; i < pixelsCanvas.length; i += 2) {
            pixelsWebGL.push(...convertePixel(canvas, pixelsCanvas[i], pixelsCanvas[i + 1]));
        }
 
        const dados = new Float32Array(pixelsWebGL);
 
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, dados, gl.STATIC_DRAW);
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
 
        gl.useProgram(program);
        gl.uniform4fv(colorUniformLocation, corAtual);
        gl.uniform1f(tamanhoPixelLocation, 2.0);
 
        gl.drawArrays(gl.POINTS, 0, dados.length / 2);
    }

    function redesenhar(){
        redesenhaPixel(pixelsAtuais);
    }

    canvas.addEventListener("mousedown", (evento) => {
        const ponto = {x: evento.offsetX, y: evento.offsetY};
        cliques.push(ponto);

        if (modo === "reta"){
            if (cliques.length === 1){
                pixelsAtuais = bresenham(cliques[0].x, cliques[0].y, cliques[0].x, cliques[0].y);
            } else if (cliques.length === 2){
                pixelsAtuais = bresenham(cliques[0].x, cliques[0].y, cliques[1].x, cliques[1].y);
                cliques = [];
            }
        }else if (modo === "triangulo"){
            if (cliques.length < 3){
                pixelsAtuais = [];
                for (let i = 0; i < cliques.length - 1; i++){
                    pixelsAtuais.push(...bresenham(cliques[i].x, cliques[i].y, cliques[i+1].x, cliques[i+1].y)); 
                }
                if (cliques.length === 1){
                    pixelsAtuais = bresenham(cliques[0].x, cliques[0].y, cliques[0].x, cliques[0].y);
                }
            }
            if (cliques.length === 3){
                pixelsAtuais = bresenhamTriangle(cliques[0], cliques[1], cliques[2]);
                cliques = [];
            }
        }
        redesenhar();
    });

    canvas.addEventListener("mouseenter", () => window.__canvasAtivo = 2);
 
    window.addEventListener("keydown", (evento) => {
        if (window.__canvasAtivo !== 2) return;
        const tecla = evento.key.toLowerCase();

        if (tecla === "r"){
            modo = "reta";
            cliques = [];
        }else if (tecla === "t"){
            modo = "triangulo";
            cliques = [];
        }else {
            const indice = parseInt(evento.key, 10);
            if(!isNaN(indice) && indice >= 0 && indice <= 9){
                corAtual = [...PALETA_CORES[indice]];
                redesenhar();
            }
        }
    });

    redesenhar();
})();
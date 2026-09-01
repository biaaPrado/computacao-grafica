//reta entre dois cliques, trocando de cor pelo teclado
(function(){
    const canvas = document.getElementById("canvas1");
    const gl = canvas.getContext("webgl2");
    if (!gl) { throw new Error("WebGL 2 não é suportado."); }
 
    const program = criarProgramaPadrao(gl);
    const positionLocation = gl.getAttribLocation(program, "aPosition");
    const colorUniformLocation = gl.getUniformLocation(program, "uColor");
    const tamanhoPixelLocation = gl.getUniformLocation(program, "uTamanhoPixel");
    const buffer = gl.createBuffer();
 
    let corAtual = [...PALETA_CORES[0]];

    // linha inicial (0,0)-(0,0), como pede o enunciado
    let pontoInicial = { x: 0, y: 0 };
    let pontoFinal = { x: 0, y: 0 };
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
            corAtual = [...PALETA_CORES[indice]];
            redesenhar();
        }
    });

    //desenho inicial
    redesenhar();
})();
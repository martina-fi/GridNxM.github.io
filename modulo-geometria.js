/*

    Tareas:
    ------

    1) Modificar a función "generarSuperficie" para que tenga en cuenta los parametros filas y columnas al llenar el indexBuffer
       Con esta modificación deberían poder generarse planos de N filas por M columnas

    2) Modificar la funcion "dibujarMalla" para que use la primitiva "triangle_strip"

    3) Crear nuevos tipos funciones constructoras de FIGURES

        3a) Crear la función constructora "Esfera" que reciba como parámetro el radio

        3b) Crear la función constructora "TuboSenoidal" que reciba como parámetro la amplitud de onda, longitud de onda, radio del tubo y altura.
        (Ver imagenes JPG adjuntas)
        
        
    Entrega:
    -------

    - Agregar una variable global que permita elegir facilmente que tipo de primitiva se desea visualizar [plano,esfera,tubosenoidal]
    
*/

var FIGURE = 'esfera';

var FIGURES = {
    plano: new Plano(3,3),
    esfera: new Esfera(1),
    tubosenoidal: new TuboSenoidal(0.3,0.1,1,4)
};

var superficie3D;
var mallaDeTriangulos;

var filas=100;
var columnas=100;


function crearGeometria(){

    superficie3D=FIGURES[FIGURE];
    mallaDeTriangulos=generarSuperficie(superficie3D,filas,columnas);
    
}

function dibujarGeometria(){

    dibujarMalla(mallaDeTriangulos);

}

function Plano(ancho,largo){

    this.getPosicion=function(u,v){

        var x=(u-0.5)*ancho;
        var z=(v-0.5)*largo;
        return new THREE.Vector3(x,0,z);
    }

    this.getNormal=function(u,v){
        return new THREE.Vector3(0,1,0);;
    }

    this.getCoordenadasTextura=function(u,v){
        return [u,v];
    }
}

// Utilizo la parametrización de la esfera. u: Theta, V: Phi
function Esfera(radio) {

    this.getPosicion=function(u,v) { 
        var x = radio*Math.cos(u*2*Math.PI)*Math.sin(v*Math.PI);
        var z = radio*Math.sin(u*2*Math.PI)*Math.sin(v*Math.PI);
        var y = radio*Math.cos(v*Math.PI);
        return new THREE.Vector3(x,y,z); 
    }

    this.getNormal=function(u,v) {
        var coords = this.getPosicion(u,v);
        var norm = radio*radio*Math.sin(v);
        var res = new THREE.Vector3(coords.x/norm,coords.y/norm,coords.z/norm);
        return res;
    }

    this.getCoordenadasTextura=function(u,v) {
        return [u,v];
    }
}

function TuboSenoidal(amplitud, long, radio, altura) {

    this.getPosicion=function(u,v) {
        var d = amplitud*Math.sin(v*2*Math.PI/long);
        var x = (radio + d)*Math.cos(2*Math.PI*u);
        var z = (radio + d)*Math.sin(2*Math.PI*u);
        var y = altura*(v-0.5);      
        var pos = new THREE.Vector3(x,y,z);                           
        return pos;
    }

    this.getNormal=function(u,v) {
        var norm = new THREE.Vector3()
        var d1 = this.getPosicion(u+.1,v);
        var d2 = this.getPosicion(u,v+.1);

        return norm.crossVectors(d1, d2);
    }

    this.getCoordenadasTextura=function(u,v) {
        return [u,v];
    }
}

function generarSuperficie(superficie,filas,columnas){
    
    positionBuffer = [];
    normalBuffer = [];
    uvBuffer = [];

    for (var i=0; i <= filas; i++) {
        for (var j=0; j <= columnas; j++) {

            var u=j/columnas;
            var v=i/filas;

            var pos=superficie.getPosicion(u,v);

            positionBuffer.push(pos.x);
            positionBuffer.push(pos.y);
            positionBuffer.push(pos.z);

            var nrm=superficie.getNormal(u,v);

            normalBuffer.push(nrm.x);
            normalBuffer.push(nrm.y);
            normalBuffer.push(nrm.z);

            var uvs=superficie.getCoordenadasTextura(u,v);

            uvBuffer.push(uvs[0]);
            uvBuffer.push(uvs[1]);

        }
    }

    // Buffer de indices de los triángulos
    var colsVert = columnas + 1;
    
    indexBuffer=[];
    
    for (i=0; i < filas; i++) {
        for (j=0; j <= columnas; j++) {
            indexBuffer.push(i*colsVert + j);
            indexBuffer.push((i+1)*colsVert + j);
        }
    }
    // Creación e Inicialización de los buffers

    webgl_position_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_position_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positionBuffer), gl.STATIC_DRAW);
    webgl_position_buffer.itemSize = 3;
    webgl_position_buffer.numItems = positionBuffer.length / 3;

    webgl_normal_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_normal_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normalBuffer), gl.STATIC_DRAW);
    webgl_normal_buffer.itemSize = 3;
    webgl_normal_buffer.numItems = normalBuffer.length / 3;

    webgl_uvs_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, webgl_uvs_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(uvBuffer), gl.STATIC_DRAW);
    webgl_uvs_buffer.itemSize = 2;
    webgl_uvs_buffer.numItems = uvBuffer.length / 2;


    webgl_index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, webgl_index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indexBuffer), gl.STATIC_DRAW);
    webgl_index_buffer.itemSize = 1;
    webgl_index_buffer.numItems = indexBuffer.length;

    return {
        webgl_position_buffer,
        webgl_normal_buffer,
        webgl_uvs_buffer,
        webgl_index_buffer
    }
}

function dibujarMalla(mallaDeTriangulos){
    
    // Se configuran los buffers que alimentaron el pipeline
    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_position_buffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, mallaDeTriangulos.webgl_position_buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_uvs_buffer);
    gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, mallaDeTriangulos.webgl_uvs_buffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mallaDeTriangulos.webgl_normal_buffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, mallaDeTriangulos.webgl_normal_buffer.itemSize, gl.FLOAT, false, 0, 0);
       
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mallaDeTriangulos.webgl_index_buffer);


    if (modo!="wireframe"){
        gl.uniform1i(shaderProgram.useLightingUniform,(lighting=="true"));                    
        /*
            Aqui es necesario modificar la primitiva por triangle_strip
        */
        gl.drawElements(gl.TRIANGLE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
    
    if (modo!="smooth") {
        gl.uniform1i(shaderProgram.useLightingUniform,false);
        gl.drawElements(gl.LINE_STRIP, mallaDeTriangulos.webgl_index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
    }
 
}


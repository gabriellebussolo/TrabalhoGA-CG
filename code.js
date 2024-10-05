window.onload = function() {
    const canvas = document.getElementById('glCanvas');
    const gl = canvas.getContext('webgl');

    if (!gl) {
        console.error('WebGL not supported');
        return;
    }

    // Vertex Shader
    const vertexShaderSource = `
        attribute vec4 aPosition;
        attribute vec4 aColor;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;
        varying vec4 vColor;
        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aPosition;
            vColor = aColor;
        }
    `;
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);

    // Fragment Shader
    const fragmentShaderSource = `
        precision mediump float;
        varying vec4 vColor;
        void main(void) {
            gl_FragColor = vColor;
        }
    `;
    const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);

    // Shader Program
    const shaderProgram = createProgram(gl, vertexShader, fragmentShader);
    gl.useProgram(shaderProgram);

    // Pyramid vertices and colors
    const vertices = new Float32Array([
        // Base (two triangles)
        // Triangle 1
        -1, -1, -1,  1, 1, 0, 1, // Vertex 0
        1, -1, -1,  1, 1, 0, 1, // Vertex 1
        1, -1,  1,  1, 1, 0, 1, // Vertex 2

        // Triangle 2
        -1, -1, -1,  1, 1, 0, 1, // Vertex 0
        1, -1,  1,  1, 1, 0, 1, // Vertex 2
        -1, -1,  1,  1, 1, 0, 1, // Vertex 3

        // Sides
        // Face 1 (Red)
        -1, -1, -1,  1, 0, 0, 1, // Vertex 0
        1, -1, -1,  1, 0, 0, 1, // Vertex 1
        0,  1,  0,  1, 0, 0, 1, // Apex

        // Face 2 (Green)
        1, -1, -1,  0, 1, 0, 1, // Vertex 1
        1, -1,  1,  0, 1, 0, 1, // Vertex 2
        0,  1,  0,  0, 1, 0, 1, // Apex

        // Face 3 (Blue)
        1, -1,  1,  0, 0, 1, 1, // Vertex 2
        -1, -1,  1,  0, 0, 1, 1, // Vertex 3
        0,  1,  0,  0, 0, 1, 1, // Apex

        // Face 4 (Purple)
        -1, -1,  1,  1, 0, 1, 1, // Vertex 3
        -1, -1, -1,  1, 0, 1, 1, // Vertex 0
        0,  1,  0,  1, 0, 1, 1  // Apex
    ]);

    // Buffer
    const vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const position = gl.getAttribLocation(shaderProgram, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 0);

    const color = gl.getAttribLocation(shaderProgram, 'aColor');
    gl.enableVertexAttribArray(color);
    gl.vertexAttribPointer(color, 4, gl.FLOAT, false, 7 * Float32Array.BYTES_PER_ELEMENT, 3 * Float32Array.BYTES_PER_ELEMENT);

    // Projection matrix
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, canvas.width / canvas.height, 0.1, 100);
    const uProjectionMatrix = gl.getUniformLocation(shaderProgram, 'uProjectionMatrix');
    gl.uniformMatrix4fv(uProjectionMatrix, false, projectionMatrix);

    // Variables for position and rotation
    let positionX = 0;
    let positionY = 0;
    let positionZ = 0;
    let angleX = 0;
    let angleY = 0;
    let angleZ = 0;

    const uModelViewMatrix = gl.getUniformLocation(shaderProgram, 'uModelViewMatrix');

    // Flags for object movement (translacao)
    let moveLeft = false;
    let moveRight = false;
    let moveUp = false;
    let moveDown = false;
    let moveIn = false;
    let moveOut = false;

    // Flags for object rotation
    let rotateLeft = false;
    let rotateRight = false;
    let rotateUp = false;
    let rotateDown = false;
    let rotateFront = false;
    let rotateBack = false;

    // Handle keydown events to set movement flags
    window.addEventListener('keydown', function(event) {
        switch (event.key) {
            case 'ArrowLeft':
                moveLeft = true;
                break;
            case 'ArrowRight':
                moveRight = true;
                break;
            case 'ArrowUp':
                moveUp = true;
                break;
            case 'ArrowDown':
                moveDown = true;
                break;
            case 'i':
                moveIn = true;
                break;
            case 'o':
                moveOut = true;
                break;
            case 'w':
                rotateUp = true;
                break;
            case 's':
                rotateDown = true;
                break;
            case 'a':
                rotateLeft = true;
                break;
            case 'd':
                rotateRight = true;
                break;
            case 'z':
                rotateFront = true;
                break;
            case 'x':
                rotateBack = true;
                break;
        }
    });

    // Handle keyup events to unset movement flags
    window.addEventListener('keyup', function(event) {
        switch (event.key) {
            case 'ArrowLeft':
                moveLeft = false;
                break;
            case 'ArrowRight':
                moveRight = false;
                break;
            case 'ArrowUp':
                moveUp = false;
                break;
            case 'ArrowDown':
                moveDown = false;
                break;
            case 'i':
                moveIn = false;
                break;
            case 'o':
                moveOut = false;
                break;
            case 'w':
                rotateUp = false;
                break;
            case 's':
                rotateDown = false;
                break;
            case 'a':
                rotateLeft = false;
                break;
            case 'd':
                rotateRight = false;
                break;
            case 'z':
                rotateFront = false;
                break;
            case 'x':
                rotateBack = false;
                break;
        }
    });

    function animate() {
        if (moveLeft) positionX -= 0.1;
        if (moveRight) positionX += 0.1;
        if (moveUp) positionY += 0.1;
        if (moveDown) positionY -= 0.1;
        if (moveIn) positionZ += 0.1;
        if (moveOut) positionZ -= 0.1;

        if (rotateLeft) angleY -= 0.1;
        if (rotateRight) angleY += 0.1;
        if (rotateUp) angleX += 0.1;
        if (rotateDown) angleX -= 0.1;
        if (rotateFront) angleZ += 0.1;
        if (rotateBack) angleZ -= 0.1;

        const modelViewMatrix = mat4.create();
        mat4.translate(modelViewMatrix, modelViewMatrix, [positionX, positionY, positionZ - 5]);
        mat4.rotateX(modelViewMatrix, modelViewMatrix, angleX);
        mat4.rotateY(modelViewMatrix, modelViewMatrix, angleY);
        mat4.rotateZ(modelViewMatrix, modelViewMatrix, angleZ);

        gl.uniformMatrix4fv(uModelViewMatrix, false, modelViewMatrix);

        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.drawArrays(gl.TRIANGLES, 0, vertices.length / 7);

        requestAnimationFrame(animate);
    }

    animate();
};

function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
    }
    return program;
}
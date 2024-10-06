document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');

  const canvas = document.getElementById('glcanvas');
  const gl = canvas.getContext('webgl');

  if (!gl) {
    console.error('WebGL not supported, falling back on experimental-webgl');
    gl = canvas.getContext('experimental-webgl');
  }

  if (!gl) {
    alert('Your browser does not support WebGL');
    return;
  }

  console.log('WebGL context obtained');

  // Vertex shader program
  const vsSource = `
        attribute vec4 aVertexPosition;
        attribute vec3 aVertexNormal;

        uniform mat4 uNormalMatrix;
        uniform mat4 uModelViewMatrix;
        uniform mat4 uProjectionMatrix;

        varying highp vec3 vLighting;

        void main(void) {
            gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

            // Apply lighting effect
            highp vec3 ambientLight = vec3(0.3, 0.3, 0.3);
            highp vec3 directionalLightColor = vec3(1, 1, 1);
            highp vec3 directionalVector = normalize(vec3(0.85, 0.8, 0.75));

            highp vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);

            highp float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
            vLighting = ambientLight + (directionalLightColor * directional);
        }
    `;

  // Fragment shader program
  const fsSource = `
        varying highp vec3 vLighting;

        void main(void) {
            gl_FragColor = vec4(vec3(1, 0.5, 0.3) * vLighting, 1.0);
        }
    `;

  const shaderProgram = initShaderProgram(gl, vsSource, fsSource);
  const programInfo = {
    program: shaderProgram,
    attribLocations: {
      vertexPosition: gl.getAttribLocation(shaderProgram, 'aVertexPosition'),
      vertexNormal: gl.getAttribLocation(shaderProgram, 'aVertexNormal'),
    },
    uniformLocations: {
      projectionMatrix: gl.getUniformLocation(
        shaderProgram,
        'uProjectionMatrix'
      ),
      modelViewMatrix: gl.getUniformLocation(shaderProgram, 'uModelViewMatrix'),
      normalMatrix: gl.getUniformLocation(shaderProgram, 'uNormalMatrix'),
    },
  };

  console.log('Shader program initialized');

  const mesh = loadMesh(gl);

  console.log('Mesh loaded:', mesh);

  let xRot = 0,
    yRot = 0,
    zRot = 0;
  let xTrans = 0,
    yTrans = 0,
    zTrans = -6;

  document.addEventListener('keydown', (event) => {
    switch (event.code) {
      case 'ArrowLeft':
        yRot -= 0.1;
        break;
      case 'ArrowRight':
        yRot += 0.1;
        break;
      case 'ArrowUp':
        xRot -= 0.1;
        break;
      case 'ArrowDown':
        xRot += 0.1;
        break;
      case 'KeyW':
        yTrans += 0.1;
        break;
      case 'KeyS':
        yTrans -= 0.1;
        break;
      case 'KeyA':
        xTrans -= 0.1;
        break;
      case 'KeyD':
        xTrans += 0.1;
        break;
      case 'KeyI':
        zTrans += 0.1;
        break;
      case 'KeyO':
        zTrans -= 0.1;
        break;
    }
  });

  function render() {
    drawScene(gl, programInfo, mesh, xRot, yRot, zRot, xTrans, yTrans, zTrans);
    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
});

function initShaderProgram(gl, vsSource, fsSource) {
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);

  const shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    console.error(
      'Unable to initialize the shader program: ' +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }

  return shaderProgram;
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(
      'An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function loadMesh(gl) {
  console.log('Loading mesh using OBJ loader...');

  // TODO: we should read this from a .obj file
  const objStr = `
        v  1.000000 -1.000000 1.000000
        v  1.000000 -1.000000 -1.000000
        v  -1.000000 -1.000000 -1.000000
        v  -1.000000 -1.000000 1.000000
        v  1.000000 1.000000 0.999999
        v  0.999999 1.000000 -1.000001
        v  -1.000000 1.000000 -1.000000
        v  -1.000000 1.000000 1.000000
        vn 0.0000 -1.0000 0.0000
        vn 0.0000 1.0000 0.0000
        vn 1.0000 0.0000 0.0000
        vn -1.0000 0.0000 -0.0000
        vn 0.0000 0.0000 1.0000
        vn 0.0000 0.0000 -1.0000
        f 1//1 2//1 3//1
        f 1//1 3//1 4//1
        f 1//2 5//2 6//2
        f 1//2 6//2 2//2
        f 1//3 8//3 5//3
        f 1//4 4//4 8//4
        f 2//5 6//5 7//5
        f 2//5 7//5 3//5
        f 3//6 7//6 8//6
        f 3//6 8//6 4//6
        f 5//2 8//2 7//2
        f 5//2 7//2 6//2
    `;

  if (typeof OBJ === 'undefined') {
    console.error(
      'OBJ loader not defined, seems the library did not load correctly.'
    );
    return null;
  }

  const objMesh = new OBJ.Mesh(objStr);
  OBJ.initMeshBuffers(gl, objMesh);

  console.log('Mesh loaded via OBJ loader:', objMesh);

  return objMesh;
}

function drawScene(
  gl,
  programInfo,
  mesh,
  xRot,
  yRot,
  zRot,
  xTrans,
  yTrans,
  zTrans
) {
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  gl.clearDepth(1.0);
  gl.enable(gl.DEPTH_TEST);
  gl.depthFunc(gl.LEQUAL);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const projectionMatrix = mat4.create();
  mat4.perspective(
    projectionMatrix,
    (45 * Math.PI) / 180,
    gl.canvas.clientWidth / gl.canvas.clientHeight,
    0.1,
    100.0
  );

  const modelViewMatrix = mat4.create();
  mat4.translate(modelViewMatrix, modelViewMatrix, [xTrans, yTrans, zTrans]);

  mat4.rotate(modelViewMatrix, modelViewMatrix, xRot, [1, 0, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, yRot, [0, 1, 0]);
  mat4.rotate(modelViewMatrix, modelViewMatrix, zRot, [0, 0, 1]);

  const normalMatrix = mat4.create();
  mat4.invert(normalMatrix, modelViewMatrix);
  mat4.transpose(normalMatrix, normalMatrix);

  gl.useProgram(programInfo.program);

  gl.uniformMatrix4fv(
    programInfo.uniformLocations.projectionMatrix,
    false,
    projectionMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.modelViewMatrix,
    false,
    modelViewMatrix
  );
  gl.uniformMatrix4fv(
    programInfo.uniformLocations.normalMatrix,
    false,
    normalMatrix
  );

  {
    const vertexPosition = mesh.vertexBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexPosition);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexPosition,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexPosition);
  }

  {
    const vertexNormal = mesh.normalBuffer;
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexNormal);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexNormal,
      3,
      gl.FLOAT,
      false,
      0,
      0
    );
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexNormal);
  }

  {
    const indices = mesh.indexBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indices);
    gl.drawElements(
      gl.TRIANGLES,
      mesh.indexBuffer.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded and parsed');

  const canvas = document.getElementById('glcanvas');
  resizeCanvas(canvas);
  window.addEventListener('resize', () => resizeCanvas(canvas));

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

        varying vec3 vNormal;
        varying vec3 vFragPos;

        void main(void) {
          vec4 fragPos = uModelViewMatrix * aVertexPosition;
          vFragPos = fragPos.xyz;
          vNormal = mat3(uNormalMatrix) * aVertexNormal;
          gl_Position = uProjectionMatrix * fragPos;
      }
  `;

  // Fragment shader program
  const fsSource = `
      precision highp float;

      varying vec3 vNormal;
      varying vec3 vFragPos;

      uniform vec3 uLightPosition;
      uniform vec3 uLightColor;
      uniform vec3 uViewPosition;

      uniform vec3 uObjectColor;
      uniform float uShininess;

      void main(void) {
          vec3 norm = normalize(vNormal);
          vec3 lightDir = normalize(uLightPosition - vFragPos);

          // Componente Ambiente
          float ambientStrength = 0.1;
          vec3 ambient = ambientStrength * uLightColor;

          // Componente Difuso
          float diff = max(dot(norm, lightDir), 0.0);
          vec3 diffuse = diff * uLightColor;

          // Componente Especular
          float specularStrength = 0.5;
          vec3 viewDir = normalize(-vFragPos);
          vec3 reflectDir = reflect(-lightDir, norm);
          float spec = pow(max(dot(viewDir, reflectDir), 0.0), uShininess);
          vec3 specular = specularStrength * spec * uLightColor;

          // Combinação dos componentes
          vec3 result = (ambient + diffuse + specular) * uObjectColor;
          gl_FragColor = vec4(result, 1.0);
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
      lightPosition: gl.getUniformLocation(shaderProgram, 'uLightPosition'),
      lightColor: gl.getUniformLocation(shaderProgram, 'uLightColor'),
      viewPosition: gl.getUniformLocation(shaderProgram, 'uViewPosition'),
      objectColor: gl.getUniformLocation(shaderProgram, 'uObjectColor'),
      shininess: gl.getUniformLocation(shaderProgram, 'uShininess'),
    },
  };

  console.log('Shader program initialized');

  const mesh = loadMesh(gl);

  console.log('Mesh loaded:', mesh);

  // variables for rotation
  let angleX = 0,
    angleY = 0,
    angleZ = 0;
  // variables for translation
  let positionX = 0,
    positionY = 0,
    positionZ = 0;
  // variables for scale
  let scaleFactorX = 1.0,
    scaleFactorY = 1.0,
    scaleFactorZ = 1.0;

  const sliders = document.querySelectorAll("input[type='range']");

  sliders.forEach((slider) => {
    slider.addEventListener('input', function () {
      const sliderId = slider.id;
      if (slider.id == 'moveX') positionX = slider.value;
      if (slider.id == 'moveY') positionY = slider.value;
      if (slider.id == 'moveZ') positionZ = slider.value;
      if (slider.id == 'rotateX') angleX = slider.value;
      if (slider.id == 'rotateY') angleY = slider.value;
      if (slider.id == 'rotateZ') angleZ = slider.value;
      if (slider.id == 'scaleX') scaleFactorX = slider.value;
      if (slider.id == 'scaleY') scaleFactorY = slider.value;
      if (slider.id == 'scaleZ') scaleFactorZ = slider.value;
    });
  });

  // Definir as propriedades da luz e do material
  gl.useProgram(programInfo.program);

  const lightPosition = [2.0, 2.0, 2.0]; // Posição da luz no espaço da visualização
  const lightColor = [1.0, 1.0, 1.0]; // Cor da luz branca

  const objectColor = [1.0, 0.5, 0.31]; // Cor do objeto
  const shininess = 32.0; // Fator de brilho

  // Definir uniformes
  gl.uniform3fv(programInfo.uniformLocations.lightPosition, lightPosition);
  gl.uniform3fv(programInfo.uniformLocations.lightColor, lightColor);
  gl.uniform3fv(programInfo.uniformLocations.objectColor, objectColor);
  gl.uniform1f(programInfo.uniformLocations.shininess, shininess);

  function render() {
    drawScene(
      gl,
      programInfo,
      mesh,
      angleX,
      angleY,
      angleZ,
      positionX,
      positionY,
      positionZ,
      scaleFactorX,
      scaleFactorY,
      scaleFactorZ
    );
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
  const objStr = [
    'v  1.0 -1.0  1.0',
    'v  1.0 -1.0 -1.0',
    'v -1.0 -1.0 -1.0',
    'v -1.0 -1.0  1.0',
    'v  1.0  1.0  1.0',
    'v  1.0  1.0 -1.0',
    'v -1.0  1.0 -1.0',
    'v -1.0  1.0  1.0',

    'v  3.5 -1.0  1.0',
    'v  3.5 -1.0 -1.0',
    'v  1.5 -1.0 -1.0',
    'v  1.5 -1.0  1.0',
    'v  3.5  1.0  1.0',
    'v  3.5  1.0 -1.0',
    'v  1.5  1.0 -1.0',
    'v  1.5  1.0  1.0',

    'vn  0.0 -1.0  0.0',
    'vn  0.0  1.0  0.0',
    'vn  1.0  0.0  0.0',
    'vn -1.0  0.0  0.0',
    'vn  0.0  0.0  1.0',
    'vn  0.0  0.0 -1.0',

    // # Faces for first cube
    'f 1//1 2//1 3//1',
    'f 1//1 3//1 4//1',
    'f 5//2 8//2 7//2',
    'f 5//2 7//2 6//2',
    'f 1//3 5//3 6//3',
    'f 1//3 6//3 2//3',
    'f 2//6 6//6 7//6',
    'f 2//6 7//6 3//6',
    'f 3//4 7//4 8//4',
    'f 3//4 8//4 4//4',
    'f 4//5 8//5 5//5',
    'f 4//5 5//5 1//5',

    // # Faces for second cube
    'f 9//1 10//1 11//1',
    'f 9//1 11//1 12//1',
    'f 13//2 16//2 15//2',
    'f 13//2 15//2 14//2',
    'f 9//3 13//3 14//3',
    'f 9//3 14//3 10//3',
    'f 10//6 14//6 15//6',
    'f 10//6 15//6 11//6',
    'f 11//4 15//4 16//4',
    'f 11//4 16//4 12//4',
    'f 12//5 16//5 13//5',
    'f 12//5 13//5 9//5',
  ].join('\n');

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
  angleX,
  angleY,
  angleZ,
  positionX,
  positionY,
  positionZ,
  scaleFactorX,
  scaleFactorY,
  scaleFactorZ
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
  mat4.translate(modelViewMatrix, modelViewMatrix, [
    positionX,
    positionY,
    positionZ - 5,
  ]);

  mat4.rotateX(modelViewMatrix, modelViewMatrix, (angleX * Math.PI) / 180.0);
  mat4.rotateY(modelViewMatrix, modelViewMatrix, (angleY * Math.PI) / 180.0);
  mat4.rotateZ(modelViewMatrix, modelViewMatrix, (angleZ * Math.PI) / 180.0);

  mat4.scale(modelViewMatrix, modelViewMatrix, [
    scaleFactorX,
    scaleFactorY,
    scaleFactorZ,
  ]);

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

  const viewPosition = [0.0, 0.0, 0.0];
  gl.uniform3fv(programInfo.uniformLocations.viewPosition, viewPosition);

  // Configurar os buffers de posição
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

  // Configurar os buffers de normal
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
    const indexBuffer = mesh.indexBuffer;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.drawElements(
      gl.TRIANGLES,
      mesh.indexBuffer.numItems,
      gl.UNSIGNED_SHORT,
      0
    );
  }
}

function resizeCanvas(canvas) {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const gl = canvas.getContext('webgl');
  gl.viewport(0, 0, canvas.width, canvas.height);
}

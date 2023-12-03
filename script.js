const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

// Set canvas background color to black
gl.clearColor(0.0, 0.0, 0.0, 1.0);

// Adjust viewport and aspect ratio
gl.viewport(0, 0, canvas.width, canvas.height);
const aspectRatio = canvas.width / canvas.height;

const outerRadiusSun = 0.5;
const innerRadiusSun = 0.2;

const verticesSun = [];
// Center of the sun
verticesSun.push(0.0, 0.0);

for (let i = 0; i <= 20; i++) {
    const radius = i % 2 === 0 ? outerRadiusSun : innerRadiusSun;
    const theta = (i / 10) * Math.PI; // Angle for each point

    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);

    verticesSun.push(x, y);
}

const outerRadiusEarth = 0.3;
const innerRadiusEarth = 0.1;

const distanceFromSun = 1.0; // Adjust the distance of Earth from the Sun

const verticesEarth = [];
// Center of the Earth (position it away from the Sun)
verticesEarth.push(distanceFromSun, 0.0);

for (let i = 0; i <= 20; i++) {
    const radius = i % 2 === 0 ? outerRadiusEarth : innerRadiusEarth;
    const theta = (i / 10) * Math.PI; // Angle for each point

    const x = distanceFromSun + radius * Math.cos(theta);
    const y = radius * Math.sin(theta);

    verticesEarth.push(x, y);
}

const vertexShaderSource = `
  attribute vec2 aPosition;
  uniform float uRotation; // Rotation angle in radians
  uniform float uDistance; // Distance from the center
  void main() {
    // Create a rotation matrix
    mat2 rotationMatrix = mat2(cos(uRotation), -sin(uRotation), sin(uRotation), cos(uRotation));
    
    // Apply rotation to the position
    vec2 rotatedPosition = rotationMatrix * aPosition;

    // Translate the position based on the distance
    vec2 translatedPosition = rotatedPosition + vec2(uDistance, 0.0);

    gl_Position = vec4(translatedPosition, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // Yellow color for the Sun
  }
`;

const fragmentShaderSourceEarth = `
  void main() {
    gl_FragColor = vec4(0.0, 0.7, 1.0, 1.0); // Light blue color for the Earth
  }
`;

const vertexBufferSun = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferSun);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesSun), gl.STATIC_DRAW);

const vertexBufferEarth = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferEarth);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesEarth), gl.STATIC_DRAW);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const fragmentShaderEarth = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShaderEarth, fragmentShaderSourceEarth);
gl.compileShader(fragmentShaderEarth);

const shaderProgramSun = gl.createProgram();
gl.attachShader(shaderProgramSun, vertexShader);
gl.attachShader(shaderProgramSun, fragmentShader);
gl.linkProgram(shaderProgramSun);

const shaderProgramEarth = gl.createProgram();
gl.attachShader(shaderProgramEarth, vertexShader);
gl.attachShader(shaderProgramEarth, fragmentShaderEarth);
gl.linkProgram(shaderProgramEarth);

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Rotation for the Sun
    const rotationAngleSun = performance.now() * 0.001;
    drawStar(shaderProgramSun, vertexBufferSun, rotationAngleSun);

    // Rotation for the Earth (rotate around the Sun)
    const rotationAngleEarth = performance.now() * 0.0005;
    drawStar(shaderProgramEarth, vertexBufferEarth, rotationAngleEarth, 0.0);

    requestAnimationFrame(draw);
}

function drawStar(program, buffer, rotationAngle, distance = 0.0) {
    gl.useProgram(program);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    const uRotation = gl.getUniformLocation(program, 'uRotation');
    gl.uniform1f(uRotation, rotationAngle);

    const uDistance = gl.getUniformLocation(program, 'uDistance');
    gl.uniform1f(uDistance, distance);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesSun.length / 2);
}

draw();

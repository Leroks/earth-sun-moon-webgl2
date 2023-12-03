const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

// Set canvas background color to black
gl.clearColor(0.0, 0.0, 0.0, 1.0);

// Adjust viewport and aspect ratio
gl.viewport(0, 0, canvas.width, canvas.height);
const aspectRatio = canvas.width / canvas.height;

const outerRadiusSun = 0.1; // Adjusted radius for the Sun
const innerRadiusSun = 0.04; // Adjusted radius for the Sun

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

const outerRadiusEarth = 0.06; // Adjusted radius for the Earth
const innerRadiusEarth = 0.02; // Adjusted radius for the Earth

const distanceFromSun = 0.4; // Adjust the distance of Earth from the Sun

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

const outerRadiusMoon = 0.02; // Adjusted radius for the Moon
const innerRadiusMoon = 0.01; // Adjusted radius for the Moon

const distanceFromEarth = 0.2; // Adjust the distance of the Moon from the Earth

const verticesMoon = [];
// Center of the Moon (position it away from the Earth)
verticesMoon.push(distanceFromEarth, 0.0);

for (let i = 0; i <= 20; i++) {
    const radius = i % 2 === 0 ? outerRadiusMoon : innerRadiusMoon;
    const theta = (i / 10) * Math.PI; // Angle for each point

    const x = distanceFromEarth + radius * Math.cos(theta);
    const y = radius * Math.sin(theta);

    verticesMoon.push(x, y);
}

const vertexShaderSource = `
  attribute vec2 aPosition;
  uniform float uRotationSun; // Rotation angle around the Sun in radians
  uniform float uRotationEarth; // Rotation angle around the Earth in radians
  uniform float uRotationMoon; // Rotation angle around the Moon in radians
  uniform float uDistanceEarth; // Distance from the Sun to the Earth
  uniform float uDistanceMoon; // Distance from the Earth to the Moon
  void main() {
    // Rotation matrix for the Sun
    mat2 rotationMatrixSun = mat2(cos(uRotationSun), -sin(uRotationSun), sin(uRotationSun), cos(uRotationSun));

    // Rotation matrix for the Earth
    mat2 rotationMatrixEarth = mat2(cos(uRotationEarth), -sin(uRotationEarth), sin(uRotationEarth), cos(uRotationEarth));

    // Rotation matrix for the Moon
    mat2 rotationMatrixMoon = mat2(cos(uRotationMoon), -sin(uRotationMoon), sin(uRotationMoon), cos(uRotationMoon));

    // Apply rotations and translations
    vec2 rotatedPositionSun = aPosition + vec2(uDistanceEarth, 0.0);
    vec2 rotatedPositionEarth = rotationMatrixSun * (aPosition + vec2(uDistanceEarth, 0.0));

    // Rotate the Moon around the Earth
    vec2 rotatedPositionMoonAroundEarth = rotationMatrixEarth * (aPosition + vec2(uDistanceEarth + uDistanceMoon, 0.0));

    // Translate the Moon to follow the Earth's rotation
    vec2 rotatedPositionMoon = rotatedPositionEarth + rotatedPositionMoonAroundEarth;

    gl_Position = vec4(rotatedPositionMoon, 0.0, 1.0);
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

const fragmentShaderSourceMoon = `
  void main() {
    gl_FragColor = vec4(0.7, 0.7, 0.7, 1.0); // Gray color for the Moon
  }
`;

const vertexBufferSun = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferSun);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesSun), gl.STATIC_DRAW);

const vertexBufferEarth = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferEarth);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesEarth), gl.STATIC_DRAW);

const vertexBufferMoon = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBufferMoon);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesMoon), gl.STATIC_DRAW);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const fragmentShaderEarth = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShaderEarth, fragmentShaderSourceEarth);
gl.compileShader(fragmentShaderEarth);

const fragmentShaderMoon = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShaderMoon, fragmentShaderSourceMoon);
gl.compileShader(fragmentShaderMoon);

const shaderProgramSun = gl.createProgram();
gl.attachShader(shaderProgramSun, vertexShader);
gl.attachShader(shaderProgramSun, fragmentShader);
gl.linkProgram(shaderProgramSun);

const shaderProgramEarth = gl.createProgram();
gl.attachShader(shaderProgramEarth, vertexShader);
gl.attachShader(shaderProgramEarth, fragmentShaderEarth);
gl.linkProgram(shaderProgramEarth);

const shaderProgramMoon = gl.createProgram();
gl.attachShader(shaderProgramMoon, vertexShader);
gl.attachShader(shaderProgramMoon, fragmentShaderMoon);
gl.linkProgram(shaderProgramMoon);

function draw() {
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Rotation for the Sun
    const rotationAngleSun = performance.now() * 0.001;

    // Rotation for the Earth (rotate around the Sun)
    const rotationAngleEarth = performance.now() * 0.0005;

    // Rotation for the Moon (rotate around the Earth)
    const rotationAngleMoon = performance.now() * 0.001;

    // Draw the Sun
    drawStar(shaderProgramSun, vertexBufferSun, rotationAngleSun);

    // Draw the Earth
    drawStar(shaderProgramEarth, vertexBufferEarth, rotationAngleEarth, 0.0);

    // Draw the Moon
    drawStar(shaderProgramMoon, vertexBufferMoon, rotationAngleMoon, distanceFromEarth);

    requestAnimationFrame(draw);
}

function drawStar(program, buffer, rotationAngle, distance = 0.0) {
    gl.useProgram(program);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    const uRotationSun = gl.getUniformLocation(program, 'uRotationSun');
    const uRotationEarth = gl.getUniformLocation(program, 'uRotationEarth');
    const uRotationMoon = gl.getUniformLocation(program, 'uRotationMoon');
    const uDistanceEarth = gl.getUniformLocation(program, 'uDistanceEarth');
    const uDistanceMoon = gl.getUniformLocation(program, 'uDistanceMoon');

    gl.uniform1f(uRotationSun, rotationAngle);
    gl.uniform1f(uRotationEarth, rotationAngle);
    gl.uniform1f(uRotationMoon, rotationAngle);
    gl.uniform1f(uDistanceEarth, 0.0);
    gl.uniform1f(uDistanceMoon, distance);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesSun.length / 2);
}

draw();

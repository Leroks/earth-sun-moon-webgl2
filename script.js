const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

// Set canvas background color to black
gl.clearColor(0.0, 0.0, 0.0, 1.0);

// Adjust viewport to the canvas size
gl.viewport(0, 0, canvas.width, canvas.height);

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
  uniform float uRotationMoonOrbit; // Rotation angle around the Moon's orbit in radians
  uniform float uDistanceEarth; // Distance from the Sun to the Earth
  uniform float uDistanceMoon; // Distance from the Earth to the Moon
  uniform float uRotationEarthAxis; // Rotation angle around the Earth's own axis in radians
  uniform float uRotationMoonAxis; // Rotation angle around the Moon's own axis in radians

  void main() {
    // Calculate the Earth's position
    vec2 earthPosition = vec2(uDistanceEarth * cos(uRotationEarth), uDistanceEarth * sin(uRotationEarth));

    // Calculate the Moon's orbit position around the Earth
    vec2 moonOrbitPosition = earthPosition + vec2(uDistanceMoon * cos(uRotationMoonOrbit), uDistanceMoon * sin(uRotationMoonOrbit));

    // Rotate the Moon around its orbit
    vec2 rotatedPositionMoon = moonOrbitPosition + (aPosition - moonOrbitPosition) * mat2(cos(uRotationMoonOrbit), -sin(uRotationMoonOrbit), sin(uRotationMoonOrbit), cos(uRotationMoonOrbit));

    // Rotate the Earth around the Sun
    vec2 rotatedPositionEarth = earthPosition + (aPosition - earthPosition) * mat2(cos(uRotationEarth), -sin(uRotationEarth), sin(uRotationEarth), cos(uRotationEarth));
    
    // Rotate the Earth around its own axis
    vec2 earthCenterPosition = vec2(uDistanceEarth * cos(uRotationEarth), uDistanceEarth * sin(uRotationEarth));
    vec2 rotatedPositionEarthSelf = earthCenterPosition + (aPosition - earthCenterPosition) * mat2(cos(uRotationEarthAxis), -sin(uRotationEarthAxis), sin(uRotationEarthAxis), cos(uRotationEarthAxis));
    
    // Rotate the Moon around its own axis
    vec2 moonCenterPosition = moonOrbitPosition + vec2(uDistanceMoon * cos(uRotationMoonOrbit), uDistanceMoon * sin(uRotationMoonOrbit));
    vec2 rotatedPositionMoonSelf = moonCenterPosition + (aPosition - moonCenterPosition) * mat2(cos(uRotationMoonAxis), -sin(uRotationMoonAxis), sin(uRotationMoonAxis), cos(uRotationMoonAxis));

    gl_Position = vec4(rotatedPositionMoon, 0.0, 1.0);
  }
`;

// GUI controls object
const parameters = {
    speedSun: 0.001,
    speedEarth: 0.0005,
    //speedMoon: 0.01,
    clockwiseRotationSun: false, // Added checkbox for clockwise rotation for the Sun
    //clockwiseRotationEarth: false, // Added checkbox for clockwise rotation for the Earth
    //clockwiseRotationMoon: false, // Added checkbox for clockwise rotation for the Moon
};

// Setup dat.gui for GUI controls
const gui = new dat.GUI();
gui.add(parameters, 'speedSun').name('RotationSpeedSun').min(0.0005).max(0.01);
gui.add(parameters, 'speedEarth').name('EarthOrbitRotation').min(0.0001).max(0.001);
//gui.add(parameters, 'speedMoon').name('Moon Rotation Speed').min(0.001).max(0.1);
gui.add(parameters, 'clockwiseRotationSun').name('ClockwiseSun');
//gui.add(parameters, 'clockwiseRotationEarth').name('ClockwiseEarth');
//gui.add(parameters, 'clockwiseRotationMoon').name('ClockwiseMoon');


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
    let rotationAngleSun = performance.now() * parameters.speedSun;
    // Reverse rotation direction if clockwise checkbox for the Sun is checked
    rotationAngleSun = parameters.clockwiseRotationSun ? -rotationAngleSun : rotationAngleSun;

    // Rotation for the Earth (rotate around the Sun)
    let rotationAngleEarth = performance.now() * parameters.speedEarth;
    // Reverse rotation direction if clockwise checkbox for the Earth is checked
    rotationAngleEarth = parameters.clockwiseRotationEarth ? -rotationAngleEarth : rotationAngleEarth;

    // Rotation for the Moon (rotate around the Earth)
    let rotationAngleMoon = rotationAngleEarth;
    // Reverse rotation direction if clockwise checkbox for the Moon is checked
    rotationAngleMoon = parameters.clockwiseRotationMoon ? -rotationAngleMoon : rotationAngleMoon;

    // Rotation for the Earth's own axis
    let rotationAngleEarthAxis = performance.now() * parameters.speedSun;
    // Reverse rotation direction if clockwise checkbox for the Earth is checked
    rotationAngleEarthAxis = parameters.clockwiseRotationEarth ? -rotationAngleEarthAxis : rotationAngleEarthAxis;

    // Rotation for the Moon's own axis
    let rotationAngleMoonAxis = performance.now() * parameters.speedSun;
    // Reverse rotation direction if clockwise checkbox for the Moon is checked
    rotationAngleMoonAxis = parameters.clockwiseRotationMoon ? -rotationAngleMoonAxis : rotationAngleMoonAxis;

    // Draw the Sun
    drawStar(shaderProgramSun, vertexBufferSun, rotationAngleSun);

    // Draw the Earth
    drawStar(shaderProgramEarth, vertexBufferEarth, rotationAngleEarth, 0.0, rotationAngleEarthAxis);

    // Draw the Moon
    drawStar(shaderProgramMoon, vertexBufferMoon, rotationAngleMoon, distanceFromEarth, rotationAngleMoonAxis);

    requestAnimationFrame(draw);
}

function drawStar(program, buffer, rotationAngle, distance = 0.0, rotationAngleAxis = 0.0) {
    gl.useProgram(program);

    const aPosition = gl.getAttribLocation(program, 'aPosition');
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(aPosition);

    const uRotationSun = gl.getUniformLocation(program, 'uRotationSun');
    const uRotationEarth = gl.getUniformLocation(program, 'uRotationEarth');
    const uRotationMoonOrbit = gl.getUniformLocation(program, 'uRotationMoonOrbit');
    const uDistanceEarth = gl.getUniformLocation(program, 'uDistanceEarth');
    const uDistanceMoon = gl.getUniformLocation(program, 'uDistanceMoon');
    const uRotationEarthAxis = gl.getUniformLocation(program, 'uRotationEarthAxis');
    const uRotationMoonAxis = gl.getUniformLocation(program, 'uRotationMoonAxis');

    gl.uniform1f(uRotationSun, rotationAngle);
    gl.uniform1f(uRotationEarth, rotationAngle);
    gl.uniform1f(uRotationMoonOrbit, rotationAngle);
    gl.uniform1f(uDistanceEarth, 0.0);
    gl.uniform1f(uDistanceMoon, distance);
    gl.uniform1f(uRotationEarthAxis, rotationAngleAxis);
    gl.uniform1f(uRotationMoonAxis, rotationAngleAxis);

    gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesSun.length / 2);
}

draw();

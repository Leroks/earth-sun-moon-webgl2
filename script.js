const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    alert('WebGL2 is not available in your browser.');
    throw new Error('WebGL2 not available');
}

const vertexShaderSrc = `
    attribute vec2 position;

    uniform mat3 translationMatrix;
    uniform mat3 scaleMatrix;

    uniform float time;
    uniform float rotationAngle;
    uniform int shouldSwing;
    uniform vec3 centerPos;

    void main() 
    {
        float angle = sin(time) * 80.0 * 3.1415926535897932384626433832795 / 180.0;

        mat3 originTranslator = mat3(
            1.0, 0.0, 0.0,  // First column
            0.0, 1.0, 0.0,  // Second column
            -centerPos.x, -centerPos.y, 1.0   // Third column
        );
    
        mat3 antiOriginTranslator = mat3(
            1.0, 0.0, 0.0,  // First column
            0.0, 1.0, 0.0,  // Second column
            centerPos.x, centerPos.y, 1.0   // Third column
        );

        mat3 rotationMatrix = mat3(
            cos(rotationAngle), -sin(rotationAngle), 0.0,  // First column
            sin(rotationAngle), cos(rotationAngle), 0.0,  // Second column
            0.0, 0.0, 1.0   // Third column
        );

        if(shouldSwing == 1)
        {
            rotationMatrix = mat3(
                cos(rotationAngle + angle), -sin(rotationAngle + angle), 0.0,  // First column
                sin(rotationAngle + angle), cos(rotationAngle + angle), 0.0,  // Second column
                0.0, 0.0, 1.0   // Third column
            );            
        }


        mat3 transformMat = antiOriginTranslator * scaleMatrix * rotationMatrix * translationMatrix * originTranslator;
        vec3 pos3D = transformMat  * vec3(position, 1.0);
        gl_Position = vec4(pos3D, 1.0);
    }
`;

const fragmentShaderSrc = `
    precision mediump float;
    uniform vec3 color;
    uniform float gradient;
    uniform int shouldColorShift;
    float intensity = 1.0;
    void main() {
        if(shouldColorShift == 1)
            intensity = (sin(gradient) + 1.0)/2.0;
        gl_FragColor = vec4(color * intensity, 1.0);
    }
`;

// Compile shader
function compileShader(src, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error('Could not compile shader:\n' + info);
    }
    return shader;
}

const vertexShader = compileShader(vertexShaderSrc, gl.VERTEX_SHADER);
const fragmentShader = compileShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);

// Link shaders into a program
const program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('Could not link program:\n' + info);
}


const outerRadiusSun = 0.1;
const innerRadiusSun = 0.04;

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

const outerRadiusEarth = 0.06;
const innerRadiusEarth = 0.02;

const distanceFromSun = 0.5;

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

const outerRadiusMoon = 0.02;
const innerRadiusMoon = 0.01;

const distanceFromEarth = 0.2;

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

gl.useProgram(program);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesSun), gl.STATIC_DRAW);

const position = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

let scaleMatrix1 = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
];

let scaleMatrix2 = [
    0.65, 0.0, 0.0,
    0.0, 0.65, 0.0,
    0.0, 0.0, 1.0
];

let scaleMatrix3 = [
    0.3, 0.0, 0.0,
    0.0, 0.3, 0.0,
    0.0, 0.0, 1.0
];

let translationMatrixSun = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
];

let translationMatrixEarth = [
    1.0, 0.0, distanceFromSun,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
];

let translationMatrixMoon = [
    1.0, 0.0, distanceFromEarth,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
];


const colorBlue = [0.157, 0.737, 0.8];
const colorWhite = [1.0, 1.0, 1.0];
const colorYellow = [1.0, 0.8, 0.0];
let centerPosSun = [0.0, 0.0, 0.0];
let centerPosEarth = [distanceFromSun, 0.0, 0.0];
let centerPosMoon = [distanceFromEarth, 0.0, 0.0];

const centerPosLoc = gl.getUniformLocation(program, 'centerPos');
const translationMatrixLoc = gl.getUniformLocation(program, 'translationMatrix');
const scaleMatrixLoc = gl.getUniformLocation(program, 'scaleMatrix');
const colorLoc = gl.getUniformLocation(program, 'color');
const timeLoc = gl.getUniformLocation(program, 'time');
const rotationAngleLoc = gl.getUniformLocation(program, 'rotationAngle');
const swingLoc = gl.getUniformLocation(program, 'shouldSwing');
const colorShiftLoc = gl.getUniformLocation(program, 'shouldColorShift');
const gradientLoc = gl.getUniformLocation(program, 'gradient');

let rotationAngleSun = 0;
let rotationAngleEarth = 0;
let rotationAngleMoon = 0;
let rotationAngleEarthAroundSun = 0;
let rotationAngleMoonAroundEarth = 0;
let shouldSwing = 0;
let shouldColorShift = 0;

let rotateOwnCenterSunSpeed = 0.01;
let rotateOwnCenterEarthSpeed = 0.03;
let rotateOwnCenterMoonSpeed = 0.05;
let orbitSpeedEarth = 0.01;
let orbitSpeedMoon = 0.04;
let scaleSunAmount = 1.0;
let scaleEarthAmount = 0.65;
let scaleMoonAmount = 0.3;

//DRAW LOOP
drawScene();

function drawScene() {
    // Update the time uniform
    let time = performance.now() / 1000.0;
    gl.uniform1f(timeLoc, time);
    gl.uniform1i(swingLoc, shouldSwing);

    gl.uniform1f(gradientLoc, time)
    gl.uniform1i(colorShiftLoc, shouldColorShift);

    // Clear and draw
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);


    // Draw the Sun
    gl.uniform1f(rotationAngleLoc, rotationAngleSun);
    gl.uniform3fv(centerPosLoc, centerPosSun);
    gl.uniformMatrix3fv(translationMatrixLoc, true, translationMatrixSun);
    gl.uniformMatrix3fv(scaleMatrixLoc, true, scaleMatrix1);
    gl.uniform3fv(colorLoc, colorYellow);
    gl.uniform1i(colorShiftLoc, shouldColorShift);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesSun.length / 2);

    // Draw the Earth
    gl.uniform1f(rotationAngleLoc, rotationAngleEarth);
    gl.uniform3fv(centerPosLoc, centerPosEarth);
    gl.uniformMatrix3fv(translationMatrixLoc, true, translationMatrixEarth);
    gl.uniformMatrix3fv(scaleMatrixLoc, true, scaleMatrix2);
    gl.uniform3fv(colorLoc, colorBlue);
    gl.uniform1i(colorShiftLoc, 0.0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesEarth.length / 2);

    // Draw the Moon
    gl.uniform1f(rotationAngleLoc, rotationAngleMoon);
    gl.uniform3fv(centerPosLoc, centerPosMoon);
    gl.uniformMatrix3fv(translationMatrixLoc, true, translationMatrixMoon);
    gl.uniformMatrix3fv(scaleMatrixLoc, true, scaleMatrix3);
    gl.uniform3fv(colorLoc, colorWhite);
    gl.uniform1i(colorShiftLoc, 0.0);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, verticesMoon.length / 2);

    requestAnimationFrame(drawScene);

    rotateOwnCenterSun(rotateOwnCenterSunSpeed);
    rotateOwnCenterEarth(rotateOwnCenterEarthSpeed);
    rotateOwnCenterMoon(rotateOwnCenterMoonSpeed);
    rotateAroundSunEarth(orbitSpeedEarth);
    rotateAroundEarthMoon(orbitSpeedMoon);
    scaleSun(scaleSunAmount);
    scaleEarth(scaleEarthAmount);
    scaleMoon(scaleMoonAmount);
}


function rotateOwnCenterSun(x) {
    rotationAngleSun += x
}

function rotateOwnCenterEarth(x) {
    rotationAngleEarth += x
}

function rotateOwnCenterMoon(x) {
    rotationAngleMoon += x
}

function rotateAroundSunEarth(x) {
    // Update the rotation angle
    rotationAngleEarthAroundSun += x;

    // Calculate the new translation matrix based on the rotation
    const cosAngle = Math.cos(rotationAngleEarthAroundSun);
    const sinAngle = Math.sin(rotationAngleEarthAroundSun);
    const newX = distanceFromSun * cosAngle;
    const newY = distanceFromSun * sinAngle;

    // Update the translationMatrixEarth
    translationMatrixEarth[2] = newX;
    translationMatrixEarth[5] = newY;

    // Update the center position
    centerPosEarth = [newX, newY, 0.0];

}

function rotateAroundEarthMoon(x) {
    // Update the rotation angle
    rotationAngleMoonAroundEarth += x;

    // Calculate the position of the Moon relative to the Earth
    const cosAngle = Math.cos(rotationAngleMoonAroundEarth);
    const sinAngle = Math.sin(rotationAngleMoonAroundEarth);
    const relativeX = distanceFromEarth * cosAngle;
    const relativeY = distanceFromEarth * sinAngle;

    // Update the translation matrix of the Moon relative to the Earth
    translationMatrixMoon[2] = centerPosEarth[0] + relativeX;
    translationMatrixMoon[5] = centerPosEarth[1] + relativeY;

    // Update the center position of the Moon
    centerPosMoon = [translationMatrixMoon[2], translationMatrixMoon[5], 0.0];
}

function scaleSun(x) {
    scaleMatrix1 = [
        x, 0.0, 0.0,
        0.0, x, 0.0,
        0.0, 0.0, 1.0
    ];
}

function scaleEarth(x) {
    scaleMatrix2 = [
        x, 0.0, 0.0,
        0.0, x, 0.0,
        0.0, 0.0, 1.0
    ];
}

function scaleMoon(x) {
    scaleMatrix3 = [
        x, 0.0, 0.0,
        0.0, x, 0.0,
        0.0, 0.0, 1.0
    ];
}

//Slider Controls
document.getElementById("scaleSun").onchange = function () {
    scaleSunAmount = event.srcElement.value / 1.0;
};
document.getElementById("rotationSpeedSun").onchange = function () {
    rotateOwnCenterSunSpeed = event.srcElement.value / 1.0;
};
document.getElementById("scaleEarth").onchange = function () {
    scaleEarthAmount = event.srcElement.value / 1.0;
};
document.getElementById("rotationSpeedEarth").onchange = function () {
    rotateOwnCenterEarthSpeed = event.srcElement.value / 1.0;
};
document.getElementById("scaleMoon").onchange = function () {
    scaleMoonAmount = event.srcElement.value / 1.0;
};
document.getElementById("rotationSpeedMoon").onchange = function () {
    rotateOwnCenterMoonSpeed = event.srcElement.value / 1.0;
};
document.getElementById("earthOrbitSpeed").onchange = function () {
    orbitSpeedEarth = event.srcElement.value / 1.0;
};
document.getElementById("moonOrbitSpeed").onchange = function () {
    orbitSpeedMoon = event.srcElement.value / 1.0;
};

// Boolean variables for clockwise rotation and orbit
let clockwiseSun = false;
let clockwiseEarth = false;
let clockwiseMoon = false;
let clockwiseEarthOrbit = false;
let clockwiseMoonOrbit = false;

// Checkbox Controls
document.getElementById("clockwiseSun").onchange = function () {
    clockwiseSun = event.srcElement.checked;
    rotateOwnCenterSunSpeed = (clockwiseSun ? -1 : 1) * Math.abs(rotateOwnCenterSunSpeed);
};

document.getElementById("clockwiseEarth").onchange = function () {
    clockwiseEarth = event.srcElement.checked;
    rotateOwnCenterEarthSpeed = (clockwiseEarth ? -1 : 1) * Math.abs(rotateOwnCenterEarthSpeed);
};

document.getElementById("clockwiseMoon").onchange = function () {
    clockwiseMoon = event.srcElement.checked;
    rotateOwnCenterMoonSpeed = (clockwiseMoon ? -1 : 1) * Math.abs(rotateOwnCenterMoonSpeed);
};

document.getElementById("earthOrbitClockwise").onchange = function () {
    clockwiseEarthOrbit = event.srcElement.checked;
    orbitSpeedEarth = (clockwiseEarthOrbit ? -1 : 1) * Math.abs(orbitSpeedEarth);
};

document.getElementById("moonOrbitClockwise").onchange = function () {
    clockwiseMoonOrbit = event.srcElement.checked;
    orbitSpeedMoon = (clockwiseMoonOrbit ? -1 : 1) * Math.abs(orbitSpeedMoon);
};


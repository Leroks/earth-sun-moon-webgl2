const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

if (!gl) {
    alert('WebGL2 is not available in your browser.');
    throw new Error('WebGL2 not available');
}

const vertexShaderSrc = `
    attribute vec2 position;
    uniform mat3 rotationMatrix;

    void main() {
        gl_Position = vec4(rotationMatrix * vec3(position, 1.0), 1.0);
    }
`;

const fragmentShaderSrc = `
    precision mediump float;
    uniform vec3 color;

    void main() {
        gl_FragColor = vec4(color, 1.0);
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

// Function to multiply two matrices
function mul(matrixA, matrixB) {
    if (matrixA.length !== 9 || matrixB.length !== 9) {
        console.error("Both matrices must be 3x3 matrices.");
        return null;
    }

    const result = [];
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
            let sum = 0;
            for (let k = 0; k < 3; k++) {
                sum += matrixA[i * 3 + k] * matrixB[k * 3 + j];
            }
            result.push(sum);
        }
    }

    return result;
}

// Calculate the coordinates of the dividing points
const divideLineIntoThree = (point1, point2) => {
    const dividingPoints = [];

    // Calculate the coordinates of the first dividing point
    const firstDividingPoint = {
        x: point1.x + (1 / 3) * (point2.x - point1.x),
        y: point1.y + (1 / 3) * (point2.y - point1.y),
    };

    // Calculate the coordinates of the second dividing point
    const secondDividingPoint = {
        x: point1.x + (2 / 3) * (point2.x - point1.x),
        y: point1.y + (2 / 3) * (point2.y - point1.y),
    };

    dividingPoints.push(firstDividingPoint, secondDividingPoint);

    return dividingPoints;
};

// Initialize Sun and Earth vertices
const sunVertices = [
    { x: -0.1, y: -0.1 },
    { x: 0.1, y: -0.1 },
    { x: 0.0, y: 0.2 }
];

const earthVertices = [
    { x: -0.05, y: -0.05 },
    { x: 0.05, y: -0.05 },
    { x: 0.0, y: 0.1 }
];

const sunVerticesFinal = sunVertices.map(obj => [obj.x, obj.y]).flat();
const earthVerticesFinal = earthVertices.map(obj => [obj.x, obj.y]).flat();

// Create vertex buffers
const sunVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, sunVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sunVerticesFinal), gl.STATIC_DRAW);

const earthVertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, earthVertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(earthVerticesFinal), gl.STATIC_DRAW);

// Set up rotation matrices
let sunRotationMatrix = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
];

let earthRotationMatrix = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
];

// Set up uniform locations
const rotationMatrixLoc = gl.getUniformLocation(program, 'rotationMatrix');
const sunColorLoc = gl.getUniformLocation(program, 'color');
const earthColorLoc = gl.getUniformLocation(program, 'color');

// Set up colors
const sunColor = [1.0, 1.0, 0.0]; // Yellow
const earthColor = [0.529, 0.808, 0.922]; // Light Blue

gl.useProgram(program);

// Main rendering loop
drawScene();
function drawScene() {
    // Clear the canvas
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Draw Sun
    gl.uniformMatrix3fv(rotationMatrixLoc, false, sunRotationMatrix);
    gl.uniform3fv(sunColorLoc, sunColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, sunVertexBuffer);
    const positionSun = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionSun);
    gl.vertexAttribPointer(positionSun, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, sunVertices.length);

    // Draw Earth
    // Earth's position relative to the Sun
    const earthOrbitRadius = 0.5;
    const earthOrbitSpeed = 0.02;
    const earthRotationSpeed = 0.1;

    // Update Earth's rotation matrix
    earthRotationMatrix = mul([
        Math.cos(earthRotationSpeed),
        -Math.sin(earthRotationSpeed),
        0.0,
        Math.sin(earthRotationSpeed),
        Math.cos(earthRotationSpeed),
        0.0,
        0.0,
        0.0,
        1.0
    ], earthRotationMatrix);

    // Update Earth's position in the orbit
    const earthOrbitPosition = {
        x: earthOrbitRadius * Math.cos(earthOrbitSpeed),
        y: earthOrbitRadius * Math.sin(earthOrbitSpeed)
    };

    // Update Earth's translation matrix
    const earthTranslationMatrix = [
        1.0, 0.0, 0.0,
        0.0, 1.0, 0.0,
        earthOrbitPosition.x, earthOrbitPosition.y, 1.0
    ];

    // Combine Earth's transformations
    const earthTransformMatrix = mul(earthRotationMatrix, earthTranslationMatrix);

    // Draw Earth
    gl.uniformMatrix3fv(rotationMatrixLoc, false, earthTransformMatrix);
    gl.uniform3fv(earthColorLoc, earthColor);
    gl.bindBuffer(gl.ARRAY_BUFFER, earthVertexBuffer);
    const positionEarth = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionEarth);
    gl.vertexAttribPointer(positionEarth, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, earthVertices.length);

    // Update Sun's rotation matrix
    sunRotationMatrix = mul([
        Math.cos(0.01),
        -Math.sin(0.01),
        0.0,
        Math.sin(0.01),
        Math.cos(0.01),
        0.0,
        0.0,
        0.0,
        1.0
    ], sunRotationMatrix);

    // Request the next frame
    requestAnimationFrame(drawScene);
}

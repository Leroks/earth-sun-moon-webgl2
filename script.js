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

function findThirdVertex(v1, v2) {
    // Calculate the distance between v1 and v2
    const distance = Math.sqrt(
        Math.pow(v2.x - v1.x, 2) + Math.pow(v2.y - v1.y, 2)
    );

    // Calculate the angle between the line connecting v1 and v2 and the x-axis
    const angle = Math.atan2(v2.y - v1.y, v2.x - v1.x);

    // Calculate the coordinates of the third vertex
    const thirdVertexX = v1.x + distance * Math.cos(angle + (Math.PI) / 3);
    const thirdVertexY = v1.y + distance * Math.sin(angle + (Math.PI) / 3);

    return { x: thirdVertexX, y: thirdVertexY };
}

function addTriangles(point1, point2, verticesOut, iteration, firstTime)
{
    if(iteration <= 0){
        return;
    }

    let dividingPoints = divideLineIntoThree(point1, point2);
    let thirdPoint = findThirdVertex(dividingPoints[0], dividingPoints[1]);
    verticesOut.push(dividingPoints[0], dividingPoints[1], thirdPoint);

    addTriangles(dividingPoints[0], thirdPoint, verticesOut, iteration-1, false);
    addTriangles(thirdPoint, dividingPoints[1], verticesOut, iteration-1, false);

    if(firstTime)
    {
        addTriangles(point1, dividingPoints[0], verticesOut, iteration-1, false);
        addTriangles(dividingPoints[1], point2 , verticesOut, iteration-1, false);
    }
}

vertices = []
let point1 = { x: 0.0, y: 0.5 * Math.sqrt(3) - 0.5};
let point2 = { x: 0.5, y: -0.5 };
let point3 = { x: -0.5, y: -0.5 };
vertices.push(point1, point2, point3)


addTriangles(point1, point2, vertices, 4, true)
addTriangles(point2, point3, vertices, 4, true)
addTriangles(point3, point1, vertices, 4, true)

const verticesFinal = vertices.map(obj => [obj.x, obj.y]).flat();

gl.useProgram(program);

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(verticesFinal), gl.STATIC_DRAW);

const position = gl.getAttribLocation(program, 'position');
gl.enableVertexAttribArray(position);
gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

let scaleMatrix1 = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
];

let scaleMatrix2 = [
    0.65, 0.0,  0.0,
    0.0,  0.65, 0.0,
    0.0,  0.0,  1.0
];

let translationMatrix = [
    1.0, 0.0, 0.0,
    0.0, 1.0, 0.0,
    0.0, 0.0, 1.0
];


const colorBlue = [0.157, 0.737, 0.8];
const colorWhite = [1.0, 1.0, 1.0];
let centerPos = [0.0, (point1.y + point2.y + point3.y) / 3, 0.0];

const centerPosLoc = gl.getUniformLocation(program, 'centerPos');
const translationMatrixLoc = gl.getUniformLocation(program, 'translationMatrix');
const scaleMatrixLoc = gl.getUniformLocation(program, 'scaleMatrix');
const colorLoc = gl.getUniformLocation(program, 'color');
const timeLoc = gl.getUniformLocation(program, 'time');
const rotationAngleLoc = gl.getUniformLocation(program, 'rotationAngle');
const swingLoc = gl.getUniformLocation(program, 'shouldSwing');
const colorShiftLoc = gl.getUniformLocation(program, 'shouldColorShift');
const gradientLoc = gl.getUniformLocation(program, 'gradient');

let rotationAngle = 0;
let shouldSwing = 0;
let shouldColorShift = 0;

//DRAW LOOP
drawScene();
function drawScene()
{
    // Update the time uniform
    let time = performance.now() / 1000.0;
    gl.uniform1f(timeLoc, time);
    gl.uniform1i(swingLoc, shouldSwing);
    gl.uniform1f(rotationAngleLoc, rotationAngle);
    gl.uniform1f(gradientLoc, time)
    gl.uniform1i(colorShiftLoc, shouldColorShift);

    // Clear and draw
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.uniform3fv(centerPosLoc, centerPos);
    // Draw the blue snowflake
    gl.uniformMatrix3fv(translationMatrixLoc, true, translationMatrix);
    gl.uniformMatrix3fv(scaleMatrixLoc, true, scaleMatrix1);
    gl.uniform3fv(colorLoc, colorBlue);
    gl.uniform1i(colorShiftLoc, shouldColorShift);
    gl.drawArrays(gl.TRIANGLES, 0, verticesFinal.length / 2);

    // Draw the white snowflake
    gl.uniformMatrix3fv(translationMatrixLoc, true, translationMatrix);
    gl.uniformMatrix3fv(scaleMatrixLoc, true, scaleMatrix2);
    gl.uniform3fv(colorLoc, colorWhite);
    gl.uniform1i(colorShiftLoc, 0.0);
    gl.drawArrays(gl.TRIANGLES, 0, verticesFinal.length / 2);

    requestAnimationFrame(drawScene);
}


//KEY CALLBACK
document.addEventListener('keydown', function(event)
{
    switch(event.key)
    {
        case "ArrowLeft":
            centerPos[0] -= 0.1;
            translationMatrix[2] -= 0.1;
            break;
        case "ArrowRight":
            centerPos[0] += 0.1;
            translationMatrix[2] += 0.1;
            break;
        case "ArrowUp":
            centerPos[1] += 0.1;
            translationMatrix[5] += 0.1;
            break;
        case "ArrowDown":
            centerPos[1] -= 0.1;
            translationMatrix[5] -= 0.1;
            break;

        case '+': // Plus key
            rotationAngle += 1.0;
            break;

        case '-': // Minus key
            rotationAngle -= 1.0;
            break;

        case '1': // One key
            // Reset the transformation and rotation matrices to their initial state
            centerPos = [0.0, (point1.y + point2.y + point3.y) / 3, 0.0];
            translationMatrix = [
                1.0, 0.0, 0.0,
                0.0, 1.0, 0.0,
                0.0, 0.0, 1.0
            ];
            rotationAngle = 0.0;
            shouldSwing = 0.0;
            shouldColorShift = 0.0;
            break;

        case '2':
            shouldSwing = 1.0;
            break;

        case '3':
            shouldSwing = 1.0;
            shouldColorShift = 1.0;
            break;
    }
});

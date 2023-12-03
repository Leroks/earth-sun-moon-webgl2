const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');

const outerRadius = 0.5;
const innerRadius = 0.2;

const vertices = [];
// Center of the star
vertices.push(0.0, 0.0);

for (let i = 0; i <= 20; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const theta = (i / 10) * Math.PI; // Angle for each point

    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);

    vertices.push(x, y);
}

const vertexShaderSource = `
  attribute vec2 aPosition;
  uniform float uRotation; // Rotation angle in radians
  void main() {
    // Create a rotation matrix
    mat2 rotationMatrix = mat2(cos(uRotation), -sin(uRotation), sin(uRotation), cos(uRotation));
    
    // Apply rotation to the position
    vec2 rotatedPosition = rotationMatrix * aPosition;

    gl_Position = vec4(rotatedPosition, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  void main() {
    gl_FragColor = vec4(1.0, 1.0, 0.0, 1.0); // Yellow color
  }
`;

const vertexBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

gl.useProgram(shaderProgram);

const aPosition = gl.getAttribLocation(shaderProgram, 'aPosition');
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

const uRotation = gl.getUniformLocation(shaderProgram, 'uRotation');

gl.clearColor(0.0, 0.0, 0.0, 1.0);
gl.clear(gl.COLOR_BUFFER_BIT);

function draw() {
    // Rotate 0.01 radians per frame
    const rotationAngle = performance.now() * 0.001;

    // Set the rotation angle in the shader
    gl.uniform1f(uRotation, rotationAngle);

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLE_FAN, 0, vertices.length / 2);

    requestAnimationFrame(draw);
}

draw();

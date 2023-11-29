
const canvas = document.getElementById('canvas');
const gl = canvas.getContext('webgl2');


const outerRadius = 0.5;
const innerRadius = 0.2;

const vertices = [];

for (let i = 0; i < 11; i++) {
    const outerX = outerRadius * Math.cos((2 * Math.PI * i) / 10);
    const outerY = outerRadius * Math.sin((2 * Math.PI * i) / 10);

    vertices.push(outerX, outerY);

    const innerX = innerRadius * Math.cos((2 * Math.PI * (i + 0.5)) / 10);
    const innerY = innerRadius * Math.sin((2 * Math.PI * (i + 0.5)) / 10);

    vertices.push(innerX, innerY);
}



const vertexShaderSource = `
  attribute vec2 aPosition;
  void main() {
    gl_Position = vec4(aPosition, 0.0, 1.0);
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

// Compile the vertex shader
const vertexShader = gl.createShader(gl.VERTEX_SHADER);
gl.shaderSource(vertexShader, vertexShaderSource);
gl.compileShader(vertexShader);

// Compile the fragment shader
const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
gl.shaderSource(fragmentShader, fragmentShaderSource);
gl.compileShader(fragmentShader);

// Link the shaders to form a program
const shaderProgram = gl.createProgram();
gl.attachShader(shaderProgram, vertexShader);
gl.attachShader(shaderProgram, fragmentShader);
gl.linkProgram(shaderProgram);

gl.useProgram(shaderProgram);

gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
const aPosition = gl.getAttribLocation(shaderProgram, 'aPosition');
gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear the canvas with black color
gl.clear(gl.COLOR_BUFFER_BIT);
gl.drawArrays(gl.LINE_STRIP, 0, vertices.length / 2);

const MODEL_PATH = "./my_model/";
let model = null;
let maxPredictions = 0;
let webcam = null;
let isCameraOn = false;

const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const uploadInput = document.getElementById("uploadInput");
const cameraBox = document.getElementById("camera-box");
const placeholder = document.getElementById("placeholder");
const labelContainer = document.getElementById("label-container");
const statusEl = document.getElementById("status");

// load model on startup
async function loadModel() {
  statusEl.textContent = "Loading model...";
  try {
    const modelURL = MODEL_PATH + "model.json";
    const metadataURL = MODEL_PATH + "metadata.json";
    model = await tmImage.load(modelURL, metadataURL);
    maxPredictions = model.getTotalClasses();
    statusEl.textContent = `Model loaded — ${maxPredictions} classes`;
    createLabelBoxes();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Failed to load model (check my_model folder)";
  }
}

// create result UI placeholders
function createLabelBoxes(){
  labelContainer.innerHTML = "";
  for (let i=0;i<maxPredictions;i++){
    const row = document.createElement("div");
    row.className = "label-row";
    row.innerHTML = `
      <div class="row-top">
        <div class="class-name">Class ${i+1}</div>
        <div class="percent-text">0%</div>
      </div>
      <div class="progress-wrapper">
        <div class="progress-fill" style="width:0%"></div>
      </div>
    `;
    labelContainer.appendChild(row);
  }
}

// Start camera
async function startCamera(){
  if (!model){ alert("Model not loaded yet."); return; }
  if (isCameraOn) return;
  try {
    statusEl.textContent = "Starting camera...";
    webcam = new tmImage.Webcam(400, 300, true); // width, height, flip
    await webcam.setup(); // request camera permissions
    await webcam.play();
    // attach canvas to cameraBox
    clearCameraBox();
    cameraBox.appendChild(webcam.canvas);
    isCameraOn = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    placeholder.style.display = "none";
    statusEl.textContent = "Camera is running — predicting...";
    runCamLoop();
  } catch (err) {
    console.error(err);
    statusEl.textContent = "Camera error or permission denied.";
    placeholder.style.display = "flex";
  }
}

// Stop camera
function stopCamera(){
  if (!isCameraOn) return;
  webcam.stop();
  webcam = null;
  isCameraOn = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  clearCameraBox();
  cameraBox.appendChild(placeholder);
  placeholder.style.display = "flex";
  statusEl.textContent = "Camera stopped";
}

// remove all children but keep placeholder variable intact
function clearCameraBox(){
  while (cameraBox.firstChild) cameraBox.removeChild(cameraBox.firstChild);
}

// camera loop
async function runCamLoop(){
  if (!isCameraOn || !webcam) return;
  webcam.update();
  await predictFromCanvas(webcam.canvas);
  requestAnimationFrame(runCamLoop);
}

// predict from an HTML element (image or canvas)
async function predictFromElement(el){
  if (!model) return;
  const prediction = await model.predict(el);
  updateUI(prediction);
}

// predict from canvas used by webcam
async function predictFromCanvas(canvas){
  if (!model) return;
  try {
    const prediction = await model.predict(canvas);
    updateUI(prediction);
  } catch (err) {
    console.error("Prediction error:", err);
  }
}
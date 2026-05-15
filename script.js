const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const captureBtn = document.getElementById("captureBtn");
const downloadLink = document.getElementById("downloadLink");
const faceStatus = document.getElementById("faceStatus");

// Overlay elements
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");

const canvasWidth = 640;
const canvasHeight = 800;
const photoAreaHeight = 600;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

let latestFaceBox = null;
let isCameraRunning = false;

// MediaPipe Face Detection
const faceDetection = new FaceDetection.FaceDetection({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/${file}`;
  }
});

faceDetection.setOptions({
  model: "short",
  minDetectionConfidence: 0.6
});

faceDetection.onResults((results) => {
  if (results.detections && results.detections.length > 0) {
    latestFaceBox = results.detections[0].boundingBox;
    faceStatus.innerText = "✅ 偵測到人臉";
  } else {
    latestFaceBox = null;
    faceStatus.innerText = "⚠️ 尚未偵測到人臉";
  }
});

// 顯示 Overlay
function showOverlay(title, text) {
  overlayTitle.innerText = title;
  overlayText.innerText = text;
  overlay.classList.remove("hidden");
}

// 隱藏 Overlay
function hideOverlay() {
  overlay.classList.add("hidden");
}

// 啟動相機
async function startCamera() {
  try {
    showOverlay("正在啟動相機...", "請稍候，系統正在請求相機授權。");

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    isCameraRunning = true;

    hideOverlay();

    captureBtn.disabled = false;
    startBtn.disabled = true;
    faceStatus.innerText = "相機已啟動，正在偵測人臉...";

    detectLoop();
    drawLoop();

  } catch (err) {
    console.error(err);

    showOverlay("⚠️ 相機啟動失敗", "請確認已允許相機權限，或使用 HTTPS 網址。");

    faceStatus.innerText = "❌ 相機啟動失敗";
    startBtn.disabled = false;
  }
}

// 偵測迴圈
async function detectLoop() {
  if (!isCameraRunning) return;

  try {
    await faceDetection.send({ image: video });
  } catch (err) {
    console.error("偵測錯誤:", err);
  }

  requestAnimationFrame(detectLoop);
}

// 繪製拍立得畫面
function drawLoop() {
  if (!isCameraRunning) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 相機畫面
  ctx.drawImage(video, 0, 0, canvasWidth, photoAreaHeight);

  // 復古淡色濾鏡
  ctx.fillStyle = "rgba(255, 230, 200, 0.18)";
  ctx.fillRect(0, 0, canvasWidth, photoAreaHeight);

  // 人臉框
  if (latestFaceBox) {
    const x = latestFaceBox.xCenter * canvasWidth - (latestFaceBox.width * canvasWidth) / 2;
    const y = latestFaceBox.yCenter * photoAreaHeight - (latestFaceBox.height * photoAreaHeight) / 2;
    const w = latestFaceBox.width * canvasWidth;
    const h = latestFaceBox.height * photoAreaHeight;

    ctx.strokeStyle = "rgba(0,255,0,0.85)";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
  }

  // 拍立得底部留白
  ctx.fillStyle = "white";
  ctx.fillRect(0, photoAreaHeight, canvasWidth, canvasHeight - photoAreaHeight);

  // 文字
  ctx.fillStyle = "black";
  ctx.font = "48px cursive";
  ctx.textAlign = "center";
  ctx.fillText("遇見東北角", canvasWidth / 2, 720);

  requestAnimationFrame(drawLoop);
}

// 拍照下載 JPG
function capturePhoto() {
  const dataURL = canvas.toDataURL("image/jpeg", 0.95);
  downloadLink.href = dataURL;
  downloadLink.style.display = "inline-block";
  downloadLink.innerText = "下載照片 (JPG)";
}

startBtn.addEventListener("click", startCamera);
captureBtn.addEventListener("click", capturePhoto);
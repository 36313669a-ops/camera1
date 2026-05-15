const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const captureBtn = document.getElementById("captureBtn");
const downloadLink = document.getElementById("downloadLink");
const faceStatus = document.getElementById("faceStatus");

const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");

const canvasWidth = 640;
const canvasHeight = 800;
const photoAreaHeight = 600;

canvas.width = canvasWidth;
canvas.height = canvasHeight;

let isCameraRunning = false;
let latestFaceBox = null;

function showOverlay(title, text) {
  overlayTitle.innerText = title;
  overlayText.innerText = text;
  overlay.classList.remove("hidden");
}

function hideOverlay() {
  overlay.classList.add("hidden");
}

function getTodayDate() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
}

// ✅ 正確建立 MediaPipe FaceDetection
const faceDetection = new FaceDetection({
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

async function startCamera() {
  showOverlay("正在啟動相機...", "請在跳出的視窗點選「允許」。");

  // HTTPS 檢查
  if (location.protocol !== "https:" && location.hostname !== "localhost") {
    showOverlay("❌ 必須使用 HTTPS", "請用 GitHub Pages 的 https:// 網址開啟。");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;
    await video.play();

    isCameraRunning = true;

    hideOverlay();

    startBtn.disabled = true;
    captureBtn.disabled = false;
    faceStatus.innerText = "相機已啟動，正在偵測中...";

    detectLoop();
    drawLoop();

  } catch (err) {
    console.error(err);
    showOverlay("❌ 相機啟動失敗", err.name + ": " + err.message);
    faceStatus.innerText = "❌ 相機啟動失敗";
  }
}

async function detectLoop() {
  if (!isCameraRunning) return;

  try {
    await faceDetection.send({ image: video });
  } catch (err) {
    console.error("偵測錯誤:", err);
  }

  requestAnimationFrame(detectLoop);
}

function drawLoop() {
  if (!isCameraRunning) return;

  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 相機畫面
  ctx.drawImage(video, 0, 0, canvasWidth, photoAreaHeight);

  // 復古濾鏡
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

  // 拍立得留白
  ctx.fillStyle = "white";
  ctx.fillRect(0, photoAreaHeight, canvasWidth, canvasHeight - photoAreaHeight);

  // 手寫鋼筆字：遇見東北角
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = "72px Caveat";
  ctx.fillText("遇見東北角", canvasWidth / 2, 715);

  // 日期（右下角）
  ctx.textAlign = "right";
  ctx.font = "42px Caveat";
  ctx.fillText(getTodayDate(), canvasWidth - 40, 770);

  requestAnimationFrame(drawLoop);
}

function capturePhoto() {
  const dataURL = canvas.toDataURL("image/jpeg", 0.95);
  downloadLink.href = dataURL;
  downloadLink.style.display = "inline-block";
  downloadLink.innerText = "下載照片 (JPG)";
}

startBtn.addEventListener("click", startCamera);
captureBtn.addEventListener("click", capturePhoto);
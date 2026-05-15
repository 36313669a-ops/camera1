const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

const startBtn = document.getElementById("startBtn");
const captureBtn = document.getElementById("captureBtn");
const downloadLink = document.getElementById("downloadLink");
const faceStatus = document.getElementById("faceStatus");

// 設定拍立得畫布大小（內框比例）
const canvasWidth = 640;
const canvasHeight = 800; // 下方留白較大

canvas.width = canvasWidth;
canvas.height = canvasHeight;

let latestFaceBox = null;

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
    const box = results.detections[0].boundingBox;
    latestFaceBox = box;
    faceStatus.innerText = "✅ 偵測到人臉";
  } else {
    latestFaceBox = null;
    faceStatus.innerText = "⚠️ 尚未偵測到人臉";
  }

  drawFrame();
});

async function startCamera() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false
    });

    video.srcObject = stream;

    video.onloadedmetadata = () => {
      video.play();
      captureBtn.disabled = false;
      faceStatus.innerText = "相機已啟動，偵測中...";
    };

    // 使用 MediaPipe camera utils
    const camera = new Camera(video, {
      onFrame: async () => {
        await faceDetection.send({ image: video });
      },
      width: 640,
      height: 480
    });

    camera.start();

  } catch (err) {
    alert("無法啟動相機：" + err.message);
  }
}

function drawFrame() {
  // 清除畫布
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // 設定相機畫面區域 (上方)
  const photoAreaHeight = 600;

  // 繪製相機影像到上方區域
  ctx.drawImage(video, 0, 0, canvasWidth, photoAreaHeight);

  // 套用淡淡復古濾鏡效果
  ctx.fillStyle = "rgba(255, 230, 200, 0.15)";
  ctx.fillRect(0, 0, canvasWidth, photoAreaHeight);

  // 如果偵測到臉，畫框提示
  if (latestFaceBox) {
    const x = latestFaceBox.xCenter * canvasWidth - (latestFaceBox.width * canvasWidth) / 2;
    const y = latestFaceBox.yCenter * photoAreaHeight - (latestFaceBox.height * photoAreaHeight) / 2;
    const w = latestFaceBox.width * canvasWidth;
    const h = latestFaceBox.height * photoAreaHeight;

    ctx.strokeStyle = "rgba(0,255,0,0.8)";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
  }

  // 下方白色拍立得留白
  ctx.fillStyle = "white";
  ctx.fillRect(0, photoAreaHeight, canvasWidth, canvasHeight - photoAreaHeight);

  // 文字：遇見東北角
  ctx.fillStyle = "black";
  ctx.font = "48px cursive";
  ctx.textAlign = "center";
  ctx.fillText("遇見東北角", canvasWidth / 2, 720);
}

// 拍照下載
function capturePhoto() {
  const dataURL = canvas.toDataURL("image/jpeg", 0.95);
  downloadLink.href = dataURL;
  downloadLink.style.display = "inline-block";
  downloadLink.innerText = "下載照片 (JPG)";
}

startBtn.addEventListener("click", startCamera);
captureBtn.addEventListener("click", capturePhoto);
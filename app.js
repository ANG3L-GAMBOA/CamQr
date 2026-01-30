const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture");
const switchCameraBtn = document.getElementById("switchCamera");
const flash = document.getElementById("flash");
const status = document.getElementById("status");

// Variable para controlar qué cámara usar
let currentFacingMode = "environment"; // Comienza con cámara trasera
let stream = null;

// 🔹 Iniciar cámara con el modo especificado
async function startCamera(facingMode = "environment") {
  try {
    // Detener stream anterior si existe
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Solicitar nueva cámara
    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode,
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });

    video.srcObject = stream;
    currentFacingMode = facingMode;

    // Aplicar espejo solo si es cámara frontal
    if (facingMode === "user") {
      video.style.transform = "scaleX(-1)";
    } else {
      video.style.transform = "scaleX(1)";
    }
  } catch (err) {
    showStatus("Error al acceder a la cámara: " + err.message, "error");
    console.error("Error de cámara:", err);
  }
}

// Iniciar con cámara trasera al cargar
startCamera("environment");

// 🔹 Cambiar entre cámara frontal y trasera
switchCameraBtn.addEventListener("click", () => {
  const newFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  startCamera(newFacingMode);

  // Feedback visual
  switchCameraBtn.style.transform = "scale(0.9) rotate(180deg)";
  setTimeout(() => {
    switchCameraBtn.style.transform = "";
  }, 200);
});

// 🔹 Mostrar mensaje de estado
function showStatus(message, type) {
  status.textContent = message;
  status.className = `status-message ${type} show`;

  setTimeout(() => {
    status.classList.remove("show");
  }, 4000);
}

// 🔹 Efecto flash al capturar
function triggerFlash() {
  flash.classList.add("active");
  setTimeout(() => {
    flash.classList.remove("active");
  }, 500);
}

// 🔹 Capturar foto y descargar
captureBtn.addEventListener("click", async () => {
  captureBtn.disabled = true;

  // Efecto flash
  triggerFlash();

  // Capturar imagen
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  // Si es cámara frontal, voltear la imagen para que se vea correcta
  if (currentFacingMode === "user") {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    // Cámara trasera - dibujar normal
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  // Descargar la foto
  downloadPhoto();

  captureBtn.disabled = false;
});

// 🔹 Descargar foto capturada
function downloadPhoto() {
  try {
    showStatus("📥 Descargando foto...", "success");

    // Obtener la imagen del canvas
    const imageData = canvas.toDataURL("image/jpeg", 0.95);

    // Crear enlace de descarga
    const link = document.createElement("a");
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    link.download = `Mis15Anos_${timestamp}.jpg`;
    link.href = imageData;
    link.click();

    showStatus("✅ ¡Foto descargada correctamente!", "success");
  } catch (err) {
    showStatus("❌ Error al descargar: " + err.message, "error");
    console.error("Error:", err);
  }
}

// 🔹 Crear efecto de estrellas flotantes
function createSparkles() {
  const sparklesContainer = document.getElementById("sparkles");

  for (let i = 0; i < 30; i++) {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle";
    sparkle.style.left = Math.random() * 100 + "%";
    sparkle.style.animationDelay = Math.random() * 3 + "s";
    sparkle.style.animationDuration = Math.random() * 3 + 2 + "s";
    sparklesContainer.appendChild(sparkle);
  }
}

createSparkles();
const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture");
const switchCameraBtn = document.getElementById("switchCamera");
const flash = document.getElementById("flash");
const status = document.getElementById("status");

// Variable para controlar qué cámara usar
let currentFacingMode = "environment";
let stream = null;

// Detectar si es dispositivo móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 🔹 CONFIGURACIÓN DE CLOUDINARY
const CLOUDINARY_CLOUD_NAME = "daybmsrjv"; // ✅ Tu Cloud Name
const CLOUDINARY_UPLOAD_PRESET = "15años"; // ⚠️ REEMPLAZA con el nombre del preset que creaste

// 🔹 Iniciar cámara con el modo especificado
async function startCamera(facingMode = "environment") {
  try {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    const constraints = {
      video: {
        facingMode: facingMode,
        width: isMobile ? { ideal: 1280, max: 1920 } : { ideal: 1920 },
        height: isMobile ? { ideal: 720, max: 1080 } : { ideal: 1080 },
        aspectRatio: { ideal: 16/9 },
        frameRate: { ideal: 30, max: 30 },
        zoom: { ideal: 1.0 }
      },
    };

    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      constraints.video = {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    }

    video.srcObject = stream;
    currentFacingMode = facingMode;

    const videoTrack = stream.getVideoTracks()[0];

    try {
      const capabilities = videoTrack.getCapabilities();
      const settings = {};

      if (capabilities.zoom) {
        await videoTrack.applyConstraints({
          advanced: [{ zoom: 1.0 }]
        });
      }

      if (facingMode === "environment") {
        if (capabilities.exposureMode && capabilities.exposureMode.includes('continuous')) {
          settings.exposureMode = 'continuous';
        }
        
        if (capabilities.whiteBalanceMode && capabilities.whiteBalanceMode.includes('continuous')) {
          settings.whiteBalanceMode = 'continuous';
        }

        if (capabilities.focusMode && capabilities.focusMode.includes('continuous')) {
          settings.focusMode = 'continuous';
        }

        if (Object.keys(settings).length > 0) {
          await videoTrack.applyConstraints({ advanced: [settings] });
        }
      }
    } catch (err) {
      // Ignorar errores de configuraciones no disponibles
    }

    if (facingMode === "user") {
      video.style.transform = "scaleX(-1)";
    } else {
      video.style.transform = "scaleX(1)";
    }

  } catch (err) {
    showStatus("Error al acceder a la cámara: " + err.message, "error");
    
    if (err.name === 'NotAllowedError') {
      showStatus("⚠️ Por favor permite el acceso a la cámara", "error");
    }
  }
}

startCamera("environment");

// 🔹 Cambiar entre cámara frontal y trasera
switchCameraBtn.addEventListener("click", async () => {
  const newFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  
  switchCameraBtn.style.transform = "scale(0.85) rotate(180deg)";
  
  await startCamera(newFacingMode);
  
  setTimeout(() => {
    switchCameraBtn.style.transform = "";
  }, 300);
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

// 🔹 Capturar foto y subir automáticamente a Cloudinary
captureBtn.addEventListener("click", async () => {
  captureBtn.disabled = true;

  triggerFlash();
  
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }

  await new Promise(resolve => setTimeout(resolve, 100));

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  if (currentFacingMode === "user") {
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();
  } else {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  }

  // Subir automáticamente a Cloudinary
  await uploadToCloudinary();

  captureBtn.disabled = false;
});

// 🔹 Subir foto a Cloudinary (AUTOMÁTICO)
async function uploadToCloudinary() {
  try {
    showStatus("📤 Subiendo foto a la nube...", "success");

    // Convertir canvas a Blob
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg', 0.92);
    });

    // Crear FormData para el upload
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Agregar carpeta y metadata
    const timestamp = new Date().toISOString();
    formData.append('folder', 'mis-15-anos');
    formData.append('public_id', `foto_${Date.now()}`);
    formData.append('context', `camera=${currentFacingMode}|timestamp=${timestamp}`);

    // Hacer el upload
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al subir la imagen');
    }

    const data = await response.json();

    showStatus("✅ ¡Foto guardada en la nube!", "success");
    
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }

  } catch (err) {
    showStatus("❌ Error al subir: " + err.message, "error");
  }
}

// 🔹 Crear efecto de estrellas flotantes
function createSparkles() {
  const sparklesContainer = document.getElementById("sparkles");
  const sparkleCount = isMobile ? 15 : 30;

  for (let i = 0; i < sparkleCount; i++) {
    const sparkle = document.createElement("div");
    sparkle.className = "sparkle";
    sparkle.style.left = Math.random() * 100 + "%";
    sparkle.style.animationDelay = Math.random() * 3 + "s";
    sparkle.style.animationDuration = Math.random() * 3 + 2 + "s";
    sparklesContainer.appendChild(sparkle);
  }
}

createSparkles();

// 🔹 Prevenir zoom en doble tap
document.addEventListener('touchstart', function(e) {
  if (e.touches.length > 1) {
    e.preventDefault();
  }
}, { passive: false });

let lastTouchEnd = 0;
document.addEventListener('touchend', function(e) {
  const now = Date.now();
  if (now - lastTouchEnd <= 300) {
    e.preventDefault();
  }
  lastTouchEnd = now;
}, { passive: false });
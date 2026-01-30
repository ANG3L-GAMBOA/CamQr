const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture");
const switchCameraBtn = document.getElementById("switchCamera");
const flash = document.getElementById("flash");
const status = document.getElementById("status");

// Variable para controlar qué cámara usar
let currentFacingMode = "environment"; // Comienza con cámara trasera
let stream = null;

// Detectar si es dispositivo móvil
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// 🔹 Iniciar cámara con el modo especificado - OPTIMIZADO PARA MÓVIL
async function startCamera(facingMode = "environment") {
  try {
    // Detener stream anterior si existe
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    // Configuración específica para móviles
    const constraints = {
      video: {
        facingMode: facingMode,
        // En móviles, usar resoluciones más apropiadas
        width: isMobile ? { ideal: 1280, max: 1920 } : { ideal: 1920 },
        height: isMobile ? { ideal: 720, max: 1080 } : { ideal: 1080 },
        aspectRatio: { ideal: 16/9 },
        frameRate: { ideal: 30, max: 30 }
      },
    };

    // Intentar con la cámara específica
    try {
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      // Si falla, intentar sin restricciones estrictas
      console.log("Intentando configuración simplificada...");
      constraints.video = {
        facingMode: facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 }
      };
      stream = await navigator.mediaDevices.getUserMedia(constraints);
    }

    video.srcObject = stream;
    currentFacingMode = facingMode;

    // Aplicar configuraciones avanzadas al track de video
    const videoTrack = stream.getVideoTracks()[0];
    
    // Mostrar configuraciones actuales
    console.log("✅ Cámara iniciada:", facingMode);
    console.log("📹 Configuración:", videoTrack.getSettings());

    // Intentar aplicar mejoras de calidad (si el dispositivo lo soporta)
    try {
      const capabilities = videoTrack.getCapabilities();
      const settings = {};

      // Solo para cámara trasera, intentar mejorar exposición
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

        // Aplicar si hay configuraciones disponibles
        if (Object.keys(settings).length > 0) {
          await videoTrack.applyConstraints({ advanced: [settings] });
          console.log("✨ Mejoras aplicadas:", settings);
        }
      }
    } catch (err) {
      console.log("⚠️ Algunas mejoras no disponibles:", err.message);
    }

    // Aplicar espejo solo si es cámara frontal
    if (facingMode === "user") {
      video.style.transform = "scaleX(-1)";
    } else {
      video.style.transform = "scaleX(1)";
    }

  } catch (err) {
    showStatus("Error al acceder a la cámara: " + err.message, "error");
    console.error("❌ Error de cámara:", err);
    
    // Sugerencia para el usuario
    if (err.name === 'NotAllowedError') {
      showStatus("⚠️ Por favor permite el acceso a la cámara", "error");
    }
  }
}

// Iniciar con cámara trasera al cargar
startCamera("environment");

// 🔹 Cambiar entre cámara frontal y trasera
switchCameraBtn.addEventListener("click", async () => {
  const newFacingMode =
    currentFacingMode === "environment" ? "user" : "environment";
  
  // Feedback visual inmediato
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

// 🔹 Capturar foto y descargar
captureBtn.addEventListener("click", async () => {
  captureBtn.disabled = true;

  // Efecto flash
  triggerFlash();
  
  // Pequeña vibración en móviles (si está disponible)
  if (navigator.vibrate) {
    navigator.vibrate(50);
  }

  // Esperar un frame para que el flash sea visible
  await new Promise(resolve => setTimeout(resolve, 100));

  // Capturar imagen
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");

  // Mejorar la calidad de la imagen capturada
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

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

// 🔹 Descargar foto capturada - OPTIMIZADO PARA MÓVIL
function downloadPhoto() {
  try {
    showStatus("📥 Descargando foto...", "success");

    // Calidad según el dispositivo
    const quality = isMobile ? 0.92 : 0.95; // Ligeramente menor en móvil para mejor rendimiento
    const imageData = canvas.toDataURL("image/jpeg", quality);

    // Crear enlace de descarga
    const link = document.createElement("a");
    const now = new Date();
    const timestamp = now.toLocaleString('es-PE', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(/[/:,\s]/g, '-');
    
    link.download = `Mis15Anos_${timestamp}.jpg`;
    link.href = imageData;
    
    // En móviles, abrir en nueva pestaña también
    if (isMobile) {
      link.target = '_blank';
    }
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showStatus("✅ ¡Foto guardada!", "success");
    
    // Vibración de confirmación
    if (navigator.vibrate) {
      navigator.vibrate([50, 100, 50]);
    }
    
  } catch (err) {
    showStatus("❌ Error al guardar: " + err.message, "error");
    console.error("Error:", err);
  }
}

// 🔹 Crear efecto de estrellas flotantes (menos en móvil para mejor rendimiento)
function createSparkles() {
  const sparklesContainer = document.getElementById("sparkles");
  const sparkleCount = isMobile ? 15 : 30; // Menos estrellas en móvil

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

// 🔹 Prevenir zoom en doble tap (iOS/Android)
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

console.log("📱 App optimizada para móvil:", isMobile ? "SÍ" : "NO");
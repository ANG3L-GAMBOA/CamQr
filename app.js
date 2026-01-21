const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture");
const switchCameraBtn = document.getElementById("switchCamera");
const flash = document.getElementById("flash");
const status = document.getElementById("status");

// Variable para controlar qué cámara usar
let currentFacingMode = "environment"; // Comienza con cámara trasera
let stream = null;

// 🔹 Configuración de Firebase (REEMPLAZA CON TUS CREDENCIALES)
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_DOMINIO",
  projectId: "TU_ID",
  storageBucket: "TU_BUCKET",
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const storage = firebase.storage();
const db = firebase.firestore();

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

// 🔹 Cuenta regresiva antes de capturar
function startCountdown() {
  return new Promise((resolve) => {
    let count = 3;
    countdown.style.display = "block";

    const interval = setInterval(() => {
      countdown.textContent = count;
      countdown.style.animation = "none";

      // Reiniciar animación
      setTimeout(() => {
        countdown.style.animation = "pulse 1s ease-in-out";
      }, 10);

      count--;

      if (count < 0) {
        clearInterval(interval);
        countdown.style.display = "none";
        resolve();
      }
    }, 1000);
  });
}

// 🔹 Efecto flash al capturar
function triggerFlash() {
  flash.classList.add("active");
  setTimeout(() => {
    flash.classList.remove("active");
  }, 500);
}

// 🔹 Capturar foto con cuenta regresiva
captureBtn.addEventListener("click", async () => {
  captureBtn.disabled = true;

  // Iniciar cuenta regresiva
  await startCountdown();

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

  const imageData = canvas.toDataURL("image/jpeg", 0.95);

  // Subir a Firebase
  await uploadPhoto(imageData);

  captureBtn.disabled = false;
});

// 🔹 Subir foto a Firebase Storage y Firestore
async function uploadPhoto(imageData) {
  try {
    showStatus("📤 Subiendo foto...", "success");

    const date = new Date().toISOString().split("T")[0];
    const fileName = `photos/${date}/${Date.now()}.jpg`;

    const ref = storage.ref(fileName);
    await ref.putString(imageData, "data_url");

    // Guardar metadata en Firestore
    await db.collection("photos").add({
      path: fileName,
      date: date,
      camera: currentFacingMode, // Guardar qué cámara se usó
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    showStatus("✅ ¡Foto guardada correctamente!", "success");
  } catch (err) {
    showStatus("❌ Error al guardar: " + err.message, "error");
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

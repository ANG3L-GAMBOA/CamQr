const video = document.getElementById("video");
const canvas = document.getElementById("canvas");
const captureBtn = document.getElementById("capture");

// 🔹 Configuración de Firebase
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

// 🔹 Iniciar cámara
async function startCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: "environment",
      width: { ideal: 1920 },
      height: { ideal: 1080 },
    },
  });
  video.srcObject = stream;
}

startCamera();

// 🔹 Capturar foto
captureBtn.addEventListener("click", async () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  const imageData = canvas.toDataURL("image/jpeg", 0.95);

  await uploadPhoto(imageData);
});

// 🔹 Subir foto a Firebase
async function uploadPhoto(imageData) {
  const date = new Date().toISOString().split("T")[0];
  const fileName = `photos/${date}/${Date.now()}.jpg`;

  const ref = storage.ref(fileName);
  await ref.putString(imageData, "data_url");

  await db.collection("photos").add({
    path: fileName,
    date: date,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  alert("✅ Foto guardada correctamente");
}

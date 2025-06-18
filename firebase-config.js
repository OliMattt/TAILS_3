import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDFBKh3jzLMHpSFPHdSJuLSArOSAZrNdas",
  authDomain: "tails-vet-app.firebaseapp.com",
  projectId: "tails-vet-app",
  storageBucket: "tails-vet-app.firebasestorage.app",
  messagingSenderId: "304548941094",
  appId: "1:304548941094:web:75b67f72d254955db885e7"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta os serviços que vamos usar
export const auth = getAuth(app);
export const db = getFirestore(app);

/**
 * Exibe uma notificação de sucesso.
 * @param {string} message A mensagem a ser exibida.
 */
export function showSuccessToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top", // `top` ou `bottom`
        position: "right", // `left`, `center` ou `right`
        stopOnFocus: true, // Impede que a notificação suma quando o mouse está sobre ela
        style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
        },
    }).showToast();
}

/**
 * Exibe uma notificação de erro.
 * @param {string} message A mensagem a ser exibida.
 */
export function showErrorToast(message) {
    Toastify({
        text: message,
        duration: 5000, // Erros ficam um pouco mais de tempo na tela
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: "linear-gradient(to right, #ff5f6d, #ffc371)",
        },
    }).showToast();
}
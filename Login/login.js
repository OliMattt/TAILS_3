import { auth, showSuccessToast, showErrorToast } from '../firebase-config.js';

import { 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('.login-form');
    const googleButton = document.querySelector('.btn-google');
    const forgotPasswordLink = document.querySelector('.forgot-password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const senha = document.getElementById('senha').value;

        try {
            console.log("Tentando fazer login com e-mail e senha...");
            const userCredential = await signInWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;
            
            console.log("Login bem-sucedido!", user);
            showSuccessToast('Login realizado com sucesso!');

            setTimeout(() => {
                window.location.href = '../dashboard/dashboard.html';
            }, 1500); 

        } catch (error) {
            console.error("Erro no login:", error.code);
            showErrorToast('Erro: E-mail ou senha inválidos. Por favor, tente novamente.');
        }
    });

    googleButton.addEventListener('click', async () => {
        const provider = new GoogleAuthProvider();

        try {
            console.log("Abrindo popup de login com Google...");
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            console.log("Login com Google bem-sucedido!", user);
            showSuccessToast(`Bem-vindo, ${user.displayName}!`);
            
            setTimeout(() => {
                window.location.href = '../dashboard/dashboard.html';
            }, 1500); 


        } catch (error) {
            console.error("Erro no login com Google:", error);
            showErrorToast('Erro: Ocorreu um erro ao tentar fazer login com o Google.');
        }
    });

    forgotPasswordLink.addEventListener('click', (e) => {
        e.preventDefault();
        
        const email = prompt("Por favor, digite o seu e-mail para redefinir a senha:");

        if (email) {
            sendPasswordResetEmail(auth, email)
                .then(() => {
                    showSuccessToast('E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.');
                })
                .catch((error) => {
                    console.error("Erro ao enviar e-mail de redefinição:", error);
                    showErrorToast('Erro: Não foi possível enviar o e-mail. Verifique se o endereço está correto.');
                });
        }
    });
});
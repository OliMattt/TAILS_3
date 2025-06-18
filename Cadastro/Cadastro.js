import { auth, db, showSuccessToast, showErrorToast } from '../firebase-config.js';

import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, addDoc, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.cadastro-form');
    const planoCards = document.querySelectorAll('.plano-card');
    const planoSelecionadoInput = document.getElementById('planoSelecionado');
    const cnpjInput = document.getElementById('cnpj');
    const cepInput = document.getElementById('cep');
    const telefoneInput = document.getElementById('telefone');

    // Seleção de plano
    planoCards.forEach(card => {
        card.addEventListener('click', function() {
            planoCards.forEach(c => c.classList.remove('plano-selecionado'));
            this.classList.add('plano-selecionado');
            planoSelecionadoInput.value = this.dataset.plano;
        });
    });

    // Máscara para CNPJ
    cnpjInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 14); // Limita a 14 dígitos
        if (value.length > 12) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
        } else if (value.length > 8) {
            value = value.replace(/^(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4");
        } else if (value.length > 5) {
            value = value.replace(/^(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{1,3})/, "$1.$2");
        }
        e.target.value = value;
    });

    // Máscara para CEP
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 8); // Limita a 8 dígitos
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d{1,3})/, "$1-$2");
        }
        e.target.value = value;
    });

    // Máscara para telefone
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 11); // Limita a 11 dígitos
        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (value.length > 6) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
        } else {
            value = value.replace(/^(\d*)/, "($1");
        }
        e.target.value = value;
    });

    // Auto-selecionar plano recomendado
    if (document.querySelector('.plano-recomendado')) {
        document.querySelector('.plano-recomendado').click();
    }
    
    form.addEventListener('submit', async (e) => {
        console.log("TESTE: O botão de cadastro foi clicado.");

        e.preventDefault(); 

        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        if (senha !== confirmarSenha) {
            showErrorToast('Erro: As senhas não coincidem!');
            return;
        }
        if (!planoSelecionadoInput.value) {
            showErrorToast('Erro: selecione um plano de assinatura!');
            return;
        }

        const email = document.getElementById('email').value;
        const nomeResponsavel = document.getElementById('nomeResponsavel').value;

        // Cria um objeto com os dados da Clínica
        const dadosClinica = {
            nomeFantasia: document.getElementById('nomeClinica').value,
            cnpj: document.getElementById('cnpj').value,
            telefone: document.getElementById('telefone').value,
            emailPrincipal: email,
            endereco: {
                cep: document.getElementById('cep').value,
                logradouro: document.getElementById('logradouro').value,
                numero: document.getElementById('numero').value,
                bairro: document.getElementById('bairro').value,
                cidade: document.getElementById('cidade').value,
                estado: document.getElementById('estado').value,
                complemento: document.getElementById('complemento').value,
            },
            assinatura: {
                planoId: document.getElementById('planoSelecionado').value,
                dataInicio: serverTimestamp(), 
                status: 'ativa'
            },
            dataCadastro: serverTimestamp()
        };

        try {
            const clinicaRef = await addDoc(collection(db, "clinicas"), dadosClinica);
            console.log("Clínica criada no Firestore com ID: ", clinicaRef.id);

            const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
            const user = userCredential.user;
            console.log("Usuário criado na Autenticação com UID: ", user.uid);

            const dadosUsuario = {
                clinicaId: clinicaRef.id,
                nome: nomeResponsavel,
                email: email,
                cargo: 'Administrador'
            };
            await setDoc(doc(db, "usuarios", user.uid), dadosUsuario);
            
            showSuccessToast('Cadastro realizado com sucesso!');
            
            window.location.href = '../Login/login.html'; 

        } catch (error) {
            console.error("Erro no cadastro: ", error);
            if (error.code === 'auth/email-already-in-use') {
                showErrorToast('Erro: Este e-mail já está em uso.');
            } else if (error.code === 'auth/weak-password') {
                showErrorToast('Erro: A senha é muito fraca. Ela deve ter no mínimo 6 caracteres.');
            } else {
                showErrorToast('Erro: Ocorreu um erro durante o cadastro. Verifique o console para mais detalhes.');
            }
        }
    });
});
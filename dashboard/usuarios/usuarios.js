import { auth, db, showSuccessToast, showErrorToast } from '../../firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const formNovoUsuario = document.getElementById('formNovoUsuario');
    const tabelaUsuariosBody = document.querySelector('#tabelaUsuarios tbody');

    let currentClinicaId = null;
    
    const renderUsers = async () => {
        if (!currentClinicaId) return;

        tabelaUsuariosBody.innerHTML = '<tr><td colspan="4">Carregando usuários...</td></tr>';
        const q = query(collection(db, "usuarios"), where("clinicaId", "==", currentClinicaId));
        
        try {
            const querySnapshot = await getDocs(q);
            let tableRowsHTML = '';
            
            // Filtra o usuário logado para não aparecer na lista
            const filteredDocs = querySnapshot.docs.filter(doc => doc.id !== auth.currentUser.uid);

            if (filteredDocs.length === 0) {
                tableRowsHTML = '<tr><td colspan="4">Nenhum outro usuário cadastrado.</td></tr>';
            } else {
                filteredDocs.forEach(doc => {
                    const usuario = doc.data();
                    tableRowsHTML += `
                        <tr>
                            <td>${usuario.nome}</td>
                            <td>${usuario.email}</td>
                            <td>${usuario.cargo}</td>
                            <td><button class="btn-delete" data-id="${doc.id}">Excluir</button></td>
                        </tr>
                    `;
                });
            }
            tabelaUsuariosBody.innerHTML = tableRowsHTML;
        } catch (error) {
            console.error("Erro ao buscar usuários: ", error);
            tabelaUsuariosBody.innerHTML = '<tr><td colspan="4">Erro ao carregar usuários.</td></tr>';
        }
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists()) {
                currentClinicaId = userDoc.data().clinicaId;
                renderUsers();
            } else { window.location.href = '../../Login/login.html'; }
        } else { window.location.href = '../../Login/login.html'; }
    });

    formNovoUsuario.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nome = document.getElementById('inputNome').value;
        const email = document.getElementById('inputEmail').value;
        const senha = document.getElementById('inputSenha').value;
        const cargo = document.getElementById('inputCargo').value;
        if (!nome || !email || !senha || !cargo) {
            showErrorToast("Por favor, preencha todos os campos.");
            return;
        }
        const { getApp, deleteApp } = await import("https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js");
        const tempAppName = `temp-auth-app-${Date.now()}`;
        const firebaseConfig = auth.app.options; 
        const tempApp = initializeApp(firebaseConfig, tempAppName);
        const tempAuth = getAuth(tempApp);
        try {
            const userCredential = await createUserWithEmailAndPassword(tempAuth, email, senha);
            const newUserUid = userCredential.user.uid;
            await setDoc(doc(db, "usuarios", newUserUid), {
                nome: nome, email: email, cargo: cargo, clinicaId: currentClinicaId
            });
            showSuccessToast(`Usuário ${nome} criado com sucesso!`);
            formNovoUsuario.reset();
            renderUsers();
        } catch (error) {
            console.error("Erro ao criar novo usuário:", error);
            if (error.code === 'auth/email-already-in-use') {
                showErrorToast('Erro: O e-mail fornecido já está em uso por outra conta.');
            } else { showErrorToast('Erro: Ocorreu um erro ao criar o usuário.'); }
        } finally {
            deleteApp(tempApp);
        }
    });

    tabelaUsuariosBody.addEventListener('click', async (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const userIdToDelete = e.target.dataset.id;
            if (confirm(`Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.`)) {
                try {
                    await deleteDoc(doc(db, "usuarios", userIdToDelete));
                    showSuccessToast('Usuário removido da clínica com sucesso!');
                    renderUsers(); 
                } catch (error) {
                    console.error("Erro ao excluir usuário:", error);
                    showErrorToast("Erro: Ocorreu um erro ao excluir o usuário.");
                }
            }
        }
    });
});
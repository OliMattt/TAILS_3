import { auth, db, showSuccessToast, showErrorToast } from '../../firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, doc, getDoc, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const tutorForm = document.getElementById('tutorForm');
    const tutorsList = document.getElementById('tutorsList');
    let currentClinicaId = null; 

    const tutorPhoneInput = document.getElementById('tutorPhone');
    const tutorCpfInput = document.getElementById('tutorCpf');

    const renderTutors = async () => {
        if (!currentClinicaId) return;
        
        const q = query(collection(db, "tutores"), where("clinicaId", "==", currentClinicaId), orderBy("nome"));
        
        try {
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                tutorsList.innerHTML = '<p>Nenhum tutor cadastrado ainda.</p>';
                return;
            }

            tutorsList.innerHTML = ''; 
            querySnapshot.forEach((doc) => {
                const tutor = doc.data();
                const tutorCard = document.createElement('div');
                tutorCard.className = 'tutor-card';
                tutorCard.innerHTML = `
                    <h3>${tutor.nome}</h3>
                    <p><strong>E-mail:</strong> ${tutor.email || 'Não informado'}</p>
                    <p><strong>Telefone:</strong> ${tutor.telefone}</p>
                `;
                tutorsList.appendChild(tutorCard);
            });
        } catch (error) {
            console.error("Erro ao buscar tutores: ", error);
            tutorsList.innerHTML = '<p>Ocorreu um erro ao carregar os tutores.</p>';
        }
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userDocRef);
            
            if (userDoc.exists()) {
                currentClinicaId = userDoc.data().clinicaId;
                renderTutors();
            } else {
                console.error("Documento de usuário não encontrado!");
                showErrorToast("Erro: não foi possível identificar sua clínica.");
            }
        } else {
            console.log("Usuário não logado. Redirecionando...");
            window.location.href = '../../Login/login.html';
        }
    });

    tutorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentClinicaId) {
            showErrorToast("Erro: ID da clínica não encontrado. Não é possível salvar.");
            return;
        }

        const newTutor = {
            nome: document.getElementById('tutorName').value,
            email: document.getElementById('tutorEmail').value,
            telefone: tutorPhoneInput.value,
            cpf: tutorCpfInput.value,
            clinicaId: currentClinicaId
        };

        try {
            await addDoc(collection(db, "tutores"), newTutor);
            tutorForm.reset(); 
            renderTutors(); 
            showSuccessToast('Tutor cadastrado com sucesso!');
        } catch (error) {
            console.error("Erro ao cadastrar tutor: ", error);
            showErrorToast('Erro: Ocorreu um erro ao salvar o tutor.')
        }
    });

    // Código das máscaras de CPF e Telefone
    tutorPhoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 11);
        if (value.length > 10) { value = value.replace(/^(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (value.length > 6) { value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
        } else if (value.length > 2) { value = value.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
        } else { value = value.replace(/^(\d*)/, '($1'); }
        e.target.value = value;
    });
    tutorCpfInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 11);
        if (value.length > 9) { value = value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        } else if (value.length > 6) { value = value.replace(/(\d{3})(\d{3})(\d{1,3})/, '$1.$2.$3');
        } else if (value.length > 3) { value = value.replace(/(\d{3})(\d{1,3})/, '$1.$2'); }
        e.target.value = value;
    });
});
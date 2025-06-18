import { auth, db, showSuccessToast, showErrorToast} from '../../firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, doc, getDoc, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-overlay');
    const mainContainer = document.querySelector('.container');
    const petForm = document.getElementById('petForm');
    const petsContainer = document.getElementById('petsContainer');
    const tutorSelect = document.getElementById('tutorSelect');
    let currentClinicaId = null;

    function getIconForSpecies(species) {
        if (!species) return 'fa-paw'; 
        switch (species.toLowerCase()) {
            case 'cachorro': return 'fa-dog';
            case 'gato': return 'fa-cat';
            case 'ave': return 'fa-dove';
            case 'roedor': return 'fa-otter';
            default: return 'fa-paw';
        }
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                currentClinicaId = userDoc.data().clinicaId;
                await Promise.all([loadTutorsDropdown(), loadAndRenderPets()]);
                loader.style.display = 'none';
                mainContainer.style.display = 'block';
            } else {
                showErrorToast("Erro: não foi possível identificar sua clínica.");
                window.location.href = '../../Login/login.html';
            }
        } else {
            window.location.href = '../../Login/login.html';
        }
    });

    const loadTutorsDropdown = async () => {
        if (!currentClinicaId) return;
        tutorSelect.disabled = true;
        tutorSelect.innerHTML = '<option value="">Carregando...</option>';
        const tutorsQuery = query(collection(db, "tutores"), where("clinicaId", "==", currentClinicaId), orderBy("nome"));
        const querySnapshot = await getDocs(tutorsQuery);
        if (querySnapshot.empty) {
             tutorSelect.innerHTML = '<option value="">Cadastre um cliente primeiro</option>';
        } else {
            tutorSelect.innerHTML = '<option value="">Selecione um tutor...</option>';
            querySnapshot.forEach((doc) => {
                const tutor = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = tutor.nome;
                tutorSelect.appendChild(option);
            });
        }
        tutorSelect.disabled = false;
    };

    const loadAndRenderPets = async () => {
        if (!currentClinicaId) return;
        petsContainer.innerHTML = '<p>Carregando pets...</p>';
        const petsQuery = query(collection(db, "pets"), where("clinicaId", "==", currentClinicaId), orderBy("nome"));
        try {
            const querySnapshot = await getDocs(petsQuery);
            petsContainer.innerHTML = '';
            if (querySnapshot.empty) {
                petsContainer.innerHTML = '<p>Nenhum pet cadastrado ainda.</p>';
            } else {
                querySnapshot.forEach((doc) => {
                    const pet = doc.data();
                    const iconClass = getIconForSpecies(pet.especie);
                    const petCard = document.createElement('div');
                    petCard.className = 'pet-card';
                    petCard.innerHTML = `
                        <h3><i class="fas ${iconClass}"></i> ${pet.nome}</h3>
                        <p><strong>Espécie:</strong> ${pet.especie}</p>
                        ${pet.raca ? `<p><strong>Raça:</strong> ${pet.raca}</p>` : ''}
                        ${pet.idade ? `<p><strong>Idade:</strong> ${pet.idade} anos</p>` : ''}
                    `;
                    petsContainer.appendChild(petCard);
                });
            }
        } catch (error) {
            if (error.code === 'failed-precondition') {
                const link = error.message.match(/https:\/\/.*/);
                console.error("ERRO: Query requer um índice. Clique no link para criar:", link ? link[0] : "Link não encontrado.");
                petsContainer.innerHTML = `<p>Erro: um índice do banco de dados precisa ser criado. Verifique o console (F12) para o link de criação.</p>`;
            } else {
                console.error("Erro ao buscar pets: ", error);
                petsContainer.innerHTML = '<p>Erro ao carregar pets.</p>';
            }
        }
    };
    
    petForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const selectedTutorId = tutorSelect.value;
        if (!selectedTutorId) {
            showErrorToast('Por favor, selecione um tutor para o pet.');
            return;
        }
        const newPetData = {
            nome: document.getElementById('petName').value.trim(),
            especie: document.getElementById('petType').value,
            raca: document.getElementById('petBreed').value.trim(),
            idade: document.getElementById('petAge').value,
            dataCadastro: new Date(),
            tutorId: selectedTutorId,
            clinicaId: currentClinicaId
        };
        try {
            await addDoc(collection(db, 'pets'), newPetData);
            showSuccessToast('Pet cadastrado com sucesso!');
            petForm.reset();
            tutorSelect.value = "";
            loadAndRenderPets();
        } catch (error) {
            console.error("Erro ao cadastrar pet:", error);
            showErrorToast('Erro: Ocorreu um erro ao salvar o pet.');
        }
    });
});
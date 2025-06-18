import { auth, db, showSuccessToast, showErrorToast } from '../firebase-config.js';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, Timestamp, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const userNameSpan = document.getElementById('userName');
    const petsListDiv = document.getElementById('petsList');
    const appointmentsListDiv = document.getElementById('appointmentsList');
    const btnLogout = document.getElementById('btnLogout');
    const statClientes = document.getElementById('stat-clientes');
    const statPets = document.getElementById('stat-pets');
    const statAgendamentos = document.getElementById('stat-agendamentos-hoje');

    let currentClinicaId = null;

    const loadDashboardStats = async () => {
        if (!currentClinicaId) return;
        try {
            const tutoresQuery = query(collection(db, "tutores"), where("clinicaId", "==", currentClinicaId));
            const tutoresSnapshot = await getDocs(tutoresQuery);
            statClientes.textContent = tutoresSnapshot.size;

            const petsQuery = query(collection(db, "pets"), where("clinicaId", "==", currentClinicaId));
            const petsSnapshot = await getDocs(petsQuery);
            statPets.textContent = petsSnapshot.size;

            const hojeInicio = new Date();
            hojeInicio.setHours(0, 0, 0, 0);
            const hojeFim = new Date();
            hojeFim.setHours(23, 59, 59, 999);
            
            const agendamentosQuery = query(collection(db, "agendamentos"), 
                where("clinicaId", "==", currentClinicaId),
                where("dataHora", ">=", Timestamp.fromDate(hojeInicio)),
                where("dataHora", "<=", Timestamp.fromDate(hojeFim))
            );
            const agendamentosSnapshot = await getDocs(agendamentosQuery);
            statAgendamentos.textContent = agendamentosSnapshot.size;

        } catch (error) {
            console.error("Erro ao carregar estatísticas:", error);
            if (error.code === 'failed-precondition') {
                showErrorToast("Erro: O banco de dados precisa de um novo índice para as estatísticas. Verifique o console (F12) para o link de criação.");
                console.error("Link para criar índice para ESTATÍSTICAS:", error.message.match(/https:\/\/.*/)?.[0]);
            }
        }
    };

    const loadAppointments = async () => {
        if (!currentClinicaId) return;
        appointmentsListDiv.innerHTML = '<p>Carregando agendamentos...</p>';
        
        try {
            const agora = new Date();
            const q = query(collection(db, "agendamentos"), 
                where("clinicaId", "==", currentClinicaId),
                where("dataHora", ">=", Timestamp.fromDate(agora)),
                orderBy("dataHora"),
                limit(5)
            );
            
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) {
                appointmentsListDiv.innerHTML = '<p>Nenhum agendamento futuro encontrado.</p>';
            } else {
                appointmentsListDiv.innerHTML = '';
                querySnapshot.forEach(doc => {
                    const agendamento = doc.data();
                    const data = agendamento.dataHora.toDate();
                    const card = document.createElement('div');
                    card.className = 'consulta-card';
                    card.innerHTML = `
                        <div class="consulta-info">
                            <h3>${agendamento.servico}</h3>
                            <p><i class="fas fa-calendar-day"></i> ${data.toLocaleDateString('pt-BR')} - ${data.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div class="consulta-acoes">
                             <a href="agenda/agenda.html" class="btn-detalhes"><i class="fas fa-info-circle"></i> Ver na Agenda</a>
                        </div>
                    `;
                    appointmentsListDiv.appendChild(card);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar agendamentos:", error);
             if (error.code === 'failed-precondition') {
                showErrorToast("Erro: O banco de dados precisa de um novo índice para a lista de agendamentos. Verifique o console (F12) para o link de criação.");
                console.error("Link para criar índice para LISTA DE AGENDAMENTOS:", error.message.match(/https:\/\/.*/)?.[0]);
            }
        }
    };
    
    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDocRef = doc(db, "usuarios", user.uid);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userNameSpan.textContent = userData.nome;
                currentClinicaId = userData.clinicaId;
                
                loadDashboardStats();
                loadPets();
                loadAppointments();
            } else {
                auth.signOut();
            }
        } else {
            window.location.href = '../Login/login.html';
        }
    });

    function getIconForSpecies(species) { if (!species) return 'fa-paw'; switch (species.toLowerCase()) { case 'cachorro': return 'fa-dog'; case 'gato': return 'fa-cat'; default: return 'fa-paw'; } }
    async function loadPets() { 
        if (!currentClinicaId) return;
        petsListDiv.innerHTML = '<p>Carregando...</p>';
        const petsQuery = query(collection(db, "pets"), where("clinicaId", "==", currentClinicaId), limit(10));
        const querySnapshot = await getDocs(petsQuery);
        petsListDiv.innerHTML = '';
        if (querySnapshot.empty) { } 
        else {
            querySnapshot.forEach(doc => {
                const pet = doc.data();
                const iconClass = getIconForSpecies(pet.especie);
                const petCard = document.createElement('div');
                petCard.className = 'pet-card';
                petCard.innerHTML = `<a href="pets/pets.html"><div class="pet-icon-container"><i class="fas ${iconClass}"></i></div><h3>${pet.nome}</h3><p>${pet.raca || pet.especie}</p></a>`;
                petsListDiv.appendChild(petCard);
            });
        }
        const addPetCard = document.createElement('div');
        addPetCard.className = 'pet-card novo-pet';
        addPetCard.innerHTML = `<a href="pets/pets.html">
                                    <i class="fas fa-plus"></i>
                                    <h3>Adicionar Pet</h3>
                                </a>`;
        petsListDiv.appendChild(addPetCard);
    }
    btnLogout.addEventListener('click', (e) => { e.preventDefault(); signOut(auth); });
});
import { auth, db, showSuccessToast, showErrorToast} from '../../firebase-config.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { collection, addDoc, query, where, getDocs, doc, getDoc, Timestamp, orderBy, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const loader = document.getElementById('loader-overlay');
    const agendaMainGrid = document.getElementById('agenda-main-grid');
    const timeSlotsSidebar = document.getElementById('time-slots-sidebar');
    
    // Modal de Agendamento
    const modalAgendamento = document.getElementById('modalAgendamento');
    const formAgendamento = document.getElementById('formAgendamento');
    const btnNovoAgendamento = document.getElementById('btnNovoAgendamento');
    const modalTitle = document.getElementById('modalTitle');
    const editingAppointmentIdInput = document.getElementById('editingAppointmentId');
    
    // Modal de Detalhes
    const modalDetalhes = document.getElementById('modalDetalhes');
    const detalhesConteudo = document.getElementById('detalhesConteudo');
    const btnEditar = document.getElementById('btnEditar');
    const btnExcluir = document.getElementById('btnExcluir');

    const currentWeekElement = document.getElementById('currentWeek');
    const btnPrevWeek = document.getElementById('btnPrevWeek');
    const btnNextWeek = document.getElementById('btnNextWeek');
    const btnToday = document.getElementById('btnToday');

    let currentClinicaId = null;
    let petsMap = new Map();
    let vetsMap = new Map();
    let tutorsMap = new Map();
    let currentDate = new Date(); 
    let selectedAppointment = null;

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userDoc = await getDoc(doc(db, "usuarios", user.uid));
            if (userDoc.exists()) {
                currentClinicaId = userDoc.data().clinicaId;
                initializeAgenda();
            } else { window.location.href = '../../Login/login.html'; }
        } else { window.location.href = '../../Login/login.html'; }
    });

    async function initializeAgenda() {
        loader.style.display = 'flex';
        renderTimeSlots();
        await Promise.all([loadPetsAndTutors(), loadVeterinariosDropdown()]);
        await renderFullWeek();
        loader.style.display = 'none';
    }

    async function renderFullWeek() {
        renderWeekView();
        await loadAndRenderAppointments();
    }
    
    function getStartOfWeek(date) {
        const d = new Date(date);
        d.setHours(0, 0, 0, 0);
        const day = d.getDay();
        const diff = d.getDate() - day;
        return new Date(d.setDate(diff));
    }

    function renderTimeSlots() {
        timeSlotsSidebar.innerHTML = '';
        for (let hour = 8; hour < 18; hour++) {
            ['00', '30'].forEach(minute => {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = `${String(hour).padStart(2, '0')}:${minute}`;
                timeSlotsSidebar.appendChild(timeSlot);
            });
        }
    }

    function renderWeekView() {
        agendaMainGrid.innerHTML = ''; 
        const daysHeader = document.createElement('div');
        daysHeader.className = 'days-header';
        const agendaGrid = document.createElement('div');
        agendaGrid.className = 'agenda-grid';
        const startOfWeek = getStartOfWeek(currentDate);

        for (let i = 0; i < 7; i++) {
            const day = new Date(startOfWeek);
            day.setDate(startOfWeek.getDate() + i);
            let dayName = day.toLocaleDateString('pt-BR', { weekday: 'long' });
            dayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
            
            const dayHeader = document.createElement('div');
            dayHeader.className = 'day-header';
            dayHeader.innerHTML = `<div>${dayName}</div><div>${day.getDate()}</div>`;
            daysHeader.appendChild(dayHeader);

            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            dayColumn.dataset.date = day.toISOString().split('T')[0];
            for (let h = 8; h < 18; h++) {
                ['00', '30'].forEach(() => {
                    const slot = document.createElement('div');
                    slot.className = 'time-slot-grid';
                    dayColumn.appendChild(slot);
                });
            }
            agendaGrid.appendChild(dayColumn);
        }
        agendaMainGrid.appendChild(daysHeader);
        agendaMainGrid.appendChild(agendaGrid);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        currentWeekElement.textContent = `${startOfWeek.toLocaleDateString('pt-BR')} - ${endOfWeek.toLocaleDateString('pt-BR')}`;
    }

    async function loadPetsAndTutors() {
        if (!currentClinicaId) return;
        const petsQuery = query(collection(db, "pets"), where("clinicaId", "==", currentClinicaId));
        const tutorsQuery = query(collection(db, "tutores"), where("clinicaId", "==", currentClinicaId));
        const [petsSnapshot, tutorsSnapshot] = await Promise.all([getDocs(petsQuery), getDocs(tutorsQuery)]);
        
        tutorsMap.clear();
        tutorsSnapshot.forEach(doc => tutorsMap.set(doc.id, doc.data()));
        
        petsMap.clear();
        const selectPet = document.getElementById('inputPet');
        selectPet.innerHTML = '<option value="">Selecione um pet</option>';
        petsSnapshot.forEach(doc => {
            const pet = doc.data();
            petsMap.set(doc.id, pet);
            const tutor = tutorsMap.get(pet.tutorId);
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = `${pet.nome} (${tutor ? tutor.nome : 'Dono desconhecido'})`;
            selectPet.appendChild(option);
        });
    }

    async function loadVeterinariosDropdown() {
        if (!currentClinicaId) return;
        const vetsQuery = query(collection(db, "usuarios"), 
            where("clinicaId", "==", currentClinicaId), 
            where("cargo", "in", ["Veterinário", "Administrador"])
        );
        const querySnapshot = await getDocs(vetsQuery);
        
        vetsMap.clear();
        const selectVeterinario = document.getElementById('inputVeterinario');
        selectVeterinario.innerHTML = '<option value="">Selecione um veterinário</option>';
        querySnapshot.forEach(doc => {
            const vet = doc.data();
            vetsMap.set(doc.id, vet);
            const option = document.createElement('option');
            option.value = doc.id;
            option.textContent = vet.nome;
            selectVeterinario.appendChild(option);
        });
    }
    
    async function loadAndRenderAppointments() {
        document.querySelectorAll('.agendamento').forEach(el => el.remove());
        const startOfWeek = getStartOfWeek(currentDate);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 7);

        const appointmentsQuery = query(collection(db, "agendamentos"), 
            where("clinicaId", "==", currentClinicaId),
            where("dataHora", ">=", Timestamp.fromDate(startOfWeek)),
            where("dataHora", "<", Timestamp.fromDate(endOfWeek))
        );
        
        try {
            const querySnapshot = await getDocs(appointmentsQuery);
            querySnapshot.forEach(doc => {
                const agendamento = doc.data();
                const data = agendamento.dataHora.toDate();
                const dateString = data.toISOString().split('T')[0];
                const dayColumn = document.querySelector(`.day-column[data-date='${dateString}']`);

                if (dayColumn) {
                    const hour = data.getHours();
                    const minute = data.getMinutes();
                    const top = ((hour - 8) * 2 + (minute / 30)) * 60;
                    const duration = agendamento.duracao || 30;
                    const height = (duration / 30) * 60;

                    const agendamentoElement = document.createElement('div');
                    agendamentoElement.className = `agendamento ${agendamento.servico}`;
                    agendamentoElement.style.top = `${top}px`;
                    agendamentoElement.style.height = `${height - 5}px`;
                    const petName = petsMap.get(agendamento.petId)?.nome || 'Pet';
                    const vetName = vetsMap.get(agendamento.veterinarioId)?.nome.split(' ')[0] || 'Vet';
                    agendamentoElement.innerHTML = `
                        <div class="agendamento-title">${agendamento.servico.charAt(0).toUpperCase() + agendamento.servico.slice(1)}</div>
                        <div class="agendamento-info">${petName} | ${vetName}</div>`;
                    agendamentoElement.addEventListener('click', () => showAppointmentDetails(doc.id, agendamento));
                    dayColumn.appendChild(agendamentoElement);
                }
            });
        } catch(error) {
            if (error.code === 'failed-precondition') {
                const link = error.message.match(/https:\/\/.*/);
                showErrorToast("Erro: O banco de dados precisa de um índice para esta consulta. Verifique o console (F12) para o link de criação.");
                console.error("ERRO: Query requer um índice. Clique no link para criar:", link ? link[0] : "Link não encontrado.");
            } else {
                console.error("Erro ao buscar agendamentos: ", error);
            }
        }
    }

    function openCreateModal() {
        formAgendamento.reset();
        modalTitle.textContent = 'Novo Agendamento';
        editingAppointmentIdInput.value = '';
        document.getElementById('inputData').valueAsDate = new Date();
        document.getElementById('inputDuracao').value = 30;
        modalAgendamento.style.display = 'block';
    }

    function showAppointmentDetails(id, data) {
        selectedAppointment = { id, ...data };
        const pet = petsMap.get(data.petId);
        const tutor = pet ? tutorsMap.get(pet.tutorId) : null;
        const vet = vetsMap.get(data.veterinarioId);
        const dataHora = data.dataHora.toDate();
        detalhesConteudo.innerHTML = `
            <p><strong>Pet:</strong> ${pet ? pet.nome : 'N/A'}</p>
            <p><strong>Tutor:</strong> ${tutor ? tutor.nome : 'N/A'}</p>
            <p><strong>Serviço:</strong> ${data.servico}</p>
            <p><strong>Veterinário:</strong> ${vet ? vet.nome : 'N/A'}</p>
            <p><strong>Data:</strong> ${dataHora.toLocaleDateString('pt-BR')} às ${dataHora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})}</p>
            <p><strong>Duração:</strong> ${data.duracao} minutos</p>
            <p><strong>Observações:</strong> ${data.observacoes || 'Nenhuma'}</p>`;
        modalDetalhes.style.display = 'block';
    }

    btnNovoAgendamento.addEventListener('click', openCreateModal);
    modalAgendamento.querySelector('.close-modal').addEventListener('click', () => modalAgendamento.style.display = 'none');
    modalAgendamento.querySelector('.btn-cancel').addEventListener('click', () => modalAgendamento.style.display = 'none');
    modalDetalhes.querySelector('.close-modal').addEventListener('click', () => modalDetalhes.style.display = 'none');

    btnEditar.addEventListener('click', () => {
        if (!selectedAppointment) return;
        modalDetalhes.style.display = 'none';
        modalTitle.textContent = 'Editar Agendamento';
        editingAppointmentIdInput.value = selectedAppointment.id;
        document.getElementById('inputPet').value = selectedAppointment.petId;
        document.getElementById('inputVeterinario').value = selectedAppointment.veterinarioId;
        document.getElementById('inputServico').value = selectedAppointment.servico;
        const data = selectedAppointment.dataHora.toDate();
        document.getElementById('inputData').value = data.toISOString().split('T')[0];
        document.getElementById('inputHora').value = data.toTimeString().split(' ')[0].substring(0, 5);
        document.getElementById('inputDuracao').value = selectedAppointment.duracao;
        document.getElementById('inputObservacoes').value = selectedAppointment.observacoes;
        modalAgendamento.style.display = 'block';
    });

    btnExcluir.addEventListener('click', async () => {
        if (!selectedAppointment || !confirm("Tem certeza que deseja excluir este agendamento?")) return;
        loader.style.display = 'flex';
        try {
            await deleteDoc(doc(db, "agendamentos", selectedAppointment.id));
            showSuccessToast("Agendamento excluído com sucesso!");
            modalDetalhes.style.display = 'none';
            await loadAndRenderAppointments();
        } catch (error) {
            console.error("Erro ao excluir agendamento:", error);
        } finally {
            loader.style.display = 'none';
        }
    });

    formAgendamento.addEventListener('submit', async (e) => {
        e.preventDefault();
        loader.style.display = 'flex';
        const editingId = editingAppointmentIdInput.value;
        const data = document.getElementById('inputData').value;
        const hora = document.getElementById('inputHora').value;
        const [year, month, day] = data.split('-');
        const [hours, minutes] = hora.split(':');
        const dataHora = new Date(year, month - 1, day, hours, minutes);
        const petId = document.getElementById('inputPet').value;

        const appointmentData = {
            clinicaId: currentClinicaId,
            petId: petId,
            tutorId: petsMap.get(petId)?.tutorId || null,
            veterinarioId: document.getElementById('inputVeterinario').value,
            servico: document.getElementById('inputServico').value,
            observacoes: document.getElementById('inputObservacoes').value,
            duracao: parseInt(document.getElementById('inputDuracao').value),
            dataHora: Timestamp.fromDate(dataHora),
            status: "Agendado"
        };
        
        try {
            if (editingId) {
                await updateDoc(doc(db, "agendamentos", editingId), appointmentData);
                showSuccessToast("Agendamento atualizado com sucesso!");
            } else {
                await addDoc(collection(db, "agendamentos"), appointmentData);
                showSuccessToast("Agendamento criado com sucesso!");
            }
            modalAgendamento.style.display = 'none';
            await loadAndRenderAppointments();
        } catch(error) {
            console.error("Erro ao salvar agendamento:", error);
            showErrorToast("Erro: Não foi possível salvar o agendamento.");
        } finally {
            loader.style.display = 'none';
        }
    });

    btnPrevWeek.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderFullWeek();
    });
    btnNextWeek.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderFullWeek();
    });
    btnToday.addEventListener('click', () => {
        currentDate = new Date();
        renderFullWeek();
    });
});
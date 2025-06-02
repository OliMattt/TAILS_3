document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const agendaGrid = document.querySelector('.agenda-grid');
    const daysHeader = document.querySelector('.days-header');
    const timeSlots = document.querySelector('.time-slots');
    const btnPrevWeek = document.getElementById('btnPrevWeek');
    const btnNextWeek = document.getElementById('btnNextWeek');
    const btnToday = document.getElementById('btnToday');
    const currentWeekElement = document.getElementById('currentWeek');
    const modalAgendamento = document.getElementById('modalAgendamento');
    const modalDetalhes = document.getElementById('modalDetalhes');
    const formAgendamento = document.getElementById('formAgendamento');
    const btnNovoAgendamento = document.getElementById('btnNovoAgendamento');
    const closeButtons = document.querySelectorAll('.close-modal');
    const btnCancelModal = document.querySelector('.btn-cancel');
    const btnEditar = document.getElementById('btnEditar');
    const btnCancelarAgendamento = document.getElementById('btnCancelar');

    // Variáveis de estado
    let currentDate = new Date();
    let selectedAgendamento = null;
    
    // Dados de exemplo (substituir por dados reais)
    let agendamentos = JSON.parse(localStorage.getItem('agendamentos')) || [
        {
            id: 1,
            petId: 1,
            petNome: "Tare",
            servico: "consulta",
            data: "2023-06-20",
            hora: "14:30",
            veterinario: "Dra. Ana Silva",
            observacoes: "Consulta de rotina anual"
        },
        {
            id: 2,
            petId: 2,
            petNome: "Luna",
            servico: "vacina",
            data: "2023-06-16",
            hora: "10:00",
            veterinario: "Dr. Carlos Mendes",
            observacoes: "Vacina antirrábica"
        }
    ];

    // Pets de exemplo (substituir por dados reais)
    const pets = [
        { id: 1, nome: "Tare", tipo: "Gato", dono: "Giulia Bagodi" },
        { id: 2, nome: "Tofu", tipo: "Gato", dono: "Giulia Bagodi" },
        { id: 3, nome: "Bucky", tipo: "Cachorro", dono: "Mateus Oliveira" }
    ];

    // Inicialização
    function init() {
        renderWeekDays();
        renderTimeSlots();
        renderAgendamentos();
        loadPetsDropdown();
        
        // Configurar data inicial para hoje
        goToToday();
    }

    // Renderizar cabeçalho com dias da semana
    function renderWeekDays() {
        daysHeader.innerHTML = '';
        
        const startOfWeek = getStartOfWeek(currentDate);
        
        for (let i = 0; i < 7; i++) {
            const dayDate = new Date(startOfWeek);
            dayDate.setDate(startOfWeek.getDate() + i);
            
            const dayElement = document.createElement('div');
            dayElement.className = 'day-header';
            
            if (isToday(dayDate)) {
                dayElement.classList.add('today');
            }
            
            dayElement.innerHTML = `
                <div class="day-name">${getDayName(dayDate)}</div>
                <div class="day-date">${dayDate.getDate()}</div>
            `;
            
            daysHeader.appendChild(dayElement);
        }
        
        // Atualizar título da semana
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        currentWeekElement.textContent = `
            ${formatDate(startOfWeek)} - ${formatDate(endOfWeek)}
        `;
    }

    // Renderizar coluna de horários
    function renderTimeSlots() {
        timeSlots.innerHTML = '';
        
        for (let hour = 8; hour < 18; hour++) {
            for (let minute = 0; minute < 60; minute += 30) {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.textContent = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                timeSlots.appendChild(timeSlot);
            }
        }
    }

    // Renderizar grade de agendamentos
    function renderAgendamentos() {
        agendaGrid.innerHTML = '';
        
        const startOfWeek = getStartOfWeek(currentDate);
        
        // Criar colunas para cada dia da semana
        for (let i = 0; i < 7; i++) {
            const dayColumn = document.createElement('div');
            dayColumn.className = 'day-column';
            
            // Criar slots de tempo vazios
            for (let hour = 8; hour < 18; hour++) {
                for (let minute = 0; minute < 60; minute += 30) {
                    const timeSlot = document.createElement('div');
                    timeSlot.className = 'time-slot-grid';
                    dayColumn.appendChild(timeSlot);
                }
            }
            
            agendaGrid.appendChild(dayColumn);
        }
        
        // Adicionar agendamentos
        agendamentos.forEach(agendamento => {
            const agendamentoDate = new Date(`${agendamento.data}T${agendamento.hora}`);
            const startOfWeek = getStartOfWeek(currentDate);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(startOfWeek.getDate() + 7);
            
            // Verificar se o agendamento está na semana atual
            if (agendamentoDate >= startOfWeek && agendamentoDate < endOfWeek) {
                const dayDiff = Math.floor((agendamentoDate - startOfWeek) / (1000 * 60 * 60 * 24));
                const hour = parseInt(agendamento.hora.split(':')[0]);
                const minute = parseInt(agendamento.hora.split(':')[1]);
                
                // Calcular posição na grade
                const top = ((hour - 8) * 2 + (minute / 30)) * 60;
                
                const dayColumns = document.querySelectorAll('.day-column');
                if (dayColumns[dayDiff]) {
                    const agendamentoElement = document.createElement('div');
                    agendamentoElement.className = `agendamento ${agendamento.servico}`;
                    agendamentoElement.style.top = `${top}px`;
                    agendamentoElement.style.height = '60px';
                    agendamentoElement.innerHTML = `
                        <div class="agendamento-titulo">${agendamento.petNome}</div>
                        <div class="agendamento-info">
                            <span>${agendamento.veterinario.split(' ')[0]}</span>
                            <span>• ${agendamento.hora}</span>
                        </div>
                    `;
                    
                    // Adicionar evento de clique
                    agendamentoElement.addEventListener('click', () => showAgendamentoDetails(agendamento));
                    
                    dayColumns[dayDiff].appendChild(agendamentoElement);
                }
            }
        });
    }

    // Carregar pets no dropdown
    function loadPetsDropdown() {
        const selectPet = document.getElementById('inputPet');
        selectPet.innerHTML = '<option value="">Selecione um pet</option>';
        
        pets.forEach(pet => {
            const option = document.createElement('option');
            option.value = pet.id;
            option.textContent = `${pet.nome} (${pet.dono})`;
            selectPet.appendChild(option);
        });
    }

    // Navegação entre semanas
    btnPrevWeek.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        updateView();
    });

    btnNextWeek.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        updateView();
    });

    btnToday.addEventListener('click', goToToday);

    function goToToday() {
        currentDate = new Date();
        updateView();
    }

    function updateView() {
        renderWeekDays();
        renderAgendamentos();
    }

    // Modal de novo agendamento
    btnNovoAgendamento.addEventListener('click', () => {
        // Definir data padrão como hoje
        document.getElementById('inputData').valueAsDate = new Date();
        modalAgendamento.style.display = 'block';
    });

    // Formulário de agendamento
    formAgendamento.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const petId = parseInt(document.getElementById('inputPet').value);
        const pet = pets.find(p => p.id === petId);
        
        const novoAgendamento = {
            id: agendamentos.length > 0 ? Math.max(...agendamentos.map(a => a.id)) + 1 : 1,
            petId: petId,
            petNome: pet.nome,
            servico: document.getElementById('inputServico').value,
            data: document.getElementById('inputData').value,
            hora: document.getElementById('inputHora').value,
            veterinario: document.getElementById('inputVeterinario').value,
            observacoes: document.getElementById('inputObservacoes').value
        };
        
        agendamentos.push(novoAgendamento);
        localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
        
        modalAgendamento.style.display = 'none';
        formAgendamento.reset();
        renderAgendamentos();
    });

    // Mostrar detalhes do agendamento
    function showAgendamentoDetails(agendamento) {
        selectedAgendamento = agendamento;
        
        const pet = pets.find(p => p.id === agendamento.petId);
        const servicoNome = {
            'consulta': 'Consulta',
            'vacina': 'Vacinação',
            'exame': 'Exames',
            'banho': 'Banho e Tosa',
            'cirurgia': 'Cirurgia'
        }[agendamento.servico];
        
        document.getElementById('detalhesConteudo').innerHTML = `
            <div class="detalhes-item">
                <h3>Pet</h3>
                <p>${pet.nome} (${pet.tipo})</p>
            </div>
            <div class="detalhes-item">
                <h3>Dono</h3>
                <p>${pet.dono}</p>
            </div>
            <div class="detalhes-item">
                <h3>Serviço</h3>
                <p>${servicoNome}</p>
            </div>
            <div class="detalhes-item">
                <h3>Data e Hora</h3>
                <p>${formatDate(new Date(`${agendamento.data}T${agendamento.hora}`))} às ${agendamento.hora}</p>
            </div>
            <div class="detalhes-item">
                <h3>Veterinário</h3>
                <p>${agendamento.veterinario}</p>
            </div>
            <div class="detalhes-item">
                <h3>Observações</h3>
                <p>${agendamento.observacoes || 'Nenhuma observação'}</p>
            </div>
        `;
        
        modalDetalhes.style.display = 'block';
    }

    // Botão cancelar agendamento
    btnCancelarAgendamento.addEventListener('click', function() {
        if (selectedAgendamento && confirm('Tem certeza que deseja cancelar este agendamento?')) {
            agendamentos = agendamentos.filter(a => a.id !== selectedAgendamento.id);
            localStorage.setItem('agendamentos', JSON.stringify(agendamentos));
            modalDetalhes.style.display = 'none';
            renderAgendamentos();
        }
    });

    // Fechar modais
    closeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            modalAgendamento.style.display = 'none';
            modalDetalhes.style.display = 'none';
        });
    });

    btnCancelModal.addEventListener('click', function() {
        modalAgendamento.style.display = 'none';
    });

    // Fechar ao clicar fora do modal
    window.addEventListener('click', function(event) {
        if (event.target === modalAgendamento) {
            modalAgendamento.style.display = 'none';
        }
        if (event.target === modalDetalhes) {
            modalDetalhes.style.display = 'none';
        }
    });

    // Funções auxiliares
    function getStartOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para semana começar na segunda
        return new Date(d.setDate(diff));
    }

    function isToday(date) {
        const today = new Date();
        return date.getDate() === today.getDate() && 
               date.getMonth() === today.getMonth() && 
               date.getFullYear() === today.getFullYear();
    }

    function getDayName(date) {
        const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        return days[date.getDay()];
    }

    function formatDate(date) {
        return date.toLocaleDateString('pt-BR');
    }

    // Inicializar a aplicação
    init();
});

document.addEventListener('DOMContentLoaded', function() {
    // Array para armazenar os pets
    let petsCadastrados = JSON.parse(localStorage.getItem('pets')) || [];

    // Elementos do DOM
    const petForm = document.getElementById('petForm');
    const petsContainer = document.getElementById('petsContainer');
    const searchInput = document.getElementById('searchInput');
    const filterType = document.getElementById('filterType');

    // Função para salvar no localStorage
    function salvarPets() {
        localStorage.setItem('pets', JSON.stringify(petsCadastrados));
    }

    // Função para renderizar os pets
    function renderizarPets(pets = petsCadastrados) {
        petsContainer.innerHTML = '';

        if (pets.length === 0) {
            petsContainer.innerHTML = '<p class="sem-pets">Nenhum pet cadastrado ainda.</p>';
            return;
        }

        pets.forEach(pet => {
            const petCard = document.createElement('div');
            petCard.className = 'pet-card';
            
            // Ícone baseado no tipo do pet
            let iconClass;
            switch(pet.tipo) {
                case 'cachorro': iconClass = 'fa-dog'; break;
                case 'gato': iconClass = 'fa-cat'; break;
                case 'ave': iconClass = 'fa-dove'; break;
                case 'roedor': iconClass = 'fa-otter'; break;
                default: iconClass = 'fa-paw';
            }

            petCard.innerHTML = `
                <h3><i class="fas ${iconClass}"></i> ${pet.nome}</h3>
                <p><strong>Espécie:</strong> <span class="pet-type">${formatarTipo(pet.tipo)}</span></p>
                ${pet.raca ? `<p><strong>Raça:</strong> ${pet.raca}</p>` : ''}
                ${pet.idade ? `<p><strong>Idade:</strong> ${pet.idade} anos</p>` : ''}
                <p><strong>Dono:</strong> ${pet.dono}</p>
                ${pet.telefone ? `<p><strong>Telefone:</strong> ${formatarTelefone(pet.telefone)}</p>` : ''}
            `;
            
            petsContainer.appendChild(petCard);
        });
    }

    // Função auxiliar para formatar o tipo
    function formatarTipo(tipo) {
        const tipos = {
            'cachorro': 'Cachorro',
            'gato': 'Gato',
            'ave': 'Ave',
            'roedor': 'Roedor',
            'outro': 'Outro'
        };
        return tipos[tipo] || tipo;
    }

    // Função para formatar telefone
    function formatarTelefone(telefone) {
        // Remove tudo que não é dígito
        const numeros = telefone.replace(/\D/g, '');
        
        // Formata (00) 00000-0000
        return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    // Evento de submit do formulário
    petForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Obter valores do formulário
        const novoPet = {
            nome: document.getElementById('petName').value.trim(),
            tipo: document.getElementById('petType').value,
            raca: document.getElementById('petBreed').value.trim(),
            idade: document.getElementById('petAge').value,
            dono: document.getElementById('ownerName').value.trim(),
            telefone: document.getElementById('ownerPhone').value.replace(/\D/g, ''),
            dataCadastro: new Date().toISOString()
        };

        // Validar tipo
        if (!novoPet.tipo) {
            alert('Por favor, selecione a espécie do pet.');
            return;
        }

        // Adicionar ao array e salvar
        petsCadastrados.unshift(novoPet);
        salvarPets();
        
        // Renderizar a lista atualizada
        renderizarPets();
        
        // Limpar formulário
        petForm.reset();
        
        // Mostrar mensagem de sucesso
        alert('Pet cadastrado com sucesso!');
    });

    // Evento de busca
    searchInput.addEventListener('input', function() {
        filtrarPets();
    });

    // Evento de filtro por tipo
    filterType.addEventListener('change', function() {
        filtrarPets();
    });

    // Função para filtrar os pets
    function filtrarPets() {
        const termoBusca = searchInput.value.toLowerCase();
        const tipoFiltro = filterType.value;
        
        const petsFiltrados = petsCadastrados.filter(pet => {
            const matchBusca = pet.nome.toLowerCase().includes(termoBusca) || 
                             pet.dono.toLowerCase().includes(termoBusca);
            
            const matchTipo = !tipoFiltro || pet.tipo === tipoFiltro;
            
            return matchBusca && matchTipo;
        });
        
        renderizarPets(petsFiltrados);
    }

    // Máscara para telefone
    document.getElementById('ownerPhone').addEventListener('input', function(e) {
        const value = e.target.value.replace(/\D/g, '');
        let formattedValue = '';
        
        if (value.length > 0) {
            formattedValue = `(${value.substring(0, 2)}`;
            
            if (value.length > 2) {
                formattedValue += `) ${value.substring(2, 7)}`;
                
                if (value.length > 7) {
                    formattedValue += `-${value.substring(7, 11)}`;
                }
            }
        }
        
        e.target.value = formattedValue;
    });

    // Renderizar pets ao carregar a página
    renderizarPets();
});
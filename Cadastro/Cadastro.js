document.addEventListener('DOMContentLoaded', function() {
    // Elementos do DOM
    const form = document.querySelector('.cadastro-form');
    const planoCards = document.querySelectorAll('.plano-card');
    const planoSelecionadoInput = document.getElementById('planoSelecionado');
    const cnpjInput = document.getElementById('cnpj');
    const cepInput = document.getElementById('cep');
    const telefoneInput = document.getElementById('telefone');

    // Seleção de plano
    planoCards.forEach(card => {
        card.addEventListener('click', function() {
            // Remove seleção anterior
            planoCards.forEach(c => c.classList.remove('plano-selecionado'));
            
            // Adiciona seleção atual
            this.classList.add('plano-selecionado');
            
            // Atualiza input hidden
            planoSelecionadoInput.value = this.dataset.plano;
        });
    });

    // Máscara para CNPJ
    cnpjInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 2) {
            value = value.substring(0, 2) + '.' + value.substring(2);
        }
        if (value.length > 6) {
            value = value.substring(0, 6) + '.' + value.substring(6);
        }
        if (value.length > 10) {
            value = value.substring(0, 10) + '/' + value.substring(10);
        }
        if (value.length > 15) {
            value = value.substring(0, 15) + '-' + value.substring(15, 17);
        }
        
        e.target.value = value;
    });

    // Máscara para CEP
    cepInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 5) {
            value = value.substring(0, 5) + '-' + value.substring(5, 8);
        }
        
        e.target.value = value;
        
        // Buscar CEP (exemplo)
        if (value.length === 9) {
            // Aqui você pode implementar a busca de CEP via API
            console.log('Buscar endereço para CEP:', value);
        }
    });

    // Máscara para telefone
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            value = '(' + value.substring(0, 2) + ') ' + value.substring(2);
        }
        if (value.length > 10) {
            value = value.substring(0, 10) + '-' + value.substring(10, 15);
        }
        
        e.target.value = value;
    });

    // Validação de formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validação básica - você pode expandir isso
        const senha = document.getElementById('senha').value;
        const confirmarSenha = document.getElementById('confirmarSenha').value;
        
        if (senha !== confirmarSenha) {
            alert('As senhas não coincidem!');
            return;
        }
        
        if (!planoSelecionadoInput.value) {
            alert('Por favor, selecione um plano de assinatura!');
            return;
        }
        
        // Se tudo estiver válido, enviar formulário
        alert('Formulário enviado com sucesso!');
        // form.submit(); // Descomente para enviar realmente
    });

    // Auto-selecionar plano recomendado
    document.querySelector('.plano-recomendado').click();
});
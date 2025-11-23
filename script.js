document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('form-cadastro');
    const cepInput = document.getElementById('cep');
    const displaySection = document.getElementById('exibicao-clima');

    // --- 1. Integração ViaCEP ---
    cepInput.addEventListener('blur', () => {
        const cep = cepInput.value.replace(/\D/g, ''); // Remove caracteres não numéricos

        if (cep.length === 8) {
            fetch(`https://viacep.com.br/ws/${cep}/json/`)
                .then(response => response.json())
                .then(data => {
                    if (!data.erro) {
                        document.getElementById('logradouro').value = data.logradouro || '';
                        document.getElementById('bairro').value = data.bairro || '';
                        document.getElementById('cidade').value = data.localidade || '';
                        document.getElementById('estado').value = data.uf || '';
                    } else {
                        alert('CEP não encontrado ou inválido.');
                        // Limpa campos se o CEP for inválido
                        document.getElementById('logradouro').value = '';
                        document.getElementById('bairro').value = '';
                        document.getElementById('cidade').value = '';
                        document.getElementById('estado').value = '';
                    }
                })
                .catch(error => {
                    console.error('Erro na requisição ViaCEP:', error);
                    alert('Erro ao buscar o CEP. Tente novamente.');
                });
        }
    });

    // --- 2. Persistência (localStorage) e Submissão ---
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Impede o envio padrão do formulário

        // Coleta dos dados do formulário
        const cliente = {
            nome: document.getElementById('nome').value,
            email: document.getElementById('email').value,
            telefone: document.getElementById('telefone').value,
            cep: cepInput.value,
            logradouro: document.getElementById('logradouro').value,
            bairro: document.getElementById('bairro').value,
            cidade: document.getElementById('cidade').value,
            estado: document.getElementById('estado').value,
        };

        // Salva no localStorage
        localStorage.setItem('clienteCadastrado', JSON.stringify(cliente));
        alert('Cliente cadastrado com sucesso! Buscando informações do clima...');

        // Dispara a busca do clima
        buscarClima(cliente.cidade, cliente.estado);
        
        // Exibe a seção de clima
        document.getElementById('clima-nome').textContent = cliente.nome;
        document.getElementById('clima-cidade').textContent = `${cliente.cidade}/${cliente.estado}`;
        displaySection.style.display = 'block';
    });

    // --- 3. Busca do Clima (OpenWeatherMap) ---
    async function buscarClima(cidade, estado) {
        
        const API_KEY = 'cfdea6bb9ca34a66f9d3adddb45b47fc'; 
        const url = `https://api.openweathermap.org/data/2.5/weather?q=${cidade},${estado},br&appid=${API_KEY}&units=metric&lang=pt`;

        try {
            const response = await fetch(url);
            const data = await response.json();

            if (data.cod === 200) {
                const temperatura = Math.round(data.main.temp);
                const timezoneOffset = data.timezone; // Deslocamento em segundos de UTC

                // Atualiza o display
                exibirClima(temperatura);
                exibirHoraLocal(timezoneOffset);
            } else {
                alert(`Erro ao buscar clima: ${data.message || 'Cidade não encontrada.'}`);
                document.getElementById('temperatura-valor').textContent = 'Erro';
            }
        } catch (error) {
            console.error('Erro na requisição OpenWeatherMap:', error);
            alert('Erro de conexão com a API de clima.');
        }
    }

    // --- Lógica de Exibição e Cores ---
    function exibirClima(temperatura) {
        const tempValor = document.getElementById('temperatura-valor');
        const tempBox = document.getElementById('temperatura-box');

        tempValor.textContent = `${temperatura}°C`;

        // Limpa classes anteriores
        tempBox.classList.remove('temp-frio', 'temp-ameno', 'temp-quente');

        // Define a cor com base na temperatura
        if (temperatura < 15) {
            tempBox.classList.add('temp-frio'); // Azul
        } else if (temperatura >= 15 && temperatura <= 30) {
            tempBox.classList.add('temp-ameno'); // Verde
        } else {
            tempBox.classList.add('temp-quente'); // Vermelho
        }
    }
function exibirHoraLocal(timezoneOffset) {
    const horaLocalElement = document.getElementById('hora-local');
    
    // Data/Hora atual em UTC (milissegundos)
    const nowUtc = new Date().getTime(); 
    
    // Deslocamento de fuso horário da cidade desejada em milissegundos
    // 'timezoneOffset' deve ser o valor em segundos (ex: -10800 para -03:00)
    const offsetMs = timezoneOffset * 1000;
    
    // Hora local da cidade: UTC + offset desejado
    const horaLocalMs = nowUtc + offsetMs; // <--- CORREÇÃO AQUI
    
    const dataLocal = new Date(horaLocalMs);

    const opcoes = { 
        hour: '2-digit', 
        minute: '2-digit', 
     
        // Continua usando 'UTC', pois o objeto Date agora armazena o *momento* correto,
        // e queremos que toLocaleTimeString o formate como se fosse UTC, 
        // sem aplicar mais nenhum offset local.
        timeZone: 'UTC' 
    };
    
    horaLocalElement.textContent = dataLocal.toLocaleTimeString('pt-BR', opcoes);
}

});
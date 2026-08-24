/* =========================================
   CHECK IA
   ANALYSIS.JS
========================================= */

/* VERIFICAÇÃO DE SESSÃO */
const usuario = localStorage.getItem("usuario");

if (!usuario) {
    window.location.href = "index.html";
}

/* MOSTRAR USUÁRIO NO PERFIL */
const usuarioElemento = document.getElementById("usuario");

if (usuarioElemento && usuario) {
    let nome = localStorage.getItem("nomeConta") || usuario.split("@")[0];
    nome = nome.charAt(0).toUpperCase() + nome.slice(1);
    usuarioElemento.textContent = nome;

    const usuarioHeader = document.getElementById("usuario-header");
    if (usuarioHeader) usuarioHeader.textContent = nome;
}


/* =========================================
   GITHUB
========================================= */

const githubButton = document.getElementById("githubButton");

if (githubButton) {
    githubButton.addEventListener("click", function () {
        mostrarModalGitHub();
    });
}


/* =========================================
   MODAL GITHUB
========================================= */

function mostrarModalGitHub() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <div class="modal">
            <div class="modal-icon">
                <i class="fa-brands fa-github"></i>
            </div>
            <h2>Informar repositório</h2>
            <p>Envie o link público do projeto. Não é necessário conectar sua conta GitHub.</p>
            <input id="githubUrl" type="url" placeholder="https://github.com/usuario/projeto">
            <div class="modal-actions">
                <button class="cancel-modal">Cancelar</button>
                <button class="confirm-github">Analisar</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // Fechar modal ao clicar fora
    modal.addEventListener("click", function (e) {
        if (e.target === modal) modal.remove();
    });

    const cancelar = modal.querySelector(".cancel-modal");
    cancelar.addEventListener("click", function () {
        modal.remove();
    });

    const confirmar = modal.querySelector(".confirm-github");
    confirmar.addEventListener("click", function () {
        const urlInput = document.getElementById("githubUrl");
        const url = urlInput ? urlInput.value.trim() : "";

        if (!url) {
            mostrarMensagem("Informe a URL do repositório.", "erro");
            return;
        }

        if (!/^https?:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(url)) {
            mostrarMensagem("Informe o link público no formato github.com/usuario/projeto.", "erro");
            return;
        }

        modal.remove();
        iniciarAnalise("GitHub", url);
    });
}




/* =========================================
   INICIALIZAÇÃO DA ANÁLISE
========================================= */

function iniciarAnalise(tipo, origem) {
    localStorage.setItem("tipoAnalise", tipo);

    if (origem) {
        localStorage.setItem("origemAnalise", origem);
    }

    const apiBaseUrl = localStorage.getItem("apiBaseUrl") || "http://127.0.0.1:8000";
    const botao = document.querySelector(".confirm-github");
    if (botao) {
        botao.disabled = true;
        botao.textContent = "Analisando...";
    }

    mostrarMensagem(`Enviando repositório para análise...`, "sucesso");

    fetch(`${apiBaseUrl}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: origem })
    })
        .then(async (response) => {
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.detail || data.error || "O backend não conseguiu analisar o repositório.");
            }
            if (data.error) throw new Error(data.error);
            return data;
        })
        .then((data) => {
            const usuarioAtual = localStorage.getItem("usuario");
            localStorage.setItem(`ultimaAnalise_${usuarioAtual}`, JSON.stringify(data));
            const chaveHistorico = `historicoAnalises_${usuarioAtual}`;
            const historico = JSON.parse(localStorage.getItem(chaveHistorico) || "[]");
            historico.push({ ...data, criada_em: new Date().toISOString() });
            localStorage.setItem(chaveHistorico, JSON.stringify(historico));
            const textoAnalise = String(data.analise_ia || "").replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
            let quantidadeRiscos = 0;
            try { quantidadeRiscos = JSON.parse(textoAnalise).vulnerabilidades?.length || 0; } catch (_) { }
            localStorage.setItem(`notificacaoPendente_${usuarioAtual}`, JSON.stringify({
                id: Date.now(), repo: data.repo, riscos: quantidadeRiscos
            }));
            mostrarMensagem("Análise concluída com sucesso!", "sucesso");
            setTimeout(() => window.location.href = "area.html?view=vulnerabilities", 700);
        })
        .catch((error) => {
            mostrarMensagem(error.message || "Não foi possível conectar ao backend.", "erro");
        });
}


/* =========================================
   TOAST / NOTIFICAÇÃO FLUTUANTE
========================================= */

function mostrarMensagem(texto, tipo = "sucesso") {
    // Remove mensagens existentes para não empilhar
    const antiga = document.querySelector(".toast-message");
    if (antiga) antiga.remove();

    const mensagem = document.createElement("div");
    mensagem.className = "toast-message";
    mensagem.textContent = texto;

    // Estilos inline garantindo harmonia visual com o projeto
    mensagem.style.position = "fixed";
    mensagem.style.bottom = "25px";
    mensagem.style.right = "25px";
    mensagem.style.background = "#161B22";
    mensagem.style.border = tipo === "erro" ? "1px solid #F85149" : "1px solid #2F81F7";
    mensagem.style.color = "#F0F6FC";
    mensagem.style.padding = "14px 22px";
    mensagem.style.borderRadius = "10px";
    mensagem.style.zIndex = "9999";
    mensagem.style.fontSize = "14px";
    mensagem.style.fontWeight = "500";
    mensagem.style.boxShadow = "0 8px 24px rgba(0,0,0,0.5)";

    document.body.appendChild(mensagem);

    setTimeout(function () {
        mensagem.remove();
    }, 2500);
}
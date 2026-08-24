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
    let nome = usuario.split("@")[0];
    nome = nome.charAt(0).toUpperCase() + nome.slice(1);
    usuarioElemento.textContent = nome;
}


/* =========================================
   UPLOAD DE ARQUIVO (.ZIP)
========================================= */

const fileInput = document.getElementById("projectFile");
const uploadButton = document.getElementById("uploadButton");

if (uploadButton && fileInput) {
    uploadButton.addEventListener("click", function () {
        fileInput.click();
    });

    fileInput.addEventListener("change", function () {
        if (!this.files.length) return;

        const arquivo = this.files[0];

        if (!arquivo.name.toLowerCase().endsWith(".zip")) {
            mostrarMensagem("Selecione um arquivo .ZIP válido.", "erro");
            this.value = "";
            return;
        }

        uploadButton.innerHTML = `<i class="fa-solid fa-check"></i> ${arquivo.name}`;
        uploadButton.style.color = "#3FB950";
        uploadButton.style.borderColor = "#3FB950";

        // Inicia análise simulada do arquivo enviado
        iniciarAnalise("ZIP", arquivo.name);
    });
}


/* =========================================
   GITHUB
========================================= */

const githubButton =
    document.getElementById("githubButton");

if (githubButton) {

    githubButton.addEventListener(
        "click",
        function () {

            window.open(
                "http://127.0.0.1:8000/auth/github",
                "_blank"
            );

        }
    );

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
            <h2>Conectar repositório</h2>
            <p>Informe a URL pública do repositório que deseja analisar.</p>
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

        if (!url.includes("github.com")) {
            mostrarMensagem("Informe uma URL válida do GitHub.", "erro");
            return;
        }

        modal.remove();
        iniciarAnalise("GitHub", url);
    });
}


/* =========================================
   CÓDIGO MANUAL
========================================= */

const codeButton = document.getElementById("codeButton");

if (codeButton) {
    codeButton.addEventListener("click", function () {
        mostrarModalCodigo();
    });
}

function mostrarModalCodigo() {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";

    modal.innerHTML = `
        <div class="modal">
            <div class="modal-icon">
                <i class="fa-solid fa-code"></i>
            </div>
            <h2>Analisar trecho de código</h2>
            <p>Cole o trecho de código abaixo para verificar falhas de segurança.</p>
            <textarea id="codeText" rows="6" placeholder="// Cole seu código aqui..."></textarea>
            <div class="modal-actions">
                <button class="cancel-modal">Cancelar</button>
                <button class="confirm-code">Analisar Código</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener("click", function (e) {
        if (e.target === modal) modal.remove();
    });

    const cancelar = modal.querySelector(".cancel-modal");
    cancelar.addEventListener("click", function () {
        modal.remove();
    });

    const confirmar = modal.querySelector(".confirm-code");
    confirmar.addEventListener("click", function () {
        const codigo = document.getElementById("codeText").value.trim();

        if (!codigo) {
            mostrarMensagem("Cole algum trecho de código para analisar.", "erro");
            return;
        }

        modal.remove();
        iniciarAnalise("Código", "Trecho colado manual");
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

    mostrarMensagem(`Preparando análise de ${tipo}...`, "sucesso");

    setTimeout(function () {
        // Redireciona para visualização do progresso ou resultado
        window.location.href = "area.html?view=vulnerabilities";
    }, 1200);
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
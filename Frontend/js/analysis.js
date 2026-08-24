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

const selectedRepository =
    document.getElementById(
        "selectedRepository"
    );


let githubConnected = false;

let repositoriosGitHub = [];

let repositorioAtual = null;


/* =========================================
   BOTÃO GITHUB
========================================= */

if (githubButton) {

    githubButton.addEventListener(
        "click",
        function () {

            /*
                Se ainda não conectou ao GitHub,
                inicia OAuth.
            */

            if (!githubConnected) {

                conectarGitHub();

                return;

            }


            /*
                Se já está conectado,
                abre novamente a lista de repos.
            */

            mostrarRepositorios(
                repositoriosGitHub
            );

        }
    );

}


/* =========================================
   CONECTAR AO GITHUB
========================================= */

function conectarGitHub() {

    const githubLogin =
        window.open(
            "http://127.0.0.1:8000/auth/github",
            "_blank"
        );


    if (!githubLogin) {

        alert(
            "O navegador bloqueou a janela de login. Permita pop-ups para continuar."
        );

    }

}


/* =========================================
   RECEBER AVISO DO BACKEND
========================================= */

window.addEventListener(
    "message",
    function (event) {

        /*
            Segurança:

            só aceitamos mensagens
            vindas do nosso backend.
        */

        if (
            event.origin !==
            "http://127.0.0.1:8000"
        ) {

            return;

        }


        /*
            Backend terminou o OAuth.
        */

        if (
            event.data &&
            event.data.type ===
            "github-connected"
        ) {

            githubConnected = true;

            carregarRepositorios();

        }

    }
);


/* =========================================
   CARREGAR REPOSITÓRIOS
========================================= */

async function carregarRepositorios() {

    try {

        githubButton.disabled = true;


        githubButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Carregando...
        `;


        const response =
            await fetch(
                "http://127.0.0.1:8000/github/repos",
                {
                    method: "GET",

                    /*
                        Necessário para enviar
                        o cookie da sessão FastAPI.
                    */
                    credentials: "include"
                }
            );


        if (!response.ok) {

            const textoErro =
                await response.text();


            console.error(
                "Erro do backend:",
                response.status,
                textoErro
            );


            throw new Error(
                `Backend respondeu com status ${response.status}`
            );

        }


        repositoriosGitHub =
            await response.json();


        githubConnected = true;


        githubButton.disabled = false;


        githubButton.innerHTML = `
            <i class="fa-solid fa-folder-open"></i>
            Selecionar repositório
        `;


        /*
            Depois do login,
            abre automaticamente a seleção.
        */

        mostrarRepositorios(
            repositoriosGitHub
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar repositórios:",
            erro
        );


        githubConnected = false;


        githubButton.disabled = false;


        githubButton.innerHTML = `
            <i class="fa-brands fa-github"></i>
            Conectar GitHub
        `;


        alert(
            "Não foi possível carregar seus repositórios."
        );

    }

}


/* =========================================
   MODAL DOS REPOSITÓRIOS
========================================= */

function mostrarRepositorios(
    repositorios
) {

    /*
        Evita criar dois modais
        ao mesmo tempo.
    */

    const modalExistente =
        document.querySelector(
            ".repo-modal-overlay"
        );


    if (modalExistente) {

        modalExistente.remove();

    }


    const modal =
        document.createElement("div");


    modal.className =
        "repo-modal-overlay";


    modal.innerHTML = `

        <div class="repo-modal">

            <div class="repo-modal-header">

                <div>

                    <h2>
                        Selecionar repositório
                    </h2>

                    <p>
                        Escolha um projeto do GitHub
                        para analisar com o CheckIA.
                    </p>

                </div>


                <button
                    class="repo-close"
                    type="button"
                    aria-label="Fechar"
                >
                    ×
                </button>

            </div>


            <div class="repo-search-wrapper">

                <input
                    type="text"
                    class="repo-search"
                    placeholder="Buscar repositório..."
                    autocomplete="off"
                >

            </div>


            <div
                class="repository-list"
            ></div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    const lista =
        modal.querySelector(
            ".repository-list"
        );


    const busca =
        modal.querySelector(
            ".repo-search"
        );


    const fechar =
        modal.querySelector(
            ".repo-close"
        );


    /* =====================================
       RENDERIZAR REPOSITÓRIOS
    ===================================== */

    function renderizarRepositorios(
        listaRepos
    ) {

        lista.innerHTML = "";


        if (!listaRepos.length) {

            lista.innerHTML = `

                <div class="repo-empty">

                    <i class="fa-solid fa-folder-open"></i>

                    <p>
                        Nenhum repositório encontrado.
                    </p>

                </div>

            `;

            return;

        }


        listaRepos.forEach(
            function (repo) {

                const item =
                    document.createElement(
                        "button"
                    );


                item.type = "button";

                item.className =
                    "repository-item";


                /*
                    Marcamos visualmente
                    o repo já selecionado.
                */

                if (
                    repositorioAtual &&
                    repositorioAtual.id === repo.id
                ) {

                    item.classList.add(
                        "selected"
                    );

                }


                const nome =
                    escaparHTML(
                        repo.name || ""
                    );


                const fullName =
                    escaparHTML(
                        repo.full_name || ""
                    );


                const descricao =
                    escaparHTML(
                        repo.description || ""
                    );


                const linguagem =
                    escaparHTML(
                        repo.language || ""
                    );


                item.innerHTML = `

                    <div class="repository-main">

                        <div class="repository-icon">

                            <i
                                class="fa-brands fa-github"
                            ></i>

                        </div>


                        <div class="repository-info">

                            <strong>
                                ${nome}
                            </strong>


                            <span
                                class="repository-full-name"
                            >
                                ${fullName}
                            </span>


                            ${
                                descricao
                                    ? `
                                        <span
                                            class="repository-description"
                                        >
                                            ${descricao}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                    </div>


                    <div class="repository-meta">

                        <span
                            class="
                                repository-status
                                ${
                                    repo.private
                                        ? "private"
                                        : "public"
                                }
                            "
                        >

                            ${
                                repo.private
                                    ? "Privado"
                                    : "Público"
                            }

                        </span>


                        ${
                            linguagem
                                ? `
                                    <span
                                        class="repository-language"
                                    >
                                        ${linguagem}
                                    </span>
                                `
                                : ""
                        }

                    </div>

                `;


                item.addEventListener(
                    "click",
                    function () {

                        selecionarRepositorio(
                            repo
                        );


                        modal.remove();

                    }
                );


                lista.appendChild(
                    item
                );

            }
        );

    }


    /*
        Primeira renderização.
    */

    renderizarRepositorios(
        repositorios
    );


    /* =====================================
       BUSCA
    ===================================== */

    busca.addEventListener(
        "input",
        function () {

            const termo =
                busca.value
                    .toLowerCase()
                    .trim();


            const filtrados =
                repositorios.filter(
                    function (repo) {

                        const nome =
                            (
                                repo.name || ""
                            ).toLowerCase();


                        const fullName =
                            (
                                repo.full_name || ""
                            ).toLowerCase();


                        return (
                            nome.includes(termo)
                            ||
                            fullName.includes(termo)
                        );

                    }
                );


            renderizarRepositorios(
                filtrados
            );

        }
    );


    /* =====================================
       FECHAR
    ===================================== */

    fechar.addEventListener(
        "click",
        function () {

            modal.remove();

        }
    );


    /*
        Clique fora do modal.
    */

    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                modal.remove();

            }

        }
    );


    /*
        ESC fecha o modal.
    */

    function fecharComEsc(event) {

        if (
            event.key === "Escape"
        ) {

            modal.remove();

            document.removeEventListener(
                "keydown",
                fecharComEsc
            );

        }

    }


    document.addEventListener(
        "keydown",
        fecharComEsc
    );

}


/* =========================================
   SELECIONAR REPOSITÓRIO
========================================= */

function selecionarRepositorio(
    repo
) {

    repositorioAtual = repo;


    /*
        Guarda informações úteis
        para as próximas telas.
    */

    localStorage.setItem(
        "repositorioSelecionado",
        repo.full_name
    );


    localStorage.setItem(
        "repositorioUrl",
        repo.html_url
    );


    localStorage.setItem(
        "repositorioBranch",
        repo.default_branch || "main"
    );


    if (!selectedRepository) {

        console.error(
            "Elemento #selectedRepository não encontrado."
        );

        return;

    }


    const nome =
        escaparHTML(
            repo.name || ""
        );


    const fullName =
        escaparHTML(
            repo.full_name || ""
        );


    const linguagem =
        escaparHTML(
            repo.language || ""
        );


    const branch =
        escaparHTML(
            repo.default_branch || "main"
        );


    selectedRepository.innerHTML = `

        <div
            class="selected-repository-header"
        >

            <span>
                Repositório selecionado
            </span>


            <span
                class="selected-repository-check"
            >

                <i
                    class="fa-solid fa-check"
                ></i>

            </span>

        </div>


        <div
            class="selected-repository-content"
        >

            <div
                class="selected-repository-icon"
            >

                <i
                    class="fa-brands fa-github"
                ></i>

            </div>


            <div
                class="selected-repository-info"
            >

                <strong>
                    ${nome}
                </strong>


                <span>
                    ${fullName}
                </span>

            </div>

        </div>


        <div
            class="selected-repository-meta"
        >

            <span
                class="
                    repo-visibility
                    ${
                        repo.private
                            ? "private"
                            : "public"
                    }
                "
            >

                ${
                    repo.private
                        ? "Privado"
                        : "Público"
                }

            </span>


            ${
                linguagem
                    ? `
                        <span
                            class="repo-language"
                        >
                            ${linguagem}
                        </span>
                    `
                    : ""
            }


            <span
                class="repo-branch"
            >

                <i
                    class="fa-solid fa-code-branch"
                ></i>

                ${branch}

            </span>

        </div>

    `;


    selectedRepository.classList.remove(
        "hidden"
    );


    /*
        O botão permanece disponível
        para trocar de repo.
    */

    githubButton.innerHTML = `
        <i class="fa-solid fa-repeat"></i>
        Selecionar repositório
    `;


    githubButton.disabled = false;

}


/* =========================================
   ESCAPAR HTML
========================================= */

/*
    Evita inserir diretamente no HTML
    textos vindos da API do GitHub.
*/

function escaparHTML(texto) {

    return String(texto)
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
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
/* =========================================
   CHECK IA
   ANALYSIS.JS
========================================= */


/* =========================================
   PROTEÇÃO CONTRA SCRIPT DUPLICADO
========================================= */

if (window.__checkIAAnalysisLoaded) {
    console.warn("analysis.js já foi carregado.");
} else {

window.__checkIAAnalysisLoaded = true;


/* =========================================
   ESTILOS DO ANALISADOR DE CÓDIGO
========================================= */

if (!document.getElementById("checkia-code-modal-styles")) {

    const style = document.createElement("style");

    style.id = "checkia-code-modal-styles";

    style.textContent = `

        /* =====================================
           MODAL DE CÓDIGO
        ====================================== */

        .code-analyzer-overlay {
            position: fixed;
            inset: 0;
            z-index: 99999;

            display: flex;
            align-items: center;
            justify-content: center;

            padding: 24px;

            background:
                rgba(5, 8, 13, 0.78);

            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);

            animation: codeAnalyzerFadeIn 0.2s ease;
        }


        @keyframes codeAnalyzerFadeIn {

            from {
                opacity: 0;
            }

            to {
                opacity: 1;
            }

        }


        .code-analyzer-modal {
            width: min(720px, 100%);

            background:
                linear-gradient(
                    145deg,
                    #161b22 0%,
                    #10141a 100%
                );

            border: 1px solid #30363d;

            border-radius: 18px;

            box-shadow:
                0 25px 70px rgba(0, 0, 0, 0.55),
                0 0 0 1px rgba(255, 255, 255, 0.02);

            overflow: hidden;

            animation: codeAnalyzerOpen 0.25s ease;

            color: #f0f6fc;
        }


        @keyframes codeAnalyzerOpen {

            from {
                opacity: 0;
                transform: translateY(15px) scale(0.98);
            }

            to {
                opacity: 1;
                transform: translateY(0) scale(1);
            }

        }


        /* HEADER */

        .code-analyzer-header {

            display: flex;
            align-items: center;
            justify-content: space-between;

            padding: 22px 24px;

            border-bottom: 1px solid #21262d;
        }


        .code-analyzer-header-left {

            display: flex;
            align-items: center;
            gap: 14px;
        }


        .code-analyzer-icon {

            width: 44px;
            height: 44px;

            display: flex;
            align-items: center;
            justify-content: center;

            border-radius: 12px;

            background: rgba(47, 129, 247, 0.12);

            border: 1px solid rgba(47, 129, 247, 0.25);

            color: #58a6ff;

            font-size: 19px;
        }


        .code-analyzer-title {

            margin: 0;

            font-size: 19px;
            font-weight: 700;

            color: #f0f6fc;
        }


        .code-analyzer-subtitle {

            margin: 4px 0 0;

            color: #8b949e;

            font-size: 13px;
        }


        .code-analyzer-close {

            width: 36px;
            height: 36px;

            border: none;
            border-radius: 8px;

            background: transparent;

            color: #8b949e;

            font-size: 22px;

            cursor: pointer;

            display: flex;
            align-items: center;
            justify-content: center;

            transition:
                background 0.2s ease,
                color 0.2s ease;
        }


        .code-analyzer-close:hover {

            background: #21262d;
            color: #f0f6fc;

        }


        /* CONTEÚDO */

        .code-analyzer-body {

            padding: 24px;
        }


        .code-analyzer-description {

            margin: 0 0 16px;

            color: #8b949e;

            font-size: 14px;
            line-height: 1.6;
        }


        /* EDITOR */

        .code-editor-wrapper {

            position: relative;

            border: 1px solid #30363d;

            border-radius: 12px;

            background: #0d1117;

            overflow: hidden;

            transition:
                border-color 0.2s ease,
                box-shadow 0.2s ease;
        }


        .code-editor-wrapper:focus-within {

            border-color: #2f81f7;

            box-shadow:
                0 0 0 3px rgba(47, 129, 247, 0.12);

        }


        .code-editor-topbar {

            height: 38px;

            display: flex;
            align-items: center;

            gap: 7px;

            padding: 0 14px;

            background: #161b22;

            border-bottom: 1px solid #21262d;
        }


        .code-editor-dot {

            width: 9px;
            height: 9px;

            border-radius: 50%;

            background: #484f58;
        }


        .code-editor-label {

            margin-left: 6px;

            color: #8b949e;

            font-size: 11px;

            font-family:
                "SFMono-Regular",
                Consolas,
                "Liberation Mono",
                monospace;
        }


        .code-analyzer-textarea {

            display: block;

            width: 100%;

            min-height: 260px;

            resize: vertical;

            padding: 18px;

            border: none;
            outline: none;

            background: #0d1117;

            color: #e6edf3;

            font-family:
                "SFMono-Regular",
                Consolas,
                "Liberation Mono",
                monospace;

            font-size: 13px;

            line-height: 1.7;

            box-sizing: border-box;
        }


        .code-analyzer-textarea::placeholder {

            color: #484f58;

        }


        /* RODAPÉ */

        .code-analyzer-footer {

            display: flex;

            align-items: center;
            justify-content: space-between;

            gap: 16px;

            padding: 18px 24px;

            border-top: 1px solid #21262d;

            background: rgba(13, 17, 23, 0.5);
        }


        .code-analyzer-hint {

            display: flex;
            align-items: center;

            gap: 7px;

            color: #6e7681;

            font-size: 12px;
        }


        .code-analyzer-hint i {

            color: #58a6ff;

        }


        .code-analyzer-actions {

            display: flex;

            align-items: center;

            gap: 10px;
        }


        .code-analyzer-btn {

            height: 40px;

            padding: 0 17px;

            border-radius: 8px;

            font-size: 13px;
            font-weight: 600;

            cursor: pointer;

            transition:
                transform 0.15s ease,
                background 0.2s ease,
                border-color 0.2s ease;
        }


        .code-analyzer-btn:active {

            transform: scale(0.98);

        }


        .code-analyzer-btn-cancel {

            background: transparent;

            border: 1px solid #30363d;

            color: #c9d1d9;
        }


        .code-analyzer-btn-cancel:hover {

            background: #21262d;

        }


        .code-analyzer-btn-analyze {

            background: #238636;

            border: 1px solid #2ea043;

            color: white;
        }


        .code-analyzer-btn-analyze:hover {

            background: #2ea043;

        }


        @media (max-width: 600px) {

            .code-analyzer-overlay {

                padding: 14px;

            }


            .code-analyzer-header {

                padding: 18px;

            }


            .code-analyzer-body {

                padding: 18px;

            }


            .code-analyzer-footer {

                padding: 16px 18px;

                flex-direction: column;

                align-items: stretch;

            }


            .code-analyzer-hint {

                justify-content: center;

            }


            .code-analyzer-actions {

                width: 100%;
            }


            .code-analyzer-btn {

                flex: 1;

            }

        }

    `;

    document.head.appendChild(style);

}


/* =========================================
   VERIFICAÇÃO DE SESSÃO
========================================= */

let usuario = null;

const usuarioElemento =
    document.getElementById("usuario");


async function verificarSessao() {

    const { data } =
        await supabase.auth.getSession();


    if (!data.session) {

        window.location.href =
            "index.html";

        return;

    }


    usuario =
        data.session.user.email;


    const nomeMeta =
        data.session.user.user_metadata?.nome;


    if (usuarioElemento) {

        let nome =
            nomeMeta ||
            usuario.split("@")[0];


        usuarioElemento.textContent =
            nome.charAt(0).toUpperCase() +
            nome.slice(1);

    }

}


verificarSessao();


/* =========================================
   UPLOAD DE ARQUIVO (.ZIP)
========================================= */

const fileInput =
    document.getElementById(
        "projectFile"
    );


const uploadButton =
    document.getElementById(
        "uploadButton"
    );


if (uploadButton && fileInput) {

    uploadButton.addEventListener(
        "click",
        function () {

            fileInput.click();

        }
    );


    fileInput.addEventListener(
        "change",
        function () {

            if (!this.files.length) {
                return;
            }


            const arquivo =
                this.files[0];


            if (
                !arquivo.name
                    .toLowerCase()
                    .endsWith(".zip")
            ) {

                mostrarMensagem(
                    "Selecione um arquivo .ZIP válido.",
                    "erro"
                );


                this.value = "";

                return;

            }


            uploadButton.innerHTML = `
                <i class="fa-solid fa-check"></i>
                ${escaparHTML(arquivo.name)}
            `;


            uploadButton.style.color =
                "#3FB950";


            uploadButton.style.borderColor =
                "#3FB950";


            iniciarAnalise(
                "ZIP",
                arquivo.name,
                arquivo
            );

        }
    );

}


/* =========================================
   GITHUB
========================================= */

const githubButton =
    document.getElementById(
        "githubButton"
    );


const selectedRepository =
    document.getElementById(
        "selectedRepository"
    );


let githubConnected = false;

let repositoriosGitHub = [];

let repositorioAtual = null;


/* =========================================
   CARREGAR USUÁRIO GITHUB
========================================= */

async function carregarUsuarioGitHub() {

    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/github/me",
                {
                    method: "GET",
                    credentials: "include"
                }
            );


        if (!response.ok) {

            console.log(
                "Usuário GitHub não conectado."
            );

            return;

        }


        const usuarioGitHub =
            await response.json();


        console.log(
            "Usuário GitHub:",
            usuarioGitHub
        );


        if (usuarioGitHub.login) {

            localStorage.setItem(
                "usuario",
                usuarioGitHub.login
            );


            if (usuarioElemento) {

                usuarioElemento.textContent =
                    usuarioGitHub.name ||
                    usuarioGitHub.login;

            }

        }

    } catch (erro) {

        console.error(
            "Erro ao carregar usuário GitHub:",
            erro
        );

    }

}


carregarUsuarioGitHub();


/* =========================================
   BOTÃO GITHUB
========================================= */

if (githubButton) {

    githubButton.addEventListener(
        "click",
        function () {

            if (!githubConnected) {

                conectarGitHub();

                return;

            }


            mostrarRepositorios(
                repositoriosGitHub
            );

        }
    );

}


/* =========================================
   CONECTAR GITHUB
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
    async function (event) {

        if (
            event.origin !==
            "http://127.0.0.1:8000"
        ) {

            return;

        }


        if (
            event.data &&
            event.data.type ===
                "github-connected"
        ) {

            githubConnected =
                true;


            await carregarUsuarioGitHub();


            carregarRepositorios();

        }

    }
);


/* =========================================
   CARREGAR REPOSITÓRIOS
========================================= */

async function carregarRepositorios() {

    try {

        githubButton.disabled =
            true;


        githubButton.innerHTML = `
            <i class="fa-solid fa-spinner fa-spin"></i>
            Carregando...
        `;


        const response =
            await fetch(
                "http://127.0.0.1:8000/github/repos",
                {
                    method: "GET",
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


        githubConnected =
            true;


        githubButton.disabled =
            false;


        githubButton.innerHTML = `
            <i class="fa-solid fa-folder-open"></i>
            Selecionar repositório
        `;


        mostrarRepositorios(
            repositoriosGitHub
        );


    } catch (erro) {

        console.error(
            "Erro ao carregar repositórios:",
            erro
        );


        githubConnected =
            false;


        githubButton.disabled =
            false;


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


                item.type =
                    "button";


                item.className =
                    "repository-item";


                if (
                    repositorioAtual &&
                    repositorioAtual.id ===
                        repo.id
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


    renderizarRepositorios(
        repositorios
    );


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
                            nome.includes(termo) ||
                            fullName.includes(termo)
                        );

                    }
                );


            renderizarRepositorios(
                filtrados
            );

        }
    );


    fechar.addEventListener(
        "click",
        function () {

            modal.remove();

        }
    );


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

    repositorioAtual =
        repo;


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
        repo.default_branch ||
            "main"
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
            repo.default_branch ||
                "main"
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


        <div
            class="selected-repository-actions"
        >

            <button
                type="button"
                class="remove-github-button"
                id="removeGithubButton"
            >

                <i
                    class="fa-solid fa-right-from-bracket"
                ></i>

                Remover conta

            </button>

        </div>

    `;


    selectedRepository.classList.remove(
        "hidden"
    );


    const removeGithubButton =
        document.getElementById(
            "removeGithubButton"
        );


    if (removeGithubButton) {

        removeGithubButton.addEventListener(
            "click",
            removerContaGitHub
        );

    }


    githubButton.innerHTML = `
        <i class="fa-solid fa-repeat"></i>
        Selecionar repositório
    `;


    githubButton.disabled =
        false;

}


/* =========================================
   REMOVER CONTA GITHUB
========================================= */

async function removerContaGitHub() {

    const confirmar =
        confirm(
            "Tem certeza que deseja remover a conta do GitHub?"
        );


    if (!confirmar) {
        return;
    }


    try {

        const response =
            await fetch(
                "http://127.0.0.1:8000/auth/github/logout",
                {
                    method: "POST",
                    credentials: "include"
                }
            );


        if (!response.ok) {

            throw new Error(
                "Não foi possível desconectar o GitHub."
            );

        }


        githubConnected =
            false;


        repositoriosGitHub =
            [];


        repositorioAtual =
            null;


        localStorage.removeItem(
            "repositorioSelecionado"
        );


        localStorage.removeItem(
            "repositorioUrl"
        );


        localStorage.removeItem(
            "repositorioBranch"
        );


        selectedRepository.innerHTML =
            "";


        selectedRepository.classList.add(
            "hidden"
        );


        githubButton.innerHTML = `
            <i class="fa-brands fa-github"></i>
            Conectar GitHub
        `;


        githubButton.disabled =
            false;


        mostrarMensagem(
            "Conta do GitHub desconectada.",
            "sucesso"
        );


    } catch (erro) {

        console.error(
            "Erro ao remover conta GitHub:",
            erro
        );


        mostrarMensagem(
            "Não foi possível desconectar a conta do GitHub.",
            "erro"
        );

    }

}


/* =========================================
   ESCAPAR HTML
========================================= */

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

    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "modal-overlay";


    modal.innerHTML = `

        <div class="modal">

            <div class="modal-icon">

                <i
                    class="fa-brands fa-github"
                ></i>

            </div>


            <h2>
                Conectar repositório
            </h2>


            <p>
                Informe a URL pública do repositório
                que deseja analisar.
            </p>


            <input
                id="githubUrl"
                type="url"
                placeholder="https://github.com/usuario/projeto"
            >


            <div class="modal-actions">

                <button
                    class="cancel-modal"
                    type="button"
                >
                    Cancelar
                </button>


                <button
                    class="confirm-github"
                    type="button"
                >
                    Analisar
                </button>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    modal.addEventListener(
        "click",
        function (e) {

            if (
                e.target === modal
            ) {

                modal.remove();

            }

        }
    );


    const cancelar =
        modal.querySelector(
            ".cancel-modal"
        );


    cancelar.addEventListener(
        "click",
        function () {

            modal.remove();

        }
    );


    const confirmar =
        modal.querySelector(
            ".confirm-github"
        );


    confirmar.addEventListener(
        "click",
        function () {

            const urlInput =
                modal.querySelector(
                    "#githubUrl"
                );


            const url =
                urlInput
                    ? urlInput.value.trim()
                    : "";


            if (!url) {

                mostrarMensagem(
                    "Informe a URL do repositório.",
                    "erro"
                );

                return;

            }


            if (
                !url.includes(
                    "github.com"
                )
            ) {

                mostrarMensagem(
                    "Informe uma URL válida do GitHub.",
                    "erro"
                );

                return;

            }


            modal.remove();


            iniciarAnalise(
                "GitHub",
                url
            );

        }
    );

}


/* =========================================
   CÓDIGO MANUAL
========================================= */

const codeButton =
    document.getElementById(
        "codeButton"
    );


if (codeButton) {

    codeButton.addEventListener(
        "click",
        function () {

            mostrarModalCodigo();

        }
    );

}


/* =========================================
   MODAL DO ANALISADOR DE CÓDIGO
========================================= */

function mostrarModalCodigo() {

    /*
       Se por algum motivo já existir um modal,
       remove antes de criar outro.
    */

    const modalAntigo =
        document.querySelector(
            ".code-analyzer-overlay"
        );


    if (modalAntigo) {

        modalAntigo.remove();

    }


    const modal =
        document.createElement(
            "div"
        );


    modal.className =
        "code-analyzer-overlay";


    modal.innerHTML = `

        <div
            class="code-analyzer-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="codeAnalyzerTitle"
        >

            <!-- HEADER -->

            <div class="code-analyzer-header">

                <div
                    class="code-analyzer-header-left"
                >

                    <div
                        class="code-analyzer-icon"
                    >

                        <i
                            class="fa-solid fa-code"
                        ></i>

                    </div>


                    <div>

                        <h2
                            class="code-analyzer-title"
                            id="codeAnalyzerTitle"
                        >
                            Analisar trecho de código
                        </h2>


                        <p
                            class="code-analyzer-subtitle"
                        >
                            Check IA Security Engine
                        </p>

                    </div>

                </div>


                <button
                    type="button"
                    class="code-analyzer-close"
                    aria-label="Fechar analisador"
                >

                    <i
                        class="fa-solid fa-xmark"
                    ></i>

                </button>

            </div>


            <!-- CORPO -->

            <div class="code-analyzer-body">

                <p
                    class="code-analyzer-description"
                >
                    Cole abaixo o trecho de código
                    que deseja analisar. A Check IA
                    verificará possíveis falhas e riscos
                    de segurança.
                </p>


                <div
                    class="code-editor-wrapper"
                >

                    <div
                        class="code-editor-topbar"
                    >

                        <span
                            class="code-editor-dot"
                        ></span>

                        <span
                            class="code-editor-dot"
                        ></span>

                        <span
                            class="code-editor-dot"
                        ></span>


                        <span
                            class="code-editor-label"
                        >
                            code-input
                        </span>

                    </div>


                    <textarea
                        class="code-analyzer-textarea"
                        id="codeAnalyzerInput"
                        placeholder="// Cole seu código aqui..."
                        spellcheck="false"
                        autocomplete="off"
                    ></textarea>

                </div>

            </div>


            <!-- FOOTER -->

            <div class="code-analyzer-footer">

                <div
                    class="code-analyzer-hint"
                >

                    <i
                        class="fa-solid fa-shield-halved"
                    ></i>

                    <span>
                        O código será analisado pela IA.
                    </span>

                </div>


                <div
                    class="code-analyzer-actions"
                >

                    <button
                        type="button"
                        class="
                            code-analyzer-btn
                            code-analyzer-btn-cancel
                        "
                    >
                        Cancelar
                    </button>


                    <button
                        type="button"
                        class="
                            code-analyzer-btn
                            code-analyzer-btn-analyze
                        "
                    >

                        <i
                            class="fa-solid fa-magnifying-glass"
                        ></i>

                        Analisar código

                    </button>

                </div>

            </div>

        </div>

    `;


    document.body.appendChild(
        modal
    );


    /* =====================================
       ELEMENTOS
    ====================================== */

    const textarea =
        modal.querySelector(
            "#codeAnalyzerInput"
        );


    const fechar =
        modal.querySelector(
            ".code-analyzer-close"
        );


    const cancelar =
        modal.querySelector(
            ".code-analyzer-btn-cancel"
        );


    const analisar =
        modal.querySelector(
            ".code-analyzer-btn-analyze"
        );


    /* =====================================
       FECHAR
    ====================================== */

    function fecharModal() {

        modal.remove();

        document.body.style.overflow =
            "";

        document.removeEventListener(
            "keydown",
            fecharComEsc
        );

    }


    /* =====================================
       ESC
    ====================================== */

    function fecharComEsc(event) {

        if (
            event.key === "Escape"
        ) {

            fecharModal();

        }

    }


    /* =====================================
       EVENTOS
    ====================================== */

    fechar.addEventListener(
        "click",
        fecharModal
    );


    cancelar.addEventListener(
        "click",
        fecharModal
    );


    modal.addEventListener(
        "click",
        function (event) {

            if (
                event.target === modal
            ) {

                fecharModal();

            }

        }
    );


    document.addEventListener(
        "keydown",
        fecharComEsc
    );


    /* =====================================
       ANALISAR CÓDIGO
    ====================================== */

    analisar.addEventListener(
        "click",
        function () {

            const codigo =
                textarea.value.trim();


            if (!codigo) {

                textarea.focus();


                mostrarMensagem(
                    "Cole algum trecho de código para analisar.",
                    "erro"
                );


                return;

            }


            /*
               Envia para o fluxo normal
               da análise.
            */

            fecharModal();


            iniciarAnalise(
                "Código",
                "Trecho colado manual",
                codigo
            );

        }
    );


    /* =====================================
       BLOQUEIA SCROLL DA PÁGINA
    ====================================== */

    document.body.style.overflow =
        "hidden";


    /* =====================================
       FOCO AUTOMÁTICO
    ====================================== */

    setTimeout(
        function () {

            textarea.focus();

        },
        100
    );

}


/* =========================================
   INICIALIZAÇÃO DA ANÁLISE
========================================= */

async function iniciarAnalise(
    tipo,
    origem,
    payload
) {

    localStorage.setItem(
        "tipoAnalise",
        tipo
    );


    if (origem) {

        localStorage.setItem(
            "origemAnalise",
            origem
        );

    }


    mostrarMensagem(
        `Preparando análise de ${tipo}...`,
        "sucesso"
    );


    /* =====================================
       ZIP
    ====================================== */

    if (
        payload instanceof File
    ) {

        const leitor =
            new FileReader();


        leitor.onload =
            function () {

                sessionStorage.setItem(
                    "arquivoAnaliseBase64",
                    leitor.result
                );


                sessionStorage.setItem(
                    "arquivoAnaliseNome",
                    payload.name
                );


                window.location.href =
                    "scan.html";

            };


        leitor.readAsDataURL(
            payload
        );


        return;

    }


    /* =====================================
       CÓDIGO
    ====================================== */

    if (
        typeof payload ===
        "string"
    ) {

        sessionStorage.setItem(
            "codigoAnalise",
            payload
        );

    }


    /* =====================================
       IR PARA SCANNER
    ====================================== */

    setTimeout(
        function () {

            window.location.href =
                "scan.html";

        },
        800
    );

}


/* =========================================
   TOAST / NOTIFICAÇÃO
========================================= */

function mostrarMensagem(
    texto,
    tipo = "sucesso"
) {

    const antiga =
        document.querySelector(
            ".toast-message"
        );


    if (antiga) {

        antiga.remove();

    }


    const mensagem =
        document.createElement(
            "div"
        );


    mensagem.className =
        "toast-message";


    mensagem.textContent =
        texto;


    mensagem.style.position =
        "fixed";


    mensagem.style.bottom =
        "25px";


    mensagem.style.right =
        "25px";


    mensagem.style.background =
        "#161B22";


    mensagem.style.border =
        tipo === "erro"

            ? "1px solid #F85149"

            : "1px solid #2F81F7";


    mensagem.style.color =
        "#F0F6FC";


    mensagem.style.padding =
        "14px 22px";


    mensagem.style.borderRadius =
        "10px";


    mensagem.style.zIndex =
        "999999";


    mensagem.style.fontSize =
        "14px";


    mensagem.style.fontWeight =
        "500";


    mensagem.style.boxShadow =
        "0 8px 24px rgba(0,0,0,0.5)";


    document.body.appendChild(
        mensagem
    );


    setTimeout(
        function () {

            mensagem.remove();

        },
        2500
    );

}


/* =========================================
   VERIFICAÇÃO ANTES DA ANÁLISE GITHUB
========================================= */

const startVerificationButton =
    document.getElementById(
        "startVerificationButton"
    );


if (startVerificationButton) {

    startVerificationButton.addEventListener(
        "click",
        function () {

            const repositorio =
                localStorage.getItem(
                    "repositorioSelecionado"
                );


            if (!repositorio) {

                mostrarMensagem(
                    "Selecione um repositório antes de começar a verificação.",
                    "erro"
                );


                return;

            }


            iniciarAnalise(
                "GitHub",
                repositorio
            );

        }
    );

}

} // fim da proteção contra script duplicado
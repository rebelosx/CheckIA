/* =========================================
   CHECK IA
   ANALYSIS.JS
========================================= */

const usuario = localStorage.getItem("usuario");

if (!usuario) {

    window.location.href = "login.html";

}


/* MOSTRAR USUÁRIO */

const usuarioElemento =
    document.getElementById("usuario");

if (usuarioElemento && usuario) {

    let nome =
        usuario.split("@")[0];

    nome =
        nome.charAt(0).toUpperCase() +
        nome.slice(1);

    usuarioElemento.textContent = nome;

}


/* =========================================
   UPLOAD
========================================= */

const fileInput =
    document.getElementById("projectFile");

const uploadButton =
    document.getElementById("uploadButton");


if (uploadButton) {

    uploadButton.addEventListener(
        "click",
        function () {

            fileInput.click();

        }
    );

}


if (fileInput) {

    fileInput.addEventListener(
        "change",
        function () {

            if (!this.files.length) {
                return;
            }

            const arquivo =
                this.files[0];

            if (!arquivo.name
                .toLowerCase()
                .endsWith(".zip")) {

                alert(
                    "Selecione um arquivo ZIP."
                );

                this.value = "";

                return;

            }


            uploadButton.innerHTML =

                `<i class="fa-solid fa-check"></i>
                 ${arquivo.name}`;


            uploadButton.style.color =
                "#39D98A";

        }
    );

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

            mostrarModalGitHub();

        }
    );

}


/* =========================================
   MODAL GITHUB
========================================= */

function mostrarModalGitHub() {

    const modal =
        document.createElement("div");


    modal.className =
        "modal-overlay";


    modal.innerHTML = `

        <div class="modal">

            <div class="modal-icon">

                <i class="fa-brands fa-github"></i>

            </div>

            <h2>Conectar repositório</h2>

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
                    class="cancel-modal">
                    Cancelar
                </button>

                <button
                    class="confirm-github">
                    Analisar
                </button>

            </div>

        </div>
    `;


    document.body.appendChild(modal);


    const cancelar =
        modal.querySelector(".cancel-modal");


    cancelar.addEventListener(
        "click",
        function () {

            modal.remove();

        }
    );


    const confirmar =
        modal.querySelector(".confirm-github");


    confirmar.addEventListener(
        "click",
        function () {

            const url =
                document.getElementById(
                    "githubUrl"
                ).value.trim();


            if (!url) {

                alert(
                    "Informe a URL do repositório."
                );

                return;

            }


            if (!url.includes("github.com")) {

                alert(
                    "Informe uma URL válida do GitHub."
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
   CÓDIGO
========================================= */

const codeButton =
    document.getElementById("codeButton");


if (codeButton) {

    codeButton.addEventListener(
        "click",
        function () {

            iniciarAnalise(
                "Código",
                null
            );

        }
    );

}


/* =========================================
   SIMULAÇÃO DE ANÁLISE
========================================= */

function iniciarAnalise(
    tipo,
    origem
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
        "Preparando análise..."
    );


    setTimeout(
        function () {

            window.location.href =
                "analysis.html";

        },
        1000
    );

}


/* =========================================
   MENSAGEM
========================================= */

function mostrarMensagem(texto) {

    const mensagem =
        document.createElement("div");


    mensagem.textContent =
        texto;


    mensagem.style.position =
        "fixed";

    mensagem.style.bottom =
        "25px";

    mensagem.style.right =
        "25px";

    mensagem.style.background =
        "#151C2B";

    mensagem.style.border =
        "1px solid #34435F";

    mensagem.style.color =
        "#F4F7FB";

    mensagem.style.padding =
        "14px 20px";

    mensagem.style.borderRadius =
        "10px";

    mensagem.style.zIndex =
        "9999";

    mensagem.style.fontSize =
        "13px";


    document.body.appendChild(
        mensagem
    );


    setTimeout(
        function () {

            mensagem.remove();

        },
        1500
    );

}

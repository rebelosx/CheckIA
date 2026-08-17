const searchInput =
    document.getElementById("searchInput");

const severityFilter =
    document.getElementById("severityFilter");

const projectFilter =
    document.getElementById("projectFilter");

const table =
    document.getElementById("vulnerabilityTable");

const resultsCount =
    document.getElementById("resultsCount");

const modal =
    document.getElementById("vulnerabilityModal");

const modalTitle =
    document.getElementById("modalTitle");

const modalDescription =
    document.getElementById("modalDescription");


/* ==============================
   DADOS
============================== */

const descriptions = {

    "SQL Injection":
        "A análise identificou uma possível entrada controlada pelo usuário sendo utilizada diretamente em uma consulta ao banco de dados.",

    "Dependência vulnerável":
        "Uma biblioteca utilizada pelo projeto possui uma versão com vulnerabilidade conhecida.",

    "Credencial exposta":
        "Foi encontrada uma possível credencial ou segredo armazenado diretamente no código-fonte.",

    "Falta de autenticação":
        "Um endpoint parece permitir acesso sem uma camada adequada de autenticação.",

    "XSS potencial":
        "Foi identificada uma possível utilização insegura de conteúdo fornecido pelo usuário.",

    "Header de segurança ausente":
        "A aplicação não apresenta alguns headers recomendados para aumentar a proteção do navegador."

};


/* ==============================
   FILTRO
============================== */

function filterTable() {

    const search =
        searchInput.value.toLowerCase();

    const severity =
        severityFilter.value;

    const project =
        projectFilter.value;


    const rows =
        table.querySelectorAll("tr");


    let visible = 0;


    rows.forEach(row => {

        const text =
            row.textContent.toLowerCase();

        const rowSeverity =
            row.dataset.severity;

        const rowProject =
            row.dataset.project;


        const matchesSearch =
            text.includes(search);


        const matchesSeverity =
            severity === "all" ||
            rowSeverity === severity;


        const matchesProject =
            project === "all" ||
            rowProject === project;


        if (
            matchesSearch &&
            matchesSeverity &&
            matchesProject
        ) {

            row.style.display = "";

            visible++;

        }

        else {

            row.style.display = "none";

        }

    });


    resultsCount.textContent =
        visible + " resultados";

}


searchInput.addEventListener(
    "input",
    filterTable
);

severityFilter.addEventListener(
    "change",
    filterTable
);

projectFilter.addEventListener(
    "change",
    filterTable
);


/* ==============================
   ABRIR VULNERABILIDADE
============================== */

function viewVulnerability(name) {

    modalTitle.textContent =
        name;


    modalDescription.textContent =
        descriptions[name] ||
        "A análise identificou um possível problema de segurança que precisa ser revisado.";


    modal.classList.add("show");

}


/* ==============================
   FECHAR MODAL
============================== */

function closeModal() {

    modal.classList.remove("show");

}


modal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === modal
        ) {

            closeModal();

        }

    }
);


/* ==============================
   MARCAR COMO CORRIGIDA
============================== */

function markAsFixed() {

    alert(
        "Vulnerabilidade marcada como corrigida!"
    );

    closeModal();

}


/* ==============================
   ESC
============================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeModal();

        }

    }
);
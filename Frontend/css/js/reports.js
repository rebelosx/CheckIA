const reportSearch =
    document.getElementById("reportSearch");

const reportFilter =
    document.getElementById("reportFilter");

const reportsTable =
    document.getElementById("reportsTable");

const reportModal =
    document.getElementById("reportModal");

const modalReportName =
    document.getElementById("modalReportName");

const modalScore =
    document.getElementById("modalScore");

const modalVulnerabilities =
    document.getElementById("modalVulnerabilities");


let selectedReport = "";


/* =========================
   FILTRAR RELATÓRIOS
========================= */

function filterReports() {

    const search =
        reportSearch.value.toLowerCase();

    const status =
        reportFilter.value;


    const rows =
        reportsTable.querySelectorAll("tr");


    rows.forEach(row => {

        const text =
            row.innerText.toLowerCase();

        const rowStatus =
            row.dataset.status;


        const matchesSearch =
            text.includes(search);


        const matchesStatus =
            status === "all" ||
            rowStatus === status;


        if (
            matchesSearch &&
            matchesStatus
        ) {

            row.style.display = "";

        } else {

            row.style.display = "none";

        }

    });

}


reportSearch.addEventListener(
    "input",
    filterReports
);


reportFilter.addEventListener(
    "change",
    filterReports
);


/* =========================
   VISUALIZAR RELATÓRIO
========================= */

function viewReport(reportName) {

    selectedReport =
        reportName;


    modalReportName.textContent =
        reportName;


    if (reportName.includes("#024")) {

        modalScore.textContent = "94";

        modalVulnerabilities.textContent = "0";

    }

    else if (reportName.includes("#023")) {

        modalScore.textContent = "78";

        modalVulnerabilities.textContent = "4";

    }

    else if (reportName.includes("#022")) {

        modalScore.textContent = "52";

        modalVulnerabilities.textContent = "7";

    }

    else {

        modalScore.textContent = "91";

        modalVulnerabilities.textContent = "1";

    }


    reportModal.classList.add("show");

}


/* =========================
   FECHAR MODAL
========================= */

function closeReportModal() {

    reportModal.classList.remove("show");

}


reportModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === reportModal
        ) {

            closeReportModal();

        }

    }
);


/* =========================
   DOWNLOAD
========================= */

function downloadReport(reportName) {

    const reportContent = `

CYBERSHIELD AI
SECURITY REPORT

Relatório:
${reportName}

Security Score:
94

Vulnerabilidades:
0

Status:
Seguro

Este relatório foi gerado pelo
CyberShield AI.

`;


    const blob =
        new Blob(
            [reportContent],
            {
                type: "text/plain"
            }
        );


    const url =
        URL.createObjectURL(blob);


    const link =
        document.createElement("a");


    link.href = url;

    link.download =
        reportName
        .replaceAll(" ", "_")
        + ".txt";


    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);


    alert(
        "Relatório exportado com sucesso!"
    );

}


/* =========================
   DOWNLOAD DO MODAL
========================= */

function downloadReportFromModal() {

    downloadReport(
        selectedReport
    );

}


/* =========================
   GERAR NOVO RELATÓRIO
========================= */

function generateReport() {

    alert(
        "Nova análise iniciada! Na próxima etapa vamos conectar esta função à tela de análise."
    );

}


/* =========================
   MUDAR PERÍODO DO GRÁFICO
========================= */

const scorePeriod =
    document.getElementById("scorePeriod");


scorePeriod.addEventListener(
    "change",
    function() {

        const period =
            this.value;


        if (period === "7") {

            console.log(
                "Exibindo dados dos últimos 7 dias."
            );

        }

        else if (period === "30") {

            console.log(
                "Exibindo dados dos últimos 30 dias."
            );

        }

        else {

            console.log(
                "Exibindo dados dos últimos 90 dias."
            );

        }

    }
);


/* =========================
   ESC FECHA MODAL
========================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeReportModal();

        }

    }
);
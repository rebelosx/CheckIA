const projectSearch =
    document.getElementById("projectSearch");

const projectStatus =
    document.getElementById("projectStatus");

const projectLanguage =
    document.getElementById("projectLanguage");

const projectGrid =
    document.getElementById("projectGrid");

const projectModal =
    document.getElementById("projectModal");

const totalProjects =
    document.getElementById("totalProjects");


/* =========================
   FILTRAR PROJETOS
========================= */

function filterProjects() {

    const search =
        projectSearch.value.toLowerCase();

    const status =
        projectStatus.value;

    const language =
        projectLanguage.value;


    const projects =
        projectGrid.querySelectorAll(".project-card");


    let visibleProjects = 0;


    projects.forEach(project => {

        const name =
            project.dataset.name.toLowerCase();

        const projectStatusValue =
            project.dataset.status;

        const projectLanguageValue =
            project.dataset.language;


        const matchesSearch =
            name.includes(search);


        const matchesStatus =
            status === "all" ||
            projectStatusValue === status;


        const matchesLanguage =
            language === "all" ||
            projectLanguageValue === language;


        if (
            matchesSearch &&
            matchesStatus &&
            matchesLanguage
        ) {

            project.style.display = "";

            visibleProjects++;

        } else {

            project.style.display = "none";

        }

    });


    totalProjects.textContent =
        visibleProjects;

}


projectSearch.addEventListener(
    "input",
    filterProjects
);

projectStatus.addEventListener(
    "change",
    filterProjects
);

projectLanguage.addEventListener(
    "change",
    filterProjects
);


/* =========================
   MODAL
========================= */

function openProjectModal() {

    projectModal.classList.add("show");

}


function closeProjectModal() {

    projectModal.classList.remove("show");

}


projectModal.addEventListener(
    "click",
    function(event) {

        if (
            event.target === projectModal
        ) {

            closeProjectModal();

        }

    }
);


/* =========================
   GITHUB
========================= */

function connectGithub() {

    alert(
        "Integração com GitHub selecionada. Na próxima etapa vamos conectar a API do GitHub."
    );

}


/* =========================
   UPLOAD
========================= */

function uploadProject() {

    alert(
        "Upload de projeto selecionado. Vamos conectar o envio de arquivos na próxima etapa."
    );

}


/* =========================
   MANUAL
========================= */

function manualProject() {

    alert(
        "Modo manual selecionado. Aqui vamos permitir inserir o código diretamente."
    );

}


/* =========================
   ABRIR PROJETO
========================= */

function openProject(projectName) {

    localStorage.setItem(
        "selectedProject",
        projectName
    );

    window.location.href =
        "results.html";

}


/* =========================
   MENU
========================= */

function showProjectMenu(button) {

    const card =
        button.closest(".project-card");

    const projectName =
        card.dataset.name;


    const action =
        confirm(
            "Deseja remover o projeto " +
            projectName +
            "?"
        );


    if (action) {

        card.remove();

        filterProjects();

        alert(
            "Projeto removido."
        );

    }

}


/* =========================
   ESC
========================= */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeProjectModal();

        }

    }
);
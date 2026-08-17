// ========================================
// CYBERSHIELD AI
// NAVEGAÇÃO CENTRAL
// ========================================

const pages = {
    dashboard: "dashboard.html",
    analysis: "analysis.html",
    projects: "projects.html",
    vulnerabilities: "vulnerabilities.html",
    reports: "reports.html",
    settings: "settings.html",
    login: "index.html"
};


// ========================================
// NAVEGAR PARA UMA PÁGINA
// ========================================

function navigateTo(page) {

    if (!pages[page]) {
        console.error("Página não encontrada:", page);
        return;
    }

    window.location.href = pages[page];
}


// ========================================
// DESTACAR MENU ATIVO
// ========================================

function setActiveMenu() {

    const currentPage =
        window.location.pathname
            .split("/")
            .pop();

    const links =
        document.querySelectorAll(
            "[data-page]"
        );

    links.forEach(link => {

        const page =
            link.getAttribute("data-page");

        if (
            pages[page] === currentPage
        ) {

            link.classList.add("active");

        } else {

            link.classList.remove("active");

        }

    });
}


// ========================================
// CONFIGURAR LINKS
// ========================================

function setupNavigation() {

    const links =
        document.querySelectorAll(
            "[data-page]"
        );

    links.forEach(link => {

        link.addEventListener(
            "click",
            function(event) {

                event.preventDefault();

                const page =
                    this.getAttribute(
                        "data-page"
                    );

                navigateTo(page);

            }
        );

    });

    setActiveMenu();
}


// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener(
    "DOMContentLoaded",
    setupNavigation
);
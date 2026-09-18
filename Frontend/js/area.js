const usuarioLogado = localStorage.getItem("usuario");

if (!usuarioLogado) {
    window.location.href = "index.html";
}

const dados = {
    projects: {
        title: "Projetos",
        description: "Acompanhe os ativos monitorados pela sua equipe.",
        action: "Nova análise",
        stats: [["Projetos analisados", "18"], ["Monitorados", "12"], ["Score médio", "88%"]],
        rows: [["API Financeira", "Java · Score de segurança 96%", "Seguro", "fa-code"], ["E-commerce AI", "JavaScript · Score de segurança 78%", "Atenção", "fa-cart-shopping"], ["Sistema Login", "Python · Score de segurança 52%", "Risco", "fa-user-shield"]]
    },
    reports: {
        title: "Relatórios",
        description: "Consulte os resultados e a evolução da segurança dos seus projetos.",
        action: "Nova análise",
        stats: [["Relatórios gerados", "24"], ["Este mês", "6"], ["Score médio", "88%"]],
        rows: [["Resumo executivo", "Atualizado hoje às 09:30", "PDF", "fa-file-lines"], ["E-commerce AI", "Última análise: 14/08/2026", "78%", "fa-chart-line"], ["API Financeira", "Última análise: 12/08/2026", "96%", "fa-chart-pie"]]
    },
    vulnerabilities: {
        title: "Vulnerabilidades",
        description: "Priorize os riscos identificados e acompanhe a correção de cada item.",
        action: "Nova análise",
        stats: [["Riscos abertos", "5"], ["Críticos", "1"], ["Resolvidos", "37"]],
        rows: [["Injeção de SQL", "Sistema Login · Criticidade alta", "Alta", "fa-triangle-exclamation"], ["Dependência desatualizada", "E-commerce AI · Criticidade média", "Média", "fa-cubes"], ["Chave exposta", "API de testes · Criticidade baixa", "Baixa", "fa-key"]]
    },
    settings: {
        title: "Configurações",
        description: "Gerencie as preferências da sua conta e as integrações da Check IA.",
        action: "Ir ao dashboard",
        actionHref: "dashboard.html",
        stats: [["Integrações", "2"], ["Membros", "4"], ["Notificações", "Ativas"]],
        rows: [["Perfil da conta", "Atualize seu nome, e-mail e função", "Editar", "fa-user"], ["Integrações", "GitHub e alertas de segurança", "Gerenciar", "fa-plug"], ["Notificações", "Resumo semanal e alertas críticos", "Configurar", "fa-bell"]]
    }
};

const view = new URLSearchParams(window.location.search).get("view");
const page = dados[view] || dados.projects;

document.title = `${page.title} | Check IA`;
document.getElementById("areaTitle").textContent = page.title;
document.getElementById("areaDescription").textContent = page.description;
document.getElementById("panelTitle").textContent = page.title;

const action = document.getElementById("areaAction");
action.innerHTML = `<i class="fa-solid fa-${page.actionHref ? "house" : "plus"}"></i> ${page.action}`;
action.href = page.actionHref || "analysis.html";

document.getElementById("areaSummary").innerHTML = page.stats.map(([label, value]) =>
    `<article class="area-stat"><span>${label}</span><strong>${value}</strong></article>`
).join("");

document.getElementById("areaList").innerHTML = page.rows.map(([title, detail, badge, icon]) =>
    `<article class="area-row"><i class="fa-solid ${icon}"></i><div><strong>${title}</strong><span>${detail}</span></div><b class="area-badge">${badge}</b></article>`
).join("");

document.querySelector(`[data-view="${view || "projects"}"]`)?.classList.add("active");

const usuario = document.getElementById("usuario");
if (usuarioLogado && usuario) {
    const nome = usuarioLogado.split("@")[0];
    usuario.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
}

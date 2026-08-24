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

const areaSummary = document.getElementById("areaSummary");
const areaList = document.getElementById("areaList");

areaSummary.innerHTML = page.stats.map(([label, value]) =>
    `<article class="area-stat"><span>${label}</span><strong>${value}</strong></article>`
).join("");

if (view === "settings") {
    const emailSalvo = localStorage.getItem("emailConta") || usuarioLogado;
    const nomeSalvo = localStorage.getItem("nomeConta") || usuarioLogado.split("@")[0];
    const funcaoSalva = localStorage.getItem("funcaoConta") || "Analista";
    const githubAtivo = localStorage.getItem("integracaoGithub") !== "false";
    const webhooksAtivos = localStorage.getItem("webhooksAtivos") === "true";
    const alertasAtivos = localStorage.getItem("alertasSeguranca") !== "false";
    const resumoAtivo = localStorage.getItem("resumoSemanal") !== "false";

    areaList.innerHTML = `
        <section class="settings-section">
            <div class="settings-section-heading">
                <div class="settings-icon"><i class="fa-solid fa-user"></i></div>
                <div><h3>Perfil da conta</h3><p>Atualize as informações usadas no seu acesso.</p></div>
            </div>
            <form class="settings-form" id="profileForm">
                <label>Nome<input name="nome" value="${nomeSalvo}" required></label>
                <label>E-mail<input name="email" type="email" value="${emailSalvo}" required></label>
                <label>Função<input name="funcao" value="${funcaoSalva}" required></label>
                <label>Nova senha<input name="senha" type="password" placeholder="Deixe em branco para manter"></label>
                <button class="area-action settings-save" type="submit"><i class="fa-solid fa-check"></i> Salvar perfil</button>
            </form>
        </section>
        <section class="settings-section">
            <div class="settings-section-heading">
                <div class="settings-icon"><i class="fa-solid fa-plug"></i></div>
                <div><h3>Integrações</h3><p>Controle os serviços conectados à sua conta.</p></div>
            </div>
            <label class="settings-toggle"><span><strong><i class="fa-brands fa-github"></i> GitHub</strong><small>Conectar repositórios para novas análises.</small></span><input id="githubToggle" type="checkbox" ${githubAtivo ? "checked" : ""}><span class="toggle-control"></span></label>
            <label class="settings-toggle"><span><strong><i class="fa-solid fa-code-branch"></i> Webhooks</strong><small>Receber eventos automáticos dos projetos.</small></span><input id="webhookToggle" type="checkbox" ${webhooksAtivos ? "checked" : ""}><span class="toggle-control"></span></label>
        </section>
        <section class="settings-section">
            <div class="settings-section-heading">
                <div class="settings-icon"><i class="fa-solid fa-bell"></i></div>
                <div><h3>Notificações</h3><p>Escolha quais atualizações deseja receber.</p></div>
            </div>
            <label class="settings-toggle"><span><strong>Alertas de segurança</strong><small>Avise quando um risco crítico for encontrado.</small></span><input id="alertsToggle" type="checkbox" ${alertasAtivos ? "checked" : ""}><span class="toggle-control"></span></label>
            <label class="settings-toggle"><span><strong>Resumo semanal</strong><small>Receba a evolução dos seus projetos por e-mail.</small></span><input id="summaryToggle" type="checkbox" ${resumoAtivo ? "checked" : ""}><span class="toggle-control"></span></label>
        </section>`;

    document.getElementById("profileForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const dadosPerfil = new FormData(event.currentTarget);
        localStorage.setItem("nomeConta", dadosPerfil.get("nome"));
        localStorage.setItem("emailConta", dadosPerfil.get("email"));
        localStorage.setItem("funcaoConta", dadosPerfil.get("funcao"));
        document.getElementById("usuario").textContent = dadosPerfil.get("nome");
        document.getElementById("usuario-header").textContent = dadosPerfil.get("nome");
        mostrarMensagem("Perfil atualizado com sucesso.", "#3FB950");
    });
    document.getElementById("githubToggle").addEventListener("change", (event) => localStorage.setItem("integracaoGithub", event.target.checked));
    document.getElementById("webhookToggle").addEventListener("change", (event) => localStorage.setItem("webhooksAtivos", event.target.checked));
    document.getElementById("alertsToggle").addEventListener("change", (event) => localStorage.setItem("alertasSeguranca", event.target.checked));
    document.getElementById("summaryToggle").addEventListener("change", (event) => localStorage.setItem("resumoSemanal", event.target.checked));
} else {
    const ultimaAnalise = JSON.parse(localStorage.getItem("ultimaAnalise") || "null");
    if (view === "vulnerabilities" && ultimaAnalise) {
        let analise = ultimaAnalise.analise_ia || "";
        analise = analise.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
        let vulnerabilidades = [];
        try { vulnerabilidades = JSON.parse(analise).vulnerabilidades || []; } catch (_) { /* Mantém o texto bruto para respostas fora do formato. */ }

        areaSummary.innerHTML = [
            ["Repositório analisado", ultimaAnalise.repo || "GitHub"],
            ["Riscos encontrados", String(vulnerabilidades.length)],
            ["Status", "Concluída"]
        ].map(([label, value]) => `<article class="area-stat"><span>${label}</span><strong>${value}</strong></article>`).join("");

        areaList.innerHTML = vulnerabilidades.length
            ? vulnerabilidades.map((item) => `<article class="area-row"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>${item.risco || "Ponto de atenção"}</strong><span>${item.arquivo || "Arquivo não informado"} · ${item.descricao || "Sem descrição disponível."}</span></div><b class="area-badge">${item.severidade || "Análise"}</b></article>`).join("")
            : `<article class="area-row"><i class="fa-solid fa-shield-check"></i><div><strong>Nenhum risco estruturado encontrado</strong><span>A resposta da IA não identificou vulnerabilidades no formato esperado.</span></div><b class="area-badge">Seguro</b></article>`;
    } else {
        areaList.innerHTML = page.rows.map(([title, detail, badge, icon]) =>
            `<article class="area-row"><i class="fa-solid ${icon}"></i><div><strong>${title}</strong><span>${detail}</span></div><b class="area-badge">${badge}</b></article>`
        ).join("");
    }
}

function mostrarMensagem(texto, cor) {
    const mensagem = document.createElement("div");
    mensagem.className = "area-message";
    mensagem.style.background = cor;
    mensagem.textContent = texto;
    document.body.appendChild(mensagem);
    setTimeout(() => mensagem.remove(), 2800);
}

document.querySelector(`[data-view="${view || "projects"}"]`)?.classList.add("active");

const usuario = document.getElementById("usuario");
if (usuarioLogado && usuario) {
    const nome = usuarioLogado.split("@")[0];
    const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1);
    usuario.textContent = nomeFormatado;
    document.getElementById("usuario-header").textContent = nomeFormatado;
}

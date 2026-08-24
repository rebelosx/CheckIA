const usuarioLogado = localStorage.getItem("usuario");

if (!usuarioLogado) {
    window.location.href = "index.html";
}

const dados = {
    projects: { title: "Projetos", description: "Acompanhe os repositórios analisados pela sua conta.", action: "Nova análise" },
    reports: { title: "Relatórios", description: "Consulte o histórico de análises e seus resultados.", action: "Nova análise" },
    vulnerabilities: { title: "Vulnerabilidades", description: "Priorize os riscos identificados nas suas análises.", action: "Nova análise" },
    settings: { title: "Configurações", description: "Gerencie as preferências da sua conta e as integrações da Check IA.", action: "Ir ao dashboard", actionHref: "dashboard.html" }
};

const view = new URLSearchParams(window.location.search).get("view");
const repositorioSelecionado = new URLSearchParams(window.location.search).get("repo");
const page = dados[view] || dados.projects;
const ultimaAnalise = JSON.parse(localStorage.getItem(`ultimaAnalise_${usuarioLogado}`) || "null");
const chaveHistorico = `historicoAnalises_${usuarioLogado}`;
const historicoSalvo = JSON.parse(localStorage.getItem(chaveHistorico) || "[]");
const analiseLegada = JSON.parse(localStorage.getItem("ultimaAnalise") || "null");
const registrosDisponiveis = [...historicoSalvo, ...(ultimaAnalise ? [ultimaAnalise] : []), ...(analiseLegada ? [analiseLegada] : [])];
const historico = registrosDisponiveis.filter((item, index, registros) => item && registros.findIndex((outro) => outro.repo === item.repo && outro.analise_ia === item.analise_ia) === index);
if (historico.length !== historicoSalvo.length) localStorage.setItem(chaveHistorico, JSON.stringify(historico));

function obterVulnerabilidades(resultado) {
    if (!resultado?.analise_ia) return [];
    const texto = resultado.analise_ia.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    try { return JSON.parse(texto).vulnerabilidades || []; } catch (_) { return []; }
}

function escaparHtml(valor) {
    return String(valor ?? "").replace(/[&<>'"]/g, (caractere) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
    }[caractere]));
}

const vulnerabilidades = obterVulnerabilidades(ultimaAnalise);

function dataFormatada(data) {
    return data ? new Date(data).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Data não informada";
}

document.title = page.title;
document.getElementById("areaTitle").textContent = page.title;
document.getElementById("areaDescription").textContent = page.description;
document.getElementById("panelTitle").textContent = page.title;

const action = document.getElementById("areaAction");
action.innerHTML = `<i class="fa-solid fa-${page.actionHref ? "house" : "plus"}"></i> ${page.action}`;
action.href = page.actionHref || "analysis.html";

const areaSummary = document.getElementById("areaSummary");
const areaList = document.getElementById("areaList");

if (view === "projects") {
    const projetos = [...new Map(historico.map((item) => [item.repo, item])).values()];
    areaSummary.innerHTML = [["Projetos analisados", projetos.length], ["Em monitoramento", projetos.length], ["Último status", ultimaAnalise ? "Concluída" : "Sem dados"]].map(([label, value]) => `<article class="area-stat"><span>${label}</span><strong>${escaparHtml(value)}</strong></article>`).join("");
    areaList.innerHTML = projetos.length ? projetos.map((item) => `<a class="area-row" href="area.html?view=reports&repo=${encodeURIComponent(item.repo)}"><i class="fa-brands fa-github"></i><div><strong>${escaparHtml(item.repo)}</strong><span>Última análise: ${dataFormatada(item.criada_em)}</span></div><b class="area-badge">Ver relatórios</b></a>`).join("") : `<article class="area-row"><i class="fa-solid fa-folder-open"></i><div><strong>Nenhum projeto analisado</strong><span>Conecte um repositório para começar.</span></div></article>`;
} else if (view === "reports") {
    const relatorios = repositorioSelecionado ? historico.filter((item) => item.repo === repositorioSelecionado) : historico;
    areaSummary.innerHTML = [["Relatórios gerados", relatorios.length], ["Com riscos", relatorios.filter((item) => obterVulnerabilidades(item).length > 0).length], ["Projeto", repositorioSelecionado || "Todos"]].map(([label, value]) => `<article class="area-stat"><span>${label}</span><strong>${escaparHtml(value)}</strong></article>`).join("");
    areaList.innerHTML = relatorios.length ? [...relatorios].reverse().map((item) => `<article class="area-row"><i class="fa-solid fa-file-lines"></i><div><strong>Relatório de ${escaparHtml(item.repo)}</strong><span>${dataFormatada(item.criada_em)} · ${obterVulnerabilidades(item).length} risco(s) encontrado(s)</span></div><b class="area-badge">Concluído</b></article>`).join("") : `<article class="area-row"><i class="fa-solid fa-file-circle-plus"></i><div><strong>Nenhum relatório gerado</strong><span>Os relatórios aparecerão após a primeira análise.</span></div></article>`;
} else {
    areaSummary.innerHTML = view === "settings" ? [["Integrações", localStorage.getItem(`integracaoGithub_${usuarioLogado}`) === "false" ? 0 : 1], ["Análises realizadas", historico.length], ["Notificações", localStorage.getItem(`alertasSeguranca_${usuarioLogado}`) === "false" ? "Inativas" : "Ativas"]].map(([label, value]) => `<article class="area-stat"><span>${label}</span><strong>${escaparHtml(value)}</strong></article>`).join("") : "";
}

if (view === "settings") {
    const emailSalvo = localStorage.getItem("emailConta") || usuarioLogado;
    const nomeSalvo = localStorage.getItem("nomeConta") || usuarioLogado.split("@")[0];
    const funcaoSalva = localStorage.getItem("funcaoConta") || "Analista";
    const chaveConta = `_${usuarioLogado}`;
    const githubAtivo = localStorage.getItem(`integracaoGithub${chaveConta}`) !== "false";
    const webhooksAtivos = localStorage.getItem(`webhooksAtivos${chaveConta}`) === "true";
    const alertasAtivos = localStorage.getItem(`alertasSeguranca${chaveConta}`) !== "false";
    const resumoAtivo = localStorage.getItem(`resumoSemanal${chaveConta}`) !== "false";

    areaList.innerHTML = `
        <section class="settings-section">
            <div class="settings-section-heading">
                <div class="settings-icon"><i class="fa-solid fa-user"></i></div>
                <div><h3>Perfil da conta</h3><p>Atualize as informações usadas no seu acesso.</p></div>
            </div>
            <div class="avatar-settings">
                <span class="profile-avatar" id="settingsAvatar">👤</span>
                <div class="avatar-controls">
                    <label for="avatarEmoji">Emoji do avatar</label>
                    <input id="avatarEmoji" type="text" maxlength="4" placeholder="Ex.: 🙂">
                    <label for="avatarColor">Cor do avatar</label>
                    <input id="avatarColor" class="avatar-color" type="color" value="#ffffff">
                    <label for="avatarUpload">Ou escolha uma imagem</label>
                    <input id="avatarUpload" type="file" accept="image/*">
                    <button id="resetAvatar" class="avatar-reset" type="button"><i class="fa-solid fa-rotate-left"></i> Voltar ao padrão</button>
                </div>
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
            <label class="settings-toggle"><span><strong>Tema claro</strong><small>Use uma aparência clara para o aplicativo.</small></span><input id="themeToggle" type="checkbox"><span class="toggle-control"></span></label>
        </section>`;

    document.getElementById("profileForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const dadosPerfil = new FormData(event.currentTarget);
        localStorage.setItem("nomeConta", dadosPerfil.get("nome"));
        localStorage.setItem("emailConta", dadosPerfil.get("email"));
        localStorage.setItem("funcaoConta", dadosPerfil.get("funcao"));
        document.getElementById("usuario").textContent = dadosPerfil.get("nome");
        mostrarMensagem("Perfil atualizado com sucesso.", "#3FB950");
    });
    document.getElementById("githubToggle").addEventListener("change", (event) => localStorage.setItem(`integracaoGithub${chaveConta}`, event.target.checked));
    document.getElementById("webhookToggle").addEventListener("change", (event) => localStorage.setItem(`webhooksAtivos${chaveConta}`, event.target.checked));
    document.getElementById("alertsToggle").addEventListener("change", (event) => localStorage.setItem(`alertasSeguranca${chaveConta}`, event.target.checked));
    document.getElementById("summaryToggle").addEventListener("change", (event) => localStorage.setItem(`resumoSemanal${chaveConta}`, event.target.checked));
} else {
    if (view === "vulnerabilities" && ultimaAnalise) {
        const repositorio = escaparHtml(ultimaAnalise.repo || "GitHub");
        const riscos = String(vulnerabilidades.length);
        areaSummary.innerHTML = [
            [view === "reports" ? "Relatório mais recente" : "Repositório analisado", repositorio],
            ["Riscos encontrados", riscos],
            ["Status", "Concluída"]
        ].map(([label, value]) => `<article class="area-stat"><span>${label}</span><strong>${value}</strong></article>`).join("");

        if (view === "vulnerabilities") {
            areaList.innerHTML = vulnerabilidades.length
                ? vulnerabilidades.map((item) => `<article class="area-row"><i class="fa-solid fa-triangle-exclamation"></i><div><strong>${escaparHtml(item.risco || "Ponto de atenção")}</strong><span>${escaparHtml(item.arquivo || "Arquivo não informado")} · ${escaparHtml(item.descricao || "Sem descrição disponível.")}</span></div><b class="area-badge">${escaparHtml(item.severidade || "Análise")}</b></article>`).join("")
                : `<article class="area-row"><i class="fa-solid fa-shield-check"></i><div><strong>Nenhum risco estruturado encontrado</strong><span>A resposta da IA não identificou vulnerabilidades no formato esperado.</span></div><b class="area-badge">Seguro</b></article>`;
        }
    } else if (view === "vulnerabilities") {
        areaList.innerHTML = `<article class="area-row"><i class="fa-solid fa-shield"></i><div><strong>Nenhuma análise disponível</strong><span>Faça uma análise para visualizar vulnerabilidades.</span></div></article>`;
    } else if (view !== "projects" && view !== "reports") {
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
    const nome = localStorage.getItem("nomeConta") || usuarioLogado.split("@")[0];
    const nomeFormatado = nome.charAt(0).toUpperCase() + nome.slice(1);
    usuario.textContent = nomeFormatado;
}

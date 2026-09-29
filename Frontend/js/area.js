let usuarioLogado = null;
let userId = null;

const severidadeIcones = {
  Alta: { icon: "fa-triangle-exclamation", color: "#ef4444" },
  Média: { icon: "fa-cubes", color: "#f59e0b" },
  Baixa: { icon: "fa-key", color: "#3b82f6" },
};

async function iniciarPagina() {
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  userId = sessionData.session.user.id;
  usuarioLogado = sessionData.session.user.email;
  const nomeMeta = sessionData.session.user.user_metadata?.nome;

  const view = new URLSearchParams(window.location.search).get("view") || "vulnerabilities";

  const titulos = {
    vulnerabilities: {
      title: "Vulnerabilidades",
      description: "Priorize os riscos identificados no seu código e acompanhe a correção de cada item.",
    },
    reports: {
      title: "Relatórios",
      description: "Consulte o histórico de análises de segurança efetuadas na sua conta.",
    },
    projects: {
      title: "Projetos",
      description: "Acompanhe a lista de escaneamentos realizados.",
    },
  };

  const pageInfo = titulos[view] || titulos.vulnerabilities;

  document.title = `${pageInfo.title} | Check IA`;
  document.getElementById("areaTitle").textContent = pageInfo.title;
  document.getElementById("areaDescription").textContent = pageInfo.description;
  document.getElementById("panelTitle").textContent = pageInfo.title;

  document.querySelectorAll("[data-view]").forEach((el) => el.classList.remove("active"));
  document.querySelector(`[data-view="${view}"]`)?.classList.add("active");

  const usuario = document.getElementById("usuario");
  if (usuario) {
    let nome = nomeMeta || usuarioLogado.split("@")[0];
    usuario.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  if (view === "vulnerabilities") {
    await carregarVulnerabilidadesReais();
  } else if (view === "reports" || view === "projects") {
    await carregarRelatoriosReais();
  }
}

// Carregar Vulnerabilidades com Origem, Data e Trecho/Linha
async function carregarVulnerabilidadesReais() {
  const { data: vulns, error } = await supabase
    .from("vulnerabilidades")
    .select("*, analises(origem)")
    .eq("user_id", userId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao carregar vulnerabilidades:", error);
    return;
  }

  const actionContainer = document.getElementById("areaAction")?.parentElement;
  if (actionContainer) {
    actionContainer.innerHTML = `
      <div style="display: flex; gap: 10px;">
        ${vulns && vulns.length > 0 ? `
          <button onclick="zerarHistoricoCompleto()" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
            <i class="fa-solid fa-trash-can"></i> Zerar histórico
          </button>
        ` : ""}
        <a href="analysis.html" class="btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #3b82f6; color: white; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">
          <i class="fa-solid fa-plus"></i> Nova análise
        </a>
      </div>
    `;
  }

  const abertas = vulns ? vulns.filter((v) => v.status === "Aberta").length : 0;
  const criticas = vulns ? vulns.filter((v) => v.severidade === "Alta" && v.status === "Aberta").length : 0;
  const resolvidas = vulns ? vulns.filter((v) => v.status === "Resolvida").length : 0;

  document.getElementById("areaSummary").innerHTML = `
    <article class="area-stat"><span>Riscos abertos</span><strong>${abertas}</strong></article>
    <article class="area-stat"><span>Críticos</span><strong>${criticas}</strong></article>
    <article class="area-stat"><span>Resolvidos</span><strong>${resolvidas}</strong></article>
  `;

  const containerLista = document.getElementById("areaList");

  if (!vulns || vulns.length === 0) {
    containerLista.innerHTML = `
      <div style="padding: 3rem 1rem; text-align: center; color: #9ca3af;">
        <p>Nenhum registro encontrado. Seu histórico está limpo!</p>
        <a href="analysis.html" style="color: #3b82f6; text-decoration: none; font-weight: bold; margin-top: 8px; display: inline-block;">Fazer nova análise →</a>
      </div>`;
    return;
  }

  containerLista.innerHTML = vulns
    .map((v) => {
      const conf = severidadeIcones[v.severidade] || severidadeIcones["Média"];
      const isResolvida = v.status === "Resolvida";
      const origemNome = v.analises?.origem || "Código colado";

      const dataFormatada = new Date(v.criado_em).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
      <article class="area-row" style="opacity: ${isResolvida ? "0.6" : "1"}; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <i class="fa-solid ${conf.icon}" style="color: ${conf.color}; font-size: 1.2rem;"></i>
        <div style="flex: 1; padding: 0 12px;">
          <div style="display: flex; align-items: center; gap: 8px;">
            <strong>${v.titulo} ${isResolvida ? "(Resolvida)" : ""}</strong>
            <span style="font-size: 0.75rem; color: #60a5fa; background: rgba(59, 130, 246, 0.1); padding: 2px 6px; border-radius: 4px;">
              📂 ${origemNome}
            </span>
          </div>
          <span style="display: block; margin-top: 4px; font-size: 0.85rem; color: #9ca3af;">
            <strong>Linha/Trecho:</strong> <code>${v.linha || "N/A"}</code> | <strong>Categoria:</strong> ${v.categoria || "N/A"}
          </span>
          <span style="display: block; margin-top: 4px; color: #d1d5db; font-size: 0.85rem;">
            ${v.descricao || ""}
          </span>
          ${
            v.recomendacao
              ? `<div style="margin-top: 6px; padding: 6px 10px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; font-size: 0.8rem; color: #93c5fd;">
                  <strong>Recomendação:</strong> ${v.recomendacao}
                </div>`
              : ""
          }
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <b class="area-badge" style="background: ${conf.color}22; color: ${conf.color}; border: 1px solid ${conf.color}55; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">
            ${v.severidade}
          </b>
          <span style="font-size: 0.75rem; color: #6b7280;">
            🕒 ${dataFormatada}
          </span>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            ${
              !isResolvida
                ? `<button onclick="marcarComoResolvida('${v.id}')" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
                     Resolver
                   </button>`
                : `<span style="font-size: 0.75rem; color: #10b981;">✓ Concluída</span>`
            }
            <button onclick="excluirVulnerabilidade('${v.id}')" title="Excluir este registro" style="background: transparent; color: #6b7280; border: none; cursor: pointer; padding: 2px 4px; font-size: 0.85rem;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#6b7280'">
              <i class="fa-solid fa-trash-can"></i>
            </button>
          </div>
        </div>
      </article>
    `;
    })
    .join("");
}

async function marcarComoResolvida(vulnId) {
  const { error } = await supabase
    .from("vulnerabilidades")
    .update({ status: "Resolvida" })
    .eq("id", vulnId);

  if (error) {
    alert("Erro ao atualizar status.");
  } else {
    carregarVulnerabilidadesReais();
  }
}

async function excluirVulnerabilidade(vulnId) {
  if (!confirm("Excluir este registro?")) return;

  const { error } = await supabase
    .from("vulnerabilidades")
    .delete()
    .eq("id", vulnId)
    .eq("user_id", userId);

  if (error) {
    alert("Erro ao excluir.");
  } else {
    carregarVulnerabilidadesReais();
  }
}

async function zerarHistoricoCompleto() {
  if (!confirm("Atenção: Isso apagar todas as análises e vulnerabilidades gravadas permanentemente. Deseja continuar?")) return;

  const { error } = await supabase
    .from("analises")
    .delete()
    .eq("user_id", userId);

  if (error) {
    alert("Erro ao zerar histórico.");
  } else {
    carregarVulnerabilidadesReais();
  }
}

async function carregarRelatoriosReais() {
  const { data: analises, error } = await supabase
    .from("analises")
    .select("*")
    .eq("user_id", userId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao carregar relatórios:", error);
    return;
  }

  const total = analises.length;
  const scoreMedio = total > 0 ? Math.round(analises.reduce((acc, a) => acc + a.score, 0) / total) : 0;

  document.getElementById("areaSummary").innerHTML = `
    <article class="area-stat"><span>Análises efetuadas</span><strong>${total}</strong></article>
    <article class="area-stat"><span>Score médio</span><strong>${scoreMedio}%</strong></article>
  `;

  const containerLista = document.getElementById("areaList");

  if (!analises || analises.length === 0) {
    containerLista.innerHTML = `<div style="padding: 2rem; text-align: center; color: #9ca3af;">Nenhum relatório encontrado.</div>`;
    return;
  }

  containerLista.innerHTML = analises
    .map((a) => {
      const dataFormatada = new Date(a.criado_em).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
      <article class="area-row">
        <i class="fa-solid fa-file-code" style="color: #3b82f6;"></i>
        <div style="flex: 1;">
          <strong>${a.origem || "Código manual"} (${a.linguagem_detectada})</strong>
          <span>${a.resumo}</span>
          <span style="font-size: 0.75rem; color: #6b7280; display: block; margin-top: 2px;">Realizada em ${dataFormatada}</span>
        </div>
        <b class="area-badge" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa;">
          Score: ${a.score}%
        </b>
      </article>
    `;
    })
    .join("");
}

iniciarPagina();
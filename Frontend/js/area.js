import { supabase } from './supabaseClient.js';

let usuarioLogado = null;
let userId = null;

const severidadeIcones = {
  Alta: { icon: "fa-triangle-exclamation", color: "#ef4444" },
  Média: { icon: "fa-cubes", color: "#f59e0b" },
  Baixa: { icon: "fa-key", color: "#3b82f6" },
};

async function iniciarPagina() {
  // 1. Verifica sessão no Supabase Auth
  const { data: sessionData } = await supabase.auth.getSession();

  if (!sessionData || !sessionData.session) {
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
      description: "Acompanhe a lista de ativos e escaneamentos realizados.",
    },
    settings: {
      title: "Configurações",
      description: "Gerencie as preferências da sua conta, informações de perfil e altere sua senha.",
    },
  };

  const pageInfo = titulos[view] || titulos.vulnerabilities;

  document.title = `${pageInfo.title} | Check IA`;
  const elTitle = document.getElementById("areaTitle");
  const elDesc = document.getElementById("areaDescription");
  const elPanel = document.getElementById("panelTitle");

  if (elTitle) elTitle.textContent = pageInfo.title;
  if (elDesc) elDesc.textContent = pageInfo.description;
  if (elPanel) elPanel.textContent = pageInfo.title;

  document.querySelectorAll("[data-view]").forEach((el) => el.classList.remove("active"));
  document.querySelector(`[data-view="${view}"]`)?.classList.add("active");

  const usuario = document.getElementById("usuario");
  if (usuario) {
    let nome = nomeMeta || usuarioLogado.split("@")[0];
    usuario.textContent = nome.charAt(0).toUpperCase() + nome.slice(1);
  }

  // 2. Roteamento de telas
  if (view === "vulnerabilities") {
    await carregarVulnerabilidadesReais();
  } else if (view === "reports" || view === "projects") {
    await carregarRelatoriosReais();
  } else if (view === "settings") {
    carregarTelaConfiguracoes(nomeMeta || usuarioLogado.split("@")[0]);
  }
}

// ---------------------------------------------------------
// TELA DE CONFIGURAÇÕES (PERFIL + TROCA DE SENHA)
// ---------------------------------------------------------
function carregarTelaConfiguracoes(nomeAtual) {
  const actionContainer = document.getElementById("areaAction")?.parentElement;
  if (actionContainer) actionContainer.innerHTML = "";

  const areaSummary = document.getElementById("areaSummary");
  if (areaSummary) areaSummary.innerHTML = "";

  const containerLista = document.getElementById("areaList");
  if (!containerLista) return;

  containerLista.innerHTML = `
    <div class="settings-container" style="display: flex; flex-direction: column; gap: 1.5rem; max-width: 680px; margin-top: 1rem;">
      
      <!-- PERFIL DO USUÁRIO -->
      <div class="settings-card" style="background: rgba(18, 24, 36, 0.85); border: 1px solid rgba(148, 163, 184, 0.12); border-radius: 12px; padding: 1.5rem;">
        <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-user-gear" style="color: #3b82f6;"></i> Perfil do Usuário
        </h3>
        <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.2rem;">Atualize as informações exibidas na sua conta.</p>
        
        <form id="formPerfil" onsubmit="atualizarPerfil(event)" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Nome de Exibição</label>
            <input type="text" id="nomeUsuario" value="${nomeAtual}" placeholder="Seu nome" required style="background: #080b12; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 0.9rem;" />
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">E-mail (somente leitura)</label>
            <input type="email" id="emailUsuario" value="${usuarioLogado}" disabled style="background: #080b12; border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 8px; padding: 10px 12px; color: #64748b; font-size: 0.9rem; cursor: not-allowed;" />
          </div>

          <button type="submit" style="align-self: flex-start; background: #3b82f6; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem; margin-top: 0.5rem;">
            <i class="fa-solid fa-floppy-disk"></i> Salvar Perfil
          </button>
        </form>
      </div>

      <!-- ALTERAÇÃO DE SENHA -->
      <div class="settings-card" style="background: rgba(18, 24, 36, 0.85); border: 1px solid rgba(148, 163, 184, 0.12); border-radius: 12px; padding: 1.5rem;">
        <h3 style="color: #fff; font-size: 1.1rem; margin-bottom: 0.4rem; display: flex; align-items: center; gap: 8px;">
          <i class="fa-solid fa-lock" style="color: #f59e0b;"></i> Alterar Senha
        </h3>
        <p style="color: #94a3b8; font-size: 0.85rem; margin-bottom: 1.2rem;">Digite uma nova senha com pelo menos 6 caracteres.</p>
        
        <form id="formSenha" onsubmit="alterarSenha(event)" style="display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Nova Senha</label>
            <input type="password" id="novaSenha" placeholder="••••••••" required minlength="6" style="background: #080b12; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 0.9rem;" />
          </div>

          <div style="display: flex; flex-direction: column; gap: 6px;">
            <label style="color: #cbd5e1; font-size: 0.85rem; font-weight: 600;">Confirmar Nova Senha</label>
            <input type="password" id="confirmarSenha" placeholder="••••••••" required minlength="6" style="background: #080b12; border: 1px solid rgba(148, 163, 184, 0.2); border-radius: 8px; padding: 10px 12px; color: #fff; font-size: 0.9rem;" />
          </div>

          <div id="msgSenha" style="font-size: 0.85rem; font-weight: 600; min-height: 20px;"></div>

          <button type="submit" style="align-self: flex-start; background: #6366f1; color: #fff; border: none; padding: 10px 18px; border-radius: 8px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; font-size: 0.85rem;">
            <i class="fa-solid fa-key"></i> Atualizar Senha
          </button>
        </form>
      </div>

    </div>
  `;
}

window.atualizarPerfil = async function (e) {
  e.preventDefault();
  const novoNome = document.getElementById("nomeUsuario").value.trim();
  if (!novoNome) return;

  const { error } = await supabase.auth.updateUser({ data: { nome: novoNome } });
  if (error) {
    alert("Erro ao atualizar perfil: " + error.message);
  } else {
    alert("Perfil atualizado com sucesso!");
    location.reload();
  }
};

window.alterarSenha = async function (e) {
  e.preventDefault();
  const novaSenha = document.getElementById("novaSenha").value;
  const confirmarSenha = document.getElementById("confirmarSenha").value;
  const msgEl = document.getElementById("msgSenha");

  if (novaSenha !== confirmarSenha) {
    msgEl.style.color = "#ef4444";
    msgEl.textContent = "As senhas não coincidem. Tente novamente.";
    return;
  }

  msgEl.style.color = "#3b82f6";
  msgEl.textContent = "Processando atualização...";

  const { error } = await supabase.auth.updateUser({ password: novaSenha });

  if (error) {
    msgEl.style.color = "#ef4444";
    msgEl.textContent = "Erro ao alterar senha: " + error.message;
  } else {
    msgEl.style.color = "#10b981";
    msgEl.textContent = "✓ Senha alterada com sucesso!";
    document.getElementById("formSenha").reset();
  }
};

// ---------------------------------------------------------
// VULNERABILIDADES
// ---------------------------------------------------------
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

  const areaSummary = document.getElementById("areaSummary");
  if (areaSummary) {
    areaSummary.innerHTML = `
      <article class="area-stat"><span>Riscos abertos</span><strong>${abertas}</strong></article>
      <article class="area-stat"><span>Críticos</span><strong style="color: #ef4444;">${criticas}</strong></article>
      <article class="area-stat"><span>Resolvidos</span><strong style="color: #10b981;">${resolvidas}</strong></article>
    `;
  }

  const containerLista = document.getElementById("areaList");
  if (!containerLista) return;

  if (!vulns || vulns.length === 0) {
    containerLista.innerHTML = `
      <div style="padding: 3rem 1rem; text-align: center; color: #9ca3af;">
        <p>Nenhuma vulnerabilidade encontrada. Seu histórico está limpo!</p>
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
      <article class="area-row" style="opacity: ${isResolvida ? "0.6" : "1"}; padding: 12px 16px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: flex-start; gap: 12px; flex: 1;">
          <i class="fa-solid ${conf.icon}" style="color: ${conf.color}; font-size: 1.2rem; margin-top: 4px;"></i>
          <div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <strong>${v.titulo} ${isResolvida ? "(Resolvida)" : ""}</strong>
              <span style="font-size: 0.75rem; color: #60a5fa; background: rgba(59, 130, 246, 0.1); padding: 2px 6px; border-radius: 4px;">📂 ${origemNome}</span>
            </div>
            <span style="display: block; margin-top: 4px; font-size: 0.85rem; color: #9ca3af;">
              <strong>Linha/Trecho:</strong> <code>${v.linha || "N/A"}</code> | <strong>Categoria:</strong> ${v.categoria || "N/A"}
            </span>
            <span style="display: block; margin-top: 4px; color: #d1d5db; font-size: 0.85rem;">${v.descricao || ""}</span>
            ${v.recomendacao ? `<div style="margin-top: 6px; padding: 6px 10px; background: rgba(59, 130, 246, 0.1); border-left: 3px solid #3b82f6; font-size: 0.8rem; color: #93c5fd;"><strong>Recomendação:</strong> ${v.recomendacao}</div>` : ""}
          </div>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 6px;">
          <b class="area-badge" style="background: ${conf.color}22; color: ${conf.color}; border: 1px solid ${conf.color}55; padding: 2px 8px; border-radius: 4px; font-size: 0.75rem;">${v.severidade}</b>
          <span style="font-size: 0.75rem; color: #6b7280;">🕒 ${dataFormatada}</span>
          <div style="display: flex; gap: 6px; margin-top: 4px;">
            ${!isResolvida ? `<button onclick="marcarComoResolvida('${v.id}')" style="background: #10b981; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">Resolver</button>` : `<span style="font-size: 0.75rem; color: #10b981;">✓ Concluída</span>`}
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

window.marcarComoResolvida = async function (vulnId) {
  const { error } = await supabase.from("vulnerabilidades").update({ status: "Resolvida" }).eq("id", vulnId);
  if (!error) carregarVulnerabilidadesReais();
};

window.excluirVulnerabilidade = async function (vulnId) {
  if (!confirm("Excluir este registro?")) return;
  const { error } = await supabase.from("vulnerabilidades").delete().eq("id", vulnId).eq("user_id", userId);
  if (!error) carregarVulnerabilidadesReais();
};

window.zerarHistoricoCompleto = async function () {
  if (!confirm("Atenção: Isso apagará todas as análises e vulnerabilidades gravadas permanentemente. Deseja continuar?")) return;
  const { error } = await supabase.from("analises").delete().eq("user_id", userId);
  if (!error) iniciarPagina();
};

// ---------------------------------------------------------
// RELATÓRIOS E PROJETOS
// ---------------------------------------------------------
async function carregarRelatoriosReais() {
  const { data: analises, error } = await supabase
    .from("analises")
    .select("*")
    .eq("user_id", userId)
    .order("criado_em", { ascending: false });

  if (error) {
    console.error("Erro ao carregar relatórios/projetos:", error);
    return;
  }

  const actionContainer = document.getElementById("areaAction")?.parentElement;
  if (actionContainer) {
    actionContainer.innerHTML = `
      <div style="display: flex; gap: 10px;">
        ${analises && analises.length > 0 ? `
          <button onclick="zerarHistoricoCompleto()" style="background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid rgba(239, 68, 68, 0.3); padding: 8px 14px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
            <i class="fa-solid fa-trash-can"></i> Limpar histórico
          </button>
        ` : ""}
        <a href="analysis.html" class="btn-primary" style="text-decoration: none; display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; background: #3b82f6; color: white; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">
          <i class="fa-solid fa-plus"></i> Nova análise
        </a>
      </div>
    `;
  }

  const total = analises ? analises.length : 0;
  const scoreMedio = total > 0 ? Math.round(analises.reduce((acc, a) => acc + (a.score || 0), 0) / total) : 0;

  const areaSummary = document.getElementById("areaSummary");
  if (areaSummary) {
    areaSummary.innerHTML = `
      <article class="area-stat"><span>Análises efetuadas</span><strong>${total}</strong></article>
      <article class="area-stat"><span>Score médio</span><strong>${scoreMedio}%</strong></article>
    `;
  }

  const containerLista = document.getElementById("areaList");
  if (!containerLista) return;

  if (!analises || analises.length === 0) {
    containerLista.innerHTML = `
      <div style="padding: 3rem 1rem; text-align: center; color: #9ca3af;">
        <p>Nenhum projeto ou análise encontrado. Seu histórico está limpo!</p>
        <a href="analysis.html" style="color: #3b82f6; text-decoration: none; font-weight: bold; margin-top: 8px; display: inline-block;">Fazer nova análise →</a>
      </div>`;
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
      <article class="area-row" style="display: flex; align-items: center; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
          <i class="fa-solid fa-file-code" style="color: #3b82f6; font-size: 1.2rem;"></i>
          <div>
            <strong style="color: #f8fafc; font-size: 0.95rem;">${a.origem || "Código manual"} <small style="color: #64748b; font-weight: normal;">(${a.linguagem_detectada || "geral"})</small></strong>
            <span style="display: block; color: #94a3b8; font-size: 0.85rem; margin-top: 2px;">${a.resumo || "Análise concluída."}</span>
            <span style="font-size: 0.75rem; color: #64748b; display: block; margin-top: 4px;">Realizada em ${dataFormatada}</span>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 12px;">
          <b class="area-badge" style="background: rgba(59, 130, 246, 0.15); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.3); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem;">
            Score: ${a.score}%
          </b>
          <button onclick="excluirAnalise('${a.id}')" title="Excluir este relatório" style="background: transparent; color: #64748b; border: none; cursor: pointer; padding: 4px 6px; font-size: 0.9rem;" onmouseover="this.style.color='#ef4444'" onmouseout="this.style.color='#64748b'">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </article>
    `;
    })
    .join("");
}

window.excluirAnalise = async function (analiseId) {
  if (!confirm("Deseja excluir esta análise?")) return;
  const { error } = await supabase.from("analises").delete().eq("id", analiseId).eq("user_id", userId);
  if (!error) carregarRelatoriosReais();
};

iniciarPagina();
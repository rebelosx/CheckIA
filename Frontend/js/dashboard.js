let usuarioLogado = null;
let userId = null;
let chartInstancia = null;

async function iniciarSessao() {
  // 1. Verifica autenticação e captura o usuário ativo
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData || !sessionData.session) {
    window.location.href = "index.html";
    return;
  }

  const user = sessionData.session.user;
  userId = user.id;
  usuarioLogado = user.email;
  const nomeMeta = user.user_metadata?.nome;

  const usuarioElemento = document.getElementById("usuario");
  if (usuarioElemento) {
    let nomeUsuario = nomeMeta || usuarioLogado.split("@")[0];
    nomeUsuario = nomeUsuario.charAt(0).toUpperCase() + nomeUsuario.slice(1);
    usuarioElemento.textContent = nomeUsuario;
  }

  // 2. Carrega todas as informações do Supabase
  await carregarEstatisticasDashboard();
  await carregarGraficoEvolucao();
  await carregarTabelaProjetos();
}

// =========================================================
// CARREGA OS CARDS DO TOPO (SCORE, PROJETOS, VULNS, ÚLTIMA ANÁLISE)
// =========================================================
async function carregarEstatisticasDashboard() {
  // A. Busca histórico de análises
  const { data: analises, error: errAnalises } = await supabase
    .from("analises")
    .select("*")
    .eq("user_id", userId)
    .order("criado_em", { ascending: false });

  // B. Busca vulnerabilidades abertas
  const { data: vulns, error: errVulns } = await supabase
    .from("vulnerabilidades")
    .select("id")
    .eq("user_id", userId)
    .eq("status", "Aberta");

  const cards = document.querySelectorAll(".security-card h3");
  if (cards.length < 4) return;

  // 1. Score Médio de Segurança
  if (analises && analises.length > 0) {
    const analisesValidas = analises.filter(a => a.status_execucao !== "Erro");
    const scoreMedio = analisesValidas.length > 0 
      ? Math.round(analisesValidas.reduce((acc, a) => acc + a.score, 0) / analisesValidas.length) 
      : 0;
    cards[0].textContent = `${scoreMedio}%`;
  } else {
    cards[0].textContent = "0%";
  }

  // 2. Total de Projetos / Análises
  const totalAnálises = analises ? analises.length : 0;
  cards[1].textContent = totalAnálises < 10 && totalAnálises > 0 ? `0${totalAnálises}` : totalAnálises;

  // 3. Vulnerabilidades Abertas
  const totalVulns = vulns ? vulns.length : 0;
  cards[2].textContent = totalVulns < 10 && totalVulns > 0 ? `0${totalVulns}` : totalVulns;

  // 4. Data da Última Análise
  if (analises && analises.length > 0) {
    const ultimaData = new Date(analises[0].criado_em);
    const hoje = new Date();
    
    if (ultimaData.toDateString() === hoje.toDateString()) {
      cards[3].textContent = "Hoje";
    } else {
      cards[3].textContent = ultimaData.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
    }
  } else {
    cards[3].textContent = "--";
  }
}

// =========================================================
// RENDERIZA O GRÁFICO DINÂMICO DE EVOLUÇÃO
// =========================================================
async function carregarGraficoEvolucao() {
  const canvas = document.getElementById("chartEvolucao");
  if (!canvas) return;

  const { data: analises, error } = await supabase
    .from("analises")
    .select("score, criado_em")
    .eq("user_id", userId)
    .order("criado_em", { ascending: true })
    .limit(7);

  if (error || !analises || analises.length === 0) {
    return;
  }

  const labels = analises.map(a => 
    new Date(a.criado_em).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
  );
  const scores = analises.map(a => a.score);

  const ctx = canvas.getContext("2d");

  // Gradiente em tons de Azul e Roxo (Design System Check IA)
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "#8b5cf6");
  gradient.addColorStop(1, "#6366f1");

  if (chartInstancia) {
    chartInstancia.destroy();
  }

  chartInstancia = new Chart(ctx, {
    type: "bar",
    data: {
      labels: labels,
      datasets: [{
        label: "Score (%)",
        data: scores,
        backgroundColor: gradient,
        borderRadius: 8,
        borderSkipped: false,
        barThickness: 28
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#121824",
          titleColor: "#f8fafc",
          bodyColor: "#34d399",
          borderColor: "rgba(148, 163, 184, 0.12)",
          borderWidth: 1
        }
      },
      scales: {
        y: {
          min: 0,
          max: 100,
          grid: { color: "rgba(148, 163, 184, 0.08)" },
          ticks: { color: "#64748b", font: { family: "Inter" } }
        },
        x: {
          grid: { display: false },
          ticks: { color: "#94a3b8", font: { family: "Inter" } }
        }
      }
    }
  });
}

// =========================================================
// CARREGA A TABELA DE PROJETOS ANALISADOS
// =========================================================
async function carregarTabelaProjetos() {
  const tabelaBody = document.querySelector("tbody");
  if (!tabelaBody) return;

  const { data: analises, error } = await supabase
    .from("analises")
    .select("*")
    .eq("user_id", userId)
    .order("criado_em", { ascending: false })
    .limit(5);

  if (error || !analises || analises.length === 0) {
    tabelaBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 20px;">Nenhum projeto analisado ainda.</td></tr>`;
    return;
  }

  tabelaBody.innerHTML = analises.map(a => {
    let statusClass = "safe";
    let statusTexto = "Seguro";

    if (a.score < 60) {
      statusClass = "danger-text";
      statusTexto = "Risco";
    } else if (a.score < 80) {
      statusClass = "warning";
      statusTexto = "Atenção";
    }

    return `
      <tr>
        <td><strong>${a.origem || "Código Manual"}</strong></td>
        <td>${a.linguagem_detectada || "Desconhecida"}</td>
        <td>${a.score}%</td>
        <td class="${statusClass}">${statusTexto}</td>
      </tr>
    `;
  }).join("");
}

// Pesquisa dinâmica na tabela
const campoPesquisa = document.querySelector(".search input");
if (campoPesquisa) {
  campoPesquisa.addEventListener("input", function () {
    const pesquisa = this.value.toLowerCase().trim();
    const linhas = document.querySelectorAll("tbody tr");
    linhas.forEach(function (linha) {
      const texto = linha.textContent.toLowerCase();
      linha.style.display = texto.includes(pesquisa) ? "" : "none";
    });
  });
}

// Inicializa a sessão ao carregar a página
iniciarSessao();
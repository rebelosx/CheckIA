const BACKEND_URL = "http://127.0.0.1:8000";

let currentUserId = null;

/* Validação de Sessão Supabase */
supabase.auth.getSession().then(({ data }) => {
  if (!data.session) {
    window.location.href = "index.html";
  } else {
    currentUserId = data.session.user.id;
  }
});

const percentage = document.getElementById("percentage");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const steps = [...document.querySelectorAll(".scan-step")];
const filesCount = document.getElementById("filesCount");
const checksCount = document.getElementById("checksCount");
const risksCount = document.getElementById("risksCount");
const timer = document.getElementById("timer");
const aiMessage = document.getElementById("aiMessage");

if (filesCount) filesCount.textContent = "0";
if (checksCount) checksCount.textContent = "0";
if (risksCount) risksCount.textContent = "0";

let segundos = 0;
const intervaloTimer = setInterval(() => {
  segundos += 1;
  const mm = String(Math.floor(segundos / 60)).padStart(2, "0");
  const ss = String(segundos % 60).padStart(2, "0");
  if (timer) timer.textContent = `${mm}:${ss}`;
}, 1000);

const mensagens = [
  "Mapeando a estrutura do projeto...",
  "Enviando código para análise...",
  "Aguardando resposta da IA...",
  "Correlacionando riscos com o OWASP Top 10...",
  "Gerando o resumo inteligente da análise...",
];

function updateStep(index, completed) {
  const step = steps[index];
  if (!step) return;
  step.classList.toggle("active", !completed);
  step.classList.toggle("completed", completed);
  const status = step.querySelector(".step-status");
  if (status) {
    status.innerHTML = completed
      ? '<i class="fa-solid fa-check"></i>'
      : '<i class="fa-solid fa-circle-notch fa-spin"></i>';
  }
}

let progresso = 0;
const intervaloVisual = setInterval(() => {
  if (progresso < 90) progresso += 1;

  const stepIndex = Math.min(
    Math.floor(progresso / (100 / Math.max(steps.length, 1))),
    Math.max(steps.length - 1, 0)
  );
  
  steps.forEach((_, index) => updateStep(index, index < stepIndex));
  if (steps.length > 0) updateStep(stepIndex, false);

  if (percentage) percentage.textContent = `${progresso}%`;
  if (progressText) progressText.textContent = `${progresso}%`;
  if (progressFill) progressFill.style.width = `${progresso}%`;
  if (aiMessage) {
    aiMessage.textContent =
      mensagens[Math.min(Math.floor(progresso / 20), mensagens.length - 1)];
  }
}, 150);

function finalizarComSucesso(resultado) {
  clearInterval(intervaloVisual);
  clearInterval(intervaloTimer);

  steps.forEach((_, index) => updateStep(index, true));
  if (percentage) percentage.textContent = "100%";
  if (progressText) progressText.textContent = "100%";
  if (progressFill) progressFill.style.width = "100%";

  if (filesCount) filesCount.textContent = resultado.arquivos_analisados ?? 1;
  if (checksCount) checksCount.textContent = "8";
  if (risksCount) risksCount.textContent = resultado.vulnerabilidades?.length ?? 0;

  if (aiMessage) {
    aiMessage.textContent =
      resultado.resumo || "Análise concluída. Os resultados já estão disponíveis.";
  }

  const statusEl = document.querySelector(".scanner-status");
  if (statusEl) statusEl.innerHTML = '<span class="status-dot"></span> ANÁLISE CONCLUÍDA';

  sessionStorage.setItem("ultimoResultadoAnalise", JSON.stringify(resultado));

  if (!document.querySelector(".scan-result-link")) {
    const resultLink = document.createElement("a");
    resultLink.className = "scan-result-link";
    resultLink.href = "area.html?view=vulnerabilities";
    resultLink.innerHTML = '<i class="fa-solid fa-chart-line"></i> Ver resultados';
    document.querySelector(".scanner-main")?.appendChild(resultLink);
  }
}

function finalizarComErro(mensagemErro) {
  clearInterval(intervaloVisual);
  clearInterval(intervaloTimer);

  if (aiMessage) aiMessage.textContent = `Erro na análise: ${mensagemErro}`;

  const statusEl = document.querySelector(".scanner-status");
  if (statusEl) {
    statusEl.innerHTML =
      '<span class="status-dot" style="background:#F85149; box-shadow:0 0 12px #F85149;"></span> ERRO NA ANÁLISE';
  }
}

async function executarAnalise() {
  const tipo = localStorage.getItem("tipoAnalise");

  if (!currentUserId) {
    const { data } = await supabase.auth.getSession();
    currentUserId = data.session?.user?.id || null;
  }

  try {
    let resposta;

    if (tipo === "Código") {
      const codigo = sessionStorage.getItem("codigoAnalise") || "";
      if (!codigo.trim()) throw new Error("Nenhum código foi enviado para análise.");

      const form = new FormData();
      form.append("codigo", codigo);
      if (currentUserId) form.append("user_id", currentUserId);

      resposta = await fetch(`${BACKEND_URL}/analyze/code`, {
        method: "POST",
        body: form,
      });

    } else if (tipo === "ZIP") {
      const base64 = sessionStorage.getItem("arquivoAnaliseBase64");
      const nome = sessionStorage.getItem("arquivoAnaliseNome") || "projeto.zip";
      if (!base64) throw new Error("Nenhum arquivo ZIP foi enviado.");

      const blob = await (await fetch(base64)).blob();
      const form = new FormData();
      form.append("arquivo", blob, nome);
      if (currentUserId) form.append("user_id", currentUserId);

      resposta = await fetch(`${BACKEND_URL}/analyze/zip`, {
        method: "POST",
        body: form,
      });

    } else if (tipo === "GitHub") {
      const repoFullName = localStorage.getItem("origemAnalise") || "";
      const branch = localStorage.getItem("repositorioBranch") || "main";

      const form = new FormData();
      form.append("repo_full_name", repoFullName);
      form.append("branch", branch);
      if (currentUserId) form.append("user_id", currentUserId);

      resposta = await fetch(`${BACKEND_URL}/analyze/github`, {
        method: "POST",
        body: form,
        credentials: "include",
      });

    } else {
      throw new Error("Tipo de análise não reconhecido.");
    }

    if (!resposta.ok) {
      let detalhe = "";
      try {
        detalhe = (await resposta.json()).detail;
      } catch {}
      throw new Error(detalhe || `O servidor respondeu com status ${resposta.status}`);
    }

    const resultado = await resposta.json();
    finalizarComSucesso(resultado);

  } catch (erro) {
    console.error("Erro ao analisar:", erro);
    finalizarComErro(erro.message);
  }
}

executarAnalise();
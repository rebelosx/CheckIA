const usuario = localStorage.getItem("usuario");

if (!usuario) {
    window.location.href = "index.html";
}

const percentage = document.getElementById("percentage");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");
const steps = [...document.querySelectorAll(".scan-step")];
const filesCount = document.getElementById("filesCount");
const checksCount = document.getElementById("checksCount");
const risksCount = document.getElementById("risksCount");
const timer = document.getElementById("timer");
const aiMessage = document.getElementById("aiMessage");
let progress = 0;
let seconds = 0;

const messages = [
    "Mapeando a estrutura do projeto...",
    "Verificando dependências e configurações...",
    "Procurando credenciais e secrets expostos...",
    "Correlacionando riscos com o OWASP Top 10...",
    "Gerando o resumo inteligente da análise..."
];

function updateStep(index, completed) {
    const step = steps[index];
    if (!step) return;
    step.classList.toggle("active", !completed);
    step.classList.toggle("completed", completed);
    const status = step.querySelector(".step-status");
    status.innerHTML = completed
        ? '<i class="fa-solid fa-check"></i>'
        : '<i class="fa-solid fa-circle-notch fa-spin"></i>';
}

const progressInterval = setInterval(() => {
    progress += 1;
    const stepIndex = Math.min(Math.floor(progress / 17), steps.length - 1);
    steps.forEach((_, index) => updateStep(index, index < stepIndex));
    updateStep(stepIndex, false);
    percentage.textContent = `${progress}%`;
    progressText.textContent = `${progress}%`;
    progressFill.style.width = `${progress}%`;
    filesCount.textContent = Math.round(progress * 1.8);
    checksCount.textContent = Math.round(progress * 6.4);
    risksCount.textContent = Math.min(5, Math.floor(progress / 20));
    aiMessage.textContent = messages[Math.min(Math.floor(progress / 20), messages.length - 1)];

    if (progress >= 100) {
        clearInterval(progressInterval);
        steps.forEach((_, index) => updateStep(index, true));
        aiMessage.textContent = "Análise concluída. Os resultados já estão disponíveis para consulta.";
        document.querySelector(".scanner-status").innerHTML = '<span class="status-dot"></span> ANÁLISE CONCLUÍDA';
        const resultLink = document.createElement("a");
        resultLink.className = "scan-result-link";
        resultLink.href = "area.html?view=reports";
        resultLink.innerHTML = '<i class="fa-solid fa-chart-line"></i> Ver resultados';
        document.querySelector(".scanner-main").appendChild(resultLink);
    }
}, 80);

setInterval(() => {
    seconds += 1;
    timer.textContent = `00:${String(seconds).padStart(2, "0")}`;
}, 1000);

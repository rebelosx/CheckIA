const contaAtual = localStorage.getItem("usuario");
const chaveTema = contaAtual ? `tema_${contaAtual}` : "tema_global";
const chaveAvatar = `avatar_${contaAtual || "global"}`;
const chaveAvatarCor = `avatarCor_${contaAtual || "global"}`;

function aplicarPreferencias() {
    const temaClaro = localStorage.getItem(chaveTema) === "light";
    document.body.classList.toggle("light-theme", temaClaro);
    document.querySelectorAll("[data-logo-light]").forEach((logo) => {
        logo.src = temaClaro ? logo.dataset.logoLight : logo.dataset.logoDark;
    });
    const avatar = localStorage.getItem(chaveAvatar);
    document.querySelectorAll(".profile-avatar").forEach((elemento) => {
        elemento.innerHTML = avatar ? "" : '<i class="fa-solid fa-user"></i>';
        if (avatar && !avatar.startsWith("data:image/")) elemento.textContent = avatar;
        elemento.classList.toggle("profile-avatar-image", Boolean(avatar && avatar.startsWith("data:image/")));
        elemento.style.backgroundColor = localStorage.getItem(chaveAvatarCor) || (temaClaro ? "#1f2328" : "#fff");
        if (avatar && avatar.startsWith("data:image/")) elemento.style.backgroundImage = `url(${avatar})`;
        else elemento.style.backgroundImage = "";
    });
}

function configurarPreferencias() {
    const logoutButton = document.getElementById("logoutButton");
    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            localStorage.setItem("tema_global", document.body.classList.contains("light-theme") ? "light" : "dark");
            localStorage.removeItem("usuario");
            window.location.href = "index.html";
        });
    }
    const temaToggle = document.getElementById("themeToggle");
    const avatarEmoji = document.getElementById("avatarEmoji");
    const avatarUpload = document.getElementById("avatarUpload");
    const avatarColor = document.getElementById("avatarColor");
    const resetAvatar = document.getElementById("resetAvatar");
    if (temaToggle) {
        temaToggle.checked = localStorage.getItem(chaveTema) === "light";
        temaToggle.addEventListener("change", (event) => {
            localStorage.setItem(chaveTema, event.target.checked ? "light" : "dark");
            aplicarPreferencias();
        });
    }
    if (avatarEmoji) {
        avatarEmoji.value = localStorage.getItem(chaveAvatar) || "";
        avatarEmoji.addEventListener("input", (event) => {
            const valor = event.target.value.trim();
            localStorage.setItem(chaveAvatar, valor);
            aplicarPreferencias();
        });
    }
    if (avatarColor) {
        avatarColor.value = localStorage.getItem(chaveAvatarCor) || (document.body.classList.contains("light-theme") ? "#1f2328" : "#ffffff");
        avatarColor.addEventListener("input", (event) => {
            localStorage.setItem(chaveAvatarCor, event.target.value);
            aplicarPreferencias();
        });
    }
    if (resetAvatar) {
        resetAvatar.addEventListener("click", () => {
            localStorage.removeItem(chaveAvatar);
            localStorage.removeItem(chaveAvatarCor);
            if (avatarEmoji) avatarEmoji.value = "";
            if (avatarUpload) avatarUpload.value = "";
            if (avatarColor) avatarColor.value = document.body.classList.contains("light-theme") ? "#1f2328" : "#ffffff";
            aplicarPreferencias();
        });
    }
    if (avatarUpload) {
        avatarUpload.addEventListener("change", (event) => {
            const arquivo = event.target.files[0];
            if (!arquivo || !arquivo.type.startsWith("image/")) return;
            const leitor = new FileReader();
            leitor.onload = () => {
                localStorage.setItem(chaveAvatar, leitor.result);
                if (avatarEmoji) avatarEmoji.value = "";
                aplicarPreferencias();
            };
            leitor.readAsDataURL(arquivo);
        });
    }
    aplicarPreferencias();
}

function mostrarNotificacaoAnalise() {
    const notificacao = JSON.parse(localStorage.getItem(`notificacaoPendente_${contaAtual}`) || "null");
    if (!notificacao || localStorage.getItem(`notificacaoVista_${contaAtual}`) === String(notificacao.id)) return;
    if (localStorage.getItem(`alertasSeguranca_${contaAtual}`) === "false") return;
    localStorage.setItem(`notificacaoVista_${contaAtual}`, String(notificacao.id));
    const mensagem = document.createElement("div");
    mensagem.className = "system-notification";
    const titulo = document.createElement("strong");
    titulo.textContent = "Verificação concluída";
    const detalhe = document.createElement("span");
    detalhe.textContent = `${notificacao.repo || "Repositório"} foi analisado com ${notificacao.riscos} risco(s) encontrado(s).`;
    mensagem.append(titulo, detalhe);
    document.body.appendChild(mensagem);
    setTimeout(() => mensagem.classList.add("visible"), 80);
    setTimeout(() => mensagem.remove(), 6000);
}

aplicarPreferencias();
document.addEventListener("DOMContentLoaded", () => {
    configurarPreferencias();
    mostrarNotificacaoAnalise();
});

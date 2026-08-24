/*==========================================
 Check IA
 Login
==========================================*/

const form = document.getElementById("loginForm");

const email = document.getElementById("email");

const senha = document.getElementById("senha");
const registerForm = document.getElementById("registerForm");
const recoveryForm = document.getElementById("recoveryForm");
const forms = [form, registerForm, recoveryForm];

/*==========================================
CRIAR ALERTA
==========================================*/

function mostrarMensagem(texto, cor) {

    const alerta = document.createElement("div");

    alerta.innerText = texto;

    alerta.style.position = "fixed";
    alerta.style.top = "25px";
    alerta.style.right = "25px";

    alerta.style.padding = "15px 25px";

    alerta.style.background = cor;

    alerta.style.color = "#FFF";

    alerta.style.borderRadius = "10px";

    alerta.style.fontSize = "15px";

    alerta.style.fontWeight = "600";

    alerta.style.zIndex = "9999";

    alerta.style.boxShadow = "0 15px 40px rgba(0,0,0,.35)";

    alerta.style.animation = "fade .5s";

    document.body.appendChild(alerta);

    setTimeout(() => {

        alerta.remove();

    },3000);

}

/*==========================================
VALIDAÇÃO EMAIL
==========================================*/

function validarEmail(email){

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    return regex.test(email);

}

/*==========================================
LOGIN
==========================================*/

form.addEventListener("submit",(e)=>{

    e.preventDefault();

    if(email.value.trim()===""){

        mostrarMensagem("Digite seu email.","#F85149");

        email.focus();

        return;

    }

    if(!validarEmail(email.value)){

        mostrarMensagem("Email inválido.","#F85149");

        email.focus();

        return;

    }

    if(senha.value.length<6){

        mostrarMensagem("Senha deve possuir no mínimo 6 caracteres.","#F85149");

        senha.focus();

        return;

    }

    mostrarMensagem("Login realizado com sucesso!","#3FB950");

    localStorage.setItem("usuario",email.value);
    localStorage.setItem(`tema_${email.value}`, localStorage.getItem("tema_global") || "dark");

    setTimeout(()=>{

        window.location.href="dashboard.html";

    },1500);

});

function exibirFormulario(formularioAtivo) {
    forms.forEach((formulario) => formulario.classList.toggle("auth-form-hidden", formulario !== formularioAtivo));
}

document.getElementById("registerLink").addEventListener("click", (event) => {
    event.preventDefault();
    exibirFormulario(registerForm);
});

document.getElementById("forgotPasswordLink").addEventListener("click", (event) => {
    event.preventDefault();
    exibirFormulario(recoveryForm);
});

document.querySelectorAll(".backToLogin").forEach((link) => link.addEventListener("click", (event) => {
    event.preventDefault();
    exibirFormulario(form);
}));

registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const nome = document.getElementById("registerName").value.trim();
    const novoEmail = document.getElementById("registerEmail").value.trim();
    const novaSenha = document.getElementById("registerPassword").value;
    const confirmacao = document.getElementById("registerPasswordConfirm").value;

    if (!validarEmail(novoEmail)) {
        mostrarMensagem("Email inválido.", "#F85149");
        return;
    }
    if (novaSenha.length < 6) {
        mostrarMensagem("Senha deve possuir no mínimo 6 caracteres.", "#F85149");
        return;
    }
    if (novaSenha !== confirmacao) {
        mostrarMensagem("As senhas não coincidem.", "#F85149");
        return;
    }

    localStorage.setItem("usuario", novoEmail);
    localStorage.setItem("nomeConta", nome);
    localStorage.setItem("emailConta", novoEmail);
    mostrarMensagem("Conta criada com sucesso!", "#3FB950");
    setTimeout(() => window.location.href = "dashboard.html", 1000);
});

recoveryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const emailRecuperacao = document.getElementById("recoveryEmail").value.trim();
    if (!validarEmail(emailRecuperacao)) {
        mostrarMensagem("Email inválido.", "#F85149");
        return;
    }
    mostrarMensagem("Instruções enviadas para seu email.", "#3FB950");
});

/*==========================================
ENTER
==========================================*/

document.addEventListener("keydown",(e)=>{

    if(e.key==="Enter"){
        document.querySelector("form:not(.auth-form-hidden)")?.requestSubmit();

    }

});

/*==========================================
EFEITO INPUT
==========================================*/

const inputs=document.querySelectorAll("input");

inputs.forEach((campo)=>{

    campo.addEventListener("focus",()=>{

        campo.style.boxShadow="0 0 10px rgba(47,129,247,.4)";

    });

    campo.addEventListener("blur",()=>{

        campo.style.boxShadow="none";

    });

});

/*==========================================
MODO ESCURO
==========================================*/

document.body.classList.add("dark");

/*==========================================
ANIMAÇÃO
==========================================*/

window.onload=()=>{

    document.querySelector(".container").classList.add("fade");

};

/*==========================================
 CyberShield AI
 Login
==========================================*/

const form = document.getElementById("loginForm");

const email = document.getElementById("email");

const senha = document.getElementById("senha");

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

    setTimeout(()=>{

        window.location.href="dashboard.html";

    },1500);

});

/*==========================================
ENTER
==========================================*/

document.addEventListener("keydown",(e)=>{

    if(e.key==="Enter"){

        form.requestSubmit();

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
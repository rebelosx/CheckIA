/*==========================================
 Check IA
 Cadastro
==========================================*/

const form = document.getElementById("cadastroForm");

const nome = document.getElementById("nome");
const email = document.getElementById("email");
const senha = document.getElementById("senha");
const confirmarSenha = document.getElementById("confirmarSenha");

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
CADASTRO
==========================================*/

form.addEventListener("submit", async (e) => {

    e.preventDefault();

    if(nome.value.trim()===""){

        mostrarMensagem("Digite seu nome.","#F85149");

        nome.focus();

        return;

    }

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

    if(senha.value !== confirmarSenha.value){

        mostrarMensagem("As senhas não coincidem.","#F85149");

        confirmarSenha.focus();

        return;

    }

    const botao = form.querySelector("button[type='submit']");
    if (botao) botao.disabled = true;

    const { data, error } = await supabase.auth.signUp({
        email: email.value.trim(),
        password: senha.value,
        options: { data: { nome: nome.value.trim() } },
    });

    if (botao) botao.disabled = false;

    if (error) {

        const jaExiste = /already|registered/i.test(error.message);

        mostrarMensagem(
            jaExiste ? "Este email já está cadastrado." : "Erro ao criar conta.",
            "#F85149"
        );

        return;

    }

    mostrarMensagem("Conta criada com sucesso!","#3FB950");

    setTimeout(()=>{

        window.location.href = data.session ? "dashboard.html" : "index.html";

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
ANIMAÇÃO
==========================================*/

window.onload=()=>{

    document.querySelector(".card").classList.add("fade");

};
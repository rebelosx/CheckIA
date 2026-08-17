/* =====================================================
   CHECK IA
   DASHBOARD.JS
===================================================== */


/* =====================================================
   1. VERIFICAR LOGIN
===================================================== */

const usuarioLogado = localStorage.getItem("usuario");


// Se não existir usuário, volta para o login
if (!usuarioLogado) {

    window.location.href = "index.html";

}


/* =====================================================
   2. MOSTRAR USUÁRIO
===================================================== */

const usuarioElemento = document.getElementById("usuario");

if (usuarioElemento && usuarioLogado) {

    // Pega somente o nome antes do @
    let nomeUsuario = usuarioLogado.split("@")[0];

    // Primeira letra maiúscula
    nomeUsuario =
        nomeUsuario.charAt(0).toUpperCase() +
        nomeUsuario.slice(1);

    usuarioElemento.textContent = nomeUsuario;

}


/* =====================================================
   3. DADOS DOS PROJETOS
===================================================== */

const projetos = [

    {
        nome: "API Financeira",
        linguagem: "Java",
        score: 96,
        status: "Seguro"
    },

    {
        nome: "E-commerce AI",
        linguagem: "JavaScript",
        score: 78,
        status: "Atenção"
    },

    {
        nome: "Sistema Login",
        linguagem: "Python",
        score: 52,
        status: "Risco"
    },

    {
        nome: "Aplicação Web",
        linguagem: "PHP",
        score: 89,
        status: "Seguro"
    },

    {
        nome: "API Check IA",
        linguagem: "Node.js",
        score: 94,
        status: "Seguro"
    }

];


/* =====================================================
   4. PESQUISA DE PROJETOS
===================================================== */

const campoPesquisa = document.querySelector(".search input");

const tabela = document.querySelector("tbody");


if (campoPesquisa && tabela) {

    campoPesquisa.addEventListener("input", function () {

        const pesquisa =
            this.value.toLowerCase().trim();


        const linhas =
            tabela.querySelectorAll("tr");


        linhas.forEach(function (linha) {

            const texto =
                linha.textContent.toLowerCase();


            if (texto.includes(pesquisa)) {

                linha.style.display = "";

            } else {

                linha.style.display = "none";

            }

        });

    });

}


/* =====================================================
   5. ANIMAÇÃO DOS CARDS
===================================================== */

const cards =
    document.querySelectorAll(".security-card");


cards.forEach(function (card, index) {

    card.style.opacity = "0";

    card.style.transform = "translateY(20px)";


    setTimeout(function () {

        card.style.transition =
            "all 0.5s ease";

        card.style.opacity = "1";

        card.style.transform =
            "translateY(0)";

    }, index * 120);

});


/* =====================================================
   6. ANIMAÇÃO DO SCORE
===================================================== */

const scoreElemento =
    document.querySelector(".security-card h3");


if (scoreElemento) {

    let valorFinal = 94;

    let valorAtual = 0;


    const intervalo =
        setInterval(function () {

            valorAtual++;

            scoreElemento.textContent =
                valorAtual + "%";


            if (valorAtual >= valorFinal) {

                clearInterval(intervalo);

            }

        }, 20);

}


/* =====================================================
   7. GRÁFICO
===================================================== */

const barras =
    document.querySelectorAll(".chart div");


barras.forEach(function (barra, index) {

    const alturaOriginal =
        barra.style.height;


    barra.style.height = "0";


    setTimeout(function () {

        barra.style.height =
            alturaOriginal;

        barra.style.transition =
            "height 1s ease";

    }, 300 + (index * 150));

});


/* =====================================================
   8. NOVA ANÁLISE
===================================================== */

const botoes =
    document.querySelectorAll("button");


botoes.forEach(function (botao) {

    const texto =
        botao.textContent.toLowerCase();


    if (texto.includes("nova análise")) {

        botao.addEventListener("click", function () {

            window.location.href =
                "analysis.html";

        });

    }

});


/* =====================================================
   9. MENU LATERAL
===================================================== */

const menuItens =
    document.querySelectorAll(".sidebar nav a");


menuItens.forEach(function (item) {

    item.addEventListener("click", function () {


        // Remove ativo de todos

        menuItens.forEach(function (menu) {

            menu.classList.remove("active");

        });


        // Adiciona ativo no selecionado

        this.classList.add("active");


        const texto =
            this.textContent.trim();


        /* ---------------------------------------------
           NOVA ANÁLISE
        --------------------------------------------- */

        if (texto.includes("Nova Análise")) {

            window.location.href =
                "analysis.html";

        }


        /* ---------------------------------------------
           PROJETOS
        --------------------------------------------- */

        else if (texto.includes("Projetos")) {

            mostrarMensagem(
                "Área de projetos em desenvolvimento."
            );

        }


        /* ---------------------------------------------
           RELATÓRIOS
        --------------------------------------------- */

        else if (texto.includes("Relatórios")) {

            window.location.href =
                "reports.html";

        }


        /* ---------------------------------------------
           VULNERABILIDADES
        --------------------------------------------- */

        else if (texto.includes("Vulnerabilidades")) {

            mostrarMensagem(
                "Área de vulnerabilidades em desenvolvimento."
            );

        }


        /* ---------------------------------------------
           CONFIGURAÇÕES
        --------------------------------------------- */

        else if (texto.includes("Configurações")) {

            mostrarMensagem(
                "Configurações em desenvolvimento."
            );

        }

    });

});


/* =====================================================
   10. SISTEMA DE MENSAGEM
===================================================== */

function mostrarMensagem(mensagem) {


    const alerta =
        document.createElement("div");


    alerta.textContent =
        mensagem;


    alerta.style.position =
        "fixed";


    alerta.style.bottom =
        "30px";


    alerta.style.right =
        "30px";


    alerta.style.background =
        "#21262D";


    alerta.style.border =
        "1px solid #30363D";


    alerta.style.color =
        "#F0F6FC";


    alerta.style.padding =
        "15px 22px";


    alerta.style.borderRadius =
        "10px";


    alerta.style.boxShadow =
        "0 10px 30px rgba(0,0,0,0.4)";


    alerta.style.zIndex =
        "9999";


    alerta.style.fontSize =
        "14px";


    alerta.style.animation =
        "fade .4s ease";


    document.body.appendChild(alerta);


    setTimeout(function () {

        alerta.style.opacity = "0";

        alerta.style.transform =
            "translateY(10px)";

        alerta.style.transition =
            ".3s";


        setTimeout(function () {

            alerta.remove();

        }, 300);

    }, 2500);

}


/* =====================================================
   11. LOGOUT
===================================================== */

function logout() {

    localStorage.removeItem("usuario");

    window.location.href =
        "index.html";

}


/* =====================================================
   12. ATUALIZAR DATA
===================================================== */

const elementosData =
    document.querySelectorAll(".data-atual");


const dataAtual =
    new Date();


const dataFormatada =
    dataAtual.toLocaleDateString(
        "pt-BR"
    );


elementosData.forEach(function (elemento) {

    elemento.textContent =
        dataFormatada;

});


/* =====================================================
   13. CARREGAMENTO DO DASHBOARD
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        console.log(
            "Check IA Dashboard carregado."
        );

        console.log(
            "Usuário:",
            usuarioLogado
        );

    }
);

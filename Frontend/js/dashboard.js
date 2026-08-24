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

const ultimaAnalise = JSON.parse(localStorage.getItem(`ultimaAnalise_${usuarioLogado}`) || "null");
const historicoSalvo = JSON.parse(localStorage.getItem(`historicoAnalises_${usuarioLogado}`) || "[]");
const analiseLegada = JSON.parse(localStorage.getItem("ultimaAnalise") || "null");
const historico = [...historicoSalvo, ...(ultimaAnalise ? [ultimaAnalise] : []), ...(analiseLegada ? [analiseLegada] : [])]
    .filter((item, index, registros) => item && registros.findIndex((outro) => outro.repo === item.repo && outro.analise_ia === item.analise_ia) === index);
if (historico.length !== historicoSalvo.length) localStorage.setItem(`historicoAnalises_${usuarioLogado}`, JSON.stringify(historico));
let riscosAtuais = [];
if (ultimaAnalise?.analise_ia) {
    const textoAnalise = ultimaAnalise.analise_ia.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    try { riscosAtuais = JSON.parse(textoAnalise).vulnerabilidades || []; } catch (_) { riscosAtuais = []; }
}

if (usuarioElemento && usuarioLogado) {

    // Pega somente o nome antes do @
    let nomeUsuario = localStorage.getItem("nomeConta") || usuarioLogado.split("@")[0];

    // Primeira letra maiúscula
    nomeUsuario =
        nomeUsuario.charAt(0).toUpperCase() +
        nomeUsuario.slice(1);

    usuarioElemento.textContent = nomeUsuario;

    const usuarioHeader = document.getElementById("usuario-header");
    if (usuarioHeader) {
        usuarioHeader.textContent = nomeUsuario;
    }

}


/* =====================================================
   3. PESQUISA DE PROJETOS
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

    const scores = historico.map((item) => Math.max(0, 100 - (getRiscos(item).length * 10)));
    let valorFinal = scores.length ? Math.round(scores.reduce((total, score) => total + score, 0) / scores.length) : 0;

    let valorAtual = 0;

    if (valorFinal === 0) {
        scoreElemento.textContent = "-";
    } else {
        const intervalo = setInterval(function () {

            valorAtual++;

            scoreElemento.textContent =
                valorAtual + "%";


            if (valorAtual >= valorFinal) {

                clearInterval(intervalo);

            }

            }, 20);
        }

}

function getRiscos(resultado) {
    if (!resultado?.analise_ia) return [];
    const texto = resultado.analise_ia.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
    try { return JSON.parse(texto).vulnerabilidades || []; } catch (_) { return []; }
}

const todosOsRiscos = historico.flatMap(getRiscos);
const scoreMedio = historico.length ? Math.round(historico.reduce((total, item) => total + Math.max(0, 100 - (getRiscos(item).length * 10)), 0) / historico.length) : null;
const valoresCards = document.querySelectorAll(".security-card h3");
if (valoresCards[0]) valoresCards[0].textContent = scoreMedio === null ? "-" : `${scoreMedio}%`;
if (valoresCards[1]) valoresCards[1].textContent = String(new Set(historico.map((item) => item.repo)).size);
if (valoresCards[2]) valoresCards[2].textContent = String(todosOsRiscos.length);
if (valoresCards[3]) valoresCards[3].textContent = ultimaAnalise ? "Agora" : "Nenhuma";

const primeiraLinha = document.querySelector("tbody");
if (primeiraLinha) {
    primeiraLinha.innerHTML = historico.length
        ? [...historico].reverse().map((item) => {
            const riscos = getRiscos(item).length;
            const score = Math.max(0, 100 - (riscos * 10));
            return `<tr><td>${item.repo || "Repositório GitHub"}</td><td>${item.linguagem || "Não identificada"}</td><td>${score}%</td><td class="${riscos ? "warning" : "safe"}">${riscos ? "Atenção" : "Seguro"}</td></tr>`;
        }).join("")
        : "<tr><td colspan=\"4\">Nenhuma análise realizada</td></tr>";
}

/* =====================================================
   7. GRÁFICO
===================================================== */

const barras =
    document.querySelectorAll(".chart div");


const repositorioAtual = ultimaAnalise?.repo;
const historicoDoRepositorio = repositorioAtual ? historico.filter((item) => item.repo === repositorioAtual) : [];
const historicoRecente = historicoDoRepositorio.slice(-5);
const chartMessage = document.getElementById("chartMessage");
if (chartMessage) {
    chartMessage.textContent = historicoRecente.length > 1
        ? `Evolução de ${repositorioAtual}`
        : "Ainda não há análises suficientes deste repositório para mostrar melhorias.";
}
barras.forEach((barra, index) => {
    const item = historicoRecente[index];
    const score = item ? Math.max(0, 100 - (getRiscos(item).length * 10)) : 0;
    barra.style.height = "0";
    barra.style.transition = "height .6s ease";
    setTimeout(() => { barra.style.height = `${score}%`; }, 150 + (index * 100));
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
            this.textContent.trim().toLowerCase();


        /* ---------------------------------------------
           NOVA ANÁLISE
        --------------------------------------------- */

        if (texto.includes("nova análise")) {

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
                "area.html?view=reports";

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

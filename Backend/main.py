import os
import secrets
from pathlib import Path
from urllib.parse import urlencode

import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse
from starlette.middleware.sessions import SessionMiddleware


# =========================================================
# CONFIGURAÇÃO DO .ENV
# =========================================================

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")


GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI")

SESSION_SECRET = os.getenv(
    "SESSION_SECRET",
    "chave-temporaria-apenas-para-desenvolvimento"
)


# =========================================================
# APLICAÇÃO FASTAPI
# =========================================================

app = FastAPI(
    title="CheckIA Backend"
)


# =========================================================
# SESSÃO
# =========================================================

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    same_site="lax",
    https_only=False
)


# =========================================================
# CORS
# =========================================================
#
# Frontend pelo Live Server:
# http://127.0.0.1:5500
#
# Backend:
# http://127.0.0.1:8000
#
# Como são portas diferentes, são origens diferentes.
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# ROTA DE TESTE
# =========================================================

@app.get("/")
async def home():

    return {
        "message": "CheckIA Backend funcionando."
    }


# =========================================================
# LOGIN COM GITHUB
# =========================================================

@app.get("/auth/github")
async def github_login(
    request: Request
):

    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_CLIENT_ID não configurado."
        )

    if not GITHUB_REDIRECT_URI:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_REDIRECT_URI não configurado."
        )


    # -----------------------------------------
    # Cria valor aleatório contra CSRF
    # -----------------------------------------

    state = secrets.token_urlsafe(32)


    # -----------------------------------------
    # Guarda state na sessão
    # -----------------------------------------

    request.session[
        "github_oauth_state"
    ] = state


    # -----------------------------------------
    # Parâmetros da autorização
    # -----------------------------------------

    params = {

        "client_id":
            GITHUB_CLIENT_ID,

        "redirect_uri":
            GITHUB_REDIRECT_URI,

        "state":
            state,

        # Para começar:
        # read:user = dados do usuário
        #
        # repo = acesso amplo a repos públicos e privados
        #
        # Para teste apenas com públicos,
        # você pode remover "repo".
        "scope":
            "read:user repo",
    }


    github_authorize_url = (
        "https://github.com/login/oauth/authorize?"
        + urlencode(params)
    )


    return RedirectResponse(
        github_authorize_url
    )


# =========================================================
# CALLBACK DO GITHUB
# =========================================================

@app.get("/auth/github/callback")
async def github_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None
):

    # -----------------------------------------
    # GitHub não enviou o code
    # -----------------------------------------

    if not code:

        raise HTTPException(
            status_code=400,
            detail="GitHub não retornou o código de autorização."
        )


    # -----------------------------------------
    # Verificar state
    # -----------------------------------------

    saved_state = request.session.get(
        "github_oauth_state"
    )


    if (
        not saved_state
        or not state
        or state != saved_state
    ):

        raise HTTPException(
            status_code=400,
            detail="Estado OAuth inválido."
        )


    # -----------------------------------------
    # State só deve ser usado uma vez
    # -----------------------------------------

    request.session.pop(
        "github_oauth_state",
        None
    )


    # -----------------------------------------
    # Confere configurações
    # -----------------------------------------

    if not GITHUB_CLIENT_ID:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_CLIENT_ID não configurado."
        )

    if not GITHUB_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="GITHUB_CLIENT_SECRET não configurado."
        )


    # =====================================================
    # TROCAR CODE POR ACCESS TOKEN
    # =====================================================

    async with httpx.AsyncClient() as client:

        token_response = await client.post(

            "https://github.com/login/oauth/access_token",

            headers={
                "Accept":
                    "application/json"
            },

            data={
                "client_id":
                    GITHUB_CLIENT_ID,

                "client_secret":
                    GITHUB_CLIENT_SECRET,

                "code":
                    code,

                "redirect_uri":
                    GITHUB_REDIRECT_URI,
            },
        )


        # -----------------------------------------
        # Erro HTTP na chamada do GitHub
        # -----------------------------------------

        if token_response.status_code != 200:

            raise HTTPException(
                status_code=502,
                detail="Erro ao solicitar token ao GitHub."
            )


        token_data = token_response.json()


        access_token = token_data.get(
            "access_token"
        )


        # -----------------------------------------
        # GitHub respondeu, mas sem token
        # -----------------------------------------

        if not access_token:

            error_description = (
                token_data.get("error_description")
                or token_data.get("error")
                or "Não foi possível obter o token."
            )

            raise HTTPException(
                status_code=400,
                detail=error_description
            )


        # =================================================
        # CONSULTAR USUÁRIO AUTENTICADO
        # =================================================

        user_response = await client.get(

            "https://api.github.com/user",

            headers={
                "Authorization":
                    f"Bearer {access_token}",

                "Accept":
                    "application/vnd.github+json",
            },
        )


        if user_response.status_code != 200:

            raise HTTPException(
                status_code=502,
                detail="Não foi possível consultar o usuário no GitHub."
            )


        user_data = user_response.json()


    # =====================================================
    # SALVAR DADOS NA SESSÃO
    # =====================================================

    request.session[
        "github_access_token"
    ] = access_token


    request.session[
        "github_user"
    ] = {

        "login":
            user_data.get("login"),

        "name":
            user_data.get("name"),

        "avatar_url":
            user_data.get("avatar_url"),
    }


    # =====================================================
    # AVISAR A ABA ORIGINAL
    # =====================================================

    return HTMLResponse(
        """
        <!DOCTYPE html>

        <html lang="pt-BR">

        <head>

            <meta charset="UTF-8">

            <title>
                GitHub conectado
            </title>

        </head>


        <body
            style="
                font-family: Arial, sans-serif;
                background: #0d1117;
                color: white;
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            "
        >

            <div
                style="
                    text-align: center;
                "
            >

                <h2>
                    GitHub conectado com sucesso.
                </h2>

                <p>
                    Você já pode voltar ao CheckIA.
                </p>

            </div>


            <script>

                if (window.opener) {

                    window.opener.postMessage(
                        {
                            type: "github-connected"
                        },
                        "http://127.0.0.1:5500"
                    );

                }


                setTimeout(
                    function () {

                        window.close();

                    },
                    1200
                );

            </script>


        </body>

        </html>
        """
    )


# =========================================================
# VERIFICAR USUÁRIO CONECTADO
# =========================================================

@app.get("/github/me")
async def github_me(
    request: Request
):

    github_user = request.session.get(
        "github_user"
    )


    if not github_user:

        raise HTTPException(
            status_code=401,
            detail="Usuário não conectado ao GitHub."
        )


    return github_user


# =========================================================
# LISTAR REPOSITÓRIOS
# =========================================================

@app.get("/github/repos")
async def github_repositories(
    request: Request
):

    # -----------------------------------------
    # Pegar token salvo na sessão
    # -----------------------------------------

    access_token = request.session.get(
        "github_access_token"
    )


    if not access_token:

        raise HTTPException(
            status_code=401,
            detail="Usuário não conectado ao GitHub."
        )


    # -----------------------------------------
    # Buscar repos na API GitHub
    # -----------------------------------------

    async with httpx.AsyncClient() as client:

        response = await client.get(

            "https://api.github.com/user/repos",

            headers={
                "Authorization":
                    f"Bearer {access_token}",

                "Accept":
                    "application/vnd.github+json",
            },

            params={
                "per_page": 100,
                "sort": "updated",
                "direction": "desc",
            },
        )


    # -----------------------------------------
    # Erro vindo do GitHub
    # -----------------------------------------

    if response.status_code != 200:

        raise HTTPException(
            status_code=response.status_code,
            detail="Erro ao buscar os repositórios no GitHub."
        )


    repositories = response.json()


    # -----------------------------------------
    # Retornar apenas dados úteis
    # -----------------------------------------

    repositorios_formatados = []


    for repo in repositories:

        repositorios_formatados.append(
            {
                "id":
                    repo.get("id"),

                "name":
                    repo.get("name"),

                "full_name":
                    repo.get("full_name"),

                "private":
                    repo.get("private"),

                "html_url":
                    repo.get("html_url"),

                "default_branch":
                    repo.get("default_branch"),

                "description":
                    repo.get("description"),

                "language":
                    repo.get("language"),

                "updated_at":
                    repo.get("updated_at"),
            }
        )


    return repositorios_formatados


# =========================================================
# DESCONECTAR GITHUB
# =========================================================

@app.post("/auth/github/logout")
async def github_logout(
    request: Request
):

    request.session.pop(
        "github_access_token",
        None
    )

    request.session.pop(
        "github_user",
        None
    )


    return {
        "message":
            "GitHub desconectado."
    }
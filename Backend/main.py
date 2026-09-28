import os
import secrets
from pathlib import Path
from urllib.parse import urlencode

import httpx

from dotenv import load_dotenv
from fastapi import FastAPI, Request, HTTPException, UploadFile, File, Form
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse
from google.api_core.exceptions import ResourceExhausted
from starlette.middleware.sessions import SessionMiddleware

from services.gemini_service import analisar_codigo
from services.github_service import buscar_arquivos_repo
import zipfile
import io


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

app = FastAPI(title="CheckIA Backend")


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
# O navegador trata cada combinação de host + porta como uma
# origem diferente, então listamos as que o Live Server pode usar.
# Não use "*" aqui: ele não funciona junto com allow_credentials.

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5500",
        "http://127.0.0.1:5501",
        "http://127.0.0.1:5502",
        "http://localhost:5500",
        "http://localhost:5501",
        "http://localhost:5502",
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
    return {"message": "CheckIA Backend funcionando."}


# =========================================================
# LOGIN COM GITHUB
# =========================================================

@app.get("/auth/github")
async def github_login(request: Request):

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

    # Valor aleatório contra CSRF
    state = secrets.token_urlsafe(32)
    request.session["github_oauth_state"] = state

    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "state": state,
        # read:user = dados do usuário
        # repo = repositórios públicos e privados
        "scope": "read:user repo",
    }

    github_authorize_url = (
        "https://github.com/login/oauth/authorize?"
        + urlencode(params)
    )

    return RedirectResponse(github_authorize_url)


# =========================================================
# CALLBACK DO GITHUB
# =========================================================

@app.get("/auth/github/callback")
async def github_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None
):

    if not code:
        raise HTTPException(
            status_code=400,
            detail="GitHub não retornou o código de autorização."
        )

    saved_state = request.session.get("github_oauth_state")

    if not saved_state or not state or state != saved_state:
        raise HTTPException(status_code=400, detail="Estado OAuth inválido.")

    # O state só deve ser usado uma vez
    request.session.pop("github_oauth_state", None)

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

    # ---------------------------------------------
    # TROCAR CODE POR ACCESS TOKEN
    # ---------------------------------------------

    async with httpx.AsyncClient() as client:

        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": GITHUB_REDIRECT_URI,
            },
        )

        if token_response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Erro ao solicitar token ao GitHub."
            )

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            error_description = (
                token_data.get("error_description")
                or token_data.get("error")
                or "Não foi possível obter o token."
            )
            raise HTTPException(status_code=400, detail=error_description)

        # -----------------------------------------
        # CONSULTAR USUÁRIO AUTENTICADO
        # -----------------------------------------

        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )

        if user_response.status_code != 200:
            raise HTTPException(
                status_code=502,
                detail="Não foi possível consultar o usuário no GitHub."
            )

        user_data = user_response.json()

    # ---------------------------------------------
    # SALVAR DADOS NA SESSÃO
    # ---------------------------------------------

    request.session["github_access_token"] = access_token

    request.session["github_user"] = {
        "login": user_data.get("login"),
        "name": user_data.get("name"),
        "avatar_url": user_data.get("avatar_url"),
    }

    # ---------------------------------------------
    # AVISAR A ABA ORIGINAL
    # ---------------------------------------------
    # A mensagem só carrega {type: "github-connected"}, sem nenhum
    # dado sensível, então "*" é seguro e funciona em qualquer porta.

    return HTMLResponse(
        """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>GitHub conectado</title>
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
            <div style="text-align: center;">
                <h2>GitHub conectado com sucesso.</h2>
                <p>Você já pode voltar ao CheckIA.</p>
            </div>

            <script>
                if (window.opener) {
                    window.opener.postMessage(
                        { type: "github-connected" },
                        "*"
                    );
                }

                setTimeout(function () {
                    window.close();
                }, 1200);
            </script>
        </body>
        </html>
        """
    )


# =========================================================
# VERIFICAR USUÁRIO CONECTADO
# =========================================================

@app.get("/github/me")
async def github_me(request: Request):

    github_user = request.session.get("github_user")

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
async def github_repositories(request: Request):

    access_token = request.session.get("github_access_token")

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Usuário não conectado ao GitHub."
        )

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user/repos",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
            params={
                "per_page": 100,
                "sort": "updated",
                "direction": "desc",
            },
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail="Erro ao buscar os repositórios no GitHub."
        )

    repositories = response.json()

    repositorios_formatados = []

    for repo in repositories:
        repositorios_formatados.append(
            {
                "id": repo.get("id"),
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "private": repo.get("private"),
                "html_url": repo.get("html_url"),
                "default_branch": repo.get("default_branch"),
                "description": repo.get("description"),
                "language": repo.get("language"),
                "updated_at": repo.get("updated_at"),
            }
        )

    return repositorios_formatados


# =========================================================
# DESCONECTAR GITHUB
# =========================================================

@app.post("/auth/github/logout")
async def github_logout(request: Request):

    request.session.pop("github_access_token", None)
    request.session.pop("github_user", None)

    return {"message": "GitHub desconectado."}


# =========================================================
# ANÁLISE DE CÓDIGO COM IA
# =========================================================

async def analisar_com_seguranca(codigo: str) -> dict:
    """Chama a IA sem travar o servidor e devolve erros legíveis.

    Usar HTTPException aqui é o que mantém os cabeçalhos de CORS na
    resposta. Sem isso, o navegador mostra "blocked by CORS" em vez
    do motivo real do erro.
    """
    try:
        return await run_in_threadpool(analisar_codigo, codigo)

    except ResourceExhausted:
        raise HTTPException(
            status_code=429,
            detail="Limite diário gratuito da IA atingido. Tente novamente mais tarde."
        )

    except Exception as e:
        print("ERRO AO CONSULTAR A IA:", repr(e))
        raise HTTPException(
            status_code=502,
            detail=f"Erro ao consultar a IA: {e}"
        )


@app.post("/analyze/code")
async def analisar_codigo_manual(codigo: str = Form(...)):
    """Recebe um trecho de código colado manualmente."""
    resultado = await analisar_com_seguranca(codigo)
    resultado["arquivos_analisados"] = 1
    return resultado


@app.post("/analyze/zip")
async def analisar_zip(arquivo: UploadFile = File(...)):
    """Recebe um .zip, extrai os arquivos de código e analisa juntos."""

    conteudo = await arquivo.read()

    extensoes_validas = (".py", ".js", ".jsx", ".ts", ".java", ".php", ".html", ".css", ".sql")
    codigos_extraidos = []

    try:
        with zipfile.ZipFile(io.BytesIO(conteudo)) as zip_ref:
            for nome_arquivo in zip_ref.namelist():
                if nome_arquivo.endswith(extensoes_validas) and not nome_arquivo.startswith("__MACOSX"):
                    with zip_ref.open(nome_arquivo) as f:
                        texto = f.read().decode("utf-8", errors="ignore")
                        codigos_extraidos.append(f"# Arquivo: {nome_arquivo}\n{texto[:5000]}")
    except zipfile.BadZipFile:
        raise HTTPException(
            status_code=400,
            detail="O arquivo enviado não é um ZIP válido."
        )

    if not codigos_extraidos:
        return {
            "score": 0,
            "linguagem_detectada": "desconhecida",
            "resumo": "Nenhum arquivo de código reconhecido dentro do ZIP.",
            "vulnerabilidades": [],
            "arquivos_analisados": 0,
        }

    selecionados = codigos_extraidos[:15]
    resultado = await analisar_com_seguranca("\n\n".join(selecionados))
    resultado["arquivos_analisados"] = len(selecionados)
    return resultado


@app.post("/analyze/github")
async def analisar_repo_github(
    request: Request,
    repo_full_name: str = Form(...),
    branch: str = Form("main")
):
    """repo_full_name vem como 'usuario/repositorio', igual ao que já é
    guardado em localStorage['repositorioSelecionado'] no frontend."""

    access_token = request.session.get("github_access_token")

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Usuário não conectado ao GitHub. Conecte novamente."
        )

    if "/" not in repo_full_name:
        raise HTTPException(status_code=400, detail="Repositório inválido.")

    owner, repo = repo_full_name.split("/", 1)

    try:
        arquivos = await buscar_arquivos_repo(access_token, owner, repo, branch)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"O GitHub respondeu {e.response.status_code}. "
                   f"Confira se a branch '{branch}' existe e se o repositório não está vazio."
        )

    if not arquivos:
        return {
            "score": 0,
            "linguagem_detectada": "desconhecida",
            "resumo": "Nenhum arquivo de código encontrado no repositório.",
            "vulnerabilidades": [],
            "arquivos_analisados": 0,
        }

    resultado = await analisar_com_seguranca("\n\n".join(arquivos))
    resultado["arquivos_analisados"] = len(arquivos)
    return resultado
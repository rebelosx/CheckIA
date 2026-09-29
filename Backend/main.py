import os
import secrets
import zipfile
import io
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
from supabase import create_client, Client

# =========================================================
# CONFIGURAÇÃO DO .ENV & SUPABASE
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

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tbrasnqvnghpyqpaktul.supabase.co")
SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.getenv(
        "SUPABASE_ANON_KEY",
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRicmFzbnF2bmdocHlxcGFrdHVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzAzODYsImV4cCI6MjEwNTg0NjM4Nn0.bx-q6DLickm3Fsnl3qwjkmSoogukY_FHXtBfGFIheVk"
    )
)

supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# =========================================================
# APLICAÇÃO FASTAPI & CORS
# =========================================================

app = FastAPI(title="CheckIA Backend")

app.add_middleware(
    SessionMiddleware,
    secret_key=SESSION_SECRET,
    same_site="lax",
    https_only=False
)

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
# PERSISTÊNCIA NO SUPABASE
# =========================================================

def salvar_analise_no_supabase(user_id: str, tipo: str, resultado_ia: dict, origem: str = "Código manual"):
    """Grava a análise com a origem específica e suas vulnerabilidades no Supabase."""
    if not supabase_admin or not user_id:
        return

    try:
        analise_data = {
            "user_id": user_id,
            "tipo": tipo,
            "origem": origem,  # Registra a origem do escaneamento
            "score": resultado_ia.get("score", 0),
            "linguagem_detectada": resultado_ia.get("linguagem_detectada", "desconhecida"),
            "resumo": resultado_ia.get("resumo", "Sem resumo disponível."),
        }
        res_analise = supabase_admin.table("analises").insert(analise_data).execute()

        if not res_analise.data:
            return

        analise_id = res_analise.data[0]["id"]
        vulnerabilidades = resultado_ia.get("vulnerabilidades", [])
        registros_vuln = []

        for v in vulnerabilidades:
            registros_vuln.append({
                "analise_id": analise_id,
                "user_id": user_id,
                "titulo": v.get("titulo", "Vulnerabilidade sem título"),
                "severidade": v.get("severidade", "Média"),
                "categoria": v.get("categoria", "Geral"),
                "descricao": v.get("descricao", ""),
                "linha": str(v.get("linha", "N/A")),
                "recomendacao": v.get("recomendacao", ""),
                "status": "Aberta"
            })

        if registros_vuln:
            supabase_admin.table("vulnerabilidades").insert(registros_vuln).execute()

    except Exception as e:
        print("Erro ao salvar no Supabase:", e)


# =========================================================
# ROTAS DE AUTENTICAÇÃO E REPOSITÓRIOS GITHUB
# =========================================================

@app.get("/")
async def home():
    return {"message": "CheckIA Backend funcionando."}


@app.get("/auth/github")
async def github_login(request: Request):
    if not GITHUB_CLIENT_ID or not GITHUB_REDIRECT_URI:
        raise HTTPException(status_code=500, detail="GitHub OAuth não configurado no .env")

    state = secrets.token_urlsafe(32)
    request.session["github_oauth_state"] = state

    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "state": state,
        "scope": "read:user repo",
    }
    return RedirectResponse("https://github.com/login/oauth/authorize?" + urlencode(params))


@app.get("/auth/github/callback")
async def github_callback(request: Request, code: str | None = None, state: str | None = None):
    if not code:
        raise HTTPException(status_code=400, detail="Código de autorização ausente.")

    saved_state = request.session.get("github_oauth_state")
    if not saved_state or not state or state != saved_state:
        raise HTTPException(status_code=400, detail="Estado OAuth inválido.")

    request.session.pop("github_oauth_state", None)

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
            raise HTTPException(status_code=502, detail="Erro ao obter token do GitHub.")

        token_data = token_response.json()
        access_token = token_data.get("access_token")

        if not access_token:
            raise HTTPException(status_code=400, detail=token_data.get("error_description", "Falha na autenticação."))

        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )
        user_data = user_response.json()

    request.session["github_access_token"] = access_token
    request.session["github_user"] = {
        "login": user_data.get("login"),
        "name": user_data.get("name"),
        "avatar_url": user_data.get("avatar_url"),
    }

    return HTMLResponse(
        """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head><meta charset="UTF-8"><title>GitHub Conectado</title></head>
        <body style="font-family: Arial; background: #0d1117; color: white; display: flex; align-items: center; justify-content: center; height: 100vh;">
            <div style="text-align: center;">
                <h2>GitHub conectado com sucesso.</h2>
                <p>Você já pode fechar esta janela.</p>
            </div>
            <script>
                if (window.opener) { window.opener.postMessage({ type: "github-connected" }, "*"); }
                setTimeout(function () { window.close(); }, 1200);
            </script>
        </body>
        </html>
        """
    )


@app.get("/github/me")
async def github_me(request: Request):
    github_user = request.session.get("github_user")
    if not github_user:
        raise HTTPException(status_code=401, detail="Usuário não conectado ao GitHub.")
    return github_user


@app.get("/github/repos")
async def github_repositories(request: Request):
    access_token = request.session.get("github_access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Usuário não conectado ao GitHub.")

    async with httpx.AsyncClient() as client:
        response = await client.get(
            "https://api.github.com/user/repos",
            headers={"Authorization": f"Bearer {access_token}", "Accept": "application/vnd.github+json"},
            params={"per_page": 100, "sort": "updated", "direction": "desc"},
        )

    if response.status_code != 200:
        raise HTTPException(status_code=response.status_code, detail="Erro ao buscar repositórios.")

    return [
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
        for repo in response.json()
    ]


@app.post("/auth/github/logout")
async def github_logout(request: Request):
    request.session.pop("github_access_token", None)
    request.session.pop("github_user", None)
    return {"message": "GitHub desconectado."}


# =========================================================
# ANÁLISE DE CÓDIGO COM IA & PERSISTÊNCIA
# =========================================================

async def analisar_com_seguranca(codigo: str) -> dict:
    try:
        return await run_in_threadpool(analisar_codigo, codigo)
    except ResourceExhausted:
        raise HTTPException(status_code=429, detail="Limite diário gratuito da IA atingido.")
    except Exception as e:
        print("ERRO IA:", repr(e))
        raise HTTPException(status_code=502, detail=f"Erro ao consultar a IA: {e}")


@app.post("/analyze/code")
async def analisar_codigo_manual(codigo: str = Form(...), user_id: str = Form(None)):
    resultado = await analisar_com_seguranca(codigo)
    resultado["arquivos_analisados"] = 1

    if user_id:
        salvar_analise_no_supabase(user_id, "codigo", resultado, origem="Código colado")

    return resultado


@app.post("/analyze/zip")
async def analisar_zip(arquivo: UploadFile = File(...), user_id: str = Form(None)):
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
        raise HTTPException(status_code=400, detail="O arquivo enviado não é um ZIP válido.")

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

    if user_id:
        salvar_analise_no_supabase(user_id, "zip", resultado, origem=f"ZIP: {arquivo.filename}")

    return resultado


@app.post("/analyze/github")
async def analisar_repo_github(
    request: Request,
    repo_full_name: str = Form(...),
    branch: str = Form("main"),
    user_id: str = Form(None)
):
    access_token = request.session.get("github_access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Usuário não conectado ao GitHub.")

    if "/" not in repo_full_name:
        raise HTTPException(status_code=400, detail="Repositório inválido.")

    owner, repo = repo_full_name.split("/", 1)
    arquivos = await buscar_arquivos_repo(access_token, owner, repo, branch)

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

    if user_id:
        salvar_analise_no_supabase(user_id, "github", resultado, origem=f"GitHub: {repo_full_name}")

    return resultado
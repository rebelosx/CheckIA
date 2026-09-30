import os
import secrets
import zipfile
import io
from pathlib import Path
from urllib.parse import urlencode
import re
import httpx # [biblioteca para requisições assíncronas]
import base64
from urllib.parse import quote
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv # Biblioteca para ler o arquivo .env com segurança

# 1. CONFIGURAÇÃO DE SEGURANÇA
# Carregamos as variáveis do arquivo .env (onde está sua API_KEY)
# Isso evita que sua chave fique exposta diretamente no código (Hardcoded)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("ERRO CRÍTICO: A variável GEMINI_API_KEY não foi encontrada no arquivo .env")
    raise RuntimeError("A variável de ambiente GEMINI_API_KEY não foi configurada.")

genai.configure(api_key=api_key) #type: ignore

''' Trecho temporário para teste para ver as models disponíveis no terminal
for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(f"Modelo disponível: {m.name}")
'''

# [NOVO] Token do GitHub para evitar o erro de "Rate Limit" (limite de acessos)
GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
headers = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}

app = FastAPI(title="CheckIA - Motor de Análise")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RepoRequest(BaseModel):
    repo_url: str # Recebe como string para validarmos manualmente

    @field_validator('repo_url')
    def validate_github_url(cls, v):
        # Usamos REGEX para garantir que a URL seja realmente do GitHub e tenha dono/projeto
        pattern = r'^https?://github\.com/([a-zA-Z0-9_-]+)/([a-zA-Z0-9_-]+)/?$'
        if not re.match(pattern, v):
            raise ValueError('A URL deve ser um repositório válido: https://github.com/usuario/projeto')
        return v
    
@app.post("/analyze")
async def analyze_repo(request: RepoRequest):
    # --- PARTE 1: EXTRAÇÃO DA URL (Melhoria aplicada) ---
    # Pegamos o link do GitHub e extraímos quem é o dono e qual o projeto
    match = re.search(r"github\.com/([^/]+)/([^/]+)", request.repo_url)
    
    if not match:
        raise HTTPException(status_code=400, detail="Não foi possível identificar o dono e o repositório.")

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

SUPABASE_URL = os.getenv(
    "SUPABASE_URL",
    "https://tbrasnqvnghpyqpaktul.supabase.co"
)

SUPABASE_KEY = os.getenv(
    "SUPABASE_SERVICE_ROLE_KEY",
    os.getenv(
        "SUPABASE_ANON_KEY",
        ""
    )
)

supabase_admin: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)
try:
    teste = supabase_admin.table("analises").select("*").limit(1).execute()
    print("✅ SUPABASE CONECTADO!")
    print("Resposta:", teste.data)

except Exception as e:
    print("❌ ERRO SUPABASE:")
    print(repr(e))


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

def criar_analise_no_supabase(
    user_id: str,
    tipo: str,
    origem: str
):
    """
    Cria a análise imediatamente no banco.

    Isso acontece ANTES da IA/scanner ser executado.
    Dessa forma, mesmo que a análise dê erro,
    teremos um registro no histórico.
    """

    if not supabase_admin or not user_id:
        return None

    try:
        analise_data = {
            "user_id": user_id,
            "tipo": tipo,
            "origem": origem,
            "score": 0,
            "linguagem_detectada": "aguardando",
            "resumo": "Análise em andamento.",
            "status": "em_andamento",
            "erro": None,
        }

        response = (
            supabase_admin
            .table("analises")
            .insert(analise_data)
            .execute()
        )

        if response.data:
            return response.data[0]["id"]

    except Exception as e:
        print("Erro ao criar análise no Supabase:", repr(e))

    return None


def finalizar_analise_no_supabase(
    analise_id,
    resultado_ia: dict
):
    """
    Atualiza uma análise que terminou com sucesso.
    """

    if not analise_id:
        return

    try:
        dados = {
            "score": resultado_ia.get("score", 0),
            "linguagem_detectada": resultado_ia.get(
                "linguagem_detectada",
                "desconhecida"
            ),
            "resumo": resultado_ia.get(
                "resumo",
                "Sem resumo disponível."
            ),
            "status": "concluida",
            "erro": None,
        }

        supabase_admin \
            .table("analises") \
            .update(dados) \
            .eq("id", analise_id) \
            .execute()

        salvar_vulnerabilidades(
            analise_id,
            resultado_ia
        )

    except Exception as e:
        print(
            "Erro ao finalizar análise no Supabase:",
            repr(e)
        )


def salvar_erro_analise_no_supabase(
    analise_id,
    erro: str
):
    """
    Marca a análise como erro, mantendo o registro no histórico.
    """

    if not analise_id:
        return

    try:
        dados = {
            "status": "erro",
            "score": 0,
            "linguagem_detectada": "não identificada",
            "resumo": "A análise não pôde ser concluída.",
            "erro": erro,
        }

        supabase_admin \
            .table("analises") \
            .update(dados) \
            .eq("id", analise_id) \
            .execute()

    except Exception as e:
        print(
            "Erro ao registrar falha da análise:",
            repr(e)
        )


def salvar_vulnerabilidades(
    analise_id,
    resultado_ia: dict
):
    """
    Salva as vulnerabilidades encontradas
    somente quando a análise foi concluída.
    """

    if not analise_id:
        return

    try:
        vulnerabilidades = resultado_ia.get(
            "vulnerabilidades",
            []
        )

        if not vulnerabilidades:
            return

        registros_vuln = []

        for v in vulnerabilidades:

            registros_vuln.append({
                "analise_id": analise_id,
                "user_id": resultado_ia.get("user_id"),
                "titulo": v.get(
                    "titulo",
                    "Vulnerabilidade sem título"
                ),
                "severidade": v.get(
                    "severidade",
                    "Média"
                ),
                "categoria": v.get(
                    "categoria",
                    "Geral"
                ),
                "descricao": v.get(
                    "descricao",
                    ""
                ),
                "linha": str(
                    v.get(
                        "linha",
                        "N/A"
                    )
                ),
                "recomendacao": v.get(
                    "recomendacao",
                    ""
                ),
                "status": "Aberta"
            })

        supabase_admin \
            .table("vulnerabilidades") \
            .insert(registros_vuln) \
            .execute()

    except Exception as e:
        print(
            "Erro ao salvar vulnerabilidades:",
            repr(e)
        )


def salvar_analise_concluida(
    user_id: str,
    analise_id,
    resultado_ia: dict
):
    """
    Compatibilidade/conveniência:
    adiciona o user_id ao resultado e finaliza a análise.
    """

    resultado_ia["user_id"] = user_id

    finalizar_analise_no_supabase(
        analise_id,
        resultado_ia
    )


# =========================================================
# ROTAS DE AUTENTICAÇÃO E REPOSITÓRIOS GITHUB
# =========================================================

@app.get("/")
async def home():
    return {
        "message": "CheckIA Backend funcionando."
    }


@app.get("/auth/github")
async def github_login(request: Request):

    if not GITHUB_CLIENT_ID or not GITHUB_REDIRECT_URI:
        raise HTTPException(
            status_code=500,
            detail="GitHub OAuth não configurado no .env"
        )

    state = secrets.token_urlsafe(32)

    request.session["github_oauth_state"] = state

    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "state": state,
        "scope": "read:user repo",
    }

    return RedirectResponse(
        "https://github.com/login/oauth/authorize?"
        + urlencode(params)
    )


@app.get("/auth/github/callback")
async def github_callback(
    request: Request,
    code: str | None = None,
    state: str | None = None
):

    if not code:
        raise HTTPException(
            status_code=400,
            detail="Código de autorização ausente."
        )

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

    request.session.pop(
        "github_oauth_state",
        None
    )

    async with httpx.AsyncClient() as client:

        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={
                "Accept": "application/json"
            },
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
                detail="Erro ao obter token do GitHub."
            )

        token_data = token_response.json()

        access_token = token_data.get(
            "access_token"
        )

        if not access_token:
            raise HTTPException(
                status_code=400,
                detail=token_data.get(
                    "error_description",
                    "Falha na autenticação."
                )
            )

        user_response = await client.get(
            "https://api.github.com/user",
            headers={
                "Authorization": f"Bearer {access_token}",
                "Accept": "application/vnd.github+json",
            },
        )

        user_data = user_response.json()

    request.session["github_access_token"] = (
        access_token
    )

    request.session["github_user"] = {
        "login": user_data.get("login"),
        "name": user_data.get("name"),
        "avatar_url": user_data.get("avatar_url"),
    }

    return HTMLResponse(
        """
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <title>GitHub Conectado</title>
        </head>

        <body style="
            font-family: Arial;
            background: #0d1117;
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
        ">

            <div style="text-align: center;">
                <h2>GitHub conectado com sucesso.</h2>
                <p>Você já pode fechar esta janela.</p>
            </div>

            <script>
                if (window.opener) {
                    window.opener.postMessage(
                        { type: "github-connected" },
                        "*"
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


@app.get("/github/me")
async def github_me(request: Request):

    github_user = request.session.get(
        "github_user"
    )

    if not github_user:
        raise HTTPException(
            status_code=401,
            detail="Usuário não conectado ao GitHub."
        )

    return github_user


@app.get("/github/repos")
async def github_repositories(
    request: Request
):

    access_token = request.session.get(
        "github_access_token"
    )

    if not access_token:
        raise HTTPException(
            status_code=401,
            detail="Usuário não conectado ao GitHub."
        )

    async with httpx.AsyncClient() as client:

        response = await client.get(
            "https://api.github.com/user/repos",
            headers={
                "Authorization":
                    f"Bearer {access_token}",
                "Accept":
                    "application/vnd.github+json"
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
            detail="Erro ao buscar repositórios."
        )

    return [
        {
            "id": repo.get("id"),
            "name": repo.get("name"),
            "full_name": repo.get("full_name"),
            "private": repo.get("private"),
            "html_url": repo.get("html_url"),
            "default_branch":
                repo.get("default_branch"),
            "description":
                repo.get("description"),
            "language":
                repo.get("language"),
            "updated_at":
                repo.get("updated_at"),
        }
        for repo in response.json()
    ]


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
        "message": "GitHub desconectado."
    }


# =========================================================
# IA
# =========================================================

async def analisar_com_seguranca(
    codigo: str
) -> dict:

    try:

        return await run_in_threadpool(
            analisar_codigo,
            codigo
        )

    except ResourceExhausted:

        raise HTTPException(
            status_code=429,
            detail="Limite diário gratuito da IA atingido."
        )

    except Exception as e:

        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=502,
            detail=f"Erro ao consultar a IA: {type(e).__name__}: {(e)}"
        )
    
        
        print(
            "ERRO IA:",
            repr(e)
        )

        


# =========================================================
# ANÁLISE DE CÓDIGO MANUAL
# =========================================================

@app.post("/analyze/code")
async def analisar_codigo_manual(
    codigo: str = Form(...),
    user_id: str = Form(None)
):

    analise_id = None

    if user_id:

        analise_id = criar_analise_no_supabase(
            user_id=user_id,
            tipo="codigo",
            origem="Código colado"
        )

    try:

        resultado = await analisar_com_seguranca(
            codigo
        )

        resultado["arquivos_analisados"] = 1

        if user_id:

            salvar_analise_concluida(
                user_id,
                analise_id,
                resultado
            )

        return resultado

    except HTTPException as e:

        if analise_id:

            salvar_erro_analise_no_supabase(
                analise_id,
                e.detail
            )

        raise e

    except Exception as e:

        if analise_id:

            salvar_erro_analise_no_supabase(
                analise_id,
                str(e)
            )

        raise HTTPException(
            status_code=500,
            detail="Erro inesperado durante a análise."
        )


# =========================================================
# ANÁLISE DE ZIP
# =========================================================

@app.post("/analyze/zip")
async def analisar_zip(
    arquivo: UploadFile = File(...),
    user_id: str = Form(None)
):

    analise_id = None

    if user_id:

        analise_id = criar_analise_no_supabase(
            user_id=user_id,
            tipo="zip",
            origem=f"ZIP: {arquivo.filename}"
        )

    try:

        conteudo = await arquivo.read()

        extensoes_validas = (
            ".py",
            ".js",
            ".jsx",
            ".ts",
            ".java",
            ".php",
            ".html",
            ".css",
            ".sql"
        )

        codigos_extraidos = []

        try:

            with zipfile.ZipFile(
                io.BytesIO(conteudo)
            ) as zip_ref:

                for nome_arquivo in zip_ref.namelist():

                    if (
                        nome_arquivo.endswith(
                            extensoes_validas
                        )
                        and not nome_arquivo.startswith(
                            "__MACOSX"
                        )
                    ):

                        with zip_ref.open(
                            nome_arquivo
                        ) as f:

                            texto = f.read().decode(
                                "utf-8",
                                errors="ignore"
                            )

                            codigos_extraidos.append(
                                f"# Arquivo: "
                                f"{nome_arquivo}\n"
                                f"{texto[:5000]}"
                            )

        except zipfile.BadZipFile:

            mensagem = (
                "O arquivo enviado não é "
                "um ZIP válido."
            )

            if analise_id:

                salvar_erro_analise_no_supabase(
                    analise_id,
                    mensagem
                )

            raise HTTPException(
                status_code=400,
                detail=mensagem
            )

        if not codigos_extraidos:

            resultado = {
                "score": 0,
                "linguagem_detectada":
                    "desconhecida",
                "resumo":
                    "Nenhum arquivo de código "
                    "reconhecido dentro do ZIP.",
                "vulnerabilidades": [],
                "arquivos_analisados": 0,
            }

            if user_id:

                salvar_analise_concluida(
                    user_id,
                    analise_id,
                    resultado
                )

            return resultado

        selecionados = codigos_extraidos[:15]

        resultado = await analisar_com_seguranca(
            "\n\n".join(selecionados)
        )

        resultado["arquivos_analisados"] = (
            len(selecionados)
        )

        if user_id:

            salvar_analise_concluida(
                user_id,
                analise_id,
                resultado
            )

        return resultado

    except HTTPException as e:

        if analise_id:

            salvar_erro_analise_no_supabase(
                analise_id,
                e.detail
            )

        raise e

    except Exception as e:

        print(
            "ERRO ZIP:",
            repr(e)
        )

        if analise_id:

            salvar_erro_analise_no_supabase(
                analise_id,
                str(e)
            )

        raise HTTPException(
            status_code=500,
            detail="Erro inesperado ao analisar o ZIP."
        )


# =========================================================
# ANÁLISE DO GITHUB
# =========================================================

@app.post("/analyze/github")
async def analisar_repo_github(
    request: Request,
    repo_full_name: str = Form(...),
    branch: str = Form("main"),
    user_id: str = Form(None)
):

    analise_id = None

    if user_id:

        analise_id = criar_analise_no_supabase(
            user_id=user_id,
            tipo="github",
            origem=f"GitHub: {repo_full_name}"
        )

    try:

        access_token = request.session.get(
            "github_access_token"
        )

        if not access_token:

            mensagem = (
                "Usuário não conectado ao GitHub."
            )

            if analise_id:

                salvar_erro_analise_no_supabase(
                    analise_id,
                    mensagem
                )

            raise HTTPException(
                status_code=401,
                detail=mensagem
            )

        if "/" not in repo_full_name:

            mensagem = "Repositório inválido."

            if analise_id:

                salvar_erro_analise_no_supabase(
                    analise_id,
                    mensagem
                )

            raise HTTPException(
                status_code=400,
                detail=mensagem
            )

        owner, repo = repo_full_name.split(
            "/",
            1
        )

        arquivos = await buscar_arquivos_repo(
            access_token,
            owner,
            repo,
            branch
        )

        if not arquivos:

            resultado = {
                "score": 0,
                "linguagem_detectada":
                    "desconhecida",
                "resumo":
                    "Nenhum arquivo de código "
                    "encontrado no repositório.",
                "vulnerabilidades": [],
                "arquivos_analisados": 0,
            }

            if user_id:

                salvar_analise_concluida(
                    user_id,
                    analise_id,
                    resultado
                )

            return resultado

        resultado = await analisar_com_seguranca(
            "\n\n".join(arquivos)
        )

        resultado["arquivos_analisados"] = (
            len(arquivos)
        )

        if user_id:

            salvar_analise_concluida(
                user_id,
                analise_id,
                resultado
            )

        return resultado

    except HTTPException as e:

        if analise_id:

            salvar_erro_analise_no_supabase(
                analise_id,
                e.detail
            )

        raise e

    except Exception as e:

        print(
            "ERRO GITHUB:",
            repr(e)
        )

        if analise_id:

            salvar_erro_analise_no_supabase(
                analise_id,
                str(e)
            )

        raise HTTPException(
            status_code=500,
            detail="Erro inesperado durante a análise do GitHub."
        )

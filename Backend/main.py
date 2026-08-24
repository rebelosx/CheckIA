import os
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

    owner = match.group(1)
    repo = match.group(2).rstrip("/").replace(".git", "")

    print(f"Iniciando análise para: {owner}/{repo}")

    # --- PARTE 2: BUSCAR A ÁRVORE (TREE) NO GITHUB ---
    codigo_para_ia = "" #variável que vai armazenar o código para enviar à IA

    # Configuração de Timeout
    # 10 segundos para resposta total e 5 segundos para conectar
    timeout_config = httpx.Timeout(30.0, connect=10.0)
    
    async with httpx.AsyncClient(timeout=timeout_config) as client:
        try:
            repo_response = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
            if repo_response.status_code != 200:
                raise HTTPException(status_code=404, detail="Não consegui acessar o repositório. Verifique se o link é público.")

            default_branch = repo_response.json().get("default_branch", "main")
            github_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{quote(default_branch, safe='')}?recursive=1"
            response = await client.get(github_url, headers=headers)

            if response.status_code != 200:
                raise HTTPException(status_code=502, detail="Não consegui listar os arquivos do repositório.")

            tree = response.json().get("tree", [])

        except httpx.TimeoutException:
            raise HTTPException(status_code=504, detail="O GitHub demorou demais para responder. Tente novamente.")
        
        # 2. Aplicamos a "Blacklist" para ignorar lixo e arquivos pesados [3]
        blacklist = ['node_modules', '.git', 'package-lock.json', '.png', '.jpg', '.env', '.pem', '.key']
        filtered_files = [f["path"] for f in tree if f["type"] == "blob" and not any(i in f["path"] for i in blacklist)]

        # --- PARTE 3: COLETA DO CONTEÚDO  ---
        # Analisa todos os arquivos de texto encontrados na árvore do repositório.
        for path in filtered_files:
            content_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
            res = await client.get(content_url, headers=headers)
        
            if res.status_code == 200:
                try:
                    # Tentamos decodificar. Se for um arquivo binário que passou pelo filtro, não travamos o código!
                    raw_content = res.json().get('content', '')
                    # Decodificação segura para evitar erros de arquivos binários
                    decoded_bytes = base64.b64decode(raw_content)
                    content = decoded_bytes.decode('utf-8')
                    codigo_para_ia += f"--- ARQUIVO: {path} ---\n{content}\n\n"
                except (UnicodeDecodeError, ValueError):
                    # Se der erro de leitura (UTF-8), apenas pulamos o arquivo
                    print(f"Pulando arquivo não-texto: {path}")
                    continue

    # --- PARTE 4: ENGENHARIA DE PROMPT (Instruindo a IA [1]) ---
    # Aqui definimos o modelo e como a IA deve se comportar
    model = genai.GenerativeModel('gemini-flash-latest') # type: ignore

     # 1. Primeiro, verifique no terminal se o código está chegando o print fica fora do prompt para não confundir a IA
    print(f"Enviando {len(codigo_para_ia)} caracteres para análise...")

    # Criamos o "Prompt de Segurança": definimos a persona da IA e o formato da resposta
    # Pedimos especificamente o formato JSON para que o João e o Jonathan consigam exibir no front [4]
    prompt = f"""
    Você é um assistente de ensino especializado em boas práticas de programação e qualidade de software.
    Sua tarefa é analisar o código abaixo para fins didáticos e sugerir melhorias de robustez, seguindo padrões profissionais de desenvolvimento.
    
    FOCO DA REVISÃO PEDAGÓGICA:
    - Verificação de configurações (boas práticas de armazenamento).
    - Higienização de dados e proteção contra entradas inesperadas.
    - Melhoria na clareza e tratamento de erros do sistema.

    REGRAS DE SAÍDA:
    - Retorne APENAS o objeto JSON abaixo.
    - Se o código for seguro, retorne o array vazio.

    FORMATO JSON:
    {{
      "vulnerabilidades": [
        {{
          "arquivo": "nome_do_arquivo",
          "risco": "Título da melhoria (ex: Proteção de Dados)",
          "severidade": "Alta/Média/Baixa",
          "descricao": "Explicação pedagógica do ponto de atenção",
          "correcao": "Sugestão de código para melhoria"
        }}
      ]
    }}

    CÓDIGO PARA REVISÃO DE ESTUDO:
    {codigo_para_ia}
    """

    # Enviamos tudo para o Google e recebemos a análise
    ai_response = model.generate_content(prompt)
    
    # --- PARTE 5: RETORNO DA API ---
    # Devolvemos o resultado final que será usado para alimentar o Dashboard [5]
    return {
        "repo": f"{owner}/{repo}",
        "status": "sucesso",
        "analise_ia": ai_response.text
    }
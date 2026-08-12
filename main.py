import requests
import base64  # Necessário para decodificar o conteúdo que vem do GitHub
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="CheckIA - Motor de Análise")

class RepoRequest(BaseModel):
    repo_url: str

@app.post("/analyze")
async def analyze_repo(request: RepoRequest):
    # --- PARTE 1: Extração e Listagem ---
    
    # 1. Extraindo owner e repo da URL (Ex: https://github.com/usuario/projeto)
    # Vamos "quebrar" a URL pelas barras e pegar as últimas partes [3]
    parts = request.repo_url.rstrip("/").split("/")
    owner = parts[-2]
    repo = parts[-1]

    # 2. Chamando a API do GitHub para listar os arquivos
    # O parâmetro recursive=1 traz todas as pastas de uma vez [3]
    github_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
    response = requests.get(github_url)
    
    if response.status_code != 200:
        return {"error": "Não consegui acessar o repositório. Verifique se a URL é pública."}

    tree = response.json().get("tree", [])

    # 3. Criando a Blacklist (Filtro de Código)
    # Ignoramos o que não é código ou o que é muito pesado/desnecessário para a IA [1, 4]
    blacklist = ['node_modules', '.git', 'package-lock.json', '.png', '.jpg', '.pdf', 'dist', 'build']
    
    filtered_files = []
    for file in tree:
        # Só queremos 'blobs' (arquivos reais) e que NÃO estejam na blacklist [4]
        path = file.get("path", "")
        if file["type"] == "blob" and not any(ignored in path for ignored in blacklist):
            filtered_files.append(path)

    # --- PARTE 2: Coleta de Conteúdo Real (Nova Etapa) ---
    
    arquivos_com_conteudo = []
    
    # Percorremos a lista filtrada para buscar o "texto" de cada arquivo
    # Limitamos aos primeiros 10 arquivos para o teste inicial não ser lento
    for path in filtered_files[:10]: 
        content_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
        content_resp = requests.get(content_url)
        
        if content_resp.status_code == 200:
            data = content_resp.json()
            # O GitHub envia o código em Base64, decodificamos para texto legível (UTF-8)
            conteudo_decodificado = base64.b64decode(data['content']).decode('utf-8')
            
            arquivos_com_conteudo.append({
                "arquivo": path,
                "codigo": conteudo_decodificado
            })

    # Retornamos para o Frontend (Jonathan/João) e para a IA (Gabriel) apenas o que importa [2, 5]
    return {
        "repo": f"{owner}/{repo}",
        "total_arquivos_filtrados": len(filtered_files),
        "arquivos_analisados": arquivos_com_conteudo
    }
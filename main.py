import requests
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class RepoRequest(BaseModel):
    repo_url: str

@app.post("/analyze")
async def analyze_repo(request: RepoRequest):
    # 1. Extraindo owner e repo da URL (Ex: https://github.com/usuario/projeto)
    # Vamos "quebrar" a URL pelas barras e pegar as últimas partes
    parts = request.repo_url.rstrip("/").split("/")
    owner = parts[-2]
    repo = parts[-1]

    # 2. Chamando a API do GitHub para listar os arquivos [2]
    # O parâmetro recursive=1 traz todas as pastas de uma vez
    github_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/main?recursive=1"
    response = requests.get(github_url)
    
    if response.status_code != 200:
        return {"error": "Não consegui acessar o repositório. Verifique se a URL é pública."}

    tree = response.json().get("tree", [])

    # 3. Criando a Blacklist (Filtro de Código) [3]
    # Ignoramos o que não é código ou o que é muito pesado/desnecessário
    blacklist = ['node_modules', '.git', 'package-lock.json', '.png', '.jpg', '.pdf']
    
    filtered_files = []
    for file in tree:
        # Só queremos 'blobs' (arquivos reais) e que NÃO estejam na blacklist [3]
        path = file.get("path", "")
        if file["type"] == "blob" and not any(ignored in path for ignored in blacklist):
            filtered_files.append(path)

    # Retornamos para o Frontend (Jonathan/Gabriel) apenas o que importa [4]
    return {
        "repo": f"{owner}/{repo}",
        "total_arquivos_encontrados": len(filtered_files),
        "arquivos_para_analise": filtered_files
    }
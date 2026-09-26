import base64
import httpx

EXTENSOES_VALIDAS = (".py", ".js", ".jsx", ".ts", ".java", ".php", ".html", ".css", ".sql")

async def buscar_arquivos_repo(token_github: str, owner: str, repo: str, branch: str) -> list[str]:
    """Usa o token de acesso do GitHub (o mesmo já usado em /github/repos)
    para baixar os arquivos de código do repositório."""

    headers = {"Authorization": f"Bearer {token_github}"}

    async with httpx.AsyncClient() as client:
        resp_tree = await client.get(
            f"https://api.github.com/repos/{owner}/{repo}/git/trees/{branch}?recursive=1",
            headers=headers,
        )
        resp_tree.raise_for_status()
        arvore = resp_tree.json()

        arquivos_codigo = [
            item["path"] for item in arvore.get("tree", [])
            if item["type"] == "blob" and item["path"].endswith(EXTENSOES_VALIDAS)
        ][:15]  # limita para não estourar o limite de tokens da IA

        conteudos = []
        for caminho in arquivos_codigo:
            resp_arquivo = await client.get(
                f"https://api.github.com/repos/{owner}/{repo}/contents/{caminho}?ref={branch}",
                headers=headers,
            )
            if resp_arquivo.status_code != 200:
                continue
            dados = resp_arquivo.json()
            if dados.get("encoding") == "base64":
                texto = base64.b64decode(dados["content"]).decode("utf-8", errors="ignore")
                conteudos.append(f"# Arquivo: {caminho}\n{texto[:5000]}")

        return conteudos
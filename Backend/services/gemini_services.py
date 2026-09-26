import os
import json
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

MODELO = "gemini-2.0-flash"

PROMPT_BASE = """
Você é um especialista em segurança de aplicações (AppSec), atuando como um scanner
automático de vulnerabilidades, seguindo o padrão OWASP Top 10.

Analise o código abaixo e identifique vulnerabilidades reais, com base em:
- Injeção (SQL, comando, LDAP)
- Quebra de autenticação e gerenciamento de sessão
- Exposição de dados sensíveis (chaves, senhas, tokens no código)
- Configurações de segurança incorretas
- Cross-Site Scripting (XSS)
- Deserialização insegura
- Uso de componentes com vulnerabilidades conhecidas
- Falta de validação de entrada

Responda APENAS em JSON válido, sem markdown, sem texto fora do JSON, seguindo
exatamente este formato:

{
  "score": 0-100,
  "linguagem_detectada": "string",
  "resumo": "string curta explicando o estado geral de segurança",
  "vulnerabilidades": [
    {
      "titulo": "string",
      "severidade": "Alta" | "Média" | "Baixa",
      "categoria": "string (ex: Injeção de SQL, Chave exposta)",
      "descricao": "string explicando o problema encontrado",
      "linha": "número da linha ou trecho aproximado, string",
      "recomendacao": "string com a correção sugerida"
    }
  ]
}

Se não encontrar nenhuma vulnerabilidade, devolva "vulnerabilidades": [] e um score alto.
Nunca invente vulnerabilidades que não existem no código enviado.

CÓDIGO A ANALISAR:
"""

def analisar_codigo(codigo: str) -> dict:
    modelo = genai.GenerativeModel(MODELO)

    resposta = modelo.generate_content(
        PROMPT_BASE + "\n\n```\n" + codigo + "\n```",
        generation_config={"temperature": 0.2},
    )

    texto = resposta.text.strip()

    if texto.startswith("```"):
        texto = texto.strip("`")
        if texto.lower().startswith("json"):
            texto = texto[4:]

    try:
        return json.loads(texto)
    except json.JSONDecodeError:
        return {
            "score": 0,
            "linguagem_detectada": "desconhecida",
            "resumo": "Não foi possível interpretar a resposta da IA.",
            "vulnerabilidades": [],
            "erro_bruto": texto[:500],
        }
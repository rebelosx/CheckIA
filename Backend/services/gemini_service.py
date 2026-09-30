import os
import json
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()

# Cliente oficial da SDK atualizada
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

# Modelo oficial ativo no Google AI Studio
MODELO = "gemini-3.5-flash-lite"

PROMPT_BASE = """
Você é um especialista em segurança de aplicações (AppSec), atuando como um scanner
automático de vulnerabilidades, seguindo o padrão OWASP Top 10.
Analise o código abaixo e identifique vulnerabilidades reais, com base em:
1. Injeção (SQL, comando, LDAP)
2. Quebra de autenticação e gerenciamento de sessão
3. Exposição de dados sensíveis (chaves, senhas, tokens no código)
4. Configurações de segurança incorretas
5. Cross-Site Scripting (XSS)
6. Deserialização insegura
7. Uso de componentes com vulnerabilidades conhecidas
8. Falta de validação de entrada

Responda APENAS em JSON válido, sem markdown, sem texto fora do JSON, seguindo exatamente este formato:
{
  "score": 0,
  "linguagem_detectada": "string",
  "resumo": "string curta explicando o estado geral de segurança",
  "vulnerabilidades": [
    {
      "titulo": "string",
      "severidade": "Alta | Média | Baixa",
      "categoria": "string (ex: Injeção de SQL, Chave exposta)",
      "descricao": "string explicando o problema encontrado",
      "linha": "número da linha ou trecho aproximado",
      "recomendacao": "string com a correção sugerida"
    }
  ]
}

Se não encontrar nenhuma vulnerabilidade, devolva "vulnerabilidades": [] e um score alto.
Nunca invente vulnerabilidades que não existem no código enviado.
Seja direto e conciso nas descrições e recomendações, para caber dentro do limite de tokens de resposta. Não repita o código enviado na resposta.

CÓDIGO A ANALISAR:
"""

def analisar_codigo(codigo: str) -> dict:
    prompt_completo = PROMPT_BASE + "\n\n" + codigo + "\n"

    # Configuração enxuta mantendo a resposta estrita em JSON
    configuracao = types.GenerateContentConfig(
        response_mime_type="application/json",
    )

    resposta = client.models.generate_content(
        model=MODELO,
        contents=prompt_completo,
        config=configuracao
    )

    texto = resposta.text.strip()

    if texto.startswith("```"):
        linhas = texto.splitlines()
        if linhas[0].startswith("```"):
            linhas = linhas[1:]
        if linhas and linhas[-1].startswith("```"):
            linhas = linhas[:-1]
        texto = "\n".join(linhas).strip()

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
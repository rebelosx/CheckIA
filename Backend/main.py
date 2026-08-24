import os
import re
import httpx # [biblioteca para requisições assíncronas]
import base64
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv # Biblioteca para ler o arquivo .env com segurança
import secrets
from starlette.middleware.sessions import SessionMiddleware
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

load_dotenv(BASE_DIR / ".env")

app = FastAPI(title="CheckIA - Motor de Análise")
app.add_middleware(
    SessionMiddleware,
    secret_key="3399ba75b865f2bd7224d129153c796ea16222be"
)

GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI")

@app.get("/auth/github")
async def github_login(request: Request):

    state = secrets.token_urlsafe(32)

    request.session["github_oauth_state"] = state

    github_url = (
        "https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&redirect_uri={GITHUB_REDIRECT_URI}"
        f"&state={state}"
        "&scope=read:user"
    )

    return RedirectResponse(github_url)

@app.get("/auth/github/callback")
async def github_callback(
    request: Request,
    code: str,
    state: str
):

    saved_state = request.session.get(
        "github_oauth_state"
    )

    if (
        not saved_state
        or state != saved_state
    ):
        return {
            "error":
                "Estado OAuth inválido."
        }


    async with httpx.AsyncClient() as client:

        token_response = (
            await client.post(
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
        )


        token_data = (
            token_response.json()
        )


        access_token = (
            token_data.get(
                "access_token"
            )
        )


        if not access_token:

            return {
                "error":
                    "Não foi possível obter o token."
            }


        user_response = (
            await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization":
                        f"Bearer {access_token}",
                    "Accept":
                        "application/vnd.github+json",
                },
            )
        )


        user_data = (
            user_response.json()
        )


        return {
            "login":
                user_data.get("login"),
            "name":
                user_data.get("name"),
            "avatar_url":
                user_data.get(
                    "avatar_url"
                ),
        }
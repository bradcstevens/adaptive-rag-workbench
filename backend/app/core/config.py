from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    openai_endpoint: str = ""
    openai_key: str = ""
    openai_chat_deployment: str = "gpt-4.1"
    openai_embed_deployment: str = "text-embedding-3-small"
    
    search_endpoint: str = ""
    search_admin_key: str = ""
    search_index: str = "filings"
    
    foundry_endpoint: Optional[str] = None
    foundry_api_key: Optional[str] = None
    
    document_intel_account_url: str = ""
    document_intel_key: str = ""
    
    tenant_id: Optional[str] = None
    api_client_id: Optional[str] = None
    authority: Optional[str] = None
    user_flow: Optional[str] = None
    jwks_uri: Optional[str] = None
    api_audience: Optional[str] = None
    
    class Config:
        env_file = ".env"

settings = Settings()

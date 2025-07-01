from fastapi import APIRouter, Request, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Dict, Any
import json
import asyncio
from ..agents.orchestrator import OrchestratorAgent
from ..agents.retriever import RetrieverAgent
from ..agents.writer import WriterAgent
from ..agents.verifier import VerifierAgent
from ..agents.curator import CuratorAgent
from ..core.globals import initialize_kernel, get_agent_registry
from ..auth.middleware import get_current_user

router = APIRouter()

class ChatRequest(BaseModel):
    prompt: str
    mode: str = "context-aware-generation"

kernel = initialize_kernel()

orchestrator = OrchestratorAgent(kernel, get_agent_registry())
retriever = RetrieverAgent(kernel)
writer = WriterAgent(kernel)
verifier = VerifierAgent(kernel)
curator = CuratorAgent(kernel)

orchestrator.set_agents(
    retriever=retriever,
    writer=writer,
    verifier=verifier,
    curator=curator
)

@router.post("/chat")
async def chat_stream(request: ChatRequest, current_user: dict = Depends(get_current_user)):
    try:
        plan = await orchestrator.create_plan({"mode": request.mode})
        
        async def generate():
            try:
                async for token in orchestrator.run_stream(request.prompt, plan):
                    yield f"data: {json.dumps({'token': token})}\n\n"
                yield f"data: {json.dumps({'done': True})}\n\n"
            except Exception as e:
                yield f"data: {json.dumps({'error': str(e)})}\n\n"
        
        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

import os
import shutil
import asyncio
import json
import numpy as np
from functools import partial
from fastapi import FastAPI, UploadFile, File, Header, Form, HTTPException
from pydantic import BaseModel
from typing import Optional

from lightrag import LightRAG, QueryParam
from lightrag.llm.gemini import gemini_model_complete, gemini_embed
from lightrag.utils import EmbeddingFunc
import logging
import anthropic

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger("SovereignRAG")

app = FastAPI(title="LightRAG API Sidecar")

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
VISION_MODEL = os.environ.get("VISION_MODEL", "gemini-1.5-pro")
NEO4J_URI = os.environ.get("NEO4J_URI", "neo4j://neo4j:7687")
NEO4J_USER = os.environ.get("NEO4J_USERNAME", "neo4j")
NEO4J_PASS = os.environ.get("NEO4J_PASSWORD", "restaurant_os_2026")
ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")

# Cache LightRAG instances per workspace for tenant isolation
instances = {}

class SemanticCache:
    def __init__(self, workspace: str, threshold: float = 0.85):
        self.workspace = workspace
        self.threshold = threshold
        self.cache_dir = f"./rag_storage/{workspace}"
        os.makedirs(self.cache_dir, exist_ok=True)
        self.cache_file = os.path.join(self.cache_dir, "semantic_cache.json")
        self.cache = self._load_cache()

    def _load_cache(self):
        if os.path.exists(self.cache_file):
            try:
                with open(self.cache_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            except Exception:
                return []
        return []

    def _save_cache(self):
        with open(self.cache_file, 'w', encoding='utf-8') as f:
            json.dump(self.cache, f, ensure_ascii=False)

    def _cosine_similarity(self, vec1, vec2):
        dot_product = np.dot(vec1, vec2)
        norm_a = np.linalg.norm(vec1)
        norm_b = np.linalg.norm(vec2)
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return float(dot_product / (norm_a * norm_b))

    def get(self, query_vector):
        if not self.cache:
            return None
        
        q_vec = np.array(query_vector)
        best_score = -1
        best_match = None
        
        for item in self.cache:
            item_vec = np.array(item["vector"])
            score = self._cosine_similarity(q_vec, item_vec)
            if score > best_score:
                best_score = score
                best_match = item
                
        if best_score >= self.threshold:
            logger.info(f"⚡ FAST BRAIN HIT (score: {best_score:.4f})")
            return best_match["response"]
        
        logger.info(f"🐌 SLOW BRAIN MISS (best score: {best_score:.4f})")
        return None

    def set(self, query: str, query_vector: list, response: str):
        self.cache.append({
            "query": query,
            "vector": query_vector,
            "response": response
        })
        self._save_cache()
        
    def clear(self):
        self.cache = []
        self._save_cache()
        
    def stats(self):
        return {"cached_queries": len(self.cache)}

semantic_caches = {}

def get_semantic_cache(workspace: str):
    if workspace not in semantic_caches:
        semantic_caches[workspace] = SemanticCache(workspace)
    return semantic_caches[workspace]

async def get_rag_instance(workspace: str):
    if workspace in instances:
        return instances[workspace]
    
    working_dir = f"./rag_storage/{workspace}"
    os.makedirs(working_dir, exist_ok=True)
    
    async def llm_model_func(prompt, system_prompt=None, history_messages=[], **kwargs):
        kwargs.pop("model_name", None)
        binding = os.environ.get("LLM_BINDING", "gemini")
        model = os.environ.get("LLM_MODEL", "gemini-2.0-flash")
        base_url = os.environ.get("OPENAI_BASE_URL")
        
        if binding == "anthropic":
            print(f"DEBUG: Using Anthropic model -> {model}")
            client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)
            messages = history_messages + [{"role": "user", "content": prompt}]
            response = await client.messages.create(
                model=model,
                max_tokens=kwargs.get("max_tokens", 4096),
                system=system_prompt if system_prompt else "",
                messages=messages
            )
            return response.content[0].text
        elif binding == "openai":
            from openai import AsyncOpenAI
            key = os.environ.get("OPENAI_API_KEY")
            print(f"DEBUG: Using OpenAI-compatible model (OpenRouter) -> {model}")
            
            # OpenRouter mandatory headers
            extra_headers = {
                "HTTP-Referer": "https://restaurant-os.com",
                "X-Title": "Restaurant OS Core RAG"
            }
            
            client = AsyncOpenAI(api_key=key, base_url=base_url, default_headers=extra_headers)
            messages = [{"role": "system", "content": system_prompt}] if system_prompt else []
            messages += history_messages + [{"role": "user", "content": prompt}]
            
            # Filter kwargs for OpenAI compatibility
            openai_kwargs = {}
            allowed_params = ["temperature", "top_p", "n", "stream", "stop", "max_tokens", "presence_penalty", "frequency_penalty", "logit_bias", "user"]
            for k, v in kwargs.items():
                if k in allowed_params:
                    openai_kwargs[k] = v
            
            # Cap max_tokens to prevent 402 errors on OpenRouter
            if "max_tokens" in openai_kwargs:
                openai_kwargs["max_tokens"] = min(openai_kwargs["max_tokens"], 4096)
            else:
                openai_kwargs["max_tokens"] = 4096
                    
            response = await client.chat.completions.create(
                model=model,
                messages=messages,
                **openai_kwargs
            )
            content = response.choices[0].message.content
            print(f"DEBUG: LLM Response (100 chars): {content[:100]}...")
            return content
        else:
            print(f"DEBUG: Using Gemini model -> {model}")
            return await gemini_model_complete(
                prompt, system_prompt=system_prompt, history_messages=history_messages,
                model_name=model, api_key=GEMINI_API_KEY, **kwargs
            )
            
    async def embedding_func_wrapper(texts, **kwargs):
        binding = os.environ.get("EMBEDDING_BINDING", "gemini")
        print(f"DEBUG: Embedding {len(texts)} texts using {binding}...")
        
        if binding == "openai":
            from openai import AsyncOpenAI
            key = os.environ.get("OPENAI_API_KEY")
            base_url = os.environ.get("OPENAI_BASE_URL")
            client = AsyncOpenAI(api_key=key, base_url=base_url)
            model = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")
            response = await client.embeddings.create(input=texts, model=model)
            import numpy as np
            return np.array([data.embedding for data in response.data])
        else:
            # Default to Gemini
            tasks = [gemini_embed([text], model=os.environ.get("EMBEDDING_MODEL", "models/gemini-embedding-2"), api_key=GEMINI_API_KEY, embedding_dim=1536) for text in texts]
            results = await asyncio.gather(*tasks)
            import numpy as np
            return np.vstack(results)

    embedding_func = EmbeddingFunc(
        embedding_dim=int(os.environ.get("EMBEDDING_DIM", 1536)), 
        max_token_size=2048,
        func=embedding_func_wrapper,
    )
    
    # Initialize LightRAG with all settings from environment
    rag = LightRAG(
        working_dir=working_dir,
        workspace=workspace,
        llm_model_func=llm_model_func,
        embedding_func=embedding_func,
        kv_storage=os.environ.get("LIGHTRAG_KV_STORAGE", "JsonKVStorage"),
        vector_storage=os.environ.get("LIGHTRAG_VECTOR_STORAGE", "NanoVectorDBStorage"),
        graph_storage=os.environ.get("LIGHTRAG_GRAPH_STORAGE", "Neo4JStorage"),
        doc_status_storage=os.environ.get("LIGHTRAG_DOC_STATUS_STORAGE", "JsonDocStatusStorage"),
        llm_model_name=os.environ.get("LLM_MODEL", "gemini-2.0-flash"),
    )
    await rag.initialize_storages()
    
    logger.info(f"LightRAG instance créée pour workspace: {workspace}")
    instances[workspace] = rag
    return rag

class QueryRequest(BaseModel):
    query: str
    mode: str = "mix"
    only_need_context: bool = False
    top_k: Optional[int] = None

class InsertRequest(BaseModel):
    text: str
    id: Optional[str] = None

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/query")
async def query(req: QueryRequest, x_workspace: str = Header(default="default")):
    cache = get_semantic_cache(x_workspace)
    
    try:
        # 1. Generate query vector
        binding = os.environ.get("EMBEDDING_BINDING", "gemini")
        if binding == "openai":
            from openai import AsyncOpenAI
            key = os.environ.get("OPENAI_API_KEY")
            base_url = os.environ.get("OPENAI_BASE_URL")
            client = AsyncOpenAI(api_key=key, base_url=base_url)
            model = os.environ.get("EMBEDDING_MODEL", "text-embedding-3-small")
            response = await client.embeddings.create(input=[req.query], model=model)
            query_vector = response.data[0].embedding
        else:
            vec_result = await gemini_embed([req.query], model=os.environ.get("EMBEDDING_MODEL", "models/gemini-embedding-2"), api_key=GEMINI_API_KEY, embedding_dim=1536)
            query_vector = vec_result[0].tolist() if hasattr(vec_result[0], 'tolist') else list(vec_result[0])
        
        # 2. Check Fast Brain (Semantic Cache)
        cached_response = cache.get(query_vector)
        if cached_response is not None:
            return {"response": cached_response, "source": "fast_brain"}
            
        # 3. Slow Brain (RAG Query)
        STRICT_SYSTEM_PROMPT = """---ROLE---
You are a sovereign expert in French Consumer Law. You are strictly forbidden from answering any questions that are not related to the Consumer Code (Code de la consommation).

---CONSTRAINTS---
1. If the user query is about cooking (recipes), weather, personal advice, or any topic OUTSIDE of consumer law, you MUST respond:
"Désolé, je ne peux répondre qu'aux questions relatives au Code de la consommation. Votre demande est hors-sujet."
2. DO NOT use your internal knowledge to fill gaps. Use ONLY the provided context.
3. If the context is empty or irrelevant, refuse to answer.
4. DO NOT invent references or hallucinate recipes.
5. If the user asks for a recipe, weather or non-legal info, you must refuse even if you know the answer.
"""
        rag = await get_rag_instance(x_workspace)
        res = await rag.aquery(req.query, param=QueryParam(mode=req.mode), system_prompt=STRICT_SYSTEM_PROMPT)
        
        # 4. Save to cache
        cache.set(req.query, query_vector, res)
        
        return {"response": res, "source": "slow_brain"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cache/stats")
async def cache_stats(x_workspace: str = Header(default="default")):
    cache = get_semantic_cache(x_workspace)
    return cache.stats()

@app.post("/cache/clear")
async def cache_clear(x_workspace: str = Header(default="default")):
    cache = get_semantic_cache(x_workspace)
    cache.clear()
    return {"status": "success", "message": "Cache cleared"}

@app.post("/documents/text")
async def insert_text(req: InsertRequest, x_workspace: str = Header(default="default")):
    rag = await get_rag_instance(x_workspace)
    try:
        await rag.ainsert(req.text)
        return {"status": "success", "message": "Text inserted successfully"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/documents/upload")
async def upload_document(
    file: UploadFile = File(...), 
    id: Optional[str] = Form(None), 
    x_workspace: str = Header(default="default")
):
    rag = await get_rag_instance(x_workspace)
    
    temp_dir = f"./temp/{x_workspace}"
    os.makedirs(temp_dir, exist_ok=True)
    file_path = os.path.join(temp_dir, file.filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
        await rag.ainsert(content)
        return {"status": "success", "message": f"Document {file.filename} processed successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9621)

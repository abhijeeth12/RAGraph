import json
import re
from loguru import logger
from app.config import settings

async def extract_semantic_triplets(text: str) -> list[dict]:
    """
    Uses the configured LLM to extract Entities and Relationships from text.
    Returns a list of dicts: {"source": "EntityA", "target": "EntityB", "label": "relationship", "source_type": "Concept", "target_type": "Concept"}
    """
    if not settings.openai_api_key:
        logger.warning("No OpenAI API key configured. Skipping semantic extraction.")
        return []

    from app.core.generation.llm_client import _openai_client, _openrouter_headers
    client = _openai_client()
    
    prompt = """
    Extract a knowledge graph from the following text.
    Identify the key entities (Concepts, Persons, Organizations, Locations) and the relationships between them.
    Output the result STRICTLY as a JSON list of objects with the following keys:
    - "source": Name of the source entity (string)
    - "target": Name of the target entity (string)
    - "label": A short description of the relationship (string, e.g., "causes", "is part of", "developed")
    - "source_type": The type of the source entity (e.g., "Concept", "Person", "Organization", "Location")
    - "target_type": The type of the target entity (e.g., "Concept", "Person", "Organization", "Location")
    
    Example output:
    [
      {"source": "Machine Learning", "target": "Artificial Intelligence", "label": "is a subset of", "source_type": "Concept", "target_type": "Concept"}
    ]
    
    Only output the JSON array, no markdown formatting or other text.
    Text:
    """

    model = settings.resolve_generation_model()
    is_free = ":free" in model or model == "openrouter/free"
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a precise knowledge graph extraction system. You only output valid JSON arrays. Never add explanatory text, only the JSON array."},
                {"role": "user", "content": prompt + text[:5000]}
            ],
            temperature=0.1,
            max_tokens=2000,
            extra_headers=_openrouter_headers(),
        )
        
        content = response.choices[0].message.content
        if not content:
            return []
            
        # Robust markdown / prefix stripping
        content = content.strip()
        # Remove ```json ... ``` or ``` ... ``` fences via regex
        fence_match = re.search(r"```(?:json)?\s*(.*?)\s*```", content, re.DOTALL)
        if fence_match:
            content = fence_match.group(1).strip()
        # If LLM prepended text like "Here is the JSON: [...]", extract first [...] block
        if not content.startswith("["):
            arr_match = re.search(r"\[.*\]", content, re.DOTALL)
            if arr_match:
                content = arr_match.group(0)
        
        content = content.strip()
        if not content:
            return []

        # Try direct parse, then repair attempts
        try:
            triplets = json.loads(content)
        except json.JSONDecodeError as je:
            logger.warning(f"Triplet JSON parse failed at char {je.pos}: {je.msg}; attempting repair (len={len(content)}) preview={content[:300]!r}")
            # Repair: remove trailing commas before ] or }, handle truncated JSON
            repaired = re.sub(r",\s*([\]}])", r"\1", content)
            # If truncated (no closing ], try to close)
            if not repaired.rstrip().endswith("]"):
                # Find last complete object and close array
                last_brace = repaired.rfind("}")
                if last_brace != -1:
                    repaired = repaired[:last_brace+1] + "]"
                    logger.info("Repaired truncated JSON by closing array")
                else:
                    repaired = "[]"
            try:
                triplets = json.loads(repaired)
                logger.info("Repaired JSON parsed successfully")
            except Exception as je2:
                logger.error(f"Failed to extract semantic triplets after repair: {je2} at char {getattr(je2,'pos','?')} (char 1797-type error). Raw preview: {content[max(0,je.pos-100):je.pos+200]!r}")
                return []

        if isinstance(triplets, list):
            # Validate shape, filter bad entries
            valid = [t for t in triplets if isinstance(t, dict) and t.get("source") and t.get("target")]
            if len(valid) != len(triplets):
                logger.info(f"Filtered {len(triplets)-len(valid)} invalid triplets")
            return valid
        if isinstance(triplets, dict):
            return [triplets]
        return []
    except Exception as e:
        # Use repr to avoid empty str(e) hiding the error (seen as "Ingestion failed: " with blank)
        logger.exception(f"Failed to extract semantic triplets: {repr(e)}")
        return []

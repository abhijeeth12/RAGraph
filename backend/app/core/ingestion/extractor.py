import json
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
    # Use a faster/cheaper model if possible for extraction, or the default
    is_free = ":free" in model or model == "openrouter/free"
    
    try:
        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a precise knowledge graph extraction system. You only output valid JSON arrays."},
                {"role": "user", "content": prompt + text[:3000]} # Limit text length to avoid token limits
            ],
            temperature=0.1,
            max_tokens=1500,
            extra_headers=_openrouter_headers(),
        )
        
        content = response.choices[0].message.content
        if not content:
            return []
            
        # Clean up markdown if the LLM hallucinated it
        content = content.strip()
        if content.startswith("```json"):
            content = content[7:]
        if content.endswith("```"):
            content = content[:-3]
            
        triplets = json.loads(content.strip())
        if isinstance(triplets, list):
            return triplets
        return []
    except Exception as e:
        logger.error(f"Failed to extract semantic triplets: {e}")
        return []

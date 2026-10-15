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
    from app.utils.json_repair import parse_triplets_response
    client = _openai_client()

    # Both system and user prompts consistently request the {"triplets": [...]} wrapper
    system_prompt = (
        "You are a precise knowledge graph extraction system. "
        "Output ONLY a valid JSON object with a single key 'triplets' containing an array. "
        "Never add explanatory text or markdown — only the JSON object."
    )
    user_prompt = """Extract a knowledge graph from the following text.
Identify the key entities (Concepts, Persons, Organizations, Locations) and the relationships between them.
Output the result STRICTLY as a JSON object with a single key 'triplets' containing the array of objects.

Example output:
{
  "triplets": [
    {"source": "Machine Learning", "target": "Artificial Intelligence", "label": "is a subset of", "source_type": "Concept", "target_type": "Concept"}
  ]
}

Text:
"""

    model = settings.resolve_generation_model()
    is_free = ":free" in model or model == "openrouter/free"

    try:
        # request JSON object format for non-free models (better reliability)
        extra_kwargs = {}
        if not is_free:
            try:
                extra_kwargs["response_format"] = {"type": "json_object"}
            except Exception:
                pass

        response = await client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt + text[:5000]}
            ],
            temperature=0.1,
            max_tokens=2000,
            extra_headers=_openrouter_headers(),
            **extra_kwargs,
        )

        content = response.choices[0].message.content
        # Log the raw LLM JSON so it's visible in Render logs for debugging.
        logger.info(
            f"Triplet LLM raw response model={model} "
            f"len={len(content) if content else 0} preview={(content or '')[:2000]!r}"
        )
        if not content:
            logger.warning(f"Triplet LLM returned empty content model={model}")
            return []

        # Use the shared repair utility — handles all known failure modes
        triplets = parse_triplets_response(content)
        if triplets is None:
            logger.warning(f"Triplet extraction returned None — raw preview: {content[:200]!r}")
            return []

        # Validate shape, filter bad entries
        valid = [
            t for t in triplets
            if isinstance(t, dict) and t.get("source") and t.get("target")
        ]
        if len(valid) != len(triplets):
            logger.info(f"Filtered {len(triplets) - len(valid)} invalid triplets")
        return valid

    except Exception as e:
        logger.exception(f"Failed to extract semantic triplets: {repr(e)}")
        return []

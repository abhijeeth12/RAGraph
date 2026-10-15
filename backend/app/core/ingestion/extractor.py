import json
import re
from loguru import logger
from app.config import settings

async def extract_semantic_triplets(text: str) -> list[dict]:
    """
    Uses the configured LLM to extract Entities and Relationships from text.
    Walks an LLM-layered fallback chain (primary model + full text, then the
    cheap fallback model + shorter slices) and returns the first valid list.
    Returns [] only when every LLM stage fails.
    """
    if not settings.openai_api_key:
        logger.warning("No OpenAI API key configured. Skipping semantic extraction.")
        return []

    from app.utils.json_repair import parse_triplets_response
    from app.core.ingestion.llm_json import JsonStage, complete_json_stages, dedupe_models

    primary = settings.resolve_generation_model()
    cheap = settings.resolve_cheap_model()
    models = dedupe_models(primary, cheap)
    fallback_model = models[1] if len(models) > 1 else models[0]

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

Text (full):
"""

    user_prompt_short = """Extract a knowledge graph from the following text.
Identify up to 10 key entities and their relationships.
Output STRICTLY a JSON object with a single key 'triplets' containing the array.
Example: {"triplets": [{"source": "A", "target": "B", "label": "relates to", "source_type": "Concept", "target_type": "Concept"}]}

Text (short):
"""

    stages = [
        JsonStage(name="triplets-full", model=primary,
                  system=system_prompt, user=user_prompt + text[:5000],
                  temperature=0.1, max_tokens=2000),
        JsonStage(name="triplets-short", model=primary,
                  system=system_prompt, user=user_prompt_short + text[:2000],
                  temperature=0.1, max_tokens=1200),
        JsonStage(name="triplets-fallback", model=fallback_model,
                  system=system_prompt, user=user_prompt_short + text[:2000],
                  temperature=0.1, max_tokens=1200),
    ]

    try:
        triplets, _raw, used_model = await complete_json_stages(stages, parse_triplets_response)
        if triplets is None:
            logger.warning(
                f"Triplet extraction failed after {len(stages)} LLM stages "
                f"(primary={primary} fallback={fallback_model})"
            )
            return []

        # Validate shape, filter bad entries
        valid = [
            t for t in triplets
            if isinstance(t, dict) and t.get("source") and t.get("target")
        ]
        if len(valid) != len(triplets):
            logger.info(f"Filtered {len(triplets) - len(valid)} invalid triplets")
        logger.info(f"Extracted {len(valid)} semantic triplets via model={used_model}")
        return valid

    except Exception as e:
        logger.exception(f"Failed to extract semantic triplets: {repr(e)}")
        return []

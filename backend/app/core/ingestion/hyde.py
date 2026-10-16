"""
Enhanced Query Expansion — combines:
1. Abbreviation expansion (ANN -> Artificial Neural Network)
2. HyDE (Hypothetical Document Embeddings)
3. Synonym/term expansion

Uses a single OpenRouter call with a rich system prompt.
"""
from __future__ import annotations
from loguru import logger
from app.config import settings


EXPANSION_PROMPT = """You are a search query expansion expert for document retrieval.

Given a search query, you must:
1. Expand ALL abbreviations and acronyms to their full forms
   (e.g. ANN -> Artificial Neural Network, ML -> Machine Learning, 
    DL -> Deep Learning, CNN -> Convolutional Neural Network,
    RNN -> Recurrent Neural Network, LLM -> Large Language Model)
2. Add synonyms and closely related terms
3. Write a short hypothetical passage (3-5 sentences) that would 
   perfectly answer this query if found in a technical document

Return ONLY a JSON object with this exact format:
{
  "expanded_query": "full expanded query with all abbreviations resolved and synonyms",
  "hypothetical_passage": "a short technical passage that would answer the query"
}

No other text, no markdown, no explanation. Just the JSON."""


async def generate_hypothetical_doc(query: str) -> str:
    """
    Generate an expanded query string combining:
    - Abbreviation expansion
    - HyDE hypothetical passage
    Returns a combined string optimized for embedding similarity.
    """
    if not settings.openai_api_key and not settings.anthropic_api_key:
        # Fallback: local abbreviation expansion only
        return _local_expand(query)

    try:
        result = await _call_llm(query)
        if result:
            expanded = result.get("expanded_query", query)
            passage = result.get("hypothetical_passage", "")
            # Combine both — expanded query guides keyword matching,
            # hypothetical passage guides semantic similarity
            combined = f"{expanded}. {passage}"
            logger.debug(f"Query expansion: '{query}' -> {len(combined)} chars")
            return combined
    except Exception as e:
        logger.warning(f"HyDE generation failed: {e}")

    return _local_expand(query)


async def _call_llm(query: str) -> dict:
    import json
    from openai import AsyncOpenAI
    client = AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url=settings.openai_base_url,
    )
    headers = {}
    if settings.using_openrouter:
        headers = {"HTTP-Referer": "https://ragraph.dev", "X-Title": "RAGraph"}

    response = await client.chat.completions.create(
        model=settings.resolve_cheap_model(),
        messages=[
            {"role": "system", "content": EXPANSION_PROMPT},
            {"role": "user", "content": f"Query: {query}"},
        ],
        max_tokens=300,
        temperature=0.3,   # low temp for consistent expansion
        extra_headers=headers,
    )
    raw = response.choices[0].message.content.strip()
    # Strip markdown code fences if present
    raw = raw.replace("```json", "").replace("```", "").strip()
    return json.loads(raw)


# Common abbreviations — used as fallback when LLM unavailable
ABBREVIATIONS = {
    "ann":   "artificial neural network",
    "ml":    "machine learning",
    "dl":    "deep learning",
    "ai":    "artificial intelligence",
    "cnn":   "convolutional neural network",
    "rnn":   "recurrent neural network",
    "lstm":  "long short-term memory",
    "nlp":   "natural language processing",
    "llm":   "large language model",
    "rag":   "retrieval augmented generation",
    "gpt":   "generative pre-trained transformer",
    "bert":  "bidirectional encoder representations from transformers",
    "svm":   "support vector machine",
    "knn":   "k nearest neighbors",
    "dnn":   "deep neural network",
    "bnn":   "bayesian neural network",
    "gan":   "generative adversarial network",
    "vae":   "variational autoencoder",
    "relu":  "rectified linear unit",
    "sgd":   "stochastic gradient descent",
    "bp":    "backpropagation",
    "pca":   "principal component analysis",
    "rl":    "reinforcement learning",
    "cv":    "computer vision",
    "ltu":   "linear threshold unit",
    "mse":   "mean squared error",
    "mae":   "mean absolute error",
    "api":   "application programming interface",
    "cpu":   "central processing unit",
    "gpu":   "graphics processing unit",
}


def _local_expand(query: str) -> str:
    """Expand abbreviations locally without LLM."""
    words = query.lower().split()
    expanded_words = []
    expansions = []

    for word in words:
        clean = word.strip(".,?!;:")
        if clean in ABBREVIATIONS:
            full = ABBREVIATIONS[clean]
            expanded_words.append(full)
            expansions.append(f"{clean} = {full}")
        else:
            expanded_words.append(word)

    expanded = " ".join(expanded_words)
    if expansions:
        logger.debug(f"Local abbreviation expansion: {expansions}")
    return expanded

import re
import tiktoken
from typing import Optional
from loguru import logger

HEADING_PATTERNS = [
    r"^#{1,6}\s+(.+)$",
    r"^([A-Z][A-Za-z0-9 \-:]{2,60})$",
    r"^(\d+\.?\d*\.?\s+[A-Z][A-Za-z0-9 \-:]+)$",
    r"^([IVXLCDM]+\.\s+[A-Z][A-Za-z0-9 \-:]+)$",
]

_enc = tiktoken.get_encoding("cl100k_base")


def count_tokens(text: str) -> int:
    return len(_enc.encode(text))


def detect_heading(line: str) -> Optional[str]:
    line = line.strip()
    if not line or len(line) > 120:
        return None
    for pattern in HEADING_PATTERNS:
        m = re.match(pattern, line)
        if m:
            heading = m.group(1).strip()
            if len(heading.split()) > 15:
                return None
            return heading
    return None


def extract_heading_sections(text: str) -> dict[str, str]:
    sections: dict[str, str] = {}
    current_heading = "Introduction"
    sections[current_heading] = ""

    for line in text.split("\n"):
        heading = detect_heading(line)
        if heading:
            current_heading = heading
            if current_heading not in sections:
                sections[current_heading] = ""
        else:
            if line.strip():
                sections[current_heading] += line + "\n"

    sections = {h: c.strip() for h, c in sections.items() if c.strip()}

    if not sections:
        paras = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
        for i, p in enumerate(paras):
            sections[f"Paragraph {i + 1}"] = p

    logger.debug(f"Extracted {len(sections)} sections")
    return sections


def chunk_by_tokens(
    text: str,
    chunk_size: int = 300,
    overlap: int = 40,
    heading: str = "",
) -> list[str]:
    tokens = _enc.encode(text)
    chunks = []
    prefix = f"## {heading}\n" if heading else ""
    prefix_tokens = len(_enc.encode(prefix))
    start = 0

    while start < len(tokens):
        end = min(start + chunk_size - prefix_tokens, len(tokens))
        chunk_text = prefix + _enc.decode(tokens[start:end])
        chunks.append(chunk_text.strip())
        if end >= len(tokens):
            break
        start = end - overlap

    return chunks


def chunk_document(text: str, chunk_size: int = 300, overlap: int = 40) -> list[str]:
    sections = extract_heading_sections(text)
    all_chunks = []
    for heading, content in sections.items():
        if not content:
            continue
        if count_tokens(content) <= chunk_size:
            all_chunks.append(f"## {heading}\n{content}".strip())
        else:
            all_chunks.extend(chunk_by_tokens(content, chunk_size, overlap, heading))
    logger.debug(f"Document chunked into {len(all_chunks)} chunks")
    return all_chunks


def extract_fig_references(text: str) -> list[str]:
    patterns = [
        r"Fig(?:ure)?\.?\s*\d+[a-z]?",
        r"Figure\s+[A-Z]",
        r"Fig\s+[A-Z]",
    ]
    refs = []
    for p in patterns:
        refs.extend(re.findall(p, text, re.IGNORECASE))
    return list(set(refs))


def clean_text(text: str) -> str:
    text = re.sub(r"\s+", " ", text)
    text = re.sub(r"[^\x00-\x7F]+", " ", text)
    return text.strip()

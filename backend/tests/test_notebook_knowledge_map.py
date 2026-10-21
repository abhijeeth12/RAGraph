"""
Unit & integration tests for notebook-isolated knowledge maps.

Verifies:
1. Independent knowledge maps: Each notebook has its own isolated map.
2. No automatic initialization: Notebook creation does not create or generate a map.
3. Generate on-demand: Returns empty state with doc count until generated.
4. Persistence: Reopening or refreshing a notebook retrieves its existing map.
5. Notebook-specific regeneration: Regenerating a map updates only that notebook.
6. Navigation & context: Switching notebooks returns only that notebook's map or empty state.
7. Authorization: Rejecting unauthorized access to other owners' notebooks.
8. Concurrency & Failure safety: 409 on duplicate concurrent generation; previous map preserved on failure.
9. Cascade deletion: Deleting a notebook removes its associated map.
"""
import json
import uuid
from datetime import datetime, UTC

import pytest
from httpx import AsyncClient, ASGITransport

from app.services.db_service import NotebookConflictError, NotebookNotFoundError


class FakeKnowledgeMapDB:
    def __init__(self):
        self.notebooks: dict[str, dict] = {}
        self.documents: dict[str, dict] = {}
        self.knowledge_maps: dict[str, dict] = {}

    # -- notebooks --
    async def create_notebook(self, notebook_id, user_id, session_id, title,
                              description=None, model="openrouter/free", focus="all"):
        now = datetime.now(UTC)
        nb = {
            "id": notebook_id, "user_id": user_id, "session_id": session_id,
            "title": title, "description": description, "model": model, "focus": focus,
            "created_at": now, "updated_at": now,
        }
        self.notebooks[notebook_id] = nb
        return dict(nb)

    async def get_notebook(self, notebook_id):
        nb = self.notebooks.get(notebook_id)
        return dict(nb) if nb else None

    async def verify_notebook_ownership(self, notebook_id, user_id, session_id):
        nb = self.notebooks.get(notebook_id)
        if not nb:
            return False
        if user_id and nb.get("user_id") == user_id:
            return True
        if session_id and nb.get("session_id") == session_id and nb.get("user_id") is None:
            return True
        return False

    async def delete_notebook(self, notebook_id):
        self.knowledge_maps.pop(notebook_id, None)
        self.notebooks.pop(notebook_id, None)

    # -- documents --
    async def list_documents_by_notebook(self, notebook_id):
        return [
            dict(d) for d in self.documents.values()
            if d.get("notebook_id") == notebook_id
        ]

    # -- knowledge maps --
    async def get_knowledge_map_by_notebook(self, notebook_id):
        m = self.knowledge_maps.get(notebook_id)
        return dict(m) if m else None

    async def get_knowledge_map(self, key):
        return await self.get_knowledge_map_by_notebook(key)

    async def claim_knowledge_map_generation(
        self, notebook_id, owner_key, doc_ids_json, doc_count,
        user_id=None, session_id=None, stale_seconds=900
    ):
        now = datetime.now(UTC)
        existing = self.knowledge_maps.get(notebook_id)
        if existing and existing.get("status") == "generating":
            age = (now - existing["updated_at"]).total_seconds()
            if age < stale_seconds:
                return False

        map_record = existing or {
            "notebook_id": notebook_id,
            "scope_key": notebook_id,
            "owner_key": owner_key,
            "user_id": user_id,
            "session_id": session_id,
            "outline_json": None,
            "graph_json": None,
            "created_at": now,
        }
        map_record.update({
            "status": "generating",
            "doc_ids_json": doc_ids_json,
            "doc_count": doc_count,
            "error_message": None,
            "updated_at": now,
        })
        self.knowledge_maps[notebook_id] = map_record
        return True

    async def save_knowledge_map(self, notebook_id, outline_json, graph_json):
        now = datetime.now(UTC)
        rec = self.knowledge_maps.get(notebook_id)
        if not rec:
            rec = {"notebook_id": notebook_id, "created_at": now}
            self.knowledge_maps[notebook_id] = rec
        rec.update({
            "outline_json": outline_json,
            "graph_json": graph_json,
            "status": "done",
            "error_message": None,
            "updated_at": now,
        })

    async def fail_knowledge_map(self, notebook_id, error_message):
        now = datetime.now(UTC)
        rec = self.knowledge_maps.get(notebook_id)
        if rec:
            rec.update({
                "status": "failed",
                "error_message": error_message,
                "updated_at": now,
            })

    async def delete_knowledge_map(self, notebook_id):
        if notebook_id in self.knowledge_maps:
            del self.knowledge_maps[notebook_id]
            return True
        return False


@pytest.fixture
def fake_km_db(monkeypatch):
    from app.services import db_service as db_mod
    fake = FakeKnowledgeMapDB()
    for name in (
        "create_notebook", "get_notebook", "verify_notebook_ownership", "delete_notebook",
        "list_documents_by_notebook", "get_knowledge_map_by_notebook", "get_knowledge_map",
        "claim_knowledge_map_generation", "save_knowledge_map", "fail_knowledge_map",
        "delete_knowledge_map",
    ):
        monkeypatch.setattr(db_mod.db_service, name, getattr(fake, name))
    return fake


@pytest.fixture
async def client():
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


@pytest.mark.asyncio
async def test_notebook_creation_has_no_map_automatically(fake_km_db, client):
    """When notebooks are created, no map should be generated or stored."""
    sess_id = "test-session-1"
    headers = {"Cookie": f"session_id={sess_id}"}

    # Create Notebook 1
    r1 = await client.post("/api/notebooks/", json={"title": "Notebook Alpha"}, headers=headers)
    assert r1.status_code == 200
    nb1_id = r1.json()["id"]

    # Create Notebook 2
    r2 = await client.post("/api/notebooks/", json={"title": "Notebook Beta"}, headers=headers)
    assert r2.status_code == 200
    nb2_id = r2.json()["id"]

    # Ensure no knowledge map exists for either notebook
    get_r1 = await client.get(f"/api/knowledge-map?notebook_id={nb1_id}", headers=headers)
    assert get_r1.status_code == 200
    assert get_r1.json()["exists"] is False
    assert get_r1.json()["status"] == "empty"
    assert get_r1.json()["doc_count"] == 0

    get_r2 = await client.get(f"/api/knowledge-map?notebook_id={nb2_id}", headers=headers)
    assert get_r2.status_code == 200
    assert get_r2.json()["exists"] is False
    assert get_r2.json()["status"] == "empty"
    assert get_r2.json()["doc_count"] == 0


@pytest.mark.asyncio
async def test_independent_knowledge_maps_per_notebook(fake_km_db, client, monkeypatch):
    """Generating map for Notebook Alpha must NOT leak to Notebook Beta."""
    sess_id = "test-session-2"
    headers = {"Cookie": f"session_id={sess_id}"}

    # Setup Notebook A with doc A
    nb_a = await fake_km_db.create_notebook("nb-alpha", None, sess_id, "Notebook Alpha")
    doc_a = {
        "id": "doc-a",
        "notebook_id": "nb-alpha",
        "original_filename": "raft_paper.pdf",
        "status": "done",
    }
    fake_km_db.documents["doc-a"] = doc_a

    # Setup Notebook B with doc B
    nb_b = await fake_km_db.create_notebook("nb-beta", None, sess_id, "Notebook Beta")
    doc_b = {
        "id": "doc-b",
        "notebook_id": "nb-beta",
        "original_filename": "paxos_paper.pdf",
        "status": "done",
    }
    fake_km_db.documents["doc-b"] = doc_b

    # Mock generator for Alpha
    alpha_outline = {
        "name": "Raft Consensus",
        "children": [{"name": "Leader Election"}, {"name": "Log Replication"}],
    }
    alpha_triplets = [{"source": "Raft", "target": "Election", "label": "uses"}]

    async def mock_generate_map(owner_id, docs):
        assert docs[0]["id"] == "doc-a"
        return {"outline": alpha_outline, "triplets": alpha_triplets}

    monkeypatch.setattr("app.core.knowledge_map.generate_notebook_map", mock_generate_map)

    # Generate map for Notebook Alpha
    gen_res = await client.post(
        "/api/knowledge-map/generate",
        json={"notebook_id": "nb-alpha"},
        headers=headers,
    )
    assert gen_res.status_code == 200
    assert gen_res.json()["accepted"] is True
    assert gen_res.json()["status"] == "generating"

    # Save completed map into fake DB for Alpha
    await fake_km_db.save_knowledge_map(
        "nb-alpha",
        json.dumps(alpha_outline),
        json.dumps(alpha_triplets),
    )

    # 1. Query Notebook Alpha: returns Alpha's map
    alpha_res = await client.get("/api/knowledge-map?notebook_id=nb-alpha", headers=headers)
    assert alpha_res.status_code == 200
    alpha_data = alpha_res.json()
    assert alpha_data["exists"] is True
    assert alpha_data["status"] == "done"
    assert alpha_data["notebook_id"] == "nb-alpha"
    assert alpha_data["outline"]["name"] == "Raft Consensus"
    assert "doc-a" in alpha_data["doc_ids"]

    # 2. Query Notebook Beta: MUST be empty state, zero leak from Alpha!
    beta_res = await client.get("/api/knowledge-map?notebook_id=nb-beta", headers=headers)
    assert beta_res.status_code == 200
    beta_data = beta_res.json()
    assert beta_data["exists"] is False
    assert beta_data["status"] == "empty"
    assert beta_data["notebook_id"] == "nb-beta"
    assert beta_data["doc_count"] == 1
    assert "outline" not in beta_data or beta_data.get("outline") is None


@pytest.mark.asyncio
async def test_persistence_across_multiple_queries(fake_km_db, client):
    """Once generated, a notebook's knowledge map persists across repeated queries."""
    sess_id = "test-session-3"
    headers = {"Cookie": f"session_id={sess_id}"}

    await fake_km_db.create_notebook("nb-persist", None, sess_id, "Persistence Test")
    fake_km_db.documents["doc-p"] = {
        "id": "doc-p",
        "notebook_id": "nb-persist",
        "original_filename": "architecture.pdf",
        "status": "done",
    }

    outline = {"name": "Architecture Overview", "children": [{"name": "Frontend"}, {"name": "Backend"}]}
    triplets = [{"source": "Frontend", "target": "Backend", "label": "calls"}]
    await fake_km_db.save_knowledge_map(
        "nb-persist",
        json.dumps(outline),
        json.dumps(triplets),
    )

    # First query
    res1 = await client.get("/api/knowledge-map?notebook_id=nb-persist", headers=headers)
    assert res1.status_code == 200
    assert res1.json()["exists"] is True
    assert res1.json()["outline"]["name"] == "Architecture Overview"

    # Second query (simulating page reload)
    res2 = await client.get("/api/knowledge-map?notebook_id=nb-persist", headers=headers)
    assert res2.status_code == 200
    assert res2.json()["exists"] is True
    assert res2.json()["outline"]["name"] == "Architecture Overview"
    assert res2.json()["notebook_id"] == "nb-persist"


@pytest.mark.asyncio
async def test_regeneration_updates_only_selected_notebook(fake_km_db, client):
    """Regenerating a notebook updates only that notebook's map."""
    sess_id = "test-session-4"
    headers = {"Cookie": f"session_id={sess_id}"}

    # Notebook 1
    await fake_km_db.create_notebook("nb-1", None, sess_id, "Notebook 1")
    fake_km_db.documents["doc-1"] = {"id": "doc-1", "notebook_id": "nb-1", "original_filename": "d1.pdf", "status": "done"}
    await fake_km_db.save_knowledge_map("nb-1", json.dumps({"name": "Map 1 v1"}), json.dumps([]))

    # Notebook 2
    await fake_km_db.create_notebook("nb-2", None, sess_id, "Notebook 2")
    fake_km_db.documents["doc-2"] = {"id": "doc-2", "notebook_id": "nb-2", "original_filename": "d2.pdf", "status": "done"}
    await fake_km_db.save_knowledge_map("nb-2", json.dumps({"name": "Map 2 Unchanged"}), json.dumps([]))

    # Update Notebook 1 map to v2
    await fake_km_db.save_knowledge_map("nb-1", json.dumps({"name": "Map 1 v2 Regenerated"}), json.dumps([]))

    # Verify Notebook 1 updated
    r1 = await client.get("/api/knowledge-map?notebook_id=nb-1", headers=headers)
    assert r1.json()["outline"]["name"] == "Map 1 v2 Regenerated"

    # Verify Notebook 2 remains unchanged
    r2 = await client.get("/api/knowledge-map?notebook_id=nb-2", headers=headers)
    assert r2.json()["outline"]["name"] == "Map 2 Unchanged"


@pytest.mark.asyncio
async def test_concurrent_generation_conflict(fake_km_db, client, monkeypatch):
    """Requesting generation while generation is in progress returns 409."""
    sess_id = "test-session-5"
    headers = {"Cookie": f"session_id={sess_id}"}

    await fake_km_db.create_notebook("nb-busy", None, sess_id, "Busy Test")
    fake_km_db.documents["doc-b"] = {"id": "doc-b", "notebook_id": "nb-busy", "original_filename": "b.pdf", "status": "done"}

    # Mock _run_generation so it leaves status in 'generating'
    async def mock_run_generation(nb_id, owner_id, doc_ids):
        pass

    monkeypatch.setattr("app.api.knowledge_map._run_generation", mock_run_generation)

    # First claim
    res1 = await client.post("/api/knowledge-map/generate", json={"notebook_id": "nb-busy"}, headers=headers)
    assert res1.status_code == 200

    # Second claim while 'generating' -> 409 Conflict
    res2 = await client.post("/api/knowledge-map/generate", json={"notebook_id": "nb-busy"}, headers=headers)
    assert res2.status_code == 409
    assert "already in progress" in res2.json()["detail"]


@pytest.mark.asyncio
async def test_failed_regeneration_preserves_previous_map(fake_km_db, client):
    """A failed regeneration does not erase the previously existing map."""
    sess_id = "test-session-6"
    headers = {"Cookie": f"session_id={sess_id}"}

    await fake_km_db.create_notebook("nb-fail", None, sess_id, "Fail Test")
    fake_km_db.documents["doc-f"] = {"id": "doc-f", "notebook_id": "nb-fail", "original_filename": "f.pdf", "status": "done"}

    # Initial valid map
    await fake_km_db.save_knowledge_map("nb-fail", json.dumps({"name": "Prior Valid Map"}), json.dumps([]))

    # Mark failed
    await fake_km_db.fail_knowledge_map("nb-fail", "LLM rate limit error")

    # Query: since outline_json is intact, stored map is returned with status
    res = await client.get("/api/knowledge-map?notebook_id=nb-fail", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["exists"] is True
    assert data["outline"]["name"] == "Prior Valid Map"


@pytest.mark.asyncio
async def test_ownership_validation_rejects_unauthorized_notebook(fake_km_db, client):
    """Accessing another user's notebook knowledge map returns 404."""
    # Notebook owned by session-A
    await fake_km_db.create_notebook("nb-private", None, "session-A", "Private")

    # Request from session-B
    headers = {"Cookie": "session_id=session-B"}
    res = await client.get("/api/knowledge-map?notebook_id=nb-private", headers=headers)
    assert res.status_code == 404
    assert res.json()["detail"] == "Notebook not found"

    # Generate request from session-B
    gen_res = await client.post("/api/knowledge-map/generate", json={"notebook_id": "nb-private"}, headers=headers)
    assert gen_res.status_code == 404


@pytest.mark.asyncio
async def test_delete_notebook_deletes_associated_map(fake_km_db, client):
    """Deleting a notebook deletes its knowledge map."""
    sess_id = "test-session-7"
    headers = {"Cookie": f"session_id={sess_id}"}

    await fake_km_db.create_notebook("nb-del", None, sess_id, "Delete Test")
    fake_km_db.documents["doc-d"] = {"id": "doc-d", "notebook_id": "nb-del", "original_filename": "d.pdf", "status": "done"}
    await fake_km_db.save_knowledge_map("nb-del", json.dumps({"name": "Map to Delete"}), json.dumps([]))

    # Delete notebook
    del_res = await client.delete("/api/notebooks/nb-del", headers=headers)
    assert del_res.status_code == 200

    # Ensure map record in DB is deleted
    map_row = await fake_km_db.get_knowledge_map_by_notebook("nb-del")
    assert map_row is None

    # Querying the deleted notebook returns 404
    res = await client.get("/api/knowledge-map?notebook_id=nb-del", headers=headers)
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_deterministic_synthesize_unified_outline_multi_doc():
    """Verify deterministic synthesis merges multiple document outlines into a coherent tree."""
    from app.core.knowledge_map import deterministic_synthesize_unified_outline

    minis = [
        {
            "document": "Abhijeeth Chandragi Resume.pdf",
            "outline": {
                "name": "Abhijeeth Chandragi Resume.pdf",
                "children": [
                    {
                        "name": "Experience",
                        "children": [
                            {"name": "Senior Full-Stack Engineer"},
                            {"name": "Backend Architect"},
                        ],
                    },
                    {
                        "name": "Technical Skills",
                        "children": [
                            {"name": "Python & FastAPI"},
                            {"name": "React & TypeScript"},
                        ],
                    },
                ],
            },
        },
        {
            "document": "System Architecture.pdf",
            "outline": {
                "name": "System Architecture.pdf",
                "children": [
                    {
                        "name": "Technical Skills",
                        "children": [
                            {"name": "PostgreSQL & Vector DBs"},
                            {"name": "Python & FastAPI"},
                        ],
                    },
                    {
                        "name": "Deployment",
                        "children": [
                            {"name": "Docker & Render"},
                        ],
                    },
                ],
            },
        },
    ]

    unified = deterministic_synthesize_unified_outline(minis)
    assert unified["name"] == "Knowledge Base"
    assert "children" in unified
    assert len(unified["children"]) > 0

    concept_names = [c["name"] for c in unified["children"]]
    assert "Technical Skills" in concept_names
    tech_skills = next(c for c in unified["children"] if c["name"] == "Technical Skills")
    sub_names = [s["name"] for s in tech_skills["children"]]
    # Python & FastAPI appeared in both; should be deduped
    assert sub_names.count("Python & FastAPI") == 1
    assert "React & TypeScript" in sub_names
    assert "PostgreSQL & Vector DBs" in sub_names


@pytest.mark.asyncio
async def test_synthesize_unified_outline_recovers_from_17_char_llm_failure(monkeypatch):
    """When LLM provider returns a 17-char or empty error, synthesize_unified_outline recovers via fallback."""
    from app.core.knowledge_map import synthesize_unified_outline
    from app.config import settings

    monkeypatch.setattr(settings, "openai_api_key", "sk-mock-key")

    # Mock complete_json_stages to simulate all 3 LLM stages failing with a 17-char raw string
    async def mock_stages(stages, parse_fn):
        return None, '{"type": "error"}', "openrouter/free"

    monkeypatch.setattr("app.core.ingestion.llm_json.complete_json_stages", mock_stages)

    minis = [
        {
            "document": "Resume.pdf",
            "outline": {
                "name": "Resume.pdf",
                "children": [
                    {"name": "Work History", "children": [{"name": "Company A"}]},
                    {"name": "Education", "children": [{"name": "University B"}]},
                ],
            },
        }
    ]

    # Should safely recover and not raise RuntimeError("Map synthesis failed after 3 LLM stages (last len=17)")
    result, trimmed = await synthesize_unified_outline(minis)
    assert result is not None
    assert "children" in result
    assert len(result["children"]) > 0
    assert any(c["name"] == "Work History" for c in result["children"])


@pytest.mark.asyncio
async def test_generate_notebook_map_partial_document_recovery(monkeypatch):
    """When one document fails outline extraction, generate_notebook_map succeeds with the remaining documents."""
    from app.core.knowledge_map import generate_notebook_map

    docs = [
        {"id": "doc-good", "original_filename": "Good.pdf"},
        {"id": "doc-corrupted", "original_filename": "Corrupted.pdf"},
    ]

    async def mock_gather(owner_id, doc_list):
        return {
            "doc-good": {"filename": "Good.pdf", "text": "Valid text about systems", "headings": ["Intro"]},
            "doc-corrupted": {"filename": "Corrupted.pdf", "text": "Corrupted text", "headings": []},
        }

    async def mock_generate_outline(text, headings, title=""):
        if "Corrupted" in title:
            return None  # extraction failed for this doc
        return {
            "name": title,
            "children": [{"name": "Key Topic", "children": [{"name": "Subtopic 1"}]}],
        }

    async def mock_triplets(text):
        return []

    monkeypatch.setattr("app.core.knowledge_map.gather_doc_texts", mock_gather)
    monkeypatch.setattr("app.core.ingestion.outline.generate_outline", mock_generate_outline)
    monkeypatch.setattr("app.core.ingestion.extractor.extract_semantic_triplets", mock_triplets)

    result = await generate_notebook_map(owner_id="test_owner", docs=docs)
    assert result is not None
    assert "outline" in result
    assert "Corrupted.pdf" in result["failed_docs"]
    assert result["outline"]["children"] is not None


@pytest.mark.asyncio
async def test_x_session_id_header_auth(fake_km_db, client):
    """X-Session-ID header is accepted for guest users to prevent cross-tab cookie mismatch."""
    sess_id = "test-session-header-1"
    headers = {"X-Session-ID": sess_id}

    await fake_km_db.create_notebook("nb-header", None, sess_id, "Header Auth Test")
    fake_km_db.documents["doc-h"] = {"id": "doc-h", "notebook_id": "nb-header", "original_filename": "h.pdf", "status": "done"}
    await fake_km_db.save_knowledge_map("nb-header", json.dumps({"name": "Header Map"}), json.dumps([]))

    res = await client.get("/api/knowledge-map?notebook_id=nb-header", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["exists"] is True
    assert data["outline"]["name"] == "Header Map"


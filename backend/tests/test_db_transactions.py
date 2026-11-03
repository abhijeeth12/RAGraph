"""
Unit tests for the DB-layer transaction manager (_tx) and connection lifecycle.

Validates that:
1. _tx executes on the connection's transaction context manager without recursion.
2. Transactions commit on successful completion.
3. Transactions roll back on error.
4. Released connection proxies (<PoolConnectionProxy [released]>) are rejected with a clear error.
5. Closed connections are rejected with a clear error.
6. None connections are rejected with a clear error.
7. Duck-typed mocks without transaction support pass through cleanly.
8. Concurrent transaction requests on independent connections operate without collision.
"""
import asyncio
import pytest
from app.services.db_service import _tx, DBService


class MockAsyncpgTransaction:
    def __init__(self):
        self.entered = False
        self.committed = False
        self.rolled_back = False

    async def __aenter__(self):
        self.entered = True
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            self.rolled_back = True
        else:
            self.committed = True
        return False


class MockActiveConnection:
    def __init__(self):
        self._con = object()  # Represents active underlying asyncpg connection
        self.tx = MockAsyncpgTransaction()
        self.executed_queries = []

    def is_closed(self) -> bool:
        return False

    def transaction(self):
        return self.tx

    async def execute(self, query: str, *args):
        self.executed_queries.append((query, args))
        return "EXEC 1"

    async def fetchrow(self, query: str, *args):
        return None


class MockReleasedConnectionProxy:
    """Simulates an asyncpg PoolConnectionProxy that was released back to the pool."""
    def __init__(self):
        self._con = None  # asyncpg sets _con = None on detach / release

    def __repr__(self):
        return "<PoolConnectionProxy [released] 0x12345678>"

    def transaction(self):
        raise RuntimeError("cannot call Connection.transaction(): connection has been released back to the pool")


class MockClosedConnection:
    def __init__(self):
        self._con = object()

    def is_closed(self) -> bool:
        return True

    def transaction(self):
        return MockAsyncpgTransaction()


# ─── Tests ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_tx_commits_on_clean_exit():
    conn = MockActiveConnection()
    async with _tx(conn) as c:
        assert c is conn
        await c.execute("UPDATE test SET val = 1")

    assert conn.tx.entered is True
    assert conn.tx.committed is True
    assert conn.tx.rolled_back is False
    assert len(conn.executed_queries) == 1


@pytest.mark.asyncio
async def test_tx_rolls_back_on_exception():
    conn = MockActiveConnection()
    with pytest.raises(ValueError, match="simulated failure"):
        async with _tx(conn) as c:
            await c.execute("INSERT INTO test VALUES (1)")
            raise ValueError("simulated failure")

    assert conn.tx.entered is True
    assert conn.tx.rolled_back is True
    assert conn.tx.committed is False


@pytest.mark.asyncio
async def test_tx_rejects_none_connection():
    with pytest.raises(RuntimeError, match="connection is None"):
        async with _tx(None):
            pass


@pytest.mark.asyncio
async def test_tx_rejects_released_connection_proxy():
    released_conn = MockReleasedConnectionProxy()
    with pytest.raises(RuntimeError, match="connection has already been released"):
        async with _tx(released_conn):
            pass


@pytest.mark.asyncio
async def test_tx_rejects_closed_connection():
    closed_conn = MockClosedConnection()
    with pytest.raises(RuntimeError, match="connection is closed"):
        async with _tx(closed_conn):
            pass


@pytest.mark.asyncio
async def test_tx_supports_duck_typed_connections_without_transaction():
    class SimpleConn:
        pass

    simple = SimpleConn()
    async with _tx(simple) as c:
        assert c is simple


@pytest.mark.asyncio
async def test_tx_no_recursion_depth_error_under_load():
    """Verify that multiple successive transactions do not grow recursion frames."""
    conn = MockActiveConnection()
    for _ in range(50):
        async with _tx(conn) as c:
            await c.execute("SELECT 1")
    assert len(conn.executed_queries) == 50


@pytest.mark.asyncio
async def test_concurrent_tx_on_distinct_connections():
    """Verify concurrent requests executing transactions concurrently do not interfere."""
    conns = [MockActiveConnection() for _ in range(10)]

    async def worker(c, idx):
        async with _tx(c):
            await asyncio.sleep(0.001)
            await c.execute(f"UPDATE t SET i = {idx}")

    await asyncio.gather(*(worker(c, i) for i, c in enumerate(conns)))

    for c in conns:
        assert c.tx.committed is True
        assert c.tx.rolled_back is False
        assert len(c.executed_queries) == 1

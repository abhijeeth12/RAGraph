"""
RAGraph Schema Migration Runner
Applies versioned SQL migrations in order from migrations/ directory.
Tracks applied versions in the schema_migrations table.
"""

import os
import sys
import asyncio
import asyncpg
from pathlib import Path
from loguru import logger

MIGRATIONS_DIR = Path(__file__).resolve().parent.parent.parent / "migrations"


async def run_migrations(dsn: str) -> None:
    logger.info(f"Connecting to database to apply migrations...")
    conn = await asyncpg.connect(dsn)
    try:
        # 1. Ensure migrations table exists
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version INT PRIMARY KEY,
                name TEXT NOT NULL,
                applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """)

        # 2. Query applied migrations
        rows = await conn.fetch("SELECT version FROM schema_migrations ORDER BY version")
        applied = {r["version"] for r in rows}

        # 3. Find migration files
        migration_files = sorted(MIGRATIONS_DIR.glob("*.sql"))
        if not migration_files:
            logger.warning(f"No migration files found in {MIGRATIONS_DIR}")
            return

        for mf in migration_files:
            prefix = mf.name.split("_")[0]
            try:
                version = int(prefix)
            except ValueError:
                continue

            if version in applied:
                logger.debug(f"Migration {mf.name} already applied (v{version})")
                continue

            logger.info(f"Applying migration: {mf.name} (v{version})...")
            sql = mf.read_text(encoding="utf-8")
            async with conn.transaction():
                await conn.execute(sql)
                await conn.execute(
                    "INSERT INTO schema_migrations (version, name) VALUES ($1, $2)",
                    version,
                    mf.name,
                )
            logger.info(f"Successfully applied migration: {mf.name}")

    finally:
        await conn.close()


def main():
    dsn = os.getenv("POSTGRES_URL") or os.getenv("DATABASE_URL")
    if not dsn:
        logger.error("POSTGRES_URL or DATABASE_URL not set.")
        sys.exit(1)
    asyncio.run(run_migrations(dsn))


if __name__ == "__main__":
    main()


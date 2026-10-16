import os
import ssl
import unittest
from app.config import Settings
from backend.scripts.migrate_db import clean_pg_url


class TestNeonConfiguration(unittest.TestCase):
    def test_effective_postgres_url_resolution(self):
        # 1. Default fallback
        s = Settings()
        self.assertTrue(s.effective_postgres_url.startswith("postgresql://"))

        # 2. NEON_DATABASE_URL override
        os.environ["NEON_DATABASE_URL"] = "postgres://neon_user:neon_pass@ep-test-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
        s2 = Settings()
        self.assertEqual(
            s2.effective_postgres_url,
            "postgresql://neon_user:neon_pass@ep-test-123.us-east-2.aws.neon.tech/neondb?sslmode=require"
        )
        del os.environ["NEON_DATABASE_URL"]

        # 3. DATABASE_URL override
        os.environ["DATABASE_URL"] = "postgres://db_user:db_pass@ep-pooler-456.us-east-2.aws.neon.tech/neondb"
        s3 = Settings()
        self.assertEqual(
            s3.effective_postgres_url,
            "postgresql://db_user:db_pass@ep-pooler-456.us-east-2.aws.neon.tech/neondb"
        )
        del os.environ["DATABASE_URL"]

    def test_clean_pg_url_direct_neon(self):
        url = "postgres://alex:secret@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
        clean_url, kwargs = clean_pg_url(url)

        self.assertTrue(clean_url.startswith("postgresql://"))
        self.assertNotIn("sslmode", clean_url)
        self.assertNotIn("channel_binding", clean_url)
        self.assertIn("ssl", kwargs)
        self.assertIsInstance(kwargs["ssl"], ssl.SSLContext)
        # Direct connection should not enforce statement_cache_size=0
        self.assertNotIn("statement_cache_size", kwargs)

    def test_clean_pg_url_pooled_neon(self):
        url = "postgresql://alex:secret@ep-cool-fog-123456-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"
        clean_url, kwargs = clean_pg_url(url)

        self.assertTrue(clean_url.startswith("postgresql://"))
        self.assertNotIn("sslmode", clean_url)
        self.assertIn("ssl", kwargs)
        # Pooled connection MUST enforce statement_cache_size=0 for PgBouncer
        self.assertEqual(kwargs.get("statement_cache_size"), 0)


if __name__ == "__main__":
    unittest.main()

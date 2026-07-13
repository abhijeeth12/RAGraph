import asyncio
import asyncpg

async def main():
    try:
        url = "postgres://user:pass@host/db"
        await asyncpg.create_pool(url)
    except Exception as e:
        print(type(e), e)

asyncio.run(main())

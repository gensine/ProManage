import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import init_db, engine, Base

@pytest_asyncio.fixture(autouse=True)
async def prepare_database():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_health():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        res = await client.get("/health")
        assert res.status_code == 200
        assert res.json()["status"] == "ok"

@pytest.mark.asyncio
async def test_auth_register_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register
        reg_data = {
            "fullName": "Test User",
            "email": "test@example.com",
            "password": "Password123!"
        }
        res = await client.post("/api/auth/register", json=reg_data)
        assert res.status_code == 201
        data = res.json()
        assert "token" in data
        assert data["user"]["email"] == "test@example.com"

        # Duplicate email
        res_dup = await client.post("/api/auth/register", json=reg_data)
        assert res_dup.status_code == 409
        assert res_dup.json()["error"]["code"] == "DUPLICATE_EMAIL"

        # Login
        login_res = await client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        assert "token" in login_res.json()

        # Login failure
        bad_login = await client.post("/api/auth/login", json={
            "email": "test@example.com",
            "password": "WrongPassword!"
        })
        assert bad_login.status_code == 401
        assert bad_login.json()["error"]["code"] == "INVALID_CREDENTIALS"

@pytest.mark.asyncio
async def test_cross_user_isolation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # User A Register
        res_a = await client.post("/api/auth/register", json={
            "fullName": "User A",
            "email": "usera@example.com",
            "password": "Password123!"
        })
        token_a = res_a.json()["token"]

        # User B Register
        res_b = await client.post("/api/auth/register", json={
            "fullName": "User B",
            "email": "userb@example.com",
            "password": "Password123!"
        })
        token_b = res_b.json()["token"]

        # User A creates a project
        proj_res = await client.post(
            "/api/projects",
            json={"name": "User A Project", "status": "IN_PROGRESS"},
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert proj_res.status_code == 201
        proj_id_a = proj_res.json()["id"]

        # User B attempts to access User A's project -> 404
        get_b_proj = await client.get(
            f"/api/projects/{proj_id_a}",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert get_b_proj.status_code == 404

        # User A creates a task in Project A
        task_res = await client.post(
            "/api/tasks",
            json={"projectId": proj_id_a, "name": "User A Task", "priority": "HIGH"},
            headers={"Authorization": f"Bearer {token_a}"}
        )
        assert task_res.status_code == 201
        task_id_a = task_res.json()["id"]

        # User B attempts to create a task in User A's project -> 404
        bad_task_create = await client.post(
            "/api/tasks",
            json={"projectId": proj_id_a, "name": "Hack Task", "priority": "HIGH"},
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert bad_task_create.status_code == 404

        # User B attempts to GET User A's task -> 404
        bad_task_get = await client.get(
            f"/api/tasks/{task_id_a}",
            headers={"Authorization": f"Bearer {token_b}"}
        )
        assert bad_task_get.status_code == 404

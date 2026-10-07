import asyncio
from datetime import date, timedelta
from app.database import AsyncSessionLocal, init_db
from app.models import User, Project, Task, ProjectStatus, TaskPriority, TaskStatus
from app.security import hash_password

async def seed():
    print("Initializing database tables...")
    await init_db()

    async with AsyncSessionLocal() as session:
        # Check if users already exist
        from sqlalchemy import select
        res = await session.execute(select(User))
        existing_users = res.scalars().all()
        if existing_users:
            print("Database already contains data. Skipping seed.")
            return

        print("Seeding test user 1 (Alex Developer)...")
        user1 = User(
            full_name="Alex Developer",
            email="alex@example.com",
            password_hash=hash_password("Password123!")
        )
        session.add(user1)
        await session.flush()

        print("Seeding test user 2 (Sarah Manager)...")
        user2 = User(
            full_name="Sarah Manager",
            email="sarah@example.com",
            password_hash=hash_password("Password123!")
        )
        session.add(user2)
        await session.flush()

        today = date.today()

        # Projects for User 1
        p1 = Project(
            owner_id=user1.id,
            name="Website Redesign",
            description="Revamp the company website using modern React and FastAPI",
            status=ProjectStatus.IN_PROGRESS,
            start_date=today - timedelta(days=10),
            end_date=today + timedelta(days=20)
        )
        p2 = Project(
            owner_id=user1.id,
            name="Mobile App Launch",
            description="Expo React Native mobile app for Android and iOS",
            status=ProjectStatus.NOT_STARTED,
            start_date=today + timedelta(days=5),
            end_date=today + timedelta(days=35)
        )
        session.add_all([p1, p2])
        await session.flush()

        # Tasks for User 1's projects
        t1 = Task(
            project_id=p1.id,
            name="Setup Backend API",
            description="Implement Auth, Projects, and Tasks CRUD routes",
            priority=TaskPriority.HIGH,
            status=TaskStatus.COMPLETED,
            due_date=today - timedelta(days=2)
        )
        t2 = Task(
            project_id=p1.id,
            name="Design Glassmorphism UI",
            description="Create responsive layout with dark mode toggle",
            priority=TaskPriority.HIGH,
            status=TaskStatus.IN_PROGRESS,
            due_date=today + timedelta(days=5)
        )
        t3 = Task(
            project_id=p1.id,
            name="API Integration & Auth Context",
            description="Connect Axios interceptors to JWT tokens",
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.PENDING,
            due_date=today + timedelta(days=8)
        )
        t4 = Task(
            project_id=p2.id,
            name="Configure Expo SecureStore",
            description="Store JWT token securely on Android native storage",
            priority=TaskPriority.HIGH,
            status=TaskStatus.PENDING,
            due_date=today + timedelta(days=12)
        )
        session.add_all([t1, t2, t3, t4])

        # Projects for User 2 (Isolation testing)
        p3 = Project(
            owner_id=user2.id,
            name="Q4 Marketing Strategy",
            description="Private marketing tasks for Sarah",
            status=ProjectStatus.IN_PROGRESS,
            start_date=today - timedelta(days=3),
            end_date=today + timedelta(days=30)
        )
        session.add(p3)
        await session.flush()

        t5 = Task(
            project_id=p3.id,
            name="Prepare Campaign Deck",
            description="Draft slides for product launch",
            priority=TaskPriority.MEDIUM,
            status=TaskStatus.IN_PROGRESS,
            due_date=today + timedelta(days=4)
        )
        session.add(t5)

        await session.commit()
        print("Seeding completed successfully!")
        print("Test Accounts:")
        print("  1. alex@example.com / Password123!")
        print("  2. sarah@example.com / Password123!")

if __name__ == "__main__":
    asyncio.run(seed())

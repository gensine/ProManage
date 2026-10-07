from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import User, Project, Task, ProjectStatus, TaskStatus
from app.schemas import DashboardResponse
from app.dependencies import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Total Projects for current user
    proj_count_res = await db.execute(
        select(func.count(Project.id)).where(Project.owner_id == current_user.id)
    )
    total_projects = proj_count_res.scalar() or 0

    # Projects In Progress
    proj_in_progress_res = await db.execute(
        select(func.count(Project.id)).where(
            Project.owner_id == current_user.id,
            Project.status == ProjectStatus.IN_PROGRESS
        )
    )
    projects_in_progress = proj_in_progress_res.scalar() or 0

    # Total Tasks for current user's projects
    task_count_res = await db.execute(
        select(func.count(Task.id))
        .join(Project, Task.project_id == Project.id)
        .where(Project.owner_id == current_user.id)
    )
    total_tasks = task_count_res.scalar() or 0

    # Completed Tasks
    task_completed_res = await db.execute(
        select(func.count(Task.id))
        .join(Project, Task.project_id == Project.id)
        .where(
            Project.owner_id == current_user.id,
            Task.status == TaskStatus.COMPLETED
        )
    )
    completed_tasks = task_completed_res.scalar() or 0

    # Pending Tasks (non-completed: PENDING + IN_PROGRESS)
    task_pending_res = await db.execute(
        select(func.count(Task.id))
        .join(Project, Task.project_id == Project.id)
        .where(
            Project.owner_id == current_user.id,
            Task.status != TaskStatus.COMPLETED
        )
    )
    pending_tasks = task_pending_res.scalar() or 0

    return DashboardResponse(
        totalProjects=total_projects,
        totalTasks=total_tasks,
        completedTasks=completed_tasks,
        pendingTasks=pending_tasks,
        projectsInProgress=projects_in_progress
    )

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, asc
from typing import Optional, List
from app.database import get_db
from app.models import User, Project, Task, TaskPriority, TaskStatus
from app.schemas import (
    TaskCreateRequest,
    TaskUpdateRequest,
    TaskResponse,
    GenericMessageResponse
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("", response_model=List[TaskResponse])
async def list_tasks(
    projectId: Optional[str] = Query(None, description="Filter tasks by project ID"),
    search: Optional[str] = Query(None, description="Search by task name"),
    status_filter: Optional[TaskStatus] = Query(None, alias="status", description="Filter by task status"),
    priority_filter: Optional[TaskPriority] = Query(None, alias="priority", description="Filter by task priority"),
    sortBy: Optional[str] = Query("createdAt", description="Sort by: createdAt, name, status, priority, dueDate"),
    order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Join with Project to enforce caller ownership
    query = select(Task).join(Project, Task.project_id == Project.id).where(Project.owner_id == current_user.id)

    if projectId:
        query = query.where(Task.project_id == projectId)

    if search:
        query = query.where(Task.name.ilike(f"%{search}%"))

    if status_filter:
        query = query.where(Task.status == status_filter)

    if priority_filter:
        query = query.where(Task.priority == priority_filter)

    # Sorting
    sort_column = Task.created_at
    if sortBy == "name":
        sort_column = Task.name
    elif sortBy == "status":
        sort_column = Task.status
    elif sortBy == "priority":
        sort_column = Task.priority
    elif sortBy == "dueDate":
        sort_column = Task.due_date

    if order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    tasks = result.scalars().all()
    return [TaskResponse.model_validate(t) for t in tasks]

@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).join(Project, Task.project_id == Project.id).where(
        Task.id == task_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Task not found"}
        )

    return TaskResponse.model_validate(task)

@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    req: TaskCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # MANDATORY SECURITY CHECK: Verify parent project belongs to current user
    proj_result = await db.execute(
        select(Project).where(Project.id == req.projectId, Project.owner_id == current_user.id)
    )
    project = proj_result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Project not found or not owned by user"}
        )

    task = Task(
        project_id=req.projectId,
        name=req.name,
        description=req.description,
        priority=req.priority,
        status=req.status,
        due_date=req.dueDate
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return TaskResponse.model_validate(task)

@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: str,
    req: TaskUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Verify task ownership via project
    query = select(Task).join(Project, Task.project_id == Project.id).where(
        Task.id == task_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Task not found"}
        )

    update_data = req.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] is not None:
        task.name = update_data["name"]
    if "description" in update_data:
        task.description = update_data["description"]
    if "priority" in update_data and update_data["priority"] is not None:
        task.priority = update_data["priority"]
    if "status" in update_data and update_data["status"] is not None:
        task.status = update_data["status"]
    if "dueDate" in update_data:
        task.due_date = update_data["dueDate"]

    await db.commit()
    await db.refresh(task)
    return TaskResponse.model_validate(task)

@router.delete("/{task_id}", response_model=GenericMessageResponse)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Task).join(Project, Task.project_id == Project.id).where(
        Task.id == task_id,
        Project.owner_id == current_user.id
    )
    result = await db.execute(query)
    task = result.scalar_one_or_none()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Task not found"}
        )

    await db.delete(task)
    await db.commit()
    return GenericMessageResponse(message="Task deleted successfully")

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, asc
from typing import Optional, List
from app.database import get_db
from app.models import User, Project, ProjectStatus
from app.schemas import (
    ProjectCreateRequest,
    ProjectUpdateRequest,
    ProjectResponse,
    GenericMessageResponse
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])

@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    search: Optional[str] = Query(None, description="Search by project name"),
    status_filter: Optional[ProjectStatus] = Query(None, alias="status", description="Filter by status"),
    sortBy: Optional[str] = Query("createdAt", description="Field to sort by: createdAt, name, status"),
    order: Optional[str] = Query("desc", description="Sort order: asc or desc"),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query = select(Project).where(Project.owner_id == current_user.id)

    if search:
        query = query.where(Project.name.ilike(f"%{search}%"))

    if status_filter:
        query = query.where(Project.status == status_filter)

    # Sorting
    sort_column = Project.created_at
    if sortBy == "name":
        sort_column = Project.name
    elif sortBy == "status":
        sort_column = Project.status

    if order.lower() == "asc":
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    # Pagination
    offset = (page - 1) * limit
    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    projects = result.scalars().all()
    return [ProjectResponse.model_validate(p) for p in projects]

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == current_user.id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Project not found"}
        )

    return ProjectResponse.model_validate(project)

@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    req: ProjectCreateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    project = Project(
        owner_id=current_user.id,
        name=req.name,
        description=req.description,
        status=req.status,
        start_date=req.startDate,
        end_date=req.endDate
    )
    db.add(project)
    await db.commit()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    req: ProjectUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == current_user.id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Project not found"}
        )

    update_data = req.model_dump(exclude_unset=True)
    if "name" in update_data and update_data["name"] is not None:
        project.name = update_data["name"]
    if "description" in update_data:
        project.description = update_data["description"]
    if "status" in update_data and update_data["status"] is not None:
        project.status = update_data["status"]
    if "startDate" in update_data:
        project.start_date = update_data["startDate"]
    if "endDate" in update_data:
        project.end_date = update_data["endDate"]

    await db.commit()
    await db.refresh(project)
    return ProjectResponse.model_validate(project)

@router.delete("/{project_id}", response_model=GenericMessageResponse)
async def delete_project(
    project_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.owner_id == current_user.id)
    )
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "NOT_FOUND", "message": "Project not found"}
        )

    await db.delete(project)
    await db.commit()
    return GenericMessageResponse(message="Project deleted successfully")

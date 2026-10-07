from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator, ConfigDict
from typing import Optional, List, Any
from datetime import date, datetime
from app.models import ProjectStatus, TaskPriority, TaskStatus

# Base response schemas
class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str

class ErrorPayload(BaseModel):
    code: str
    message: str
    details: Optional[List[ErrorDetail]] = None

class StandardErrorResponse(BaseModel):
    success: bool = False
    error: ErrorPayload

# User Schemas
class UserRegisterRequest(BaseModel):
    fullName: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)

    @field_validator("fullName")
    def name_must_be_stripped(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Full name cannot be empty or whitespace only")
        return v

    @field_validator("email")
    def email_lowercase(cls, v: EmailStr) -> str:
        return str(v).strip().lower()

class UserLoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

    @field_validator("email")
    def email_lowercase(cls, v: EmailStr) -> str:
        return str(v).strip().lower()

class UserResponse(BaseModel):
    id: str
    fullName: str = Field(..., validation_alias="full_name", serialization_alias="fullName")
    email: str
    createdAt: datetime = Field(..., validation_alias="created_at", serialization_alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

class AuthSuccessResponse(BaseModel):
    user: UserResponse
    token: str

class GenericMessageResponse(BaseModel):
    message: str

# Project Schemas
class ProjectCreateRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    status: ProjectStatus = ProjectStatus.NOT_STARTED
    startDate: Optional[date] = None
    endDate: Optional[date] = None

    @field_validator("name")
    def name_must_be_stripped(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Project name cannot be empty or whitespace only")
        return v

    @model_validator(mode="after")
    def validate_dates(self):
        if self.startDate and self.endDate and self.endDate < self.startDate:
            raise ValueError("End date must be greater than or equal to start date")
        return self

class ProjectUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    status: Optional[ProjectStatus] = None
    startDate: Optional[date] = None
    endDate: Optional[date] = None

    @field_validator("name")
    def name_must_be_stripped(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Project name cannot be empty or whitespace only")
        return v

    @model_validator(mode="after")
    def validate_dates(self):
        if self.startDate and self.endDate and self.endDate < self.startDate:
            raise ValueError("End date must be greater than or equal to start date")
        return self

class ProjectResponse(BaseModel):
    id: str
    ownerId: str = Field(..., validation_alias="owner_id", serialization_alias="ownerId")
    name: str
    description: Optional[str] = None
    status: ProjectStatus
    startDate: Optional[date] = Field(None, validation_alias="start_date", serialization_alias="startDate")
    endDate: Optional[date] = Field(None, validation_alias="end_date", serialization_alias="endDate")
    createdAt: datetime = Field(..., validation_alias="created_at", serialization_alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Task Schemas
class TaskCreateRequest(BaseModel):
    projectId: str = Field(..., min_length=1)
    name: str = Field(..., min_length=1, max_length=150)
    description: Optional[str] = None
    priority: TaskPriority = TaskPriority.MEDIUM
    status: TaskStatus = TaskStatus.PENDING
    dueDate: Optional[date] = None

    @field_validator("name")
    def name_must_be_stripped(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Task name cannot be empty or whitespace only")
        return v

class TaskUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=150)
    description: Optional[str] = None
    priority: Optional[TaskPriority] = None
    status: Optional[TaskStatus] = None
    dueDate: Optional[date] = None

    @field_validator("name")
    def name_must_be_stripped(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("Task name cannot be empty or whitespace only")
        return v

class TaskResponse(BaseModel):
    id: str
    projectId: str = Field(..., validation_alias="project_id", serialization_alias="projectId")
    name: str
    description: Optional[str] = None
    priority: TaskPriority
    status: TaskStatus
    dueDate: Optional[date] = Field(None, validation_alias="due_date", serialization_alias="dueDate")
    createdAt: datetime = Field(..., validation_alias="created_at", serialization_alias="createdAt")

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

# Dashboard Schema
class DashboardResponse(BaseModel):
    totalProjects: int
    totalTasks: int
    completedTasks: int
    pendingTasks: int
    projectsInProgress: int

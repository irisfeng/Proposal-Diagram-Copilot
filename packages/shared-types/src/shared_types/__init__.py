"""Shared types for proposal-diagram-copilot"""
from enum import Enum
from typing import Optional
from pydantic import BaseModel
from datetime import datetime


class JobStatus(str, Enum):
    QUEUED = "queued"
    PREPROCESSING = "preprocessing"
    INFERENCING = "inferencing"
    RECONSTRUCTING = "reconstructing"
    SCORING = "scoring"
    DONE = "done"
    FAILED_RETRYABLE = "failed_retryable"
    FAILED_TERMINAL = "failed_terminal"


class OutputFormat(str, Enum):
    PPTX = "pptx"
    DRAWIO = "drawio"


# Request/Response DTOs
class UploadSessionRequest(BaseModel):
    project_id: str
    filename: str
    content_type: str
    size: int


class UploadSessionResponse(BaseModel):
    asset_id: str
    upload_url: str
    expire_at: datetime


class CreateJobRequest(BaseModel):
    project_id: str
    asset_id: str
    output_format: OutputFormat = OutputFormat.PPTX
    template_id: str = "tpl_default"
    options: dict = {}


class CreateJobResponse(BaseModel):
    job_id: str
    status: JobStatus


class QualityScore(BaseModel):
    editable_rate: float
    ocr_accuracy: float
    layout_deviation: float
    score: int


class JobResult(BaseModel):
    output_url: str
    preview_url: str
    quality: Optional[QualityScore] = None


class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    progress: int
    stage: str
    result: Optional[JobResult] = None
    quality: Optional[QualityScore] = None
    error_message: Optional[str] = None


# Internal job model
class Job(BaseModel):
    id: str
    project_id: str
    asset_id: str
    status: JobStatus = JobStatus.QUEUED
    stage: str = "queued"
    progress: int = 0
    output_format: OutputFormat = OutputFormat.PPTX
    template_id: str = "tpl_default"
    options: dict = {}
    result: Optional[JobResult] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class Asset(BaseModel):
    id: str
    project_id: str
    filename: str
    content_type: str
    size: int
    path: str
    created_at: datetime

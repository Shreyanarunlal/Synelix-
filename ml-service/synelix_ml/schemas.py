"""Request and response models for the ML API."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class SkillEntry(BaseModel):
    name: str
    level: Optional[float] = None
    category: Optional[str] = None


class ProjectEntry(BaseModel):
    title: Optional[str] = None
    tech: Optional[str] = None
    description: Optional[str] = None


class CertificationEntry(BaseModel):
    name: Optional[str] = None
    issuer: Optional[str] = None


class StudentProfile(BaseModel):
    """Everything the models can use. Every field is optional so a partially
    completed profile still scores, using documented defaults."""

    email: Optional[str] = None
    name: Optional[str] = None
    department: Optional[str] = None
    targetRole: Optional[str] = None

    cgpa: Optional[float] = Field(default=None, ge=0, le=10)
    dsaSolved: Optional[int] = Field(default=None, ge=0)
    aptitudeScore: Optional[int] = Field(default=None, ge=0, le=100)
    projectsCount: Optional[int] = Field(default=None, ge=0)
    internshipsMonths: Optional[int] = Field(default=None, ge=0)
    certificationsCount: Optional[int] = Field(default=None, ge=0)
    hackathonsWon: Optional[int] = Field(default=None, ge=0)
    communicationScore: Optional[int] = Field(default=None, ge=0, le=100)
    backlogs: Optional[int] = Field(default=None, ge=0)

    skills: Optional[List[SkillEntry]] = None
    projects: Optional[List[ProjectEntry]] = None
    certifications: Optional[List[CertificationEntry]] = None

    def to_features(self) -> Dict[str, Any]:
        """Translate the camelCase API shape into the snake_case model shape."""
        return {
            "cgpa": self.cgpa,
            "dsa_solved": self.dsaSolved,
            "aptitude_score": self.aptitudeScore,
            "projects_count": self.projectsCount,
            "internships_months": self.internshipsMonths,
            "certifications_count": self.certificationsCount,
            "hackathons_won": self.hackathonsWon,
            "communication_score": self.communicationScore,
            "backlogs": self.backlogs,
            "department": self.department,
            "targetRole": self.targetRole,
            "skills": [s.model_dump() for s in self.skills] if self.skills else [],
            "projects": [p.model_dump() for p in self.projects] if self.projects else [],
            "certifications": (
                [c.model_dump() for c in self.certifications] if self.certifications else []
            ),
        }


class SkillGapRequest(BaseModel):
    profile: StudentProfile
    targetRole: Optional[str] = None


class MatchRequest(BaseModel):
    profile: StudentProfile
    limit: int = Field(default=8, ge=1, le=20)


class RoadmapRequest(BaseModel):
    profile: StudentProfile
    targetRole: Optional[str] = None
    completed: Optional[Dict[str, bool]] = None


class ResumeRequest(BaseModel):
    resumeText: Optional[str] = None
    fileName: Optional[str] = None
    targetRole: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    modelsLoaded: bool
    version: str

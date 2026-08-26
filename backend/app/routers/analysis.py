"""Analysis router — trigger and retrieve resume analysis results."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.analysis import AnalysisSession
from app.schemas.analysis import AnalysisRequest, AnalysisResponse
from app.services.analysis_service import analysis_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/analysis", tags=["Analysis"])


@router.post("/run", response_model=AnalysisResponse, status_code=201)
def run_analysis(
    request: AnalysisRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Trigger a full resume analysis against a job description.

    This runs the complete pipeline:
      1. Hybrid retrieval (vector + BM25 + reranking) over resume chunks
      2. LLM-based ATS scoring
      3. Skill gap identification
      4. Personalized roadmap generation
    """
    try:
        result = analysis_service.run_analysis(
            db=db,
            user_id=current_user.id,
            resume_id=request.resume_id,
            job_description_id=request.job_description_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/{analysis_id}", response_model=AnalysisResponse)
def get_analysis(
    analysis_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific analysis result by ID."""
    analysis = (
        db.query(AnalysisSession)
        .filter(
            AnalysisSession.id == analysis_id,
            AnalysisSession.user_id == current_user.id,
        )
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return analysis


@router.get("/", response_model=list[AnalysisResponse])
def list_analyses(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all analyses for the current user."""
    analyses = (
        db.query(AnalysisSession)
        .filter(AnalysisSession.user_id == current_user.id)
        .order_by(AnalysisSession.created_at.desc())
        .all()
    )
    return analyses


@router.delete("/{analysis_id}", status_code=204)
def delete_analysis(
    analysis_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a specific analysis session by ID."""
    analysis = (
        db.query(AnalysisSession)
        .filter(
            AnalysisSession.id == analysis_id,
            AnalysisSession.user_id == current_user.id,
        )
        .first()
    )
    if not analysis:
        raise HTTPException(status_code=404, detail="Analysis not found")
    db.delete(analysis)
    db.commit()
    return None


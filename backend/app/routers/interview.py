"""Interview router — start sessions, submit answers, get summaries."""
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.resume import Resume
from app.models.analysis import AnalysisSession
from app.schemas.interview import (
    InterviewStartRequest,
    InterviewAnswerRequest,
    InterviewSessionResponse,
    InterviewSummaryResponse,
    InterviewTurnResponse,
)
from app.services.interview_service import interview_service
from app.utils.security import get_current_user

router = APIRouter(prefix="/interview", tags=["Interview Coach"])


@router.post("/start", status_code=201)
def start_interview(
    request: InterviewStartRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Start a new interview session.

    Requires a resume_id. Optionally takes an analysis_session_id
    to target questions at the candidate's weak areas.
    """
    # Load resume
    resume = db.query(Resume).filter(
        Resume.id == request.resume_id,
        Resume.user_id == current_user.id,
    ).first()
    if not resume or not resume.raw_text:
        raise HTTPException(status_code=404, detail="Resume not found or has no text")

    # Optionally load analysis for skill gaps
    jd_text = ""
    skill_gaps = []
    if request.analysis_session_id:
        analysis = db.query(AnalysisSession).filter(
            AnalysisSession.id == request.analysis_session_id,
        ).first()
        if analysis:
            if analysis.job_description:
                jd_text = analysis.job_description.raw_text or ""
            if analysis.skill_gaps:
                skill_gaps = analysis.skill_gaps.get("gaps", [])

    try:
        session, first_question = interview_service.start_session(
            db=db,
            user_id=current_user.id,
            resume_text=resume.raw_text,
            jd_text=jd_text,
            skill_gaps=skill_gaps,
            analysis_session_id=request.analysis_session_id,
        )
        return {
            "session_id": str(session.id),
            "status": session.status,
            "question": first_question,
            "difficulty": "medium",
            "turn": 1,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@router.post("/{session_id}/answer")
def submit_answer(
    session_id: uuid.UUID,
    request: InterviewAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Submit an answer to the current interview question.

    Returns feedback, score, and the next question (or completion status).
    """
    from app.models.interview import InterviewSession

    # Verify session belongs to user
    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")
    if session.status == "completed":
        raise HTTPException(status_code=400, detail="Interview already completed")

    # Get resume text for context
    # We need to find the resume through analysis session or directly
    resume_text = ""
    jd_text = ""
    skill_gaps = []

    if session.analysis_session:
        if session.analysis_session.resume:
            resume_text = session.analysis_session.resume.raw_text or ""
        if session.analysis_session.job_description:
            jd_text = session.analysis_session.job_description.raw_text or ""
        if session.analysis_session.skill_gaps:
            skill_gaps = session.analysis_session.skill_gaps.get("gaps", [])

    # If no analysis session, try to find resume from turns
    if not resume_text:
        # Fallback: get the most recent resume for this user
        resume = db.query(Resume).filter(
            Resume.user_id == current_user.id
        ).order_by(Resume.uploaded_at.desc()).first()
        if resume:
            resume_text = resume.raw_text or ""

    try:
        result = interview_service.submit_answer(
            db=db,
            session_id=session_id,
            answer=request.answer,
            resume_text=resume_text,
            jd_text=jd_text,
            skill_gaps=skill_gaps,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process answer: {str(e)}")


@router.get("/{session_id}/summary")
def get_interview_summary(
    session_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the post-interview summary with overall feedback and scores."""
    from app.models.interview import InterviewSession

    session = db.query(InterviewSession).filter(
        InterviewSession.id == session_id,
        InterviewSession.user_id == current_user.id,
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    try:
        summary = interview_service.get_summary(db, session_id)
        return summary
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

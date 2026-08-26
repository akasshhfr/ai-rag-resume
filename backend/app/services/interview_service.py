"""
Interview Coach Service: adaptive interview simulator.

This uses a state-machine pattern inspired by LangGraph, but implemented
directly to avoid version compatibility issues with the REST API pattern.

The "agent" logic:
  1. ASK: Generate a question grounded in resume/JD context
  2. EVALUATE: Score the user's answer (0-1), give feedback
  3. ADAPT: Adjust difficulty based on rolling performance
  4. DECIDE: Continue or end based on turn count

Each request from the frontend runs one or more of these steps.
"""
import uuid
from sqlalchemy.orm import Session

from app.models.interview import InterviewSession, InterviewTurn
from app.services.llm_service import llm_service


def ask_question(
    resume_context: str,
    jd_context: str,
    skill_gaps: list,
    conversation_history: list,
    difficulty: str,
    topics_covered: list,
) -> str:
    """
    Generate a single interview question tailored to this candidate.

    The question is grounded in:
    - Their actual resume (what they've done)
    - The job description (what's required)
    - Their weak areas (skill gaps from analysis)
    - What's already been asked (avoid repetition)
    - Current difficulty level (easy / medium / hard)
    """
    difficulty_guide = {
        "easy": "Basic conceptual question or 'tell me about your experience with X'",
        "medium": "Applied scenario, 'how would you approach X', or trade-off discussion",
        "hard": "Deep technical question, system design, or edge-case debugging",
    }

    history_text = ""
    for turn in conversation_history[-3:]:
        history_text += f"Q: {turn.get('question', '')}\nA: {turn.get('answer', '')[:200]}\n\n"

    topics_text = ", ".join(topics_covered[-10:]) if topics_covered else "None yet"
    gaps_text = ", ".join([
        g.get("skill", str(g)) if isinstance(g, dict) else str(g)
        for g in (skill_gaps or [])[:5]
    ])

    prompt = f"""You are a technical interviewer. Generate ONE clear interview question.

DIFFICULTY: {difficulty} ({difficulty_guide.get(difficulty, "medium difficulty")})

CANDIDATE RESUME (key sections):
{resume_context[:2000]}

JOB DESCRIPTION:
{jd_context[:800]}

SKILL GAPS TO TARGET: {gaps_text or "General technical skills"}

TOPICS ALREADY COVERED (do NOT repeat): {topics_text}

RECENT CONVERSATION:
{history_text}

Write ONLY the question text. One question. Be specific to this candidate's background."""

    return llm_service.generate(prompt)


def evaluate_answer(question: str, answer: str, difficulty: str, resume_context: str) -> dict:
    """
    Score the user's answer and provide constructive feedback.

    Returns dict with:
      - score: float 0.0-1.0
      - feedback: string (2-3 sentences)
      - topic: string (1-3 word category)
    """
    prompt = f"""Evaluate this interview answer.

QUESTION: {question}
CANDIDATE ANSWER: {answer}
DIFFICULTY LEVEL: {difficulty}
RESUME CONTEXT: {resume_context[:500]}

Score and provide feedback. Return valid JSON:
{{
  "score": <float 0.0-1.0, be strict but fair>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "topic": "<1-3 word topic, e.g. 'python basics', 'system design'>"
}}"""

    result = llm_service.generate_json(prompt)
    return {
        "score": float(result.get("score", 0.5)),
        "feedback": result.get("feedback", "Keep practicing."),
        "topic": result.get("topic", "general"),
    }


def adapt_difficulty(current_difficulty: str, recent_scores: list[float]) -> str:
    """
    Adjust difficulty based on rolling performance.

    - avg > 0.75 → increase difficulty
    - avg < 0.4 → decrease difficulty
    - otherwise → stay the same
    """
    if len(recent_scores) < 2:
        return current_difficulty

    avg = sum(recent_scores) / len(recent_scores)
    levels = ["easy", "medium", "hard"]
    idx = levels.index(current_difficulty) if current_difficulty in levels else 1

    if avg > 0.75 and idx < 2:
        return levels[idx + 1]
    if avg < 0.4 and idx > 0:
        return levels[idx - 1]
    return current_difficulty


class InterviewService:
    """High-level service managing interview sessions."""

    def start_session(
        self,
        db: Session,
        user_id: uuid.UUID,
        resume_text: str,
        jd_text: str = "",
        skill_gaps: list | None = None,
        analysis_session_id: uuid.UUID | None = None,
    ) -> tuple[InterviewSession, str]:
        """
        Start a new interview session and generate the first question.

        Returns:
            (InterviewSession DB record, first_question_text)
        """
        # Create DB record
        session = InterviewSession(
            user_id=user_id,
            status="in_progress",
        )
        # Link to analysis session if provided
        if analysis_session_id:
            session.analysis_session_id = analysis_session_id

        db.add(session)
        db.commit()
        db.refresh(session)

        # Generate first question
        first_question = ask_question(
            resume_context=resume_text[:3000],
            jd_context=jd_text[:1500],
            skill_gaps=skill_gaps or [],
            conversation_history=[],
            difficulty="medium",
            topics_covered=[],
        )

        # Save first turn (question only, answer comes later)
        turn = InterviewTurn(
            interview_session_id=session.id,
            question=first_question,
            difficulty_level="medium",
            turn_order=1,
        )
        db.add(turn)
        db.commit()

        return session, first_question

    def submit_answer(
        self,
        db: Session,
        session_id: uuid.UUID,
        answer: str,
        resume_text: str,
        jd_text: str = "",
        skill_gaps: list | None = None,
        max_turns: int = 5,
    ) -> dict:
        """
        Process a user's answer, evaluate it, and generate the next question.

        Returns dict with: score, feedback, next_question, difficulty, is_complete, turn_count
        """
        # Load session
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            raise ValueError("Interview session not found")

        # Load all turns in order
        turns = (
            db.query(InterviewTurn)
            .filter(InterviewTurn.interview_session_id == session_id)
            .order_by(InterviewTurn.turn_order)
            .all()
        )

        # Find the latest unanswered turn
        current_turn = next((t for t in reversed(turns) if t.user_answer is None), None)
        if not current_turn:
            raise ValueError("No pending question found for this session")

        # Build conversation history from answered turns
        history = [
            {
                "question": t.question,
                "answer": t.user_answer,
                "score": t.evaluation_score or 0.5,
            }
            for t in turns
            if t.user_answer
        ]

        # Topics already covered
        topics_covered = [t.question[:40] for t in turns if t.user_answer]

        # Evaluate the answer
        eval_result = evaluate_answer(
            question=current_turn.question,
            answer=answer,
            difficulty=current_turn.difficulty_level or "medium",
            resume_context=resume_text[:1000],
        )

        # Save answer + evaluation to DB
        current_turn.user_answer = answer
        current_turn.evaluation_score = eval_result["score"]
        current_turn.feedback = eval_result["feedback"]

        answered_count = len([t for t in turns if t.user_answer]) + 1  # +1 for current

        # Check if interview is done
        is_complete = answered_count >= max_turns

        next_question = None
        new_difficulty = current_turn.difficulty_level or "medium"

        if not is_complete:
            # Adapt difficulty based on recent scores
            recent_scores = [t.evaluation_score for t in turns if t.evaluation_score is not None]
            recent_scores.append(eval_result["score"])
            new_difficulty = adapt_difficulty(
                current_turn.difficulty_level or "medium",
                recent_scores[-2:],
            )

            # Generate next question
            updated_history = history + [{"question": current_turn.question, "answer": answer}]
            next_question = ask_question(
                resume_context=resume_text[:3000],
                jd_context=jd_text[:1500],
                skill_gaps=skill_gaps or [],
                conversation_history=updated_history,
                difficulty=new_difficulty,
                topics_covered=topics_covered + [eval_result.get("topic", "")],
            )

            # Save next turn
            new_turn = InterviewTurn(
                interview_session_id=session_id,
                question=next_question,
                difficulty_level=new_difficulty,
                turn_order=len(turns) + 1,
            )
            db.add(new_turn)
        else:
            session.status = "completed"

        db.commit()

        return {
            "score": eval_result["score"],
            "feedback": eval_result["feedback"],
            "next_question": next_question,
            "difficulty": new_difficulty,
            "is_complete": is_complete,
            "turn_count": answered_count,
        }

    def get_summary(self, db: Session, session_id: uuid.UUID) -> dict:
        """Generate a post-interview performance summary."""
        session = db.query(InterviewSession).filter(InterviewSession.id == session_id).first()
        if not session:
            raise ValueError("Interview session not found")

        turns = (
            db.query(InterviewTurn)
            .filter(InterviewTurn.interview_session_id == session_id)
            .order_by(InterviewTurn.turn_order)
            .all()
        )

        answered = [t for t in turns if t.user_answer]
        scores = [t.evaluation_score for t in answered if t.evaluation_score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0.0

        turns_text = "\n".join(
            f"Q: {t.question}\nA: {t.user_answer}\nScore: {t.evaluation_score:.2f}\n"
            for t in answered
        )

        overall_feedback = llm_service.generate(
            f"""Based on this mock interview, give 2-3 paragraphs of constructive overall feedback.
Be encouraging but honest. Focus on patterns, strengths, and key areas to improve.

Turns:\n{turns_text}\nAverage score: {avg_score:.2f}""",
            "You are a supportive career coach giving post-interview feedback.",
        )

        return {
            "session_id": str(session_id),
            "total_turns": len(answered),
            "average_score": round(avg_score, 2),
            "difficulty_progression": [t.difficulty_level for t in turns],
            "overall_feedback": overall_feedback,
            "turns": [
                {
                    "question": t.question,
                    "answer": t.user_answer,
                    "score": t.evaluation_score,
                    "feedback": t.feedback,
                    "difficulty": t.difficulty_level,
                    "difficulty_level": t.difficulty_level,
                }
                for t in answered
            ],
        }


# Singleton instance
interview_service = InterviewService()

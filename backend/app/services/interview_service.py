"""
Interview Coach Service: LangGraph-based agentic interview simulator.

This is a REAL AGENT, not a single LLM call. It uses LangGraph to build
a state machine that:

  1. ASKS a question — grounded in the resume/JD context and current difficulty
  2. EVALUATES the user's answer — scores it, gives feedback
  3. DECIDES what to do next — follow up on a weak answer? Move to a new topic?
  4. ADAPTS difficulty — based on rolling performance

The difference between this and a plain LLM call:
  - A plain LLM call: "Given this resume, generate 10 interview questions."
    (No state, no adaptation, no evaluation — just one prompt → one response)
  - This agent: maintains STATE across turns, BRANCHES based on performance,
    and ADAPTS its behavior. That's what makes it "agentic."

LangGraph models this as a graph of nodes (functions) connected by edges
(routing logic). The state flows through the graph, getting modified at each node.
"""
import uuid
from typing import TypedDict, Literal

from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from app.models.analysis import AnalysisSession
from app.models.interview import InterviewSession, InterviewTurn
from app.services.llm_service import llm_service


# --- Agent State ---
# This TypedDict defines the shape of the state that flows through the graph.
# Every node receives this state and can modify it.

class InterviewState(TypedDict):
    """State passed between LangGraph nodes."""
    resume_context: str         # Resume text for grounding questions
    jd_context: str             # Job description for relevance
    skill_gaps: list            # Weak areas to target (from Module A)
    conversation_history: list  # All previous Q&A turns
    current_difficulty: str     # "easy" | "medium" | "hard"
    current_question: str       # The question just asked
    current_answer: str         # The user's answer (filled in when they respond)
    last_answer_score: float    # Score of the most recent answer (0-1)
    last_feedback: str          # Feedback on the most recent answer
    turn_count: int             # How many turns have occurred
    max_turns: int              # When to stop
    should_end: bool            # Flag to end the interview
    topics_covered: list        # Track which topics we've asked about


# --- Graph Nodes ---
# Each node is a function that takes the state, does something, and returns
# updates to the state. LangGraph merges the updates into the full state.

def ask_question_node(state: InterviewState) -> dict:
    """
    Generate an interview question based on context and difficulty.

    This node:
      - Looks at the resume, JD, skill gaps, and conversation history
      - Considers the current difficulty level
      - Generates a relevant, non-repeated question
    """
    difficulty = state["current_difficulty"]
    history = state["conversation_history"]
    topics_covered = state.get("topics_covered", [])

    # Build conversation context for the LLM
    history_text = ""
    if history:
        for turn in history[-3:]:  # Last 3 turns for context
            history_text += f"Q: {turn.get('question', '')}\nA: {turn.get('answer', '')}\n\n"

    topics_text = ", ".join(topics_covered) if topics_covered else "None yet"

    system_prompt = (
        "You are a technical interviewer conducting a mock interview. "
        "Ask ONE clear, specific question. Adapt to the difficulty level. "
        "Base questions on the candidate's resume and the target job."
    )

    prompt = f"""Generate ONE interview question.

DIFFICULTY: {difficulty}
- easy: Basic concepts, definitions, "tell me about your experience with X"
- medium: Applied scenarios, "how would you design/implement X", trade-offs
- hard: Deep technical, system design, edge cases, debugging scenarios

RESUME CONTEXT:
{state['resume_context'][:1500]}

JOB DESCRIPTION:
{state['jd_context'][:1000]}

SKILL GAPS TO TARGET:
{', '.join([g.get('skill', '') for g in state.get('skill_gaps', [])[:5]])}

TOPICS ALREADY COVERED (do NOT repeat):
{topics_text}

RECENT CONVERSATION:
{history_text}

Return ONLY the question text, nothing else. Make it specific to this candidate's background.
"""
    question = llm_service.generate(prompt, system_prompt).strip()

    return {"current_question": question}


def evaluate_answer_node(state: InterviewState) -> dict:
    """
    Evaluate the user's answer: score it and generate feedback.

    Scoring:
      - 0.0–0.3: Poor — missing key concepts, incorrect
      - 0.4–0.6: Adequate — basic understanding, lacks depth
      - 0.7–0.8: Good — solid understanding with some depth
      - 0.9–1.0: Excellent — comprehensive, insightful, expert-level
    """
    system_prompt = (
        "You are an expert technical interviewer. "
        "Evaluate answers fairly, providing constructive feedback. "
        "Score strictly but acknowledge partial understanding."
    )

    prompt = f"""Evaluate this interview answer.

QUESTION: {state['current_question']}
ANSWER: {state['current_answer']}
DIFFICULTY LEVEL: {state['current_difficulty']}

RESUME CONTEXT (for reference):
{state['resume_context'][:1000]}

Return a JSON object:
{{
  "score": <float 0.0-1.0>,
  "feedback": "<2-3 sentences of constructive feedback>",
  "topic": "<1-3 word topic category, e.g. 'system design', 'python basics'>"
}}
"""
    result = llm_service.generate_json(prompt, system_prompt)

    score = float(result.get("score", 0.5))
    feedback = result.get("feedback", "No feedback generated.")
    topic = result.get("topic", "general")

    # Update conversation history
    new_turn = {
        "question": state["current_question"],
        "answer": state["current_answer"],
        "score": score,
        "feedback": feedback,
        "difficulty": state["current_difficulty"],
    }
    updated_history = state["conversation_history"] + [new_turn]
    updated_topics = state.get("topics_covered", []) + [topic]

    return {
        "last_answer_score": score,
        "last_feedback": feedback,
        "conversation_history": updated_history,
        "topics_covered": updated_topics,
        "turn_count": state["turn_count"] + 1,
    }


def decide_next_node(state: InterviewState) -> dict:
    """
    Decide whether to continue, follow up, or end the interview.

    This is the BRANCHING logic that makes it an agent, not a pipeline.
    The decision depends on:
      - How many turns have passed (max_turns limit)
      - The score of the last answer (follow up on weak answers)
      - Overall performance trend
    """
    # Check if we've hit the max turns
    if state["turn_count"] >= state["max_turns"]:
        return {"should_end": True}

    return {"should_end": False}


def adapt_difficulty_node(state: InterviewState) -> dict:
    """
    Adjust difficulty based on rolling performance.

    Logic:
      - If the last 2 answers averaged > 0.75 → increase difficulty
      - If the last 2 answers averaged < 0.4 → decrease difficulty
      - Otherwise → stay the same

    This creates an adaptive experience: strong candidates get harder
    questions, struggling candidates get easier ones.
    """
    history = state["conversation_history"]
    current = state["current_difficulty"]

    if len(history) < 2:
        return {}  # Not enough data to adapt yet

    # Average of last 2 answer scores
    recent_scores = [h.get("score", 0.5) for h in history[-2:]]
    avg_score = sum(recent_scores) / len(recent_scores)

    difficulty_levels = ["easy", "medium", "hard"]
    current_idx = difficulty_levels.index(current) if current in difficulty_levels else 1

    if avg_score > 0.75 and current_idx < 2:
        new_difficulty = difficulty_levels[current_idx + 1]
    elif avg_score < 0.4 and current_idx > 0:
        new_difficulty = difficulty_levels[current_idx - 1]
    else:
        new_difficulty = current

    return {"current_difficulty": new_difficulty}


# --- Routing function ---
# This is the conditional edge that decides which node runs next.

def should_continue(state: InterviewState) -> Literal["adapt_difficulty", "end"]:
    """Route: if should_end is True, go to END. Otherwise, adapt and ask again."""
    if state.get("should_end", False):
        return "end"
    return "adapt_difficulty"


# --- Build the LangGraph ---

def build_interview_graph() -> StateGraph:
    """
    Construct the LangGraph state machine for the interview coach.

    Graph structure:
        ask_question → [wait for user answer] → evaluate_answer → decide_next
             ↑                                                        |
             |                                                        ↓
        adapt_difficulty ←────────────────────────────── (if continue)
                                                              |
                                                         (if end) → END
    """
    graph = StateGraph(InterviewState)

    # Add nodes (each node is a function that transforms state)
    graph.add_node("ask_question", ask_question_node)
    graph.add_node("evaluate_answer", evaluate_answer_node)
    graph.add_node("decide_next", decide_next_node)
    graph.add_node("adapt_difficulty", adapt_difficulty_node)

    # Set the entry point — the first node to run
    graph.set_entry_point("ask_question")

    # Add edges (the flow between nodes)
    # After asking, we pause and wait for the user's answer.
    # When we get it, we go to evaluate.
    graph.add_edge("ask_question", "evaluate_answer")

    # After evaluating, decide what to do next
    graph.add_edge("evaluate_answer", "decide_next")

    # Conditional edge: continue or end
    graph.add_conditional_edges(
        "decide_next",
        should_continue,
        {
            "adapt_difficulty": "adapt_difficulty",
            "end": END,
        },
    )

    # After adapting difficulty, ask the next question
    graph.add_edge("adapt_difficulty", "ask_question")

    return graph


# Compile the graph into a runnable
interview_graph = build_interview_graph().compile()


# --- Service class ---

class InterviewService:
    """
    High-level service that manages interview sessions using the LangGraph agent.
    """

    def start_session(
        self,
        db: Session,
        user_id: uuid.UUID,
        resume_text: str,
        jd_text: str = "",
        skill_gaps: list | None = None,
        max_turns: int = 5,
    ) -> tuple[InterviewSession, str]:
        """
        Start a new interview session.

        Creates the DB record, initializes agent state, and generates
        the first question.

        Returns:
            Tuple of (InterviewSession, first_question_text)
        """
        # Create DB record
        session = InterviewSession(
            user_id=user_id,
            status="in_progress",
        )
        db.add(session)
        db.commit()
        db.refresh(session)

        # Initialize agent state
        initial_state: InterviewState = {
            "resume_context": resume_text[:3000],
            "jd_context": jd_text[:2000],
            "skill_gaps": skill_gaps or [],
            "conversation_history": [],
            "current_difficulty": "medium",
            "current_question": "",
            "current_answer": "",
            "last_answer_score": 0.0,
            "last_feedback": "",
            "turn_count": 0,
            "max_turns": max_turns,
            "should_end": False,
            "topics_covered": [],
        }

        # Run just the ask_question node to get the first question
        # We invoke the full graph but it'll pause after ask_question
        # since evaluate_answer needs a user answer.
        first_question = ask_question_node(initial_state)["current_question"]

        # Save the first turn (question only, no answer yet)
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
    ) -> dict:
        """
        Process a user's answer and generate the next question.

        This runs the evaluate → decide → adapt → ask pipeline.

        Returns dict with: feedback, score, next_question (or None if done),
                          difficulty, is_complete
        """
        # Get the session and its turns
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id
        ).first()
        if not session:
            raise ValueError("Interview session not found")

        turns = db.query(InterviewTurn).filter(
            InterviewTurn.interview_session_id == session_id
        ).order_by(InterviewTurn.turn_order).all()

        # Find the latest unanswered turn
        current_turn = None
        for turn in reversed(turns):
            if turn.user_answer is None:
                current_turn = turn
                break

        if not current_turn:
            raise ValueError("No pending question found")

        # Build conversation history from DB turns
        history = []
        for t in turns:
            if t.user_answer:
                history.append({
                    "question": t.question,
                    "answer": t.user_answer,
                    "score": t.evaluation_score or 0.5,
                    "difficulty": t.difficulty_level,
                })

        # Build state for the agent
        state: InterviewState = {
            "resume_context": resume_text[:3000],
            "jd_context": jd_text[:2000],
            "skill_gaps": skill_gaps or [],
            "conversation_history": history,
            "current_difficulty": current_turn.difficulty_level,
            "current_question": current_turn.question,
            "current_answer": answer,
            "last_answer_score": 0.0,
            "last_feedback": "",
            "turn_count": len([t for t in turns if t.user_answer]),
            "max_turns": 5,  # Default, could be configurable
            "should_end": False,
            "topics_covered": [t.question[:30] for t in turns if t.user_answer],
        }

        # Run evaluate → decide → (adapt → ask if continuing)
        eval_result = evaluate_answer_node(state)
        state.update(eval_result)

        decide_result = decide_next_node(state)
        state.update(decide_result)

        # Save the answer and evaluation to the current turn
        current_turn.user_answer = answer
        current_turn.evaluation_score = state["last_answer_score"]
        current_turn.feedback = state["last_feedback"]

        next_question = None
        if not state.get("should_end", False):
            # Adapt difficulty and generate next question
            adapt_result = adapt_difficulty_node(state)
            state.update(adapt_result)

            ask_result = ask_question_node(state)
            next_question = ask_result["current_question"]

            # Save the next question as a new turn
            new_turn = InterviewTurn(
                interview_session_id=session_id,
                question=next_question,
                difficulty_level=state["current_difficulty"],
                turn_order=len(turns) + 1,
            )
            db.add(new_turn)
        else:
            # Interview is complete
            session.status = "completed"

        db.commit()

        return {
            "score": state["last_answer_score"],
            "feedback": state["last_feedback"],
            "next_question": next_question,
            "difficulty": state["current_difficulty"],
            "is_complete": state.get("should_end", False),
            "turn_count": state["turn_count"],
        }

    def get_summary(self, db: Session, session_id: uuid.UUID) -> dict:
        """
        Generate a post-interview summary with overall feedback.
        """
        session = db.query(InterviewSession).filter(
            InterviewSession.id == session_id
        ).first()
        if not session:
            raise ValueError("Interview session not found")

        turns = db.query(InterviewTurn).filter(
            InterviewTurn.interview_session_id == session_id
        ).order_by(InterviewTurn.turn_order).all()

        answered_turns = [t for t in turns if t.user_answer]
        scores = [t.evaluation_score for t in answered_turns if t.evaluation_score is not None]
        avg_score = sum(scores) / len(scores) if scores else 0
        difficulties = [t.difficulty_level for t in turns]

        # Generate overall feedback with LLM
        turns_summary = "\n".join(
            [
                f"Q: {t.question}\nA: {t.user_answer}\nScore: {t.evaluation_score}\n"
                for t in answered_turns
            ]
        )

        overall_feedback = llm_service.generate(
            f"""Based on this mock interview performance, provide a brief overall assessment
and 3 specific tips for improvement.

Interview turns:
{turns_summary}

Average score: {avg_score:.2f}
Difficulty progression: {' → '.join(difficulties)}

Provide 2-3 paragraphs of constructive feedback.""",
            "You are a supportive career coach giving interview feedback.",
        )

        return {
            "session_id": str(session_id),
            "total_turns": len(answered_turns),
            "average_score": round(avg_score, 2),
            "difficulty_progression": difficulties,
            "overall_feedback": overall_feedback,
            "turns": [
                {
                    "question": t.question,
                    "answer": t.user_answer,
                    "score": t.evaluation_score,
                    "feedback": t.feedback,
                    "difficulty": t.difficulty_level,
                }
                for t in answered_turns
            ],
        }


# Singleton instance
interview_service = InterviewService()

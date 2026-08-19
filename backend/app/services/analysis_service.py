"""
Analysis Service: orchestrates the full resume analysis pipeline.

Flow:
  1. Retrieve resume text and JD text from the database
  2. Use hybrid search to find relevant resume chunks for each JD requirement
  3. Send retrieved context + JD to the LLM for:
     - ATS score (0-100)
     - Skill gap identification
     - Personalized learning roadmap
  4. Save results to the analysis_sessions table
"""
import uuid
from sqlalchemy.orm import Session

from app.models.resume import Resume, JobDescription
from app.models.analysis import AnalysisSession
from app.services.llm_service import llm_service
from app.services.retriever_service import retriever_service


class AnalysisService:
    """Runs the full ATS analysis pipeline."""

    def run_analysis(
        self,
        db: Session,
        user_id: uuid.UUID,
        resume_id: uuid.UUID,
        job_description_id: uuid.UUID,
    ) -> AnalysisSession:
        """
        Execute the complete analysis pipeline.

        Steps:
          1. Load resume and JD from the database
          2. Use hybrid retrieval to find the most relevant resume chunks
             for the job description
          3. Ask the LLM to score, find gaps, and generate a roadmap
          4. Save everything to the database
        """
        # Load resume and JD
        resume = db.query(Resume).filter(Resume.id == resume_id).first()
        jd = db.query(JobDescription).filter(JobDescription.id == job_description_id).first()

        if not resume or not resume.raw_text:
            raise ValueError("Resume not found or has no extracted text")
        if not jd:
            raise ValueError("Job description not found")

        # Step 1: Retrieve relevant resume chunks using hybrid search
        # The query is the JD text — we're finding which parts of the resume
        # are most relevant to the job requirements
        relevant_chunks = retriever_service.hybrid_search(
            resume_id=str(resume_id),
            query=jd.raw_text[:2000],  # Truncate long JDs to fit model context
            top_k=8,
        )

        # Build context from retrieved chunks
        context = "\n\n---\n\n".join(
            [chunk["text"] for chunk in relevant_chunks]
        ) if relevant_chunks else resume.raw_text[:3000]

        # Step 2: Get ATS score and skill gaps from LLM
        analysis_result = self._analyze_with_llm(context, jd.raw_text, resume.raw_text)

        # Step 3: Generate learning roadmap based on identified gaps
        roadmap = self._generate_roadmap(analysis_result.get("skill_gaps", []))

        # Step 4: Save to database
        session = AnalysisSession(
            user_id=user_id,
            resume_id=resume_id,
            job_description_id=job_description_id,
            ats_score=analysis_result.get("ats_score", 0),
            skill_gaps={"gaps": analysis_result.get("skill_gaps", [])},
            roadmap={"roadmap": roadmap},
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def _analyze_with_llm(
        self, resume_context: str, jd_text: str, full_resume: str
    ) -> dict:
        """
        Ask the LLM to analyze the resume against the job description.

        The prompt is carefully structured to get consistent JSON output with:
          - ats_score: 0-100 integer
          - skill_gaps: list of missing skills with importance levels
          - strengths: list of matching strengths
          - suggestions: list of improvement suggestions
        """
        system_prompt = (
            "You are an expert ATS (Applicant Tracking System) analyzer and career coach. "
            "You analyze resumes against job descriptions to provide actionable feedback. "
            "Be specific, practical, and honest in your assessments."
        )

        prompt = f"""Analyze this resume against the job description below.

## RESUME (relevant sections):
{resume_context}

## FULL RESUME (for additional context):
{full_resume[:2000]}

## JOB DESCRIPTION:
{jd_text}

## YOUR TASK:
Return a JSON object with these exact fields:
{{
  "ats_score": <integer 0-100, where 100 = perfect match>,
  "skill_gaps": [
    {{"skill": "<missing skill>", "importance": "high|medium|low", "description": "<why this matters>"}}
  ],
  "strengths": [
    {{"skill": "<matching skill>", "description": "<how the resume demonstrates this>"}}
  ],
  "suggestions": [
    "<specific, actionable improvement suggestion>"
  ]
}}

Score criteria:
- 90-100: Excellent match, most requirements met
- 70-89: Good match, some gaps
- 50-69: Moderate match, significant gaps
- Below 50: Poor match, many missing requirements
"""
        return llm_service.generate_json(prompt, system_prompt)

    def _generate_roadmap(self, skill_gaps: list) -> list:
        """
        Generate a month-by-month learning roadmap based on identified skill gaps.

        The roadmap is personalized — it's based on the actual gaps found
        in the analysis, not a generic "learn everything" list.
        """
        if not skill_gaps:
            return []

        gaps_text = "\n".join(
            [
                f"- {gap.get('skill', 'Unknown')}: {gap.get('description', '')} "
                f"(Importance: {gap.get('importance', 'medium')})"
                for gap in skill_gaps
            ]
        )

        system_prompt = (
            "You are a career development coach. Create practical, "
            "realistic learning roadmaps with specific free resources."
        )

        prompt = f"""Create a month-by-month learning roadmap for these skill gaps:

{gaps_text}

Return a JSON array of monthly milestones:
[
  {{
    "month": 1,
    "focus": "<main topic for this month>",
    "skills": ["<skill 1>", "<skill 2>"],
    "tasks": ["<specific learning task>"],
    "resources": ["<free resource name and URL>"]
  }}
]

Rules:
- Prioritize high-importance gaps first
- Keep it realistic (2-4 hours/week assumed)
- Only suggest FREE resources (YouTube, docs, open-source projects)
- Maximum 6 months
"""
        result = llm_service.generate_json(prompt, system_prompt)

        # Handle both list and dict responses
        if isinstance(result, list):
            return result
        return result.get("roadmap", result.get("raw_response", []))


# Singleton instance
analysis_service = AnalysisService()

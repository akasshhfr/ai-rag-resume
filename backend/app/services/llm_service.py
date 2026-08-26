"""
LLM Service: abstracted interface for language model calls.

Uses Google Gemini (free tier) as the primary provider.
"""
import json
import google.generativeai as genai
from app.config import settings

# Configure Gemini with our API key
genai.configure(api_key=settings.gemini_api_key)


class LLMService:
    """
    Abstracted LLM service. All AI features call methods on this class
    instead of directly using the Gemini SDK.
    """

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or settings.gemini_model

    def _get_model(self, system_prompt: str | None = None):
        """Get a GenerativeModel, optionally with a system instruction."""
        if system_prompt:
            return genai.GenerativeModel(
                self.model_name,
                system_instruction=system_prompt,
            )
        return genai.GenerativeModel(self.model_name)

    def generate(self, prompt: str, system_prompt: str | None = None) -> str:
        """
        Generate a text response from the LLM.

        Args:
            prompt: The user's prompt / question.
            system_prompt: Optional system-level instruction that guides
                          the model's behavior.

        Returns:
            The model's text response.
        """
        model = self._get_model(system_prompt)
        try:
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            # If response was blocked or other error, return a safe fallback
            raise RuntimeError(f"LLM generation failed: {str(e)}")

    def generate_json(self, prompt: str, system_prompt: str | None = None) -> dict:
        """
        Generate a JSON response from the LLM.
        Instructs the model to respond in JSON format and parses the result.

        Returns:
            Parsed JSON as a Python dict.
        """
        json_instruction = (
            "\n\nIMPORTANT: Respond ONLY with valid JSON. "
            "No markdown, no code blocks, no explanations — just the raw JSON object."
        )
        full_prompt = prompt + json_instruction

        raw_response = self.generate(full_prompt, system_prompt)

        # Clean up common LLM formatting issues
        cleaned = raw_response.strip()
        if cleaned.startswith("```json"):
            cleaned = cleaned[7:]
        if cleaned.startswith("```"):
            cleaned = cleaned[3:]
        if cleaned.endswith("```"):
            cleaned = cleaned[:-3]
        cleaned = cleaned.strip()

        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            # If JSON parsing fails, return the raw text wrapped in a dict
            return {"raw_response": raw_response, "parse_error": True}


# Singleton instance
llm_service = LLMService()

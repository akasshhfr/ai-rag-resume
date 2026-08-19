"""
LLM Service: abstracted interface for language model calls.

Uses Google Gemini (free tier) as the primary provider.
The abstraction makes it easy to swap to OpenAI/Claude later
by implementing the same interface.
"""
import json
import google.generativeai as genai
from app.config import settings


# Configure the Gemini SDK with our API key
genai.configure(api_key=settings.gemini_api_key)


class LLMService:
    """
    Abstracted LLM service. All AI features call methods on this class
    instead of directly using the Gemini SDK, so swapping providers
    only requires changing this one file.
    """

    def __init__(self, model_name: str | None = None):
        self.model_name = model_name or settings.gemini_model
        self.model = genai.GenerativeModel(self.model_name)

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
        contents = []
        if system_prompt:
            # Gemini uses a different approach for system prompts —
            # we prepend it as context in the conversation
            contents.append({"role": "user", "parts": [system_prompt]})
            contents.append({
                "role": "model",
                "parts": ["Understood. I will follow these instructions."],
            })
        contents.append({"role": "user", "parts": [prompt]})

        response = self.model.generate_content(contents)
        return response.text

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


# Singleton instance — import this wherever you need LLM calls
llm_service = LLMService()

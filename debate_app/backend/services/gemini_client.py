import os
import time
from typing import Optional, Dict, Any
from google import genai
from google.genai import errors
from google.api_core import exceptions
from dotenv import load_dotenv

load_dotenv()

class GeminiClient:
    def __init__(self, config: Optional[Dict[str, Any]] = None, system_instruction: Optional[str] = None):
        # Load config from file if possible
        possible_paths = [
            os.path.join(os.path.dirname(__file__), "..", "config.json"),    # Docker root (/app/config.json)
            os.path.join(os.path.dirname(__file__), "..", "..", "config.json"), # Local dev (debate_app/config.json)
            "config.json" # Current directory
        ]
        
        file_config = {}
        for path in possible_paths:
            if os.path.exists(path):
                import json
                try:
                    with open(path, "r", encoding="utf-8") as f:
                        file_config = json.load(f)
                    if file_config.get("google_api_key"):
                        break
                except Exception:
                    continue

        self.api_key = file_config.get("google_api_key") or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY is not set in config.json or environment")
        
        self.client = genai.Client(api_key=self.api_key)
        
        # Priority: explicit config argument > config.json > default
        self.model_name = (config.get("model_name") if config else None) or file_config.get("model_name") or "gemini-flash-latest"
        self.temperature = config.get("temperature", 0.7) if config else 0.7
        
        self.chat = self.client.chats.create(
            model=self.model_name,
            config={
                "system_instruction": system_instruction,
                "temperature": self.temperature
            }
        )

    def send_message(self, message: str) -> str:
        try:
            # Add a timeout to the request to prevent long hangs
            # 115 seconds is slightly less than the frontend's 120s timeout
            response = self.chat.send_message(
                message, 
                config={"http_options": {"timeout": 115000}} # Timeout in milliseconds
            )
            return response.text
        except Exception as e:
            # Let the caller/frontend handle retries
            raise e

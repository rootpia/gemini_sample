import os
import sys
import json
import time
from google import genai
from google.genai import types
from google.genai import errors
from google.api_core import exceptions
from typing import Optional, Self

# 設定ファイルのパス
CONFIG_FILE = 'config.json'

class GeminiChat:
    """
    GeminiChatクラス
    """
    _AUTH_TOKEN = object()  # 外部から直接呼ばれたか判別するための内部用定数

    def __init__(self, config_file_path: str, _token: object = None):
        """
        GeminiChat インスタンスを生成する
        """
        if _token is not self._AUTH_TOKEN:
            raise RuntimeError(
                "__init__ を直接呼び出すことはできません。GeminiChat.create() で生成してください。"
            )

        self.config_file = config_file_path
        self.config = None
        self.client = None
        self.model_name = None
        self.chat = None

    @classmethod
    def create(cls, config_file_path: str, system_instruction: Optional[str] = None, model_name: Optional[str] = None) -> Self:
        """
        設定ファイルからGeminiChatインスタンスを生成する
        """
        # 1. インスタンス生成
        if not os.path.exists(config_file_path):
            raise FileNotFoundError(f"設定ファイル '{config_file_path}' が見つかりません。")
        inst = cls(config_file_path, cls._AUTH_TOKEN)

        # 2. config.json から設定を読み込む
        try:
            with open(config_file_path, 'r', encoding='utf-8') as f:
                inst.config = json.load(f)
        except json.JSONDecodeError:
            raise ValueError(f"'{config_file_path}' の形式が正しくありません。")

        # 3. Gemini APIクライアントを生成
        api_key = inst.config.get("google_api_key")
        if not api_key:
            raise ValueError("config.json に 'google_api_key' が設定されていません。")
        inst.client =  genai.Client(api_key=api_key)

        # 4. チャットセッションを作成
        # 引数で指定があれば優先、なければconfig、それもなければデフォルト
        inst.model_name = model_name or inst.config.get("model_name", "gemini-flash-latest")
        
        sys_instruction = system_instruction or inst.config.get("system_instruction", None)

        generate_config = types.GenerateContentConfig(
            temperature=inst.config.get("temperature", 0.7),
            system_instruction=sys_instruction
        )
        inst.chat = inst.client.chats.create(
            model=inst.model_name, config=generate_config, history=[]
        )
        return inst

    def send_message(self, message: str) -> str:
        """
        メッセージを送信し、レスポンスのテキストを返す
        503/429エラー時はリトライする
        """
        max_retries = 5
        base_delay = 5

        for attempt in range(max_retries + 1):
            try:
                response = self.chat.send_message(message)
                return response.text
            except Exception as e:
                # エラー判定
                is_retryable = False
                
                # google.genai.errors.ClientError の場合
                if isinstance(e, errors.ClientError):
                    if e.code in [429, 503]:
                        is_retryable = True
                
                # その他の例外型チェック (念のため)
                if not is_retryable:
                    if isinstance(e, exceptions.ServiceUnavailable) or isinstance(e, exceptions.ResourceExhausted):
                        is_retryable = True
                    elif "429" in str(e) or "503" in str(e):
                        is_retryable = True
                
                if is_retryable and attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    print(f"[{self.model_name}] エラー発生 (429/503)。{delay}秒後にリトライします... ({attempt + 1}/{max_retries})")
                    time.sleep(delay)
                else:
                    # リトライ回数超過、またはリトライ対象外のエラー
                    print(f"[{self.model_name}] エラー詳細: {e}")
                    raise e
        return ""

    def start_chat(self, initial_prompt: Optional[str] = None):
        """
        チャットを開始する
        """
        # 初期プロンプトがある場合は結果を表示して終了
        if initial_prompt:
            self._process_message(initial_prompt)
            return

        print(f"--- 会話を開始します（モデル: {self.model_name} / '終了 or exit' で終わります） ---")
        while True:
            try:
                user_input = input("あなた: ")
                if user_input.lower() in ["終了", "exit"]:
                    break
                if not user_input.strip():
                    continue

                self._process_message(user_input)
            except EOFError:
                break
            except KeyboardInterrupt:
                print("\n終了します。")
                break

    def _process_message(self, user_prompt: str):
        """
        メッセージを送信し、レスポンスを表示する
        """
        response = self.chat.send_message(user_prompt)
        print("Gemini: ")
        print(response.text, flush=True)

if __name__ == "__main__":
    chat_app = GeminiChat.create(CONFIG_FILE)

    user_prompt = None
    if len(sys.argv) > 1:
        user_prompt = " ".join(sys.argv[1:])
    
    chat_app.start_chat(user_prompt)
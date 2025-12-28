import os
import sys
import json
import google.generativeai as genai

# 設定ファイルのパス
CONFIG_FILE = 'config.json'

def load_config():
    """
    config.json から設定を読み込みます。
    """
    if not os.path.exists(CONFIG_FILE):
        print(f"エラー: 設定ファイル '{CONFIG_FILE}' が見つかりません。")
        print(f"以下の内容で '{CONFIG_FILE}' を作成してください:\n")
        print('{\n  "google_api_key": "あなたのAPIキー",\n  "model_name": "gemini-1.5-flash"\n}')
        sys.exit(1)

    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            config = json.load(f)
            return config
    except json.JSONDecodeError:
        print(f"エラー: '{CONFIG_FILE}' の形式が正しくありません。正しいJSON形式か確認してください。")
        sys.exit(1)

def setup_gemini(config):
    """
    Gemini APIの初期設定を行います。
    """
    api_key = config.get("google_api_key")
    if not api_key:
        print("エラー: config.json に 'google_api_key' が設定されていません。")
        sys.exit(1)
    
    genai.configure(api_key=api_key)

    # configからモデル名を取得、なければデフォルトを使用
    model_name = config.get("model_name", "gemini-1.5-flash")
    model = genai.GenerativeModel(model_name)
    return model

def ask_ai(prompt):
    """
    AIにプロンプトを送信し、レスポンスを取得します。
    """
    try:
        config = load_config()
        model = setup_gemini(config)
        
        print(f"🤖 AI ({model.model_name.split('/')[-1]}) に問い合わせ中...")
        
        response = model.generate_content(prompt, stream=True)
        
        print("\n--- 回答 ---")
        for chunk in response:
            if chunk.text:
                print(chunk.text, end="", flush=True)
        print("\n------------\n")

    except Exception as e:
        print(f"\nエラーが発生しました: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        user_prompt = " ".join(sys.argv[1:])
    else:
        user_prompt = "Pythonで3Dガウシアン・スプラッティングの共分散行列を計算する関数を書いて"

    print(f"質問: {user_prompt}")
    ask_ai(user_prompt)
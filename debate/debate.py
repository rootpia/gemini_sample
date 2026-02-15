import os
import sys
import time
from typing import List
from chat.ai_assist import GeminiChat, CONFIG_FILE

class DebateParticipant:
    """
    ディベート参加者クラス (GeminiChatを利用)
    """
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        
        system_instruction = f"""
あなたはディベートの参加者です。
名前: {self.name}
役割: {self.role}

これまでの議論の流れを踏まえ、あなたの役割として発言してください。
発言は簡潔に、論理的に行ってください。
自分の名前を名乗る必要はありません。
"""
        # GeminiChatインスタンスを生成（個別のチャットセッションを持つ）
        self.chat_app = GeminiChat.create(CONFIG_FILE, system_instruction=system_instruction)

    def receive_message(self, message: str) -> str:
        """
        他者の発言を受け取り、自分の発言を生成する
        """
        # GeminiChatのsend_messageを使って履歴を更新しつつ回答を得る
        return self.chat_app.send_message(message)

class DebateManager:
    """
    ディベート進行管理クラス
    """
    def __init__(self):
        self.participants: List[DebateParticipant] = []
        # 全体の履歴ログ（表示用）
        self.transcript = []

    def add_participant(self, name: str, role: str):
        participant = DebateParticipant(name, role)
        self.participants.append(participant)

    def start_debate(self, topic: str, rounds: int = 3):
        print(f"\n=== ディベート開始: {topic} ===\n")
        
        # 最初のトピック
        last_message = f"ディベートのトピックは「{topic}」です。議論を開始してください。"
        self.transcript.append(f"System: {last_message}")

        # 全参加者にトピックを初期入力として与える必要があるが、
        # GeminiChatは send_message で必ずレスポンスを返そうとする。
        # トピック提示に対する「最初の発言」は最初の一人目が行えばよい。
        # しかし、ステートフルなチャットの場合、2人目以降もトピックを知っておく必要がある。
        
        # 戦略:
        # ラウンド1の最初の人にはトピックを投げる。
        # その出力を2人目に投げる（「[前の人]がこう言いました: ...」）。
        # これを繰り返すことで、全員が文脈を共有できる。
        
        # ただし、最初の一人目以外もトピックを知る必要があるため、
        # 2人目以降への入力にはトピックのコンテキストを含めるか、
        # あるいは全員に初期化メッセージを送る（返答は無視する）？
        # 無視するのはAPIコストがかかる。
        
        # シンプルなリレー方式:
        # Input -> P1 -> Output1
        # "P1の発言: Output1" -> P2 -> Output2
        # "P2の発言: Output2" -> P3 -> Output3
        # ...
        # これだとP3はP1の発言を直接は知らない（P2の入力に含まれるが）。
        # Geminiのコンテキストウィンドウは広いので、
        # "これまでの経緯:\n[P1]: ...\n[P2]: ...\nあなたの番です。" 
        # というように累積したログを毎回全員に投げつける方式（以前の方式）が
        # 実は一番確実だが、GeminiChatクラス（ステートフル）を使うなら、
        # 履歴が重複して蓄積されてしまう。
        
        # GeminiChat（ステートフル）を使う場合の最適解:
        # 自分が発言していない間の他者の発言をすべてまとめて、自分のターンに入力する。
        
        # 各参加者が「未読のメッセージ」バッファを持つのが良さそう。
        
        # 簡易実装:
        # 各ターンで、直前の発言だけではなく、前回の自分のターン以降の全ての他者の発言をまとめて入力する。
        
        # ここではシンプルに、「直前の発言」をリレーする形式＋トピックは初回に含める、でやってみる。
        # ただし、情報の欠落を防ぐため、「[Aさんの発言] ...」という形で誰の発言かを明記して渡す。

        current_context = last_message

        for i in range(rounds):
            print(f"--- ラウンド {i+1} ---")
            for participant in self.participants:
                print(f"[{participant.name}] 考え中...", end="", flush=True)
                
                # エージェントへの入力
                # トピックあるいは直前の発言を入力とする
                response = participant.receive_message(current_context)
                
                print(f"\r[{participant.name}]: {response}\n")
                self.transcript.append(f"[{participant.name}]: {response}")
                
                # 次の人へのコンテキスト
                current_context = f"直前の{participant.name}の発言: {response}"
            
                time.sleep(1) # API制限考慮

def main():
    if not os.path.exists(CONFIG_FILE):
        print(f"エラー: {CONFIG_FILE} が見つかりません。セットアップを行ってください。")
        return

    try:
        manager = DebateManager()
    except Exception as e:
        print(f"初期化エラー: {e}")
        return

    print("--- AI ディベートツール (GeminiChat版) ---")
    topic = input("ディベートのトピックを入力してください: ")
    if not topic:
        print("トピックが入力されませんでした。終了します。")
        return

    # 参加者設定
    while True:
        print("\n参加者を追加しますか？ (y/n)")
        if len(manager.participants) == 0:
            print(" (現在は0人です。最低2人追加してください)")
        
        try:
            choice = input("> ").lower()
        except EOFError:
            choice = 'n'

        if choice != 'y':
            if len(manager.participants) < 2:
                print("最低2人の参加者が必要です。")
                try:
                    # 入力が尽きている場合はループしても意味がないので強制終了
                    if sys.stdin.read() == '': 
                        return
                except:
                    pass
                continue
            break
        
        try:
            name = input("参加者の名前 (例: 肯定派): ")
            role = input("参加者の役割/性格 (例: AIの進化を強く支持する): ")
        except EOFError:
            print("入力が途中で終了しました。")
            return

        manager.add_participant(name, role)
        print(f"参加者 '{name}' を追加しました。")

    print("\nラウンド数を入力してください (デフォルト: 3): ")
    try:
        rounds_input = input()
    except EOFError:
        rounds_input = "3"
    try:
        rounds = int(rounds_input)
    except ValueError:
        rounds = 3

    # ディベート開始
    manager.start_debate(topic, rounds)

if __name__ == "__main__":
    main()

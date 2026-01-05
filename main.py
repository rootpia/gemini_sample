from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from ai_assist import GeminiChat, CONFIG_FILE

app = FastAPI()
chat_instance = None

@app.on_event("startup")
async def startup_event():
    global chat_instance
    try:
        chat_instance = GeminiChat.create(CONFIG_FILE)
        print("GeminiChat instance created successfully.")
    except Exception as e:
        print(f"Error creating GeminiChat instance: {e}")

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    global chat_instance
    if not chat_instance:
         try:
            chat_instance = GeminiChat.create(CONFIG_FILE)
         except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to initialize GeminiChat: {str(e)}")

    try:
        response = chat_instance.chat.send_message(request.message)
        return ChatResponse(reply=response.text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8888)

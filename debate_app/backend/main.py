from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import participants, debates

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Debator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify: ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(participants.router, prefix="/api/participants", tags=["participants"])
app.include_router(debates.router, prefix="/api/debates", tags=["debates"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Debator API"}

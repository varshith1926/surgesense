from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.predict import router as predict_router

app = FastAPI()

app.include_router(predict_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # later restrict to frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"message": "SurgeSense API Running"}
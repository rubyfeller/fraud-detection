import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import router
from models.train_paysim_model import FraudDetectionModel

app = FastAPI()

logging.basicConfig(level=logging.INFO)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

model = FraudDetectionModel()


@asynccontextmanager
async def lifespan_event():
    model.load_model("models/fraud_model.pkl")
    yield

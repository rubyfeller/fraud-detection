from fastapi import APIRouter
from api.endpoints.transactions import router as transactions_router
from api.endpoints.predictions import router as predictions_router

router = APIRouter()
router.include_router(transactions_router, prefix="/api")
router.include_router(predictions_router, prefix="/api")
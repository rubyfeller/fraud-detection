from fastapi import APIRouter
from api.endpoints.transactions import router as transactions_router
from api.endpoints.predictions import router as predictions_router
from api.endpoints.analytics import router as analytics_router

router = APIRouter()
router.include_router(transactions_router, prefix="/api")
router.include_router(predictions_router, prefix="/api")
router.include_router(analytics_router, prefix="/api")

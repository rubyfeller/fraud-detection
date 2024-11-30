from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from api.database import get_db
from api.database import Transaction as DBTransaction, Prediction as DBPrediction
from math import ceil

from api.schemas import TransactionResponse

router = APIRouter()


@router.get("/transactions")
async def get_transactions(
        db: Session = Depends(get_db),
        page: int = Query(default=1, ge=1),
        page_size: int = Query(default=15, ge=1, le=1000),
        manual_review: Optional[bool] = Query(default=None)
):
    query = db.query(DBTransaction).join(DBPrediction, DBTransaction.id == DBPrediction.transaction_id)

    if manual_review is not None:
        query = query.filter(DBPrediction.manual_review == manual_review)

    # Get total count for pagination metadata
    total_count = query.count()

    # Calculate offset and limit
    offset = (page - 1) * page_size

    # Get paginated transactions
    transactions = query.offset(offset).limit(page_size).all()

    # Get corresponding predictions
    transaction_ids = [t.id for t in transactions]
    predictions = db.query(DBPrediction).filter(DBPrediction.transaction_id.in_(transaction_ids)).all()

    # Create prediction dictionary
    prediction_dict = {pred.transaction_id: pred for pred in predictions}

    # Combine transactions and predictions
    response_data = [
        TransactionResponse(
            id=transaction.id,
            step=transaction.step,
            amount=transaction.amount,
            type=transaction.type,
            oldbalanceOrg=transaction.oldbalanceOrg,
            newbalanceOrig=transaction.newbalanceOrig,
            oldbalanceDest=transaction.oldbalanceDest,
            newbalanceDest=transaction.newbalanceDest,
            prediction=prediction_dict[transaction.id].prediction if transaction.id in prediction_dict else None,
            probability=prediction_dict[transaction.id].probability if transaction.id in prediction_dict else None,
            manual_review=prediction_dict[transaction.id].manual_review if transaction.id in prediction_dict else None,
            reviewed_prediction=prediction_dict[
                transaction.id].reviewed_prediction if transaction.id in prediction_dict else 0
        ) for transaction in transactions
    ]

    return {
        "data": response_data,
        "pagination": {
            "total_items": total_count,
            "total_pages": ceil(total_count / page_size),
            "current_page": page,
            "page_size": page_size,
            "has_next": offset + page_size < total_count,
            "has_previous": page > 1
        }
    }

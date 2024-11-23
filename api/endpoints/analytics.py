from fastapi import APIRouter, Depends
from sqlalchemy import func, case
from sqlalchemy.orm import Session
from api.database import get_db
from api.database import Transaction as DBTransaction, Prediction as DBPrediction

router = APIRouter()


@router.get("/transactions/analytics")
async def get_transaction_analytics(db: Session = Depends(get_db)):
    step_distribution = (
        db.query(
            DBTransaction.step,
            func.sum(case((DBPrediction.prediction == 0, 1), else_=0)).label('legitimate'),
            func.sum(case((DBPrediction.prediction == 1, 1), else_=0)).label('fraudulent')
        )
        .select_from(DBTransaction)
        .join(DBPrediction, DBTransaction.id == DBPrediction.transaction_id)
        .group_by(DBTransaction.step)
        .order_by(DBTransaction.step)
        .all()
    )

    step_distribution = [
        {
            "step": row[0],
            "legitimate": int(row[1]) if row[1] is not None else 0,
            "fraudulent": int(row[2]) if row[2] is not None else 0
        }
        for row in step_distribution
    ]

    legitimate_count = sum(row["legitimate"] for row in step_distribution)
    fraudulent_count = sum(row["fraudulent"] for row in step_distribution)
    total_transactions = legitimate_count + fraudulent_count
    fraudulent_percentage = round(fraudulent_count / total_transactions * 100, 2) if total_transactions > 0 else 0

    # -5 to round the values to the nearest 10,000
    balance_distribution = (
        db.query(
            func.round(DBTransaction.oldbalanceOrg, -5).label('balance_range'),
            func.sum(case((DBPrediction.prediction == 0, 1), else_=0)).label('legitimate'),
            func.sum(case((DBPrediction.prediction == 1, 1), else_=0)).label('fraudulent'),
            func.avg(DBTransaction.oldbalanceOrg).label('avg_balance')
        )
        .select_from(DBTransaction)
        .join(DBPrediction, DBTransaction.id == DBPrediction.transaction_id)
        .group_by(func.round(DBTransaction.oldbalanceOrg, -5))
        .order_by(func.round(DBTransaction.oldbalanceOrg, -5))
        .all()
    )

    balance_distribution = [
        {
            "balanceRange": f"{int(row[0]):,} - {int(row[0] + 100000):,}",
            "legitimate": int(row[1]) if row[1] is not None else 0,
            "fraudulent": int(row[2]) if row[2] is not None else 0,
            "avgBalance": float(row[3]) if row[3] is not None else 0
        }
        for row in balance_distribution
    ]

    # -2 to round the values to the nearest 100
    amount_distribution = (
        db.query(
            func.round(DBTransaction.amount, -2).label('amount_range'),
            func.count().label('count')
        )
        .select_from(DBTransaction)
        .join(DBPrediction, DBTransaction.id == DBPrediction.transaction_id)
        .group_by(func.round(DBTransaction.amount, -2))
        .order_by(func.round(DBTransaction.amount, -2))
        .all()
    )

    amount_distribution = [
        {
            "amountRange": f"{int(row[0]):,} - {int(row[0] + 100):,}",
            "count": int(row[1]) if row[1] is not None else 0
        }
        for row in amount_distribution
    ]

    basic_stats = (
        db.query(
            func.avg(DBTransaction.amount).label('avg_amount'),
            func.min(DBTransaction.amount).label('min_amount'),
            func.max(DBTransaction.amount).label('max_amount'),
            func.count(DBTransaction.amount).label('total_count')
        )
        .select_from(DBTransaction)
        .join(DBPrediction, DBTransaction.id == DBPrediction.transaction_id)
        .first()
    )

    return {
        "stepDistribution": step_distribution,
        "legitimateCount": legitimate_count,
        "fraudulentCount": fraudulent_count,
        "fraudulentPercentage": fraudulent_percentage,
        "balanceDistribution": balance_distribution,
        "amountDistribution": amount_distribution,
        "summaryStats": {
            "avgAmount": float(basic_stats[0]) if basic_stats[0] is not None else 0,
            "minAmount": float(basic_stats[1]) if basic_stats[1] is not None else 0,
            "maxAmount": float(basic_stats[2]) if basic_stats[2] is not None else 0,
            "totalTransactions": int(basic_stats[3]) if basic_stats[3] is not None else 0
        }
    }

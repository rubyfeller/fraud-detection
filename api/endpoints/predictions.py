import asyncio
import logging
from io import StringIO
import pandas as pd
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from api.database import get_db
from api.database import Transaction as DBTransaction, Prediction as DBPrediction
from api.schemas import TransactionInput
from models.train_paysim_model import FraudDetectionModel

router = APIRouter()

CHUNK_SIZE = 1000  # Process 1000 rows at a time
MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB limit
MAX_ROWS = 100000  # Maximum number of rows allowed

model = FraudDetectionModel()
model.load_model("models/fraud_model.pkl")


async def process_file_in_background(db: Session, content: str):
    df = pd.read_csv(StringIO(content))

    # Process in chunks
    chunks = [df[i:i + CHUNK_SIZE] for i in range(0, len(df), CHUNK_SIZE)]
    predictions = []

    # Process chunks concurrently
    tasks = [process_chunk(chunk, db, model) for chunk in chunks]
    chunk_results = await asyncio.gather(*tasks)

    # Combine results
    for result in chunk_results:
        predictions.extend(result)

    return predictions


async def process_chunk(chunk: pd.DataFrame, db: Session, model: FraudDetectionModel):
    predictions = []

    # Bulk insert transactions
    db_transactions = [DBTransaction(**row) for _, row in chunk.iterrows()]
    db.add_all(db_transactions)
    db.commit()

    # Refresh transactions to get the auto-incremented IDs
    for transaction in db_transactions:
        db.refresh(transaction)

    # Get transaction IDs
    transaction_ids = [t.id for t in db_transactions]

    # Make predictions one by one
    batch_predictions = []
    for _, row in chunk.iterrows():
        pred = model.predict_proba(row.to_dict())
        logging.info(f"Prediction for transaction: {pred}")
        batch_predictions.append(pred)

    # Bulk insert predictions
    db_predictions = [
        DBPrediction(
            transaction_id=tid,
            prediction=pred['prediction'],
            probability=pred['probability']
        )
        for tid, pred in zip(transaction_ids, batch_predictions)
    ]
    db.add_all(db_predictions)
    db.commit()

    # Prepare response
    for t, p in zip(db_transactions, batch_predictions):
        manual_review = p['prediction'] == 0 and 0.45 <= p['probability'] <= 0.55
        predictions.append({
            'id': t.id,
            'step': t.step,
            'amount': t.amount,
            'type': t.type,
            'oldbalanceOrg': t.oldbalanceOrg,
            'newbalanceOrig': t.newbalanceOrig,
            'oldbalanceDest': t.oldbalanceDest,
            'newbalanceDest': t.newbalanceDest,
            'prediction': p.get('prediction', 0),
            'probability': p.get('probability', 0.0),
            'manual_review': manual_review
        })

    return predictions


@router.post("/predict")
async def predict(transaction: TransactionInput, db: Session = Depends(get_db)):
    # Save transaction to database
    db_transaction = DBTransaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    # Make prediction
    result = model.predict_proba(transaction.model_dump())

    # Check if manual review is needed
    manual_review = result['prediction'] == 0 and 0.45 <= result['probability'] <= 0.55

    # Save prediction to database
    db_prediction = DBPrediction(
        transaction_id=db_transaction.id,
        prediction=result['prediction'],
        probability=result['probability'],
        manual_review=manual_review
    )
    db.add(db_prediction)
    db.commit()

    # Prepare response
    response = transaction.model_dump()
    response.update({
        'id': db_transaction.id,
        'prediction': result['prediction'],
        'probability': result['probability'],
        'manual_review': manual_review
    })

    return response


@router.post("/predict_batch")
async def predict_batch(
        file: UploadFile = File(...),
        db: Session = Depends(get_db)
):
    if not file:
        raise HTTPException(status_code=400, detail="No file uploaded")

    if file.content_type != 'text/csv':
        raise HTTPException(status_code=400, detail="Only CSV files are supported")

    # Check file size
    file.file.seek(0, 2)
    size = file.file.tell()
    if size > MAX_FILE_SIZE:
        raise HTTPException(status_code=400,
                            detail=f"File size exceeds maximum limit of {MAX_FILE_SIZE / 1024 / 1024}MB")
    file.file.seek(0)

    # Read file in chunks
    content = await file.read()
    df = pd.read_csv(StringIO(content.decode('utf-8')))

    # Validate row count
    if len(df) > MAX_ROWS:
        raise HTTPException(status_code=400, detail=f"Number of rows exceeds maximum limit of {MAX_ROWS}")

    # Validate columns
    required_columns = ['step', 'type', 'amount', 'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest']
    if not all(column in df.columns for column in required_columns):
        raise HTTPException(status_code=400, detail="Missing required columns in the uploaded file")

    # Add background task to process file
    predictions = await process_file_in_background(db, content.decode('utf-8'))

    return {"message": "File processed successfully", "predictions": predictions}


@router.put("/review/{prediction_id}")
async def review_prediction(prediction_id: int, reviewed_prediction: int, db: Session = Depends(get_db)):
    db_prediction = db.query(DBPrediction).filter(DBPrediction.id == prediction_id).first()
    if not db_prediction:
        raise HTTPException(status_code=404, detail="Prediction not found")

    db_prediction.reviewed = True
    db_prediction.reviewed_prediction = reviewed_prediction
    db.commit()
    db.refresh(db_prediction)

    return {"message": "Review status updated", "prediction": db_prediction}

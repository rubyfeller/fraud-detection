from io import StringIO
from typing import List

import pandas as pd
from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from api.schemas import TransactionInput, TransactionResponse
from sqlalchemy.orm import Session

from api.database import SessionLocal, Transaction as DBTransaction, Prediction as DBPrediction
from models.train_paysim_model import FraudDetectionModel

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = FraudDetectionModel()

model.load_model("models/fraud_model.pkl")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.post("/predict")
async def predict(transaction: TransactionInput, db: Session = Depends(get_db)):
    # Save transaction to database
    db_transaction = DBTransaction(**transaction.dict())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)

    # Make prediction
    result = model.predict_proba(transaction.dict())

    # Check if manual review is needed
    manual_review = result['prediction'] == 0 and 0.45 <= result['probability'] <= 0.55

    # Save prediction to database
    db_prediction = DBPrediction(
        transaction_id=db_transaction.id,
        prediction=result['prediction'],
        probability=result['probability']
    )
    db.add(db_prediction)
    db.commit()

    return {
        'id': db_transaction.id,
        'step': transaction.step,
        'amount': transaction.amount,
        'type': transaction.type,
        'oldbalanceOrg': transaction.oldbalanceOrg,
        'newbalanceOrig': transaction.newbalanceOrig,
        'oldbalanceDest': transaction.oldbalanceDest,
        'newbalanceDest': transaction.newbalanceDest,
        'prediction': result['prediction'],
        'probability': result['probability'],
        'manual_review': manual_review
    }


@app.post("/predict_batch")
async def predict_batch(file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Read the uploaded file
    content = await file.read()
    df = pd.read_csv(StringIO(content.decode('utf-8')))

    # Ensure all required columns are present
    required_columns = ['step', 'type', 'amount', 'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest']
    if not all(column in df.columns for column in required_columns):
        return {"error": "Missing required columns in the uploaded file"}

    predictions = []
    for _, row in df.iterrows():
        transaction_data = row.to_dict()

        # Save transaction to database
        db_transaction = DBTransaction(**transaction_data)
        db.add(db_transaction)
        db.commit()
        db.refresh(db_transaction)

        # Make prediction
        result = model.predict_proba(transaction_data)

        # Check if manual review is needed
        manual_review = result['prediction'] == 0 and 0.45 <= result['probability'] <= 0.55

        # Save prediction to database
        db_prediction = DBPrediction(
            transaction_id=db_transaction.id,
            prediction=result['prediction'],
            probability=result['probability']
        )
        db.add(db_prediction)
        db.commit()

        predictions.append({
            'id': db_transaction.id,
            'step': transaction_data['step'],
            'amount': transaction_data['amount'],
            'type': transaction_data['type'],
            'oldbalanceOrg': transaction_data['oldbalanceOrg'],
            'newbalanceOrig': transaction_data['newbalanceOrig'],
            'oldbalanceDest': transaction_data['oldbalanceDest'],
            'newbalanceDest': transaction_data['newbalanceDest'],
            'prediction': result['prediction'],
            'probability': result['probability'],
            'manual_review': manual_review
        })

    return predictions


@app.get("/transactions", response_model=List[TransactionResponse])
async def get_transactions(db: Session = Depends(get_db)):
    transactions = db.query(DBTransaction).all()
    predictions = db.query(DBPrediction).all()

    # Create a dictionary to map transaction_id to prediction
    prediction_dict = {pred.transaction_id: pred for pred in predictions}

    # Combine transactions and predictions
    response = []
    for transaction in transactions:
        pred = prediction_dict.get(transaction.id)
        if pred:
            response.append(TransactionResponse(
                id=transaction.id,
                step=transaction.step,
                amount=transaction.amount,
                type=transaction.type,
                oldbalanceOrg=transaction.oldbalanceOrg,
                newbalanceOrig=transaction.newbalanceOrig,
                oldbalanceDest=transaction.oldbalanceDest,
                newbalanceDest=transaction.newbalanceDest,
                prediction=pred.prediction,
                probability=pred.probability,
                manual_review=pred.prediction == 0 and 0.45 <= pred.probability <= 0.55
            ))

    return response

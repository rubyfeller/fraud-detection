from pydantic import BaseModel


class TransactionInput(BaseModel):
    step: int
    amount: float
    type: str
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float


class TransactionResponse(BaseModel):
    id: int
    step: int
    amount: float
    type: str
    oldbalanceOrg: float
    newbalanceOrig: float
    oldbalanceDest: float
    newbalanceDest: float
    prediction: int
    probability: float
    manual_review: bool

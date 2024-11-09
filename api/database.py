from sqlalchemy import create_engine, Column, Integer, Float, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./fraud_detection.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    step = Column(Integer)
    amount = Column(Float)
    type = Column(String)
    oldbalanceOrg = Column(Float)
    newbalanceOrig = Column(Float)
    oldbalanceDest = Column(Float)
    newbalanceDest = Column(Float)

class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer)
    prediction = Column(Integer)
    probability = Column(Float)

Base.metadata.create_all(bind=engine)
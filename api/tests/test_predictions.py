import pytest
import pandas as pd
from unittest.mock import MagicMock
from sqlalchemy.orm import Session
from api.endpoints.predictions import process_chunk
from models.train_paysim_model import FraudDetectionModel

@pytest.fixture
def mock_session():
    session = MagicMock(spec=Session)
    return session

@pytest.fixture
def mock_model():
    model = MagicMock(spec=FraudDetectionModel)
    model.predict_proba.side_effect = lambda x: {'prediction': 0, 'probability': 0.5}
    return model

@pytest.mark.asyncio
async def test_process_chunk(mock_session, mock_model):
    # Arrange
    data = {
        'step': [1, 2],
        'amount': [100.0, 200.0],
        'type': ['TRANSFER', 'PAYMENT'],
        'oldbalanceOrg': [1000.0, 2000.0],
        'newbalanceOrig': [900.0, 1800.0],
        'oldbalanceDest': [0.0, 0.0],
        'newbalanceDest': [100.0, 200.0]
    }
    chunk = pd.DataFrame(data)

    # Act
    predictions = await process_chunk(chunk, mock_session, mock_model)

    # Assert
    assert len(predictions) == 2
    assert predictions[0]['prediction'] == 0
    assert predictions[0]['probability'] == 0.5
    assert predictions[1]['prediction'] == 0
    assert predictions[1]['probability'] == 0.5

    # Verify database interactions
    assert mock_session.add_all.called
    assert mock_session.commit.called
    assert mock_session.refresh.called
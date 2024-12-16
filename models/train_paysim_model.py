import pandas as pd
import joblib
import logging
from sklearn.compose import ColumnTransformer
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.metrics import precision_recall_curve, average_precision_score, roc_auc_score, auc, confusion_matrix
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

# Set up logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(levelname)s - %(message)s')


class FraudDetectionModel:
    def __init__(self):
        self.numeric_features = ['step', 'amount', 'oldbalanceOrg', 'newbalanceOrig',
                                 'oldbalanceDest', 'newbalanceDest']
        self.categorical_features = ['type']
        self.model = None
        self.preprocessor = None
        logging.info(f"Model initialized with features: \n" +
                     f"Numeric: {self.numeric_features}\n" +
                     f"Categorical: {self.categorical_features}")

    def prepare_data(self, df, sample_size=100000, fraud_fraction=None):
        """
        Prepare a balanced sample of the data for training.

        Args:
            df: Original dataframe
            sample_size: Target size for non-fraud cases
            fraud_fraction: Optional fraction of fraud cases to keep (None = keep all)
        """
        logging.info(f"Preparing data sample from {len(df)} total records...")

        # Separate fraud and non-fraud cases
        fraud_df = df[df['isFraud'] == 1]
        non_fraud_df = df[df['isFraud'] == 0]

        sample_size = min(sample_size, len(non_fraud_df))

        # Sample non-fraud cases
        non_fraud_sample = non_fraud_df.sample(n=sample_size, random_state=42)

        # Sample fraud cases if specified
        if fraud_fraction is not None:
            fraud_sample = fraud_df.sample(
                n=int(len(fraud_df) * fraud_fraction),
                random_state=42
            )
        else:
            fraud_sample = fraud_df  # Keep all fraud cases

        # Combine samples
        sampled_df = pd.concat([non_fraud_sample, fraud_sample])

        logging.info(f"Created sample with {len(sampled_df)} records:")
        logging.info(f"  - Non-fraud cases: {len(non_fraud_sample)}")
        logging.info(f"  - Fraud cases: {len(fraud_sample)}")

        # Prepare features and target
        X = sampled_df[self.numeric_features + self.categorical_features]
        y = sampled_df['isFraud']

        return X, y

    def create_preprocessor(self):
        logging.info("Creating preprocessor...")
        self.preprocessor = ColumnTransformer(
            transformers=[
                ('num', StandardScaler(), self.numeric_features),
                ('cat', OneHotEncoder(drop='first', sparse_output=False),
                 self.categorical_features)
            ])
        logging.info("Preprocessor created successfully")

    def create_pipeline(self, use_smote=True):
        logging.info(f"Creating pipeline (SMOTE: {use_smote})")
        if self.preprocessor is None:
            self.create_preprocessor()

        if use_smote:
            return ImbPipeline([
                ('preprocessor', self.preprocessor),
                ('smote', SMOTE(random_state=42)),
                ('classifier', RandomForestClassifier(n_estimators=100,
                                                      random_state=42,
                                                      n_jobs=-1))
            ])

        return Pipeline([
            ('preprocessor', self.preprocessor),
            ('classifier', RandomForestClassifier(n_estimators=100,
                                                  random_state=42,
                                                  n_jobs=-1))
        ])

    def train(self, X, y, use_smote=True):
        logging.info("Starting model training...")
        logging.info(f"Dataset size: {len(X)} samples")

        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        logging.info(f"Train set size: {len(X_train)}, Test set size: {len(X_test)}")
        logging.info(f"Fraud cases in train: {sum(y_train)}, in test: {sum(y_test)}")

        # Create and train model
        self.model = self.create_pipeline(use_smote)
        logging.info("Training model...")
        self.model.fit(X_train, y_train)
        logging.info("Model training completed")

        # Evaluate
        logging.info("Evaluating model performance...")
        metrics = self.evaluate(X_test, y_test)

        # Log metrics
        logging.info("Model Performance Metrics:")
        for metric, value in metrics.items():
            if metric != 'confusion_matrix':
                logging.info(f"{metric}: {value:.4f}")
            else:
                logging.info(f"Confusion Matrix:\n{value}")

        return metrics

    def evaluate(self, X_test, y_test):
        logging.info("Calculating prediction probabilities...")
        y_pred_proba = self.model.predict_proba(X_test)[:, 1]
        y_pred = self.model.predict(X_test)

        # Calculate metrics
        metrics = {
            'roc_auc': roc_auc_score(y_test, y_pred_proba),
            'avg_precision': average_precision_score(y_test, y_pred_proba),
            'confusion_matrix': confusion_matrix(y_test, y_pred)
        }

        # Calculate AUPRC
        precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
        metrics['auprc'] = auc(recall, precision)

        return metrics

    def get_feature_importance(self):
        logging.info("Calculating feature importance...")
        if not hasattr(self.model, 'named_steps'):
            logging.warning("Model doesn't support feature importance")
            return None

        classifier = (self.model.named_steps['pipeline'].named_steps['classifier']
                      if 'pipeline' in self.model.named_steps
                      else self.model.named_steps['classifier'])

        if not hasattr(classifier, 'feature_importances_'):
            logging.warning("Classifier doesn't support feature importance")
            return None

        importances = classifier.feature_importances_

        # Get feature names after preprocessing
        features = (self.numeric_features +
                    [f"{cf}_{cat}" for cf in self.categorical_features
                     for cat in self.model.named_steps['preprocessor']
                    .named_transformers_['cat'].categories_[0][1:]])

        importance_df = pd.DataFrame({
            'Feature': features,
            'Importance': importances
        }).sort_values('Importance', ascending=False)

        logging.info("Feature importance calculated successfully")
        logging.info("\nTop 5 most important features:")
        logging.info(importance_df.head().to_string())

        return importance_df

    def save_model(self, path):
        if self.model is None:
            raise ValueError("Model hasn't been trained yet")
        logging.info(f"Saving model to {path}")
        joblib.dump(self.model, path)
        logging.info("Model saved successfully")

    def load_model(self, path):
        logging.info(f"Loading model from {path}")
        self.model = joblib.load(path)
        logging.info("Model loaded successfully")

    def predict_proba(self, input_data: dict):
        logging.info("Making prediction for new data...")
        # Convert single input to DataFrame
        input_df = pd.DataFrame([input_data])

        # Ensure all required features are present
        for feature in self.numeric_features + self.categorical_features:
            if feature not in input_df.columns:
                logging.error(f"Missing feature: {feature}")
                raise ValueError(f"Missing feature: {feature}")

        # Make prediction
        probability = self.model.predict_proba(input_df)[0][1]
        prediction = 1 if probability > 0.5 else 0

        result = {
            'prediction': prediction,
            'probability': float(probability)
        }
        logging.info(f"Prediction result: {result}")
        return result


if __name__ == "__main__":
    # Load data
    logging.info("Starting fraud detection pipeline...")
    df = pd.read_csv("../data/paysim.csv")
    logging.info(f"Loaded dataset with {len(df)} samples")

    # Initialize model
    model = FraudDetectionModel()

    # Prepare sampled dataset
    X, y = model.prepare_data(
        df,
        sample_size=100000,  # Use 100k non-fraud transactions
        fraud_fraction=1.0  # Keep all fraud cases
    )

    # Train and evaluate
    metrics = model.train(X, y)

    # Get feature importance
    importance_df = model.get_feature_importance()

    # Save model
    model.save_model("../models/fraud_model.pkl")

    logging.info("Pipeline completed successfully!")

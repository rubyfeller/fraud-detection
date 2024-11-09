import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


from imblearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder

import pandas as pd
from imblearn.over_sampling import SMOTE
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import (average_precision_score,
                             roc_auc_score, confusion_matrix, classification_report)
from sklearn.model_selection import cross_val_score
import time
import logging

from models.train_paysim_model import FraudDetectionModel


class AlgorithmComparison:
    def __init__(self, X, y):
        self.X = X
        self.y = y
        self.models = {
            'Logistic Regression': LogisticRegression(max_iter=1000, random_state=42),
            'Decision Tree': DecisionTreeClassifier(random_state=42),
            'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
            'Gradient Boosting': GradientBoostingClassifier(random_state=42),
            'SVM': SVC(probability=True, random_state=42)
        }
        self.results = {}

    def create_preprocessor(self):
        numeric_features = ['step', 'amount', 'oldbalanceOrg', 'newbalanceOrig', 'oldbalanceDest', 'newbalanceDest']
        categorical_features = ['type']

        numeric_transformer = StandardScaler()
        categorical_transformer = OneHotEncoder(handle_unknown='ignore')

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)
            ]
        )

        return preprocessor

    def evaluate_all(self, preprocessor):
        logging.info("Starting algorithm comparison...")

        for name, model in self.models.items():
            logging.info(f"\nEvaluating {name}...")

            # Create pipeline with current model
            pipeline = Pipeline([
                ('preprocessor', preprocessor),
                ('smote', SMOTE(random_state=42)),
                ('classifier', model)
            ])

            # Time the training
            start_time = time.time()

            # Perform cross-validation
            cv_scores = cross_val_score(pipeline, self.X, self.y,
                                        cv=5, scoring='roc_auc')

            # Fit the model on full data
            pipeline.fit(self.X, self.y)

            # Time taken
            train_time = time.time() - start_time

            # Get predictions
            y_pred = pipeline.predict(self.X)
            y_pred_proba = pipeline.predict_proba(self.X)[:, 1]

            # Calculate metrics
            metrics = {
                'ROC AUC': roc_auc_score(self.y, y_pred_proba),
                'Avg Precision': average_precision_score(self.y, y_pred_proba),
                'CV Mean ROC AUC': cv_scores.mean(),
                'CV Std ROC AUC': cv_scores.std(),
                'Training Time': train_time,
                'Confusion Matrix': confusion_matrix(self.y, y_pred),
                'Classification Report': classification_report(self.y, y_pred)
            }

            self.results[name] = metrics

            logging.info(f"Results for {name}:")
            logging.info(f"ROC AUC: {metrics['ROC AUC']:.4f}")
            logging.info(f"Average Precision: {metrics['Avg Precision']:.4f}")
            logging.info(
                f"Cross-validation ROC AUC: {metrics['CV Mean ROC AUC']:.4f} (+/- {metrics['CV Std ROC AUC'] * 2:.4f})")
            logging.info(f"Training Time: {metrics['Training Time']:.2f} seconds")
            logging.info(f"Confusion Matrix:\n{metrics['Confusion Matrix']}")
            logging.info(f"Classification Report:\n{metrics['Classification Report']}")

        return self.create_comparison_report()

    def create_comparison_report(self):
        comparison_data = []

        for name, metrics in self.results.items():
            cm = metrics['Confusion Matrix']
            comparison_data.append({
                'Algorithm': name,
                'ROC AUC': metrics['ROC AUC'],
                'Avg Precision': metrics['Avg Precision'],
                'CV Mean ROC AUC': metrics['CV Mean ROC AUC'],
                'CV Std ROC AUC': metrics['CV Std ROC AUC'],
                'Training Time (s)': metrics['Training Time'],
                'False Positives': cm[0][1],
                'False Negatives': cm[1][0]
            })

        comparison_df = pd.DataFrame(comparison_data)
        return comparison_df.sort_values('ROC AUC', ascending=False)


if __name__ == "__main__":
    # Load and prepare data
    model = FraudDetectionModel()
    df = pd.read_csv("../data/paysim.csv")
    X, y = model.prepare_data(df, sample_size=100000)

    # Initialize comparison
    comparison = AlgorithmComparison(X, y)

    # Create preprocessor
    preprocessor = comparison.create_preprocessor()

    # Run comparison
    results_df = comparison.evaluate_all(preprocessor)

    # Display results
    logging.info("\nFinal algorithm comparison:")
    logging.info(results_df.to_string())

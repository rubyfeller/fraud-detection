import time
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import precision_recall_curve, average_precision_score, roc_auc_score, auc, confusion_matrix, \
    classification_report
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import LinearSVC
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline


def main():
    # Step 1: Load and Preprocess Data
    print("Step 1: Loading and Preprocessing Data")
    df = pd.read_csv("../data/creditcard.csv")

    # Feature Engineering
    df['Hour'] = df['Time'].apply(lambda x: (x / 3600) % 24)
    df['Day'] = df['Time'].apply(lambda x: (x / (3600 * 24)) % 7)
    df['Transaction_Amount_Scaled'] = np.log1p(df['Amount'])

    # Select features for modeling
    features = ['V1', 'V2', 'V3', 'V4', 'V5', 'V6', 'V7', 'V8', 'V9', 'V10',
                'V11', 'V12', 'V13', 'V14', 'V15', 'V16', 'V17', 'V18', 'V19', 'V20',
                'V21', 'V22', 'V23', 'V24', 'V25', 'V26', 'V27', 'V28',
                'Hour', 'Day', 'Transaction_Amount_Scaled']

    X = df[features]
    y = df['Class']

    # Split the data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.5, random_state=42, stratify=y)

    print(f"Training set shape: {X_train.shape}")
    print(f"Testing set shape: {X_test.shape}")

    # Step 2: Create model pipelines
    print("\nStep 2: Creating model pipelines")

    def create_pipeline(classifier, use_smote=True):
        steps = [
            ('scaler', StandardScaler()),
            ('classifier', classifier)
        ]

        if use_smote:
            return ImbPipeline([
                ('smote', SMOTE(random_state=42)),
                ('pipeline', Pipeline(steps))
            ])
        else:
            return Pipeline(steps)

    models = {
        'Random Forest': create_pipeline(RandomForestClassifier(n_estimators=100, random_state=42, n_jobs=-1)),
        'SVM': create_pipeline(LinearSVC(random_state=42, max_iter=20000, dual='auto')),
        'Logistic Regression': create_pipeline(LogisticRegression(random_state=42, max_iter=1000))
    }

    # Step 3: Model evaluation
    print("\nStep 3: Model evaluation")

    def evaluate_model(model, X, y):
        cv_scores = cross_val_score(model, X, y, cv=5, scoring='roc_auc')
        return cv_scores.mean(), cv_scores.std()

    for name, model in models.items():
        mean_score, std_score = evaluate_model(model, X_train, y_train)
        print(f"{name} - ROC AUC: {mean_score:.3f} (+/- {std_score * 2:.3f})")

    # Step 4: Train best model and evaluate on test set
    print("\nStep 4: Training Best Model and Evaluating on Test Set")

    best_model = models['Random Forest']
    best_model.fit(X_train, y_train)

    for name, model in models.items():
        start_time = time.time()
        model.fit(X_train, y_train)

        training_time = time.time() - start_time

        y_pred = model.predict(X_test)

        # False positive calculation
        cm = confusion_matrix(y_test, y_pred)
        fp = cm[0, 1]
        tn = cm[0, 0]
        fpr = fp / (fp + tn)

        y_pred_proba = model.predict_proba(X_test)[:, 1] if hasattr(model,
                                                                    'predict_proba') else model.decision_function(
            X_test)

        # Performance metrics
        roc_auc = roc_auc_score(y_test, y_pred_proba)
        avg_precision = average_precision_score(y_test, y_pred_proba)
        precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
        auprc = auc(recall, precision)

        print(f"\n{name} Performance:")
        print(f"Training time: {training_time:.2f} seconds")
        print(f"Test set ROC AUC: {roc_auc:.3f}")
        print(f"Test set Average Precision: {avg_precision:.3f}")
        print(f"Test Set AUPRC: {auprc:.3f}")

        # False positive metrics
        print(f"False Positives: {fp}")
        print(f"False Positive Rate: {fpr:.5f}")
        print(classification_report(y_test, y_pred))

    # Step 5: Feature Importance (for Random Forest)
    print("\nStep 5: Feature Importance")

    try:
        rf_classifier = best_model.named_steps['pipeline'].named_steps['classifier']
    except KeyError:
        try:
            rf_classifier = best_model.named_steps['classifier']
        except Exception as e:
            print(f"Could not access RandomForestClassifier: {e}")
            rf_classifier = None

    if rf_classifier and isinstance(rf_classifier, RandomForestClassifier):
        importances = rf_classifier.feature_importances_
        feature_imp = pd.DataFrame(sorted(zip(importances, features)), columns=['Value', 'Feature'])

        plt.figure(figsize=(10, 6))
        plt.bar(x=feature_imp['Feature'], height=feature_imp['Value'], color='skyblue')
        plt.xticks(rotation='vertical')
        plt.xlabel('Features')
        plt.ylabel('Importance')
        plt.title('Feature Importances (Random Forest)')
        plt.tight_layout()
        plt.show()
    else:
        print("Could not generate feature importance for non-Random Forest model")

    # Step 6: Precision-Recall Curve
    print("\nStep 6: Precision-Recall Curve")

    plt.figure(figsize=(8, 6))
    for name, model in models.items():
        y_pred_proba = model.predict_proba(X_test)[:, 1] if hasattr(model,
                                                                    'predict_proba') else model.decision_function(
            X_test)
        precision, recall, _ = precision_recall_curve(y_test, y_pred_proba)
        auprc = auc(recall, precision)
        plt.plot(recall, precision, label=f'{name} (AUPRC = {auprc:.2f})')

    plt.xlabel('Recall')
    plt.ylabel('Precision')
    plt.title('Precision-Recall Curve')
    plt.legend(loc='lower left')
    plt.show()

    print("\nPipeline complete!")

    joblib.dump(best_model, "../models/fraud_model.pkl")
    print("Model saved to ../models/fraud_model.pkl")


if __name__ == "__main__":
    main()

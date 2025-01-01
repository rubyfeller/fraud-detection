# Fraud Detection

## Introduction
This project aims to detect fraudulent credit card transactions using machine learning models. The dataset used is the '[Synthetic Financial Datasets For Fraud Detection](https://www.kaggle.com/datasets/ealaxi/paysim1/data)' from Kaggle. It contains various features related to credit card transactions, including both numeric and categorical data.

## Methodology
The project is divided into the following steps:
1. **Data Exploration**: Understanding the dataset and its features.
2. **Data Preprocessing**: Cleaning and preparing the data for modeling.
3. **Model Building**: Training machine learning models to detect fraud.
4. **Model Evaluation**: Evaluating the performance of the models.

## Application Architecture
![Application Architecture Diagram](/docs/img/architecture_application.png "Application Architecture Diagram")

## Model Diagram
![Model diagram](/docs/img/model_diagram.png "Mode diagram")


## Installation
To set up the project, follow these steps:

### Backend (FastAPI)

### Docker
1. **Build and start the containers**:
    ```bash
    docker-compose up
    ```
   
### Manual Setup
1. **Clone the repository**:
    ```bash
    git clone https://github.com/rubyfeller/fraud-detection.git
    ```

2. **Create a virtual environment**:
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```

3. **Install the required libraries**:
    ```bash
    pip install -r requirements.txt
    ```

4. **Run the backend server**:
    ```bash
    uvicorn api.main:app --host 0.0.0.0 --port 8000
    ```

### Frontend (Next.js)
1. **Navigate to the frontend directory**:
    ```bash
    cd frontend
    ```

2. **Install the required packages**:
    ```bash
    npm install
    ```

3. **Run the frontend server**:
    ```bash
    npm run dev
    ```
   
4. Replace env.example with .env.local and set the API URL:
    ```bash
    NEXT_PUBLIC_API_URL=http://localhost:8000
    ```

## Running tests
To run the tests, use the following command:
```bash
python -m pytest
```

## Usage
### Backend
The backend provides API endpoints for making predictions and retrieving transaction data.

#### API Endpoints
- **GET /transactions**: Get all transactions.
- **POST /predict**: Make a prediction for a transaction.
- **POST /predict_batch**: Make predictions for multiple transactions. A .csv file containing the transactions must be uploaded via the form-data of the body.

### Frontend
The frontend provides a user interface for interacting with the fraud detection model.

![Screenshot of the Fraud Detection Dashboard](/docs/img/dashboard.png "Screenshot of the Fraud Detection Dashboard")

## CI/CD 
GitHub Actions is used for CI/CD.

The backend API is deployed on AWS Elastic Beanstalk. The frontend is deployed on Vercel.

Elastic Beanstalk uses the Docker image pushed to Docker Hub.

### Secrets
The following secrets must be set in the GitHub repository settings:
- `AWS_ACCESS_KEY_ID`: The AWS access key ID.
- `AWS_SECRET_ACCESS_KEY`: The AWS secret access key.
- `DOCKER_USERNAME`: The Docker Hub username.
- `DOCKER_PASSWORD`: The Docker Hub password.

### AWS Deployment Workflow
The API deployment is automatically triggered when pushing to the `main` branch on the condition that the build and tests of the ``Python application`` workflow pass.

### Vercel Deployment
The frontend is automatically deployed to Vercel when pushing to the `main` branch. The deployment URL is: [fraud-detection.rubyfeller.nl](https://fraud-detection.rubyfeller.nl)

When using Vercel, please set the `NEXT_PUBLIC_API_URL` environment variable to the production API URL.
This can be done via the Vercel dashboard or the `vercel env` command.
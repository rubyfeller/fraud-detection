interface Transaction {
    id: number;
    step: number;
    amount: number;
    type: string;
    oldbalanceOrg: number;
    newbalanceOrig: number;
    oldbalanceDest: number;
    newbalanceDest: number;
    prediction: number;
    probability: number;
    manual_review: boolean;
    reviewed_prediction: number | null;
}

export type {Transaction};
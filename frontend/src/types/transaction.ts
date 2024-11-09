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
}

interface ChartDataPoint {
    step: number;
    legitimate: number;
    fraudulent: number;
}

interface PieChartDataPoint {
    name: string;
    value: number;
    color: string;
}

export type {Transaction, ChartDataPoint, PieChartDataPoint};
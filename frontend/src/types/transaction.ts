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

interface Pagination {
    total_items: number;
    total_pages: number;
    current_page: number;
    page_size: number;
    has_next: boolean;
    has_previous: boolean;
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

export interface LineChartDataPoint {
    oldbalanceOrg: number;
    oldbalanceDest: number;
}

export type {Transaction, Pagination, ChartDataPoint, PieChartDataPoint};
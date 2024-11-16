"use client"

import React, {useState, useEffect} from 'react';
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
    CardFooter,
} from '@/components/ui/card';
import {Alert, AlertDescription} from '@/components/ui/alert';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    LineChart,
    Line,
} from 'recharts';
import {Transaction, Pagination, ChartDataPoint, PieChartDataPoint, LineChartDataPoint} from '@/types/transaction';
import {Upload} from 'lucide-react';

const FraudDashboard: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [barChartData, setBarChartData] = useState<ChartDataPoint[]>([]);
    const [pieChartData, setPieChartData] = useState<PieChartDataPoint[]>([]);
    const [lineChartData, setLineChartData] = useState<LineChartDataPoint[]>([]);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/transactions');
                const data = await response.json();
                setTransactions(data.data || []);
                setPagination(data.pagination);
                updateChartData(data.data || []);
            } catch (err) {
                setError(`Failed to fetch transactions: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }
        };

        fetchTransactions();
    }, []);

    const updateChartData = (data: Transaction[]) => {
        const barData = data.reduce((acc: ChartDataPoint[], transaction) => {
            const existingData = acc.find(item => item.step === transaction.step);
            if (existingData) {
                if (transaction.prediction === 0) {
                    existingData.legitimate += 1;
                } else {
                    existingData.fraudulent += 1;
                }
            } else {
                acc.push({
                    step: transaction.step,
                    legitimate: transaction.prediction === 0 ? 1 : 0,
                    fraudulent: transaction.prediction === 1 ? 1 : 0,
                });
            }
            return acc;
        }, []).sort((a, b) => a.step - b.step);

        const pieData: React.SetStateAction<PieChartDataPoint[]> = [
            {name: 'Legitimate', value: data.filter(t => t.prediction === 0).length, color: '#82ca9d'},
            {name: 'Fraudulent', value: data.filter(t => t.prediction === 1).length, color: '#ff8042'},
        ];

        const lineData = data.reduce((acc: LineChartDataPoint[], transaction) => {
            acc.push({
                oldbalanceOrg: transaction.oldbalanceOrg,
                oldbalanceDest: transaction.oldbalanceDest,
            });
            return acc;
        }, []);

        setBarChartData(barData);
        setPieChartData(pieData);
        setLineChartData(lineData);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsLoading(true);
        setError('');

        try {
            const uploadResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + '/predict_batch', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error('Upload failed');

            const predictionsResponse = await fetch(process.env.NEXT_PUBLIC_API_URL + '/transactions');
            const data = await predictionsResponse.json();
            setTransactions(data.data || []);
            updateChartData(data.data || []);
        } catch (err) {
            setError(`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0);
    const fraudAmount = transactions
        .filter(t => t.prediction === 1)
        .reduce((sum, t) => sum + t.amount, 0);

    return (
        <div className="p-4 max-w-6xl mx-auto space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Fraud Detection Dashboard</CardTitle>
                </CardHeader>
                <CardContent>Summary of the data will be shown here. For example:</CardContent>
                <CardContent>50% of all transactions are fraud. The average transfer amount is $150. The median is $50.
                    0 debit transactions are fraud.</CardContent>
                <CardContent>
                    <div className="space-y-4">
                        {/* File Upload */}
                        <div className="flex items-center justify-center w-full">
                            <label
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                            >
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-gray-500"/>
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click to upload</span>
                                    </p>
                                    <p className="text-xs text-gray-500">CSV file with transaction data</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileUpload}
                                    disabled={isLoading}
                                />
                            </label>
                        </div>

                        {isLoading && (
                            <div className="text-center text-gray-500">
                                Processing transactions...
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {/* Transactions Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                <tr>
                                    <th className="p-2 border text-left">Step</th>
                                    <th className="p-2 border text-left">Amount</th>
                                    <th className="p-2 border text-left">Prediction</th>
                                    <th className="p-2 border text-left">Type</th>
                                </tr>
                                </thead>
                                <tbody>
                                {transactions.map((transaction, index) => (
                                    <tr key={index}>
                                        <td className="p-2 border">{transaction.step}</td>
                                        <td className="p-2 border">{transaction.amount}</td>
                                        <td className="p-2 border">{transaction.prediction}</td>
                                        <td className="p-2 border">{transaction.type}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                        {transactions.length > 0 && (
                            <div className="space-y-8">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Summary cards */}
                                </div>

                                {/* Charts Grid */}
                                <div className="grid md:grid-cols-2 gap-4">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Transactions by Step</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <BarChart data={barChartData}>
                                                    <CartesianGrid strokeDasharray="3 3"/>
                                                    <XAxis dataKey="step"/>
                                                    <YAxis/>
                                                    <Tooltip/>
                                                    <Legend/>
                                                    <Bar dataKey="legitimate" fill="#82ca9d"/>
                                                    <Bar dataKey="fraudulent" fill="#ff8042"/>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Transaction Distribution</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <PieChart>
                                                    <Pie
                                                        data={pieChartData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        outerRadius={100}
                                                        fill="#8884d8"
                                                        label
                                                    >
                                                        {pieChartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color}/>
                                                        ))}
                                                    </Pie>
                                                    <Tooltip/>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Balance Distribution</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <ResponsiveContainer width="100%" height={300}>
                                                <LineChart data={lineChartData}>
                                                    <CartesianGrid strokeDasharray="3 3"/>
                                                    <XAxis dataKey="oldbalanceOrg"/>
                                                    <YAxis/>
                                                    <Tooltip/>
                                                    <Legend/>
                                                    <Line type="monotone" dataKey="oldbalanceOrg" stroke="#8884d8"/>
                                                    <Line type="monotone" dataKey="oldbalanceDest" stroke="#82ca9d"/>
                                                </LineChart>
                                            </ResponsiveContainer>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
                <CardFooter className="text-right">
                    <small className="text-gray-500">
                        Total Transaction Amount: ${totalAmount.toLocaleString()}
                        <br/>
                        Suspected Fraud Amount: ${fraudAmount.toLocaleString()}
                    </small>
                </CardFooter>
            </Card>
        </div>
    );
};

export default FraudDashboard;
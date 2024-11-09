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
} from 'recharts';
import {Transaction, ChartDataPoint, PieChartDataPoint} from '@/types/transaction';
import {Upload} from 'lucide-react';

const FraudDashboard: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [barChartData, setBarChartData] = useState<ChartDataPoint[]>([]);
    const [pieChartData, setPieChartData] = useState<PieChartDataPoint[]>([]);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/transactions');
                const data = await response.json();
                setTransactions(data);
                updateChartData(data);
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

        setBarChartData(barData);
        setPieChartData(pieData);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsLoading(true);
        setError('');

        try {
            const uploadResponse = await fetch('http://127.0.0.1:8000/predict_batch', {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error('Upload failed');

            const predictionsResponse = await fetch('http://127.0.0.1:8000/transactions');
            const data = await predictionsResponse.json();
            setTransactions(data);
            updateChartData(data);
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
                                        <td className="p-2 border">${transaction.amount.toLocaleString()}</td>
                                        <td className="p-2 border">
                                            {transaction.prediction === 0 ? 'Legitimate' : 'Fraudulent'}
                                        </td>
                                        <td className="p-2 border">{transaction.type.toLocaleLowerCase()}</td>
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
                                            {barChartData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <BarChart data={barChartData}>
                                                        <CartesianGrid strokeDasharray="3 3"/>
                                                        <XAxis dataKey="step"/>
                                                        <YAxis/>
                                                        <Tooltip/>
                                                        <Legend/>
                                                        <Bar dataKey="legitimate" stackId="a" fill="#82ca9d"
                                                             name="Legitimate"/>
                                                        <Bar dataKey="fraudulent" stackId="a" fill="#ff8042"
                                                             name="Fraudulent"/>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="text-center text-gray-500">No data available</div>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Transaction Distribution</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {pieChartData.length > 0 ? (
                                                <ResponsiveContainer width="100%" height={300}>
                                                    <PieChart>
                                                        <Pie
                                                            data={pieChartData}
                                                            cx="50%"
                                                            cy="50%"
                                                            labelLine={false}
                                                            label={({percent}) => `${(percent * 100).toFixed(0)}%`}
                                                            outerRadius={80}
                                                            fill="#8884d8"
                                                            dataKey="value"
                                                        >
                                                            {pieChartData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.color}/>
                                                            ))}
                                                        </Pie>
                                                        <Tooltip/>
                                                        <Legend/>
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <div className="text-center text-gray-500">No data available</div>
                                            )}
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
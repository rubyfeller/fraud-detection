'use client'

import React, {useState, useEffect} from 'react';
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableCell
} from '@/components/ui/table';
import {Button} from '@/components/ui/button';
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import {useFetchData} from '@/hooks/userFetchData';
import {Transaction} from '@/types/transaction';

const ManualCheck: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const {data: transactionsData} = useFetchData(`${process.env.NEXT_PUBLIC_API_URL}/transactions?page=${currentPage}&manual_review=true`, [currentPage]);

    useEffect(() => {
        if (transactionsData && Array.isArray(transactionsData.data)) {
            const filteredTransactions = transactionsData.data.filter((transaction: Transaction) => transaction.manual_review && transaction.reviewed_prediction === null);
            setTransactions(filteredTransactions);
            setTotalPages(transactionsData.pagination.total_pages);
        }
    }, [transactionsData]);

    const handleReview = async (review: 0 | 1) => {
        if (selectedTransaction) {
            console.log(`Reviewing transaction ${selectedTransaction.id} as ${review === 0 ? 'Legitimate' : 'Fraudulent'}`);
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/${selectedTransaction.id}?reviewed_prediction=${review}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (response.ok) {
                console.log('Review submitted successfully');
                setSelectedTransaction(null);
                setTransactions(transactions.filter(t => t.id !== selectedTransaction.id));
            } else {
                console.error('Failed to submit review');
            }
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Manual Check</h1>
            <p className="mb-4">Review transactions that require manual checking.</p>
            {transactions.length === 0 ? (
                <div className="text-green-500 text-xl font-bold">
                    Nothing left to review! 🎉😊
                </div>
            ) : (
                <>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell>ID</TableCell>
                                <TableCell>Step</TableCell>
                                <TableCell>Amount</TableCell>
                                <TableCell>Prediction</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Old balance origin</TableCell>
                                <TableCell>New balance origin</TableCell>
                                <TableCell>Old balance destination</TableCell>
                                <TableCell>New balance destination</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell>{transaction.id}</TableCell>
                                    <TableCell>{transaction.step}</TableCell>
                                    <TableCell>${transaction.amount.toLocaleString()}</TableCell>
                                    <TableCell>{transaction.prediction}</TableCell>
                                    <TableCell>{transaction.type}</TableCell>
                                    <TableCell>${transaction.oldbalanceOrg.toLocaleString()}</TableCell>
                                    <TableCell>${transaction.newbalanceOrig.toLocaleString()}</TableCell>
                                    <TableCell>${transaction.oldbalanceDest.toLocaleString()}</TableCell>
                                    <TableCell>${transaction.newbalanceDest.toLocaleString()}</TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                className="mt-4 mb-4"
                                                onClick={() => setSelectedTransaction(transaction)}
                                            >
                                                Review
                                            </Button>
                                        </DropdownMenuTrigger>
                                        {selectedTransaction && selectedTransaction.id === transaction.id && (
                                            <DropdownMenuContent>
                                                <DropdownMenuItem
                                                    onClick={() => handleReview(0)}
                                                >
                                                    Legitimate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    onClick={() => handleReview(1)}
                                                >
                                                    Fraudulent
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        )}
                                    </DropdownMenu>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="flex justify-between mt-4">
                        <Button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <Button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                </>
            )}
        </div>
    );
};

export default ManualCheck;
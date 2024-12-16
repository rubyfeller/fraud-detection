'use client'

import React, {useEffect, useState} from 'react';
import {useFetchData} from "@/hooks/userFetchData";
import {useFileUpload} from "@/hooks/useFileUpload";
import {Transaction} from "@/types/transaction";
import {
    Card,
    CardHeader,
    CardTitle,
    CardContent,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import ErrorAlert from "@/components/ui/ErrorAlert";
import Loading from "@/components/ui/Loading";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {
    ColumnDef,
    ColumnFiltersState,
    SortingState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    useReactTable,
} from "@tanstack/react-table";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import {ArrowUpDown, Upload} from 'lucide-react';
import PaginationControls from "@/components/PaginationControls";


const columns: ColumnDef<Transaction>[] = [
    {
        accessorKey: "step",
        header: ({column}) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Step
                    <ArrowUpDown className="ml-2 h-4 w-4"/>
                </Button>
            )
        }
    },
    {
        accessorKey: "amount",
        header: ({column}) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Amount
                    <ArrowUpDown className="ml-2 h-4 w-4"/>
                </Button>
            )
        },
        cell: ({row}) => `$${row.original.amount.toLocaleString()}`
    },
    {
        accessorKey: "prediction",
        header: ({column}) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Prediction
                    <ArrowUpDown className="ml-2 h-4 w-4"/>
                </Button>
            )
        },
        cell: ({row}) => row.original.prediction ? "FRAUDULENT" : "LEGITIMATE"
    },
    {
        accessorKey: "type",
        header: ({column}) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Type
                    <ArrowUpDown className="ml-2 h-4 w-4"/>
                </Button>
            )
        }
    }
];

const FraudDashboard: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [pagination, setPagination] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [sorting, setSorting] = useState<SortingState>([]);

    const {data: transactionsData} = useFetchData(`${process.env.NEXT_PUBLIC_API_URL}/transactions?page=${currentPage}&manualReview=false`, [currentPage]);
    const {data: analyticsData} = useFetchData(`${process.env.NEXT_PUBLIC_API_URL}/transactions/analytics`, []);
    const {
        handleFileUpload,
        isLoading: fileUploadLoading,
        error: fileUploadError
    } = useFileUpload(setTransactions, setAnalytics, setPagination);

    useEffect(() => {
        if (transactionsData) {
            setTransactions(transactionsData.data || []);
            setPagination(transactionsData.pagination);
        }
    }, [transactionsData]);

    useEffect(() => {
        if (analyticsData) {
            setAnalytics(analyticsData);
        }
    }, [analyticsData]);

    const table = useReactTable({
        data: transactions,
        columns,
        state: {
            columnFilters,
            sorting,
        },
        onColumnFiltersChange: setColumnFilters,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        enableGlobalFilter: true,
    });


    return (
        <div className="p-4 max-w-6xl mx-auto space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle>Fraud Detection Dashboard</CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length === 0 ? (
                        <div className="text-center text-gray-500 mb-5">
                            No transactions found
                        </div>
                    ) : (
                        analytics && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="text-sm text-gray-500">Total Transactions</div>
                                    <div className="text-xl font-bold">{analytics.summaryStats.totalTransactions}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="text-sm text-gray-500">Average Amount</div>
                                    <div className="text-xl font-bold">${analytics.summaryStats.avgAmount.toFixed(2)}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="text-sm text-gray-500">Legitimate Transactions</div>
                                    <div className="text-xl font-bold">{analytics.legitimateCount}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="text-sm text-gray-500">Fraudulent Transactions</div>
                                    <div className="text-xl font-bold">{analytics.fraudulentCount}</div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg">
                                    <div className="text-sm text-gray-500">Fraudulent Transactions %</div>
                                    <div className="text-xl font-bold">{analytics.fraudulentPercentage}%</div>
                                </div>
                            </div>
                        ))}

                    <div className="space-y-4">
                        {/* File Upload */}
                        <div className="flex items-center justify-center w-full">
                            <label
                                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
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
                                    onChange={(event) => handleFileUpload(event, transactions, analytics)}
                                    disabled={fileUploadLoading}
                                />
                            </label>
                        </div>

                        {fileUploadLoading && <Loading/>}

                        {fileUploadError && <ErrorAlert error={fileUploadError}/>}

                        <div className="mb-4">
                            <Input
                                placeholder="Filter transactions..."
                                value={(table.getState().globalFilter as string) ?? ""}
                                onChange={(event) => table.setGlobalFilter(event.target.value)}
                                className="max-w-sm"
                            />
                        </div>

                        <Table>
                            <TableHeader>
                                {table.getHeaderGroups().map((headerGroup) => (
                                    <TableRow key={headerGroup.id}>
                                        {headerGroup.headers.map((header) => (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableHeader>
                            <TableBody>
                                {table.getRowModel().rows?.length ? (
                                    table.getRowModel().rows.map((row) => (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                        >
                                            {row.getVisibleCells().map((cell) => (
                                                <TableCell key={cell.id}>
                                                    {flexRender(
                                                        cell.column.columnDef.cell,
                                                        cell.getContext()
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={columns.length} className="h-24 text-center">
                                            No results.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        <PaginationControls pagination={pagination} setCurrentPage={setCurrentPage}/>

                        {analytics && analytics.summaryStats['totalTransactions'] > 0 && (
                            <div className="grid md:grid-cols-2 gap-4">
                                {/* Step Distribution Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Transactions by Step</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={analytics.stepDistribution}>
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

                                {/* Balance Distribution Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Balance Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={analytics.balanceDistribution}>
                                                <CartesianGrid strokeDasharray="3 3"/>
                                                <XAxis dataKey="balanceRange" angle={-45} textAnchor="end" height={80}/>
                                                <YAxis/>
                                                <Tooltip/>
                                                <Legend/>
                                                <Bar dataKey="legitimate" fill="#82ca9d"/>
                                                <Bar dataKey="fraudulent" fill="#ff8042"/>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>

                                {/* Amount Distribution Chart */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Amount Distribution</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <ResponsiveContainer width="100%" height={300}>
                                            <BarChart data={analytics.amountDistribution}>
                                                <CartesianGrid strokeDasharray="3 3"/>
                                                <XAxis dataKey="amountRange" angle={-45} textAnchor="end" height={80}/>
                                                <YAxis/>
                                                <Tooltip/>
                                                <Bar dataKey="count" fill="#8884d8"/>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FraudDashboard;
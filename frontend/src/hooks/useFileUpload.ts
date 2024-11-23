import React, {useState} from 'react';
import {pollData} from '@/helper/pollData';

export const useFileUpload = (
    setTransactions: React.Dispatch<React.SetStateAction<any>>,
    setAnalytics: React.Dispatch<React.SetStateAction<any>>,
    setPagination: React.Dispatch<React.SetStateAction<any>>
) => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string>('');

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        previousTransactionsData: any,
        previousAnalyticsData: any
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        setIsLoading(true);
        setError('');

        try {
            const uploadResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/predict_batch`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) throw new Error('Upload failed');

            const transactionsData = await pollData(`${process.env.NEXT_PUBLIC_API_URL}/transactions`, 2000, 10, previousTransactionsData);
            const analyticsData = await pollData(`${process.env.NEXT_PUBLIC_API_URL}/transactions/analytics`, 2000, 10, previousAnalyticsData);

            setTransactions(transactionsData.data);
            setAnalytics(analyticsData);
            setPagination(transactionsData.pagination);
        } catch (err) {
            setError(`Failed to process file: ${err instanceof Error ? err.message : 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return {handleFileUpload, isLoading, error};
};
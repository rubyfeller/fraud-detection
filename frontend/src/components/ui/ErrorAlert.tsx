import React from 'react';
import {Alert, AlertDescription} from '@/components/ui/alert';

interface ErrorAlertProps {
    error: string;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({error}) => {
    return (
        <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
        </Alert>
    );
};

export default ErrorAlert;
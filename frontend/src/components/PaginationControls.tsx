import React, { useState, useEffect } from 'react';

interface Pagination {
    current_page: number;
    total_pages: number;
    has_previous: boolean;
    has_next: boolean;
}

interface PaginationControlsProps {
    pagination: Pagination | null;
    setCurrentPage: (page: number) => void;
}

const PaginationControls: React.FC<PaginationControlsProps> = ({ pagination, setCurrentPage }) => {
    const [inputPage, setInputPage] = useState(1);

    useEffect(() => {
        if (pagination) {
            setInputPage(pagination.current_page);
        }
    }, [pagination]);

    const handlePageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const page = Number(event.target.value);
        if (pagination && page >= 1 && page <= pagination.total_pages) {
            setInputPage(page);
        }
    };

    const handlePageSubmit = () => {
        setCurrentPage(inputPage);
    };

    if (!pagination) {
        return null;
    }

    return (
        <div className="flex justify-between mt-4 items-center">
            <button
                className={`px-4 py-2 rounded ${!pagination.has_previous ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gray-200 text-black'}`}
                onClick={() => setCurrentPage(Math.max(pagination.current_page - 1, 1))}
                disabled={!pagination.has_previous}
            >
                Previous
            </button>
            <div className="flex items-center">
                <span>Page</span>
                <input
                    type="number"
                    value={inputPage}
                    onChange={handlePageChange}
                    className="mx-2 w-16 text-center border rounded"
                    min="1"
                    max={pagination.total_pages}
                />
                <span>of {pagination.total_pages}</span>
                <button
                    className="ml-2 px-4 py-2 bg-gray-200 text-black rounded"
                    onClick={handlePageSubmit}
                >
                    Go
                </button>
            </div>
            <button
                className={`px-4 py-2 rounded ${!pagination.has_next ? 'bg-gray-300 cursor-not-allowed text-gray-500' : 'bg-gray-200 text-black'}`}
                onClick={() => setCurrentPage(pagination.current_page + 1)}
                disabled={!pagination.has_next}
            >
                Next
            </button>
        </div>
    );
};

export default PaginationControls;
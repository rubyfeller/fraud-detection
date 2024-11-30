import React from 'react';

const Loading: React.FC = () => {
    return (
        <div className="text-center text-gray-500">
            Processing transactions...
            Feel free to leave the page and come back later.
        </div>
    );
};

export default Loading;
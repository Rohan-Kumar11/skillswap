// app/messages/components/DateSeparator.jsx
import React from 'react';

const DateSeparator = ({ date }) => {
    return (
        <div className="flex justify-center my-4">
            <div className="bg-slate-800/70 backdrop-blur-sm px-4 py-1.5 rounded-lg shadow-md">
                <span className="text-xs font-medium text-gray-300">
                    {date}
                </span>
            </div>
        </div>
    );
};

export default DateSeparator;
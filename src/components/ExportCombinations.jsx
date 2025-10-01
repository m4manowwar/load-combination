import React, { useRef } from 'react';

const ExportCombinations = ({ exportText, isCopied, handleCopyToClipboard }) => {
    const exportTextRef = useRef(null); 

    const copyHandler = () => handleCopyToClipboard(exportTextRef);

    return (
        <div className="w-full bg-white p-8 rounded-2xl shadow-xl mt-8">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-700">Exported Load Combinations (Expanded)</h2>
                <button
                    onClick={copyHandler}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all duration-200 ${
                        isCopied 
                        ? 'bg-green-500 text-white shadow-lg' 
                        : 'bg-blue-600 text-white shadow-md hover:bg-blue-700'
                    }`}
                    title="Copy content to clipboard"
                >
                    {isCopied ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                        </svg>
                    )}
                    {isCopied ? 'Copied!' : 'Copy'}
                </button>
            </div>
            <textarea
                ref={exportTextRef}
                className="w-full min-h-[520px] border rounded-xl p-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                readOnly
                value={exportText}
            />
        </div>
    );
};

export default ExportCombinations;
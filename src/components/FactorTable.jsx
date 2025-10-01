import React, { useCallback } from 'react';

const FactorTable = ({ 
  title, cases, onAddRow, onFactorChange, 
  startNumber, onStartNumberChange, 
  getUniqueLoadTypes, ulsCases, startUlsNumber, 
  generateCombinations, handleDeleteRow
}) => {
  const isSls = title.includes('SLS');

  // Calculate the suggested minimum start number for SLS
  const ulsResults = generateCombinations(ulsCases, startUlsNumber);
  const nextNumberAfterULS = (parseInt(startUlsNumber) || 101) + ulsResults.count;
  const slsMinStart = isSls ? nextNumberAfterULS : 1;

  const columnWidths = {}; // Keeping placeholder for column widths

  const generateCaseText = (loadCase) => {
    console.log('Generating case text for:', loadCase);
    return getUniqueLoadTypes()
      .filter(type => loadCase.factors[type])
      .map(type => `${loadCase.factors[type]} ${type}`)
      .join(' + ');
  };

  return (
    <div className="w-full bg-white p-8 rounded-2xl shadow-xl mt-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-gray-700">{title} (Input Factors by Load Type)</h2>
        
        {/* Load Combination Start Number Input */}
        <div className="flex items-center gap-2">
          <label htmlFor={`startLoadNumber-${title}`} className="text-sm text-gray-600 font-medium">
            Export Comb. Start at:
          </label>
          <input
            id={`startLoadNumber-${title}`}
            type="number"
            value={startNumber}
            onChange={(e) => onStartNumberChange(e.target.value)}
            className="w-24 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            min={isSls ? slsMinStart : 1}
            title={isSls ? `Must start at or after ${slsMinStart} (the combination number after ULS)` : "Starting load combination number for ULS"}
          />
          {isSls && (
            <p className="text-xs text-red-500 italic">Min: {slsMinStart}</p>
          )}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative">
                Actions
              </th>
              <th
                data-id="number"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                style={{ width: columnWidths["number"] || 'auto' }}
              >
                Case #
              </th>
              {getUniqueLoadTypes().map(type => (
                <th
                  key={type}
                  data-id={type}
                  className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider text-center relative"
                  style={{ width: columnWidths[type] || 'auto' }}
                >
                  {type}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {cases.map((loadCase, caseIndex) => (
              <tr key={loadCase.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleDeleteRow(loadCase.id)}
                    className="bg-red-500 text-white p-2 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 disabled:opacity-50"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                    </svg>
                  </button>
                </td>
                <td 
                  className="px-6 py-4 whitespace-nowrap"
                  style={{ width: columnWidths["number"] || 'auto' }}
                >
                  {generateCaseText(loadCase) || `Case ${caseIndex + 1}`}
                </td>
                {getUniqueLoadTypes().map(type => (
                  <td 
                    key={type} 
                    className="px-6 py-4 whitespace-nowrap"
                    style={{ width: columnWidths[type] || 'auto' }}
                  >
                    <input
                      type="number"
                      step="0.1"
                      value={loadCase.factors[type] || ''}
                      onChange={(e) => onFactorChange(loadCase.id, type, e.target.value)}
                      className="w-20 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Factor"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        onClick={onAddRow}
        className="mt-4 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
      >
        Add Load Case
      </button>
    </div>
  );
};

export default FactorTable;
import React from 'react';

const LoadTypeSettings = ({
  allLoadTypes, preDefinedLoadTypes, loadTypeSettings, newLoadTypeName,
  setNewLoadTypeName, handleAddLoadType, handleLoadTypeSettingChange,
  handleDeleteLoadType,
}) => {
  return (
    <div className="flex-1">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Load Type Settings</h2>
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
        
        {/* Add Load Type Section */}
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Add New Load Type</h3>
        <div className="flex gap-2 mb-8">
          <input
            type="text"
            placeholder="New Load Type Name"
            value={newLoadTypeName}
            onChange={(e) => setNewLoadTypeName(e.target.value)}
            className="flex-1 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAddLoadType}
            className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            Add
          </button>
        </div>

        {/* Combination Strategy Section */}
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Load Type Combination Strategy</h3>
        <p className="text-sm text-gray-500 mb-4">
          This controls how **all** primary loads of this type are combined when factored (e.g., $L_{1}, L_{2}, L_{3}$).
        </p>
        <ul className="space-y-5">
          {allLoadTypes.map((type, index) => (
            <li key={type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-blue-600">#{index + 1}</span>
                <span className="font-medium text-gray-800 flex-1">{type}</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={loadTypeSettings[type] || 'Separate'}
                  onChange={(e) => handleLoadTypeSettingChange(type, e.target.value)}
                  className="w-full sm:w-auto p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Separate">Separate (N loads = N sets)</option>
                  <option value="Aggregate">Aggregate (N loads = 1 set)</option>
                  <option value="Matrix">Matrix (N loads = 2ⁿ-1 sets)</option>
                </select>
                <button
                  onClick={() => handleDeleteLoadType(type)}
                  className="bg-red-500 text-white p-2 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200 disabled:opacity-50"
                  disabled={preDefinedLoadTypes.includes(type)}
                  title={preDefinedLoadTypes.includes(type) ? "Cannot delete pre-defined type" : "Delete Load Type"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default LoadTypeSettings;
import React from 'react';

const PrimaryLoadManager = ({
  primaryLoads, newLoadName, newLoadType, allLoadTypes, 
  setNewLoadName, setNewLoadType, handleAddPrimaryLoad, 
  handlePrimaryLoadNameChange, handlePrimaryLoadTypeChange, 
  handleDeletePrimaryLoad, 
  handleDragStart, handleDragEnter, handleDrop, handleDragOver
}) => {
  return (
    <div className="flex-1">
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Manage Primary Loads</h2>
      
      {/* Add Primary Load Section */}
      <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Add Primary Load</h3>
        <div className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Load Name (e.g., Roof Load, Equipment DL)"
            value={newLoadName}
            onChange={(e) => setNewLoadName(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={newLoadType}
            onChange={(e) => setNewLoadType(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {allLoadTypes.map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <button
            onClick={handleAddPrimaryLoad}
            className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
          >
            Add Primary Load
          </button>
        </div>
      </div>
      
      {/* Current Primary Loads List */}
      <div>
        <h3 className="text-xl font-semibold text-gray-700 mb-4">Current Primary Loads (Load Index: #)</h3>
        <p className="text-sm text-gray-500 mb-4 italic">Drag and drop to reorder load indices.</p>
        {primaryLoads.length === 0 ? (
          <p className="text-gray-500 italic">No loads added yet. Index 1-based.</p>
        ) : (
          <ul className="space-y-3">
            {primaryLoads.map((load, index) => (
              <li
                key={load.id}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragEnter={(e) => handleDragEnter(e, index)}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 gap-2 sm:gap-4 cursor-grab transition-all duration-200 ease-in-out hover:shadow-lg"
              >
                <div className="flex items-center gap-2 w-full sm:w-1/2">
                    <span className="font-bold text-blue-600">#{index + 1}</span>
                    <input
                        type="text"
                        value={load.name}
                        onChange={(e) => handlePrimaryLoadNameChange(load.id, e.target.value)}
                        className="flex-1 font-medium text-gray-800 w-full sm:w-auto p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-1/2 justify-end">
                    <select
                        value={load.type}
                        onChange={(e) => handlePrimaryLoadTypeChange(load.id, e.target.value)}
                        className="w-full sm:w-auto p-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {allLoadTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <button
                        onClick={() => handleDeletePrimaryLoad(load.id)}
                        className="bg-red-500 text-white p-2 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
                        title="Delete Primary Load"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm6 0a1 1 0 112 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default PrimaryLoadManager;
import React, { useState, useEffect, useRef } from 'react';

// Main App Component
const App = () => {
  // State for managing primary loads. Each load has a name, type, and factor setting.
  const [primaryLoads, setPrimaryLoads] = useState([]);
  
  // State for the new primary load input fields
  const [newLoadName, setNewLoadName] = useState('');
  const [newLoadType, setNewLoadType] = useState('Dead Load');
  // New state for the new factor setting dropdown
  const [newLoadFactorSetting, setNewLoadFactorSetting] = useState('Separate');

  // Pre-defined list of load types
  const preDefinedLoadTypes = [
    'Dead Load',
    'Live Load',
    'Wind Load',
    'Snow Load',
    'Seismic Load',
  ];

  // State for user-defined load types
  const [userDefinedLoadTypes, setUserDefinedLoadTypes] = useState([]);
  const [newLoadTypeName, setNewLoadTypeName] = useState('');

  // Combine pre-defined and user-defined load types for a complete list
  const allLoadTypes = [...preDefinedLoadTypes, ...userDefinedLoadTypes];

  // State for managing the "Separate", "Aggregate", "Matrix" settings for each load type
  const [loadTypeSettings, setLoadTypeSettings] = useState(() => {
    // Initialize settings with pre-defined load types
    const initialSettings = {};
    preDefinedLoadTypes.forEach(type => {
      initialSettings[type] = 'Separate';
    });
    return initialSettings;
  });

  // State for storing ULS load cases (rows). Each case has an ID and factors.
  const [ulsCases, setUlsCases] = useState([]);

  // State for managing column resizing
  const [columnWidths, setColumnWidths] = useState({});
  const [resizing, setResizing] = useState(false);
  const [currentColumn, setCurrentColumn] = useState(null);

  // State to track the currently edited ULS cell
  const [editingCell, setEditingCell] = useState(null); // format: [caseId, loadId]

  // Refs to store the index of the dragged item and the item it's hovering over
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // State for the exported text
  const [exportText, setExportText] = useState('');
  const exportTextRef = useRef(null);

  // New state for the starting number of load combinations
  const [startLoadNumber, setStartLoadNumber] = useState(101);
  
  // Effect hook to handle mouse events for column resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!resizing || !currentColumn) return;
      
      const table = e.currentTarget.querySelector('table');
      if (!table) return;

      const headerCell = table.querySelector(`th[data-id="${currentColumn}"]`);
      if (headerCell) {
        const newWidth = e.clientX - headerCell.getBoundingClientRect().left;
        setColumnWidths(prev => ({
          ...prev,
          [currentColumn]: newWidth > 50 ? newWidth : 50, // Minimum width of 50px
        }));
      }
    };

    const handleMouseUp = () => {
      setResizing(false);
      setCurrentColumn(null);
    };

    if (resizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizing, currentColumn]);

  // Effect to generate the load combinations text for export
  useEffect(() => {
    const generateExportText = () => {
        // Filter out cases that have no factors entered
        const validUlsCases = ulsCases.filter(ulsCase => {
            return Object.values(ulsCase.factors).some(factor => factor && parseFloat(factor) !== 0);
        });

        if (validUlsCases.length === 0) {
            setExportText('');
            return;
        }

        let text = '';
        const startingNumber = parseInt(startLoadNumber) || 101;
        
        validUlsCases.forEach((ulsCase, index) => {
            // Generate the description string for the combination
            const descriptionParts = Object.entries(ulsCase.factors)
                .filter(([type, factor]) => factor && parseFloat(factor) !== 0)
                .map(([type, factor]) => `${factor} ${type}`);
            const description = descriptionParts.join(' + ');
            
            // Add the combination header with a number that increments from the user's input
            text += `LOAD COMB ${startingNumber + index} ${description}\n`;

            // Collect primary load numbers and factors into a single line
            const primaryLoadLine = primaryLoads
                .filter(load => ulsCase.factors[load.type] && parseFloat(ulsCase.factors[load.type]) !== 0)
                .map((load, loadIndex) => `${loadIndex + 1} ${ulsCase.factors[load.type]}`)
                .join(' ');
            
            if (primaryLoadLine) {
                text += `${primaryLoadLine}\n`;
            }

            text += `\n`; // Add a blank line between combinations
        });
        
        setExportText(text);
    };

    generateExportText();
  }, [ulsCases, primaryLoads, startLoadNumber]);

  // Function to handle the start of a column resize
  const handleMouseDown = (e, columnId) => {
    e.preventDefault();
    setResizing(true);
    setCurrentColumn(columnId);
  };

  // Function to handle adding a new primary load
  const handleAddPrimaryLoad = () => {
    if (newLoadName.trim() === '') {
      return;
    }
    const newLoad = {
      id: Date.now(), // Unique ID for the key
      name: newLoadName,
      type: newLoadType,
      factorSetting: newLoadFactorSetting, // Include the new setting
    };
    setPrimaryLoads([...primaryLoads, newLoad]);
    setNewLoadName('');
  };

  // Function to handle adding a new load type
  const handleAddLoadType = () => {
    if (newLoadTypeName.trim() === '' || allLoadTypes.includes(newLoadTypeName.trim())) {
      return; // Prevent adding empty or duplicate load types
    }
    const newType = newLoadTypeName.trim();
    setUserDefinedLoadTypes([...userDefinedLoadTypes, newType]);
    // Add the new load type to the settings with a default value
    setLoadTypeSettings({
      ...loadTypeSettings,
      [newType]: 'Separate',
    });
    setNewLoadTypeName('');
  };

  // Function to handle changes in the primary load's name
  const handlePrimaryLoadNameChange = (id, newName) => {
    setPrimaryLoads(primaryLoads.map(load => 
      load.id === id ? { ...load, name: newName } : load
    ));
  };

  // Function to handle changes in the primary load's type
  const handlePrimaryLoadTypeChange = (id, newType) => {
    setPrimaryLoads(primaryLoads.map(load => 
      load.id === id ? { ...load, type: newType } : load
    ));
  };

  // New function to handle changes in the primary load's factor setting
  const handlePrimaryLoadFactorSettingChange = (id, newSetting) => {
    setPrimaryLoads(primaryLoads.map(load => 
      load.id === id ? { ...load, factorSetting: newSetting } : load
    ));
  };
  
  // Function to handle changes in the load type settings dropdowns
  const handleLoadTypeSettingChange = (type, setting) => {
    setLoadTypeSettings({
      ...loadTypeSettings,
      [type]: setting,
    });
  };

  // Function to delete a primary load
  const handleDeletePrimaryLoad = (id) => {
    setPrimaryLoads(primaryLoads.filter(load => load.id !== id));
    // Also remove the corresponding factor from all ULS cases
    setUlsCases(ulsCases.map(ulsCase => {
      const newFactors = { ...ulsCase.factors };
      delete newFactors[id];
      return { ...ulsCase, factors: newFactors };
    }));
  };
  
  // Function to delete a custom load type
  const handleDeleteLoadType = (typeToDelete) => {
    // Prevent deletion of pre-defined types
    if (preDefinedLoadTypes.includes(typeToDelete)) {
      console.log("Cannot delete a pre-defined load type.");
      return;
    }

    // Remove the type from the user-defined list
    setUserDefinedLoadTypes(userDefinedLoadTypes.filter(type => type !== typeToDelete));
    
    // Remove the type from the settings
    const newLoadTypeSettings = { ...loadTypeSettings };
    delete newLoadTypeSettings[typeToDelete];
    setLoadTypeSettings(newLoadTypeSettings);

    // Update any primary loads that had the deleted type
    setPrimaryLoads(primaryLoads.map(load => 
      load.type === typeToDelete ? { ...load, type: 'Dead Load' } : load
    ));

    // Update the new load type if it was the one being deleted
    if (newLoadType === typeToDelete) {
      setNewLoadType('Dead Load');
    }

    // Remove the corresponding factor from all ULS cases for the deleted load type
    setUlsCases(ulsCases.map(ulsCase => {
        const newFactors = { ...ulsCase.factors };
        delete newFactors[typeToDelete];
        return { ...ulsCase, factors: newFactors };
    }));
  };

  // Function to handle adding a new ULS load case (row)
  const handleAddUlsRow = () => {
    const newCase = {
      id: Date.now(),
      factors: {},
    };
    setUlsCases([...ulsCases, newCase]);
  };

  // Function to handle changes in a ULS factor input
  const handleUlsFactorChange = (caseId, loadType, value) => {
    setUlsCases(ulsCases.map(ulsCase => 
      ulsCase.id === caseId 
        ? { ...ulsCase, factors: { ...ulsCase.factors, [loadType]: value } }
        : ulsCase
    ));
  };

  // Function to handle "Enter" key press in an input field
  const handleKeyDown = (e, caseId, loadId) => {
    if (e.key === 'Enter') {
      setEditingCell(null); // Exit editing mode
    }
  };

  // DRAG AND DROP FUNCTIONS
  // Set the index of the dragged item
  const handleDragStart = (e, index) => {
    dragItem.current = index;
  };
  
  // Set the index of the item being dragged over
  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  // Prevent default behavior on drag over to allow dropping
  const handleDragOver = (e) => {
    e.preventDefault();
  };

  // Handle the drop event to reorder the list
  const handleDrop = (e) => {
    const dropIndex = dragOverItem.current;
    if (dragItem.current === null || dropIndex === null || dragItem.current === dropIndex) {
      return;
    }

    const newPrimaryLoads = [...primaryLoads];
    const draggedItem = newPrimaryLoads.splice(dragItem.current, 1)[0];
    newPrimaryLoads.splice(dropIndex, 0, draggedItem);
    setPrimaryLoads(newPrimaryLoads);
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  // Function to get unique load types for the header
  const getUniqueLoadTypes = () => {
    return [...new Set(primaryLoads.map(load => load.type))];
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="w-full bg-white p-8 rounded-2xl shadow-xl flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Manage Loads */}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Loads</h2>
          
          {/* Add New Primary Load Section */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Add Primary Load</h3>
            <div className="flex flex-col gap-4">
              {/* Input for Load Name */}
              <input
                type="text"
                placeholder="Load Name (e.g., Roof Load)"
                value={newLoadName}
                onChange={(e) => setNewLoadName(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              
              {/* Dropdown for Load Type */}
              <select
                value={newLoadType}
                onChange={(e) => setNewLoadType(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {allLoadTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>

              {/* New dropdown for Load Factor Setting */}
              <select
                value={newLoadFactorSetting}
                onChange={(e) => setNewLoadFactorSetting(e.target.value)}
                className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Separate">Separate</option>
                <option value="Aggregate">Aggregate</option>
                <option value="Matrix">Matrix</option>
              </select>
              
              {/* Add Load Button */}
              <button
                onClick={handleAddPrimaryLoad}
                className="w-full bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-colors duration-200"
              >
                Add Primary Load
              </button>
            </div>
          </div>

          {/* List of Added Primary Loads */}
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-4">Current Primary Loads</h3>
            {primaryLoads.length === 0 ? (
              <p className="text-gray-500 italic">No loads added yet.</p>
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
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <span className="font-bold text-blue-600">#{index + 1}</span>
                        <input
                            type="text"
                            value={load.name}
                            onChange={(e) => handlePrimaryLoadNameChange(load.id, e.target.value)}
                            className="flex-1 font-medium text-gray-800 w-full sm:w-auto p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <select
                            value={load.type}
                            onChange={(e) => handlePrimaryLoadTypeChange(load.id, e.target.value)}
                            className="w-full sm:w-auto p-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            {allLoadTypes.map((type) => (
                            <option key={type} value={type}>
                                {type}
                            </option>
                            ))}
                        </select>
                        {/* New dropdown for existing loads */}
                        <select
                            value={load.factorSetting}
                            onChange={(e) => handlePrimaryLoadFactorSettingChange(load.id, e.target.value)}
                            className="w-full sm:w-auto p-2 rounded-lg border border-gray-300 bg-white text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="Separate">Separate</option>
                            <option value="Aggregate">Aggregate</option>
                            <option value="Matrix">Matrix</option>
                        </select>
                        <button
                            onClick={() => handleDeletePrimaryLoad(load.id)}
                            className="bg-red-500 text-white p-2 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
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
        
        {/* Right Column: Load Type Settings */}
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Load Type Settings</h2>
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
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

            <h3 className="text-xl font-semibold text-gray-700 mb-4">Load Type Matrix</h3>
            <ul className="space-y-5">
              {allLoadTypes.map((type, index) => (
                <li key={type} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-600">#{index + 1}</span>
                    <span className="font-medium text-gray-800 flex-1">{type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={loadTypeSettings[type]}
                      onChange={(e) => handleLoadTypeSettingChange(type, e.target.value)}
                      className="w-full sm:w-auto p-2 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Separate">Separate</option>
                      <option value="Aggregate">Aggregate</option>
                      <option value="Matrix">Matrix</option>
                    </select>
                    <button
                        onClick={() => handleDeleteLoadType(type)}
                        className="bg-red-500 text-white p-2 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-200"
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
        
      </div>

      {/* ULS Table Section - Now takes up the full width */}
      {primaryLoads.length > 0 && (
        <div className="w-full bg-white p-8 rounded-2xl shadow-xl mt-8">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-700">ULS Table</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="startLoadNumber" className="text-sm text-gray-600 font-medium">Start at:</label>
                <input
                    id="startLoadNumber"
                    type="number"
                    value={startLoadNumber}
                    onChange={(e) => setStartLoadNumber(e.target.value)}
                    className="w-20 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                        <tr>
                            <th
                                data-id="number"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                                style={{ width: columnWidths["number"] || 'auto' }}
                            >
                                #
                                <div
                                    onMouseDown={(e) => handleMouseDown(e, "number")}
                                    className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                                ></div>
                            </th>
                            <th
                                data-id="description"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                                style={{ width: columnWidths["description"] || 'auto' }}
                            >
                                Description
                                <div
                                    onMouseDown={(e) => handleMouseDown(e, "description")}
                                    className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                                ></div>
                            </th>
                            {getUniqueLoadTypes().map(type => (
                                <th
                                    key={type}
                                    data-id={type}
                                    className="px-6 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider text-center relative"
                                    style={{ width: columnWidths[type] || 'auto' }}
                                >
                                    {type}
                                    <div
                                        onMouseDown={(e) => handleMouseDown(e, type)}
                                        className="absolute top-0 right-0 w-2 h-full cursor-col-resize hover:bg-gray-300 transition-colors"
                                    ></div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {ulsCases.map((ulsCase, caseIndex) => {
                            // Generate the description based on entered factors
                            const descriptionParts = Object.keys(ulsCase.factors).filter(type => 
                              ulsCase.factors[type] && parseFloat(ulsCase.factors[type]) !== 0
                            ).map(type => `${ulsCase.factors[type]} ${type}`);

                            const description = descriptionParts.length > 0 ? descriptionParts.join(' + ') : 'New Load Case';

                            return (
                            <tr key={ulsCase.id}>
                                <td 
                                  className="px-6 py-4 whitespace-nowrap"
                                  style={{ width: columnWidths["number"] || 'auto' }}
                                >
                                    {caseIndex + 1}
                                </td>
                                <td 
                                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium"
                                  style={{ width: columnWidths["description"] || 'auto' }}
                                >
                                    {description}
                                </td>
                                {getUniqueLoadTypes().map(type => (
                                    <td 
                                      key={type} 
                                      className="px-6 py-4 whitespace-nowrap"
                                      style={{ width: columnWidths[type] || 'auto' }}
                                    >
                                        <input
                                            type="number"
                                            step="any"
                                            value={ulsCase.factors[type] || ''}
                                            onChange={(e) => handleUlsFactorChange(ulsCase.id, type, e.target.value)}
                                            className="w-20 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </td>
                                ))}
                            </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <button
                onClick={handleAddUlsRow}
                className="mt-4 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
            >
                Add Load Case
            </button>
        </div>
      )}
      
      {/* Load Combinations Export Section */}
      {ulsCases.length > 0 && (
          <div className="w-full bg-white p-8 rounded-2xl shadow-xl mt-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Load Combinations</h2>
              <textarea
                  ref={exportTextRef}
                  className="w-full min-h-[520px] border rounded-xl p-2 text-xs font-mono resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly
                  value={exportText}
              />
          </div>
      )}
      
    </div>
  );
};

export default App;

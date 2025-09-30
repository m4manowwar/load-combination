import React, { useState, useEffect, useRef, useCallback } from 'react';

// Main App Component
const App = () => {
  // State for managing primary loads.
  const [primaryLoads, setPrimaryLoads] = useState([]);
  
  // State for the new primary load input fields
  const [newLoadName, setNewLoadName] = useState('');
  const [newLoadType, setNewLoadType] = useState('Dead Load');
  
  // State for copy feedback
  const [isCopied, setIsCopied] = useState(false);

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
    const initialSettings = {};
    preDefinedLoadTypes.forEach(type => {
      initialSettings[type] = 'Separate';
    });
    return initialSettings;
  });

  // State for storing ULS load cases (Strength) and SLS load cases (Serviceability)
  const [ulsCases, setUlsCases] = useState([]);
  const [slsCases, setSlsCases] = useState([]);

  // State for the starting number of load combinations
  const [startUlsNumber, setStartUlsNumber] = useState(101);
  const [startSlsNumber, setStartSlsNumber] = useState(501); // New state for SLS start number

  // State for column widths (kept for consistency, not fully implemented for drag)
  const [columnWidths, setColumnWidths] = useState({});
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const exportTextRef = useRef(null); 
  const [exportText, setExportText] = useState('');

  // Function to get unique load types for the header
  const getUniqueLoadTypes = () => {
    return [...new Set(primaryLoads.map(load => load.type))];
  };

  // Function to handle copying text to clipboard
  const handleCopyToClipboard = () => {
    if (exportTextRef.current) {
      exportTextRef.current.select(); 
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  // Helper function to generate expanded load sets (Separate, Aggregate, Matrix)
  const generateLoadSetsForType = useCallback((loadType, factor, setting, primaryLoadsOfType) => {
    if (factor === 0 || primaryLoadsOfType.length === 0) {
      return [{}];
    }

    const finalFactor = parseFloat(factor);
    
    switch (setting) {
      case 'Separate':
        return primaryLoadsOfType.map(pLoad => ({ [pLoad.id]: finalFactor }));
      case 'Aggregate':
        const aggregateSet = {};
        primaryLoadsOfType.forEach(pLoad => { aggregateSet[pLoad.id] = finalFactor; });
        return [aggregateSet];
      case 'Matrix':
        const n = primaryLoadsOfType.length;
        const matrixSets = [];
        // Generates combinations of 1 to 2^n - 1 primary loads
        for (let i = 1; i < (1 << n); i++) {
          const loadSet = {};
          for (let j = 0; j < n; j++) {
            if ((i & (1 << j)) !== 0) {
              loadSet[primaryLoadsOfType[j].id] = finalFactor;
            }
          }
          matrixSets.push(loadSet);
        }
        return matrixSets;
      default:
        return [{}];
    }
  }, []);

  // Helper function for the Cartesian product of load sets
  const crossProduct = useCallback((arrays) => {
    if (arrays.length === 0) return [{}];
    
    return arrays.reduce((accumulator, currentArray) => {
      const nextAccumulator = [];
      accumulator.forEach(accSet => {
        currentArray.forEach(currentSet => {
          nextAccumulator.push({ ...accSet, ...currentSet });
        });
      });
      return nextAccumulator;
    }, [{}]);
  }, []);

  // CORE LOGIC: Function to process a set of load cases (ULS or SLS) and generate the combinations text
  const generateCombinations = useCallback((cases, startingNumber) => {
    let text = '';
    let combinationIndex = 0;
    const initialNumber = parseInt(startingNumber) || 1; 

    const validCases = cases.filter(c => {
        return Object.values(c.factors).some(factor => factor && parseFloat(factor) !== 0);
    });

    const groupedPrimaryLoads = primaryLoads.reduce((acc, pLoad) => {
        if (!acc[pLoad.type]) { acc[pLoad.type] = []; }
        acc[pLoad.type].push(pLoad);
        return acc;
    }, {});
    
    validCases.forEach((currentCase) => {
        const loadSetArrays = [];
        
        Object.entries(currentCase.factors).forEach(([loadType, factor]) => {
          const loadFactor = factor ? parseFloat(factor) : 0;
          
          if (loadFactor !== 0) {
            const setting = loadTypeSettings[loadType] || 'Separate'; 
            const loadsOfType = groupedPrimaryLoads[loadType] || [];

            const expandedSets = generateLoadSetsForType(
              loadType, 
              loadFactor, 
              setting, 
              loadsOfType
            );
            
            if (expandedSets.length > 0) {
              loadSetArrays.push(expandedSets);
            }
          }
        });
        
        const finalCombinations = crossProduct(loadSetArrays);
        
        finalCombinations.forEach(finalCombo => {
          const comboNumber = initialNumber + combinationIndex;
          
          // --- Line 1: LOAD COMB Description ---
          const detailedDescriptionParts = primaryLoads
              .map((pLoad) => {
                  const factor = finalCombo[pLoad.id];
                  if (factor && factor !== 0) {
                      const factorText = Number.isInteger(factor) ? factor.toString() : factor.toFixed(2);
                      return `${factorText} ${pLoad.name}`;
                  }
                  return null;
              })
              .filter(part => part !== null);
          
          const description = detailedDescriptionParts.join(' + ');
          text += `LOAD COMB ${comboNumber} ${description}\n`;
          
          // --- Line 2: Primary Load Factors (LOAD COMB definition) ---
          const primaryLoadLineParts = primaryLoads
              .map((pLoad, loadIndex) => {
                  const factor = finalCombo[pLoad.id];
                  if (factor && factor !== 0) {
                      const factorText = Number.isInteger(factor) ? factor.toString() : factor.toFixed(2);
                      return `${loadIndex + 1} ${factorText}`; // Load indices are 1-based (index + 1)
                  }
                  return null;
              })
              .filter(part => part !== null);
          
          if (primaryLoadLineParts.length > 0) {
              text += `${primaryLoadLineParts.join(' ')}\n`;
          }

          text += `\n`; 
          combinationIndex++; 
        });
    });
    
    return { text, count: combinationIndex };
  }, [primaryLoads, loadTypeSettings, generateLoadSetsForType, crossProduct]);

  // Effect hook to generate the final, combined export text
  useEffect(() => {
    const generateExportText = () => {
        
        const startingNumberULS = parseInt(startUlsNumber) || 101;

        // 1. Generate ULS Combinations
        const { text: ulsText, count: ulsCount } = generateCombinations(ulsCases, startingNumberULS);

        // 2. Determine the number immediately following the last ULS combination
        const nextNumberAfterULS = startingNumberULS + ulsCount;
        
        // 3. Determine the actual SLS start number: either user input or the number following ULS
        // We ensure the SLS start number is not less than the next ULS number
        const slsManualStart = parseInt(startSlsNumber) || nextNumberAfterULS;
        const actualSlsStart = Math.max(slsManualStart, nextNumberAfterULS);

        // 4. Generate SLS Combinations
        const { text: slsText, count: slsCount } = generateCombinations(slsCases, actualSlsStart);
        
        let finalExport = '';
        const separator = '********************************';

        // Format ULS output (STRENGTH)
        if (ulsCount > 0) {
            finalExport += `${separator}\n`;
            finalExport += `****** STRENGTH      *******\n`;
            finalExport += `${separator}\n`;
            finalExport += ulsText;
        }

        // Format SLS output (SERVICE)
        if (slsCount > 0) {
            if (finalExport.length > 0) {
                finalExport += '\n'; // Add extra space if ULS was present
            }
            finalExport += `${separator}\n`;
            finalExport += `****** SERVICE      *******\n`;
            finalExport += `${separator}\n`;
            finalExport += slsText;
        }

        if (ulsCount === 0 && slsCount === 0) {
            finalExport = 'Add a primary load factor (e.g., 1.2) to one of the load type columns in the ULS or SLS Table to generate combinations.';
        }

        setExportText(finalExport);
    };

    generateExportText();
  }, [ulsCases, slsCases, startUlsNumber, startSlsNumber, generateCombinations]);


  // Placeholder functions for CRUD operations on loads and types (omitted implementation details for brevity)
  const handleAddPrimaryLoad = () => {
    if (newLoadName.trim() === '') return;
    const newLoad = { 
        id: crypto.randomUUID(), 
        name: newLoadName.trim(), 
        type: newLoadType 
    };
    setPrimaryLoads([...primaryLoads, newLoad]);
    setNewLoadName('');
  };
  const handlePrimaryLoadNameChange = (id, newName) => {
    setPrimaryLoads(primaryLoads.map(load => 
        load.id === id ? { ...load, name: newName } : load
    ));
  };
  const handlePrimaryLoadTypeChange = (id, newType) => {
    setPrimaryLoads(primaryLoads.map(load => 
        load.id === id ? { ...load, type: newType } : load
    ));
  };
  const handleDeletePrimaryLoad = (id) => {
    setPrimaryLoads(primaryLoads.filter(load => load.id !== id));
  };
  const handleAddLoadType = () => {
    const typeName = newLoadTypeName.trim();
    if (typeName === '' || allLoadTypes.includes(typeName)) return;
    setUserDefinedLoadTypes([...userDefinedLoadTypes, typeName]);
    setLoadTypeSettings(prev => ({ ...prev, [typeName]: 'Separate' }));
    setNewLoadTypeName('');
  };
  const handleLoadTypeSettingChange = (type, setting) => {
    setLoadTypeSettings(prev => ({ ...prev, [type]: setting }));
  };
  const handleDeleteLoadType = (typeToDelete) => {
    if (preDefinedLoadTypes.includes(typeToDelete)) return;
    setUserDefinedLoadTypes(userDefinedLoadTypes.filter(type => type !== typeToDelete));
    setLoadTypeSettings(prev => {
        const { [typeToDelete]: deleted, ...rest } = prev;
        return rest;
    });
    setPrimaryLoads(primaryLoads.filter(load => load.type !== typeToDelete));
  };
  const handleAddUlsRow = () => {
    setUlsCases([...ulsCases, { id: crypto.randomUUID(), factors: {} }]);
  };
  const handleAddSlsRow = () => {
    setSlsCases([...slsCases, { id: crypto.randomUUID(), factors: {} }]);
  };
  const handleUlsFactorChange = (caseId, loadType, value) => {
    setUlsCases(ulsCases.map(c => 
        c.id === caseId ? { ...c, factors: { ...c.factors, [loadType]: value } } : c
    ));
  };
  const handleSlsFactorChange = (caseId, loadType, value) => {
    setSlsCases(slsCases.map(c => 
        c.id === caseId ? { ...c, factors: { ...c.factors, [loadType]: value } } : c
    ));
  };
  // Drag and drop implementation for reordering primary loads
  const handleDragStart = (e, index) => {
      dragItem.current = index;
      e.currentTarget.classList.add('opacity-40');
  };
  const handleDragEnter = (e, index) => {
      dragOverItem.current = index;
  };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e) => {
      e.currentTarget.classList.remove('opacity-40');
      const dragIndex = dragItem.current;
      const dropIndex = dragOverItem.current;
      
      if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) return;

      const newLoads = [...primaryLoads];
      const draggedLoad = newLoads[dragIndex];
      newLoads.splice(dragIndex, 1); // remove item from old position
      newLoads.splice(dropIndex, 0, draggedLoad); // insert item at new position

      setPrimaryLoads(newLoads);
      dragItem.current = null;
      dragOverItem.current = null;
  };


  // Reusable Table Component for ULS and SLS
  const FactorTable = ({ title, cases, onAddRow, onFactorChange, startNumber, onStartNumberChange }) => {
    
    const isUls = title.includes('ULS');
    
    // Calculate the suggested minimum start number for SLS
    const nextNumberAfterULS = (parseInt(startUlsNumber) || 101) + (ulsCases.length > 0 ? generateCombinations(ulsCases, startUlsNumber).count : 0);
    const slsMinStart = isUls ? 1 : nextNumberAfterULS;
    const isSls = title.includes('SLS');

    return (
        <div className="w-full bg-white p-8 rounded-2xl shadow-xl mt-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-xl font-semibold text-gray-700">{title} (Input Factors by Load Type)</h2>
                
              {/* Load Combination Start Number Input - MODIFIED FOR SLS */}
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
                            <th
                                data-id="number"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                                style={{ width: columnWidths["number"] || 'auto' }}
                            >
                                Case #
                            </th>
                            <th
                                data-id="description"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider relative"
                                style={{ width: columnWidths["description"] || 'auto' }}
                            >
                                Case Description (Visual)
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
                        {cases.map((loadCase, caseIndex) => {
                            const descriptionParts = Object.keys(loadCase.factors).filter(type => 
                              loadCase.factors[type] && parseFloat(loadCase.factors[type]) !== 0
                            ).map(type => `${loadCase.factors[type]} ${type}`);

                            const description = descriptionParts.length > 0 ? descriptionParts.join(' + ') : 'New Load Case (Empty)';

                            return (
                            <tr key={loadCase.id}>
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
                                            value={loadCase.factors[type] || ''}
                                            onChange={(e) => onFactorChange(loadCase.id, type, e.target.value)}
                                            className="w-20 p-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Factor"
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
                onClick={onAddRow}
                className="mt-4 bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-200"
            >
                Add Load Case
            </button>
        </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-['Inter']">
      <div className="w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Manage Loads (Primary Loads, Load Indices) */}
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Manage Primary Loads</h2>
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
                  <option key={type} value={type}>
                    {type}
                  </option>
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
                            <option key={type} value={type}>
                                {type}
                            </option>
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
        
        {/* Right Column: Load Type Settings (Strategy for combining loads of the same type) */}
        <div className="flex-1">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Load Type Settings</h2>
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

            <h3 className="text-xl font-semibold text-gray-700 mb-4">Load Type Combination Strategy</h3>
            <p className="text-sm text-gray-500 mb-4">This controls how **all** primary loads of this type are combined when factored (e.g., $L_{1}, L_{2}, L_{3}$).</p>
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
        
      </div>

      {/* ULS Table Section - Strength Limit State */}
      {primaryLoads.length > 0 && (
          <FactorTable 
              title="ULS Table (Ultimate/Strength Limit State)" 
              cases={ulsCases} 
              onAddRow={handleAddUlsRow} 
              onFactorChange={handleUlsFactorChange}
              startNumber={startUlsNumber}
              onStartNumberChange={setStartUlsNumber}
          />
      )}
      
      {/* SLS Table Section - Serviceability Limit State */}
      {primaryLoads.length > 0 && (
          <FactorTable 
              title="SLS Table (Serviceability Limit State)" 
              cases={slsCases} 
              onAddRow={handleAddSlsRow} 
              onFactorChange={handleSlsFactorChange}
              startNumber={startSlsNumber}
              onStartNumberChange={setStartSlsNumber}
          />
      )}
      
      {/* Load Combinations Export Section */}
      {primaryLoads.length > 0 && (
          <div className="w-full bg-white p-8 rounded-2xl shadow-xl mt-8">
              <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-700">Exported Load Combinations (Expanded)</h2>
                  <button
                      onClick={handleCopyToClipboard}
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
      )}
      
    </div>
  );
};

export default App;

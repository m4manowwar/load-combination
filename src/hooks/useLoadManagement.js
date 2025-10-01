import { useState, useCallback, useRef } from 'react';

const preDefinedLoadTypes = [
  'Dead Load',
  'Live Load',
  'Wind Load',
  'Snow Load',
  'Seismic Load',
];

export const useLoadManagement = () => {
  // Primary Loads State
  const [primaryLoads, setPrimaryLoads] = useState([]);
  const [newLoadName, setNewLoadName] = useState('');
  const [newLoadType, setNewLoadType] = useState(preDefinedLoadTypes[0]);

  // Load Types State
  const [userDefinedLoadTypes, setUserDefinedLoadTypes] = useState([]);
  const [newLoadTypeName, setNewLoadTypeName] = useState('');
  const allLoadTypes = [...preDefinedLoadTypes, ...userDefinedLoadTypes];
  
  // Load Type Combination Settings
  const [loadTypeSettings, setLoadTypeSettings] = useState(() => {
    const initialSettings = {};
    preDefinedLoadTypes.forEach(type => {
      initialSettings[type] = 'Separate';
    });
    return initialSettings;
  });

  // Load Case States
  const [ulsCases, setUlsCases] = useState([]);
  const [slsCases, setSlsCases] = useState([]);

  // Load Combination Start Numbers
  const [startUlsNumber, setStartUlsNumber] = useState(101);
  const [startSlsNumber, setStartSlsNumber] = useState(501);

  // Drag and Drop Refs
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  // Country and Code Selection State
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCode, setSelectedCode] = useState('');

  // --- Primary Load Handlers ---
  const handleAddPrimaryLoad = useCallback(() => {
    if (newLoadName.trim() === '') return;
    const newLoad = { 
      id: crypto.randomUUID(), 
      name: newLoadName.trim(), 
      type: newLoadType 
    };
    setPrimaryLoads(prev => [...prev, newLoad]);
    setNewLoadName('');
  }, [newLoadName, newLoadType]);

  const handlePrimaryLoadNameChange = useCallback((id, newName) => {
    setPrimaryLoads(prev => prev.map(load => 
        load.id === id ? { ...load, name: newName } : load
    ));
  }, []);

  const handlePrimaryLoadTypeChange = useCallback((id, newType) => {
    setPrimaryLoads(prev => prev.map(load => 
        load.id === id ? { ...load, type: newType } : load
    ));
  }, []);

  const handleDeletePrimaryLoad = useCallback((id) => {
    setPrimaryLoads(prev => prev.filter(load => load.id !== id));
  }, []);


    // Function to delete a row from ULS or SLS cases
  const handleDeleteRow = (id, isSls) => {
    console.log(`Deleting row with id: ${id}, isSls: ${isSls}`);
    if (isSls) {
      setSlsCases((prevCases) => {
        console.log('SLS Cases before deletion:', prevCases);
        const updatedCases = prevCases.filter((loadCase) => loadCase.id !== id);
        console.log('SLS Cases after deletion:', updatedCases);
        return updatedCases;
      });
    } else {
      setUlsCases((prevCases) => {
        console.log('ULS Cases before deletion:', prevCases);
        const updatedCases = prevCases.filter((loadCase) => loadCase.id !== id);
        console.log('ULS Cases after deletion:', updatedCases);
        return updatedCases;
      });
    }
  };

  // Drag Handlers
  const handleDragStart = (e, index) => {
    dragItem.current = index;
    e.currentTarget.classList.add('opacity-40');
  };
  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };
  const handleDrop = (e) => {
    e.currentTarget.classList.remove('opacity-40');
    const dragIndex = dragItem.current;
    const dropIndex = dragOverItem.current;
    
    if (dragIndex === null || dropIndex === null || dragIndex === dropIndex) return;

    setPrimaryLoads(prev => {
      const newLoads = [...prev];
      const draggedLoad = newLoads[dragIndex];
      newLoads.splice(dragIndex, 1);
      newLoads.splice(dropIndex, 0, draggedLoad);
      return newLoads;
    });
    dragItem.current = null;
    dragOverItem.current = null;
  };
  const handleDragOver = (e) => { e.preventDefault(); };

  // --- Load Type Handlers ---
  const handleAddLoadType = useCallback(() => {
    const typeName = newLoadTypeName.trim();
    if (typeName === '' || allLoadTypes.includes(typeName)) return;
    setUserDefinedLoadTypes(prev => [...prev, typeName]);
    setLoadTypeSettings(prev => ({ ...prev, [typeName]: 'Separate' }));
    setNewLoadTypeName('');
  }, [newLoadTypeName, allLoadTypes]);

  const handleLoadTypeSettingChange = useCallback((type, setting) => {
    setLoadTypeSettings(prev => ({ ...prev, [type]: setting }));
  }, []);

  const handleDeleteLoadType = useCallback((typeToDelete) => {
    if (preDefinedLoadTypes.includes(typeToDelete)) return;
    setUserDefinedLoadTypes(prev => prev.filter(type => type !== typeToDelete));
    setLoadTypeSettings(prev => {
        const { [typeToDelete]: deleted, ...rest } = prev;
        return rest;
    });
    setPrimaryLoads(prev => prev.filter(load => load.type !== typeToDelete));
  }, []);

  // --- ULS/SLS Case Handlers ---
  const handleAddUlsRow = useCallback(() => {
    setUlsCases(prev => [...prev, { id: crypto.randomUUID(), factors: {} }]);
  }, []);

  const handleAddSlsRow = useCallback(() => {
    setSlsCases(prev => [...prev, { id: crypto.randomUUID(), factors: {} }]);
  }, []);

  const createFactorChangeHandler = useCallback((setCases) => (caseId, loadType, value) => {
    setCases(prevCases => prevCases.map(c => 
      c.id === caseId ? { ...c, factors: { ...c.factors, [loadType]: value } } : c
    ));
  }, []);

  const handleUlsFactorChange = createFactorChangeHandler(setUlsCases);
  const handleSlsFactorChange = createFactorChangeHandler(setSlsCases);

  const getUniqueLoadTypes = () => {
    return [...new Set(primaryLoads.map(load => load.type))];
  };

  // Handlers for Country and Code Selection
  const handleCountryChange = useCallback((country) => {
    setSelectedCountry(country);
    setSelectedCode(''); // Reset code selection when country changes
  }, []);

  const handleCodeChange = useCallback((code) => {
    setSelectedCode(code);

    // Removed logic for updating ULS and SLS factors based on codingStandards
  }, [selectedCountry]);

  return {
    // States
    primaryLoads, newLoadName, newLoadType, allLoadTypes, 
    loadTypeSettings, preDefinedLoadTypes, newLoadTypeName,
    ulsCases, slsCases, startUlsNumber, setStartUlsNumber, 
    startSlsNumber, setStartSlsNumber, 
    selectedCountry, selectedCode,
    
    // Setters
    setNewLoadName, setNewLoadType, setNewLoadTypeName,

    // Handlers
    handleAddPrimaryLoad, handlePrimaryLoadNameChange, handlePrimaryLoadTypeChange,
    handleDeletePrimaryLoad, handleAddLoadType, handleLoadTypeSettingChange,
    handleDeleteLoadType, handleAddUlsRow, handleAddSlsRow, 
    handleUlsFactorChange, handleSlsFactorChange,
    handleDragStart, handleDragEnter, handleDrop, handleDragOver,
    handleCountryChange, handleCodeChange,
    getUniqueLoadTypes, handleDeleteRow,
  };
};
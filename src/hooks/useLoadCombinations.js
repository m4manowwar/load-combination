import { useState, useEffect, useCallback } from 'react';

// Helper function to generate expanded load sets (Separate, Aggregate, Matrix)
const generateLoadSetsForType = (loadType, factor, setting, primaryLoadsOfType) => {
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
};

// Helper function for the Cartesian product of load sets
const crossProduct = (arrays) => {
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
};

export const useLoadCombinations = (primaryLoads, ulsCases, slsCases, loadTypeSettings, startUlsNumber, startSlsNumber) => {
  const [exportText, setExportText] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // CORE LOGIC: Function to process a set of load cases (ULS or SLS) and generate the combinations text
  const generateCombinations = useCallback((cases, startingNumber) => {
    let text = '';
    let combinationIndex = 0;
    const initialNumber = parseInt(startingNumber) || 1; 

    const validCases = cases.filter(c => 
      Object.values(c.factors).some(factor => factor && parseFloat(factor) !== 0)
    );

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
            loadType, loadFactor, setting, loadsOfType
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
              // Load indices are 1-based (index + 1)
              return `${loadIndex + 1} ${factorText}`; 
            }
            return null;
          })
          .filter(part => part !== null);
        
        if (primaryLoadLineParts.length > 0) {
          text += `${primaryLoadLineParts.join(' ')}\n`;
        }

        text += ``; 
        combinationIndex++; 
      });
    });
    
    return { text, count: combinationIndex };
  }, [primaryLoads, loadTypeSettings]);

  useEffect(() => {
    const generateExportText = () => {
      const startingNumberULS = parseInt(startUlsNumber) || 101;

      // 1. Generate ULS Combinations
      const { text: ulsText, count: ulsCount } = generateCombinations(ulsCases, startingNumberULS);

      // 2. Determine the number immediately following the last ULS combination
      const nextNumberAfterULS = startingNumberULS + ulsCount;
      
      // 3. Determine the actual SLS start number
      const slsManualStart = parseInt(startSlsNumber) || nextNumberAfterULS;
      const actualSlsStart = Math.max(slsManualStart, nextNumberAfterULS);

      // 4. Generate SLS Combinations
      const { text: slsText, count: slsCount } = generateCombinations(slsCases, actualSlsStart);
      
      let finalExport = '';
      const separator = '********************************';

      // Format ULS output (STRENGTH)
      if (ulsCount > 0) {
        finalExport += `${separator}\n`;
        finalExport += `************STRENGTH************\n`;
        finalExport += `${separator}\n`;
        finalExport += ulsText;
      }

      // Format SLS output (SERVICE)
      if (slsCount > 0) {
        if (finalExport.length > 0) {
          finalExport += '\n';
        }
        finalExport += `${separator}\n`;
        finalExport += `************SERVICE*************\n`;
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

  const handleCopyToClipboard = (ref) => {
    if (ref.current) {
      ref.current.select(); 
      document.execCommand('copy');
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  return {
    exportText,
    isCopied,
    handleCopyToClipboard,
    generateCombinations, // Exported to be used in FactorTable for calculating min SLS start number
  };
};
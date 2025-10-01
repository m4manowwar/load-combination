import React from 'react';
import { useLoadManagement } from './hooks/useLoadManagement';
import { useLoadCombinations } from './hooks/useLoadCombinations';
import PrimaryLoadManager from './components/PrimaryLoadManager';
import LoadTypeSettings from './components/LoadTypeSettings';
import FactorTable from './components/FactorTable';
import ExportCombinations from './components/ExportCombinations';
import CodeSelector from './components/CodeSelector';
import codingStandards from './data/codingStandards';

const App = () => {
  // Use custom hook for all state management and handlers
  const {
    primaryLoads, newLoadName, newLoadType, allLoadTypes, loadTypeSettings,
    preDefinedLoadTypes, newLoadTypeName, ulsCases, slsCases,
    startUlsNumber, setStartUlsNumber, startSlsNumber, setStartSlsNumber,
    setNewLoadName, setNewLoadType, setNewLoadTypeName,
    handleAddPrimaryLoad, handlePrimaryLoadNameChange, handlePrimaryLoadTypeChange,
    handleDeletePrimaryLoad,handleDeleteRow, handleAddLoadType, handleLoadTypeSettingChange,
    handleDeleteLoadType, handleAddUlsRow, handleAddSlsRow, 
    handleUlsFactorChange, handleSlsFactorChange,
    handleDragStart, handleDragEnter, handleDrop, handleDragOver,
    getUniqueLoadTypes, selectedCountry, selectedCode, handleCountryChange, handleCodeChange,
    setUlsCases, setSlsCases
  } = useLoadManagement();

  console.log('useLoadManagement output:', {
    primaryLoads, newLoadName, newLoadType, allLoadTypes, loadTypeSettings,
    preDefinedLoadTypes, newLoadTypeName, ulsCases, slsCases,
    startUlsNumber, setStartUlsNumber, startSlsNumber, setStartSlsNumber,
    setNewLoadName, setNewLoadType, setNewLoadTypeName,
    handleAddPrimaryLoad, handlePrimaryLoadNameChange, handlePrimaryLoadTypeChange,
    handleDeletePrimaryLoad,handleDeleteRow, handleAddLoadType, handleLoadTypeSettingChange,
    handleDeleteLoadType, handleAddUlsRow, handleAddSlsRow, 
    handleUlsFactorChange, handleSlsFactorChange,
    handleDragStart, handleDragEnter, handleDrop, handleDragOver,
    getUniqueLoadTypes, selectedCountry, selectedCode, handleCountryChange, handleCodeChange,
    setUlsCases, setSlsCases
  });

  // Use custom hook for core combination logic and export text generation
  const {
    exportText, isCopied, handleCopyToClipboard, generateCombinations
  } = useLoadCombinations(
    primaryLoads, ulsCases, slsCases, loadTypeSettings, startUlsNumber, startSlsNumber
  );

  console.log('handleDeleteRow function:', handleDeleteRow);

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8 font-['Inter']">
      <CodeSelector
        countries={codingStandards}
        selectedCountry={selectedCountry}
        selectedCode={selectedCode}
        onCountryChange={handleCountryChange}
        onCodeChange={handleCodeChange}
      />

      <div className="w-full bg-white p-6 sm:p-8 rounded-2xl shadow-xl flex flex-col lg:flex-row gap-8">
        {/* Left Column: Primary Load Management */}
        <PrimaryLoadManager 
          primaryLoads={primaryLoads}
          newLoadName={newLoadName}
          newLoadType={newLoadType}
          allLoadTypes={allLoadTypes}
          setNewLoadName={setNewLoadName}
          setNewLoadType={setNewLoadType}
          handleAddPrimaryLoad={handleAddPrimaryLoad}
          handlePrimaryLoadNameChange={handlePrimaryLoadNameChange}
          handlePrimaryLoadTypeChange={handlePrimaryLoadTypeChange}
          handleDeletePrimaryLoad={handleDeletePrimaryLoad}
          handleDragStart={handleDragStart}
          handleDragEnter={handleDragEnter}
          handleDrop={handleDrop}
          handleDragOver={handleDragOver}
        />

        {/* Right Column: Load Type Settings */}
        <LoadTypeSettings
          allLoadTypes={allLoadTypes}
          preDefinedLoadTypes={preDefinedLoadTypes}
          loadTypeSettings={loadTypeSettings}
          newLoadTypeName={newLoadTypeName}
          setNewLoadTypeName={setNewLoadTypeName}
          handleAddLoadType={handleAddLoadType}
          handleLoadTypeSettingChange={handleLoadTypeSettingChange}
          handleDeleteLoadType={handleDeleteLoadType}
        />
      </div>

      {primaryLoads.length > 0 && (
        <>
          {/* ULS Table Section */}
          <FactorTable 
            title="ULS Table (Ultimate/Strength Limit State)" 
            cases={ulsCases} 
            onAddRow={handleAddUlsRow} 
            onFactorChange={handleUlsFactorChange}
            startNumber={startUlsNumber}
            onStartNumberChange={setStartUlsNumber}
            getUniqueLoadTypes={getUniqueLoadTypes}
            ulsCases={ulsCases}
            startUlsNumber={startUlsNumber}
            generateCombinations={generateCombinations} // Passed down for SLS min calculation
            handleDeleteRow={(id) => handleDeleteRow(id, false)}
          />

          {/* SLS Table Section */}
          <FactorTable 
            title="SLS Table (Serviceability Limit State)" 
            cases={slsCases} 
            onAddRow={handleAddSlsRow} 
            onFactorChange={handleSlsFactorChange}
            startNumber={startSlsNumber}
            onStartNumberChange={setStartSlsNumber}
            getUniqueLoadTypes={getUniqueLoadTypes}
            ulsCases={ulsCases} // Passed for min start calculation
            startUlsNumber={startUlsNumber} // Passed for min start calculation
            generateCombinations={generateCombinations}
            handleDeleteRow={(id) => handleDeleteRow(id, true)}
          />

          {/* Load Combinations Export Section */}
          <ExportCombinations
            exportText={exportText}
            isCopied={isCopied}
            handleCopyToClipboard={handleCopyToClipboard}
          />
        </>
      )}
    </div>
  );
};

export default App;

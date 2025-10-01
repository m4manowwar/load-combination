import React from 'react';

const CodeSelector = ({
  countries,
  selectedCountry,
  selectedCode,
  onCountryChange,
  onCodeChange,
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md mb-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Select Country and Code(Implement Soon)</h2>
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Country Selector */}
        <div className="flex-1">
          <label htmlFor="country" className="block text-sm font-medium text-gray-600 mb-2">
            Country
          </label>
          <select
            id="country"
            value={selectedCountry}
            onChange={(e) => onCountryChange(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select a Country</option>
            {Object.keys(countries).map((countryCode) => (
              <option key={countryCode} value={countryCode}>
                {countryCode}
              </option>
            ))}
          </select>
        </div>

        {/* Code Selector */}
        <div className="flex-1">
          <label htmlFor="code" className="block text-sm font-medium text-gray-600 mb-2">
            Code
          </label>
          <select
            id="code"
            value={selectedCode}
            onChange={(e) => onCodeChange(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!selectedCountry}
          >
            <option value="">Select a Code</option>
            {selectedCountry &&
              Object.entries(countries[selectedCountry].codes).map(([codeKey, codeData]) => (
                <option key={codeKey} value={codeKey}>
                  {codeData.name}
                </option>
              ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default CodeSelector;
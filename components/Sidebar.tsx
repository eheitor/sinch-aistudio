import React from 'react';
import { Settings, Play, Bug, Database } from 'lucide-react';

interface SidebarProps {
  apiKey: string;
  setApiKey: (val: string) => void;
  botId: string;
  setBotId: (val: string) => void;
  startTime: string;
  setStartTime: (val: string) => void;
  endTime: string;
  setEndTime: (val: string) => void;
  minDate: string; // Add constraint
  maxDate: string; // Add constraint
  onLoad: () => void;
  onDebug: () => void;
  onViewTable: () => void; // New handler
  isLoading: boolean;
  hasData: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  apiKey,
  setApiKey,
  botId,
  setBotId,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  minDate,
  maxDate,
  onLoad,
  onDebug,
  onViewTable,
  isLoading,
  hasData
}) => {
  return (
    <div className="w-full md:w-80 bg-white border-r border-gray-200 p-6 flex-shrink-0 flex flex-col h-auto md:h-screen sticky top-0 overflow-y-auto">
      <div className="mb-8">
        <img 
          src="https://logotyp.us/file/sinch.svg" 
          alt="Sinch Logo" 
          className="h-10 w-auto mb-2"
        />
        <h1 className="text-xl font-bold text-gray-800">Payments Reminders</h1>
        <p className="text-sm text-gray-500">Dashboard Analytics</p>
      </div>

      <div className="space-y-5 flex-1">
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bot ID</label>
          <input
            type="text"
            value={botId}
            onChange={(e) => setBotId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
            placeholder="e.g., m98j39nl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
          <div className="relative">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition pr-8"
              placeholder="CHATLAYER_API_KEY"
            />
            <Settings className="absolute right-2 top-2.5 h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
          <input
            type="datetime-local"
            value={startTime}
            min={minDate}
            max={maxDate}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
          {minDate && <p className="text-xs text-gray-400 mt-1">Available from: {new Date(minDate).toLocaleString()}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
          <input
            type="datetime-local"
            value={endTime}
            min={minDate}
            max={maxDate}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
          />
        </div>

        <button
          onClick={onLoad}
          disabled={isLoading || !apiKey || !botId}
          className={`w-full flex items-center justify-center py-2.5 px-4 rounded-md text-white font-medium transition-colors shadow-sm
            ${isLoading || !apiKey || !botId 
              ? 'bg-indigo-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'}`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Load Dashboard
            </>
          )}
        </button>

        {hasData && (
          <div className="space-y-2">
            <button
              onClick={onDebug}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-md text-gray-700 bg-white border border-gray-300 font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Bug className="h-4 w-4 mr-2" />
              View Debug Log
            </button>
            <button
              onClick={onViewTable}
              className="w-full flex items-center justify-center py-2.5 px-4 rounded-md text-gray-700 bg-white border border-gray-300 font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              <Database className="h-4 w-4 mr-2" />
              View Table Data
            </button>
          </div>
        )}
      </div>
      
      <div className="mt-auto pt-6 text-xs text-gray-400 text-center">
        Powered by Chatlayer Analytics
      </div>
    </div>
  );
};

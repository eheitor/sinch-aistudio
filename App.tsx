import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Sidebar } from './components/Sidebar';
import { DashboardStats } from './components/DashboardStats';
import { fetchChatlayerEvents } from './services/chatlayerService';
import { initDatabase, clearDatabase, insertEventsToBigQuery, queryEventsFromBigQuery, getAllTableData } from './services/bigQueryService';
import { ChatlayerEvent } from './types';

// Time helper: Format date object to local datetime-local string (YYYY-MM-DDTHH:mm)
const toLocalIsoString = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return (new Date(date.getTime() - offset)).toISOString().slice(0, 16);
};

// Calculate 7 days ago at 00:00
const getApiStartDate = () => {
  const d = new Date();
  d.setDate(d.getDate() - 7);
  d.setHours(0, 0, 0, 0);
  return d;
};

// Default User view: Last 2 days
const getDefaultUserStart = () => {
  const d = new Date();
  d.setDate(d.getDate() - 2); 
  d.setHours(0, 0, 0, 0);
  return toLocalIsoString(d);
};

const getCurrentTime = () => {
  return toLocalIsoString(new Date());
};

export default function App() {
  const [apiKey, setApiKey] = useState<string>('');
  const [botId, setBotId] = useState<string>('m98j39nl');
  
  // User selected range (for Dashboard Query)
  const [startTime, setStartTime] = useState<string>(getDefaultUserStart());
  const [endTime, setEndTime] = useState<string>(getCurrentTime());
  
  // Boundaries for the UI inputs based on API fetch
  const [minDate, setMinDate] = useState<string>('');
  const [maxDate, setMaxDate] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(false);
  const [events, setEvents] = useState<ChatlayerEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDataCached, setIsDataCached] = useState<boolean>(false);
  
  // Store details about the last API request for Debugging
  const [debugRequestInfo, setDebugRequestInfo] = useState<any>(null);

  // Initialize SQL Database on mount
  useEffect(() => {
    initDatabase();
  }, []);

  const handleLoad = async () => {
    setLoading(true);
    setError(null);
    
    try {
      if (!isDataCached) {
        // --- First Load Logic ---
        
        // 1. Calculate the 7-day window for API
        const apiStartObj = getApiStartDate();
        const apiEndObj = new Date(); // Now
        
        const apiStartStr = toLocalIsoString(apiStartObj);
        const apiEndStr = toLocalIsoString(apiEndObj);

        // Capture request info for debug
        setDebugRequestInfo({
            request_timestamp: new Date().toISOString(),
            endpoint_base: `https://analytics.api.chatlayer.ai/v1/bots/${botId}/events/stream`,
            parameters_used: {
                bot_id: botId,
                version: 'DRAFT',
                start_time_local: apiStartStr,
                start_time_iso: new Date(apiStartStr).toISOString(),
                end_time_local: apiEndStr,
                end_time_iso: new Date(apiEndStr).toISOString()
            }
        });

        // 2. Fetch from API
        const response = await fetchChatlayerEvents({
          apiKey,
          botId,
          startTime: apiStartStr,
          endTime: apiEndStr
        });

        // 3. Store in SQL (BigQuery simulation)
        clearDatabase(); // Clear old data if any
        if (response.events && response.events.length > 0) {
          insertEventsToBigQuery(response.events);
        }

        // 4. Update Cache State and Constraints
        setIsDataCached(true);
        setMinDate(apiStartStr);
        setMaxDate(apiEndStr);

        // Ensure user selection is within bounds (if they picked something outside the 7 days before loading)
        if (startTime < apiStartStr) setStartTime(apiStartStr);
        if (endTime > apiEndStr) setEndTime(apiEndStr);
      }

      // --- Query Logic (Always runs, utilizing SQL table) ---
      
      const userStartIso = new Date(startTime).toISOString();
      const userEndIso = new Date(endTime).toISOString();

      const filteredEvents = queryEventsFromBigQuery(userStartIso, userEndIso);
      setEvents(filteredEvents);

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An unexpected error occurred');
      setEvents([]);
      setIsDataCached(false); // Reset cache on error so user can try again
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = () => {
    if (events.length === 0) return;
    
    // Include request info in the debug log
    const debugData = {
        last_api_request: debugRequestInfo,
        filtered_view_range: {
            start: startTime,
            end: endTime
        },
        events_count: events.length,
        events: events
    };

    const jsonString = JSON.stringify(debugData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  const handleViewTable = () => {
    const tableData = getAllTableData();
    
    if (tableData.length === 0) {
      alert("No data in table to view.");
      return;
    }

    // Process data: 
    // 1. Use raw_json directly (no flattening).
    // 2. Stringify 'attributes' and other objects so they export correctly to Excel as text.
    const displayData = tableData.map((row: any) => {
      const item = { ...row.raw_json };
      
      // Convert objects to formatted JSON strings
      Object.keys(item).forEach(key => {
          if (item[key] && typeof item[key] === 'object') {
              item[key] = JSON.stringify(item[key], null, 2);
          }
      });
      
      return item;
    });

    // Get all unique keys for headers dynamically
    const allKeys = Array.from(new Set(displayData.flatMap((obj: any) => Object.keys(obj)))) as string[];
    
    // Define a priority order for standard columns, others go to the end
    const priorityKeys = ['id', 'timestamp', 'event', 'conversation_id', 'user_id', 'attributes', 'bot_id', 'version', 'channel_type', 'channel_id'];
    const sortedKeys = allKeys.sort((a, b) => {
      const idxA = priorityKeys.indexOf(a);
      const idxB = priorityKeys.indexOf(b);
      // If both are priority keys, sort by index
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      // If only A is priority, it comes first
      if (idxA !== -1) return -1;
      // If only B is priority, it comes first
      if (idxB !== -1) return 1;
      // Otherwise alphabetical
      return a.localeCompare(b);
    });

    // Generate HTML Page content with improved formatting
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Full Events Data</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <!-- Scripts for Excel Export -->
        <script src="https://cdn.jsdelivr.net/npm/alasql@1.7.3/dist/alasql.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>
        <style>
          /* Custom scrollbar for table container */
          .table-container {
            max-height: 85vh;
            overflow: auto;
          }
          /* Sticky Header */
          thead th {
            position: sticky;
            top: 0;
            z-index: 10;
          }
          /* Preformatted text for JSON objects */
          .json-cell {
            font-family: monospace;
            white-space: pre-wrap;
            font-size: 0.75rem;
            max-width: 300px;
            color: #4b5563;
          }
        </style>
      </head>
      <body class="bg-gray-100 min-h-screen p-4 md:p-8 font-sans">
        <div class="max-w-[95%] mx-auto bg-white shadow-2xl rounded-xl overflow-hidden flex flex-col h-[90vh]">
          <div class="bg-gray-900 p-6 flex justify-between items-center shrink-0">
            <div>
              <h1 class="text-2xl font-bold text-white tracking-tight">Full Events Data</h1>
              <p class="text-gray-400 text-sm mt-1">Total Records: ${displayData.length}</p>
            </div>
            <button onclick="exportToExcel()" class="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 px-6 rounded-lg transition duration-200 flex items-center shadow-lg group">
              <svg class="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
              Export to Excel
            </button>
          </div>
          
          <div class="table-container flex-1 w-full">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50 shadow-sm">
                <tr>
                  ${sortedKeys.map(key => 
                    `<th class="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 border-b border-gray-200 whitespace-nowrap">
                      ${key}
                    </th>`
                  ).join('')}
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                ${displayData.map(row => `
                  <tr class="hover:bg-blue-50 transition-colors">
                    ${sortedKeys.map(key => {
                      const val = row[key];
                      let displayVal = '-';
                      let isJsonData = false;
                      
                      if (val !== undefined && val !== null) {
                        displayVal = String(val);
                        // Check if it looks like a JSON object string (starts with { or [) or is specifically the attributes column
                        if (key === 'attributes' || displayVal.trim().startsWith('{') || displayVal.trim().startsWith('[')) {
                           isJsonData = true;
                        }
                      } else {
                        displayVal = '<span class="text-gray-300">-</span>';
                      }
                      
                      const cellContent = isJsonData 
                        ? `<div class="json-cell">${displayVal}</div>` 
                        : displayVal;
                      
                      return `<td class="px-6 py-3 whitespace-nowrap text-sm text-gray-700 border-b border-gray-100 align-top">
                        ${cellContent}
                      </td>`;
                    }).join('')}
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <script>
          // Embed the data directly into the script
          // Data is already stringified for complex objects, so alasql will export text.
          const data = ${JSON.stringify(displayData)};

          function exportToExcel() {
            // Use AlaSQL to export the data to Excel
            alasql('SELECT * INTO XLSX("chatlayer_events_full_export.xlsx", {headers:true}) FROM ?', [data]);
          }
        </script>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank');
  };

  return (
    <Layout>
      <Sidebar 
        apiKey={apiKey}
        setApiKey={setApiKey}
        botId={botId}
        setBotId={setBotId}
        startTime={startTime}
        setStartTime={setStartTime}
        endTime={endTime}
        setEndTime={setEndTime}
        minDate={minDate}
        maxDate={maxDate}
        onLoad={handleLoad}
        onDebug={handleDebug}
        onViewTable={handleViewTable}
        isLoading={loading}
        hasData={isDataCached}
      />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-gray-50 relative">
        <header className="bg-white border-b border-gray-200 p-6 md:hidden">
            <h1 className="text-xl font-bold text-gray-800">Payments Reminders</h1>
        </header>

        {error && (
          <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-start">
            <span className="font-bold mr-2">Error:</span> {error}
          </div>
        )}

        {events.length > 0 || isDataCached ? (
          <DashboardStats events={events} />
        ) : (
          !loading && (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
               <img src="https://logotyp.us/file/sinch.svg" className="h-20 w-auto opacity-20 mb-6 grayscale" alt="Background Logo" />
               <p className="text-xl font-medium">Welcome to the Dashboard</p>
               <p className="mt-2 text-center max-w-md">Enter your Chatlayer API credentials. The system will load the last 7 days of data into a temporary SQL table for analysis.</p>
            </div>
          )
        )}
      </main>
    </Layout>
  );
}
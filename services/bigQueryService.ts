import alasql from 'alasql';
import { ChatlayerEvent } from '../types';

// Initialize the database structure
export const initDatabase = () => {
  alasql('CREATE TABLE IF NOT EXISTS temp_events (id STRING, conversation_id STRING, user_id STRING, event STRING, flow STRING, timestamp DATETIME, raw_json OBJECT)');
};

// Reset table
export const clearDatabase = () => {
  alasql('DELETE FROM temp_events');
};

// Insert raw events into the SQL table
export const insertEventsToBigQuery = (events: ChatlayerEvent[]) => {
  const formattedData = events.map(e => ({
    id: e.id,
    conversation_id: e.conversation_id,
    user_id: e.user_id,
    event: e.event,
    flow: e.attributes?.flow || 'Unknown',
    timestamp: e.timestamp,
    raw_json: e
  }));
  
  alasql('INSERT INTO temp_events SELECT * FROM ?', [formattedData]);
};

// Query the table based on date range using SQL
export const queryEventsFromBigQuery = (startTime: string, endTime: string): ChatlayerEvent[] => {
  // SQL Query to filter by timestamp string comparison (ISO strings work well for this)
  // Fix: Cast result to any[] because alasql returns unknown
  const results = alasql(
    `SELECT raw_json FROM temp_events WHERE timestamp >= "${startTime}" AND timestamp <= "${endTime}" ORDER BY timestamp ASC`
  ) as any[];

  // Map back to the original structure expected by the frontend
  return results.map((r: any) => r.raw_json);
};

// Get all data for debugging/viewing the table
export const getAllTableData = () => {
  // Fix: Cast result to any[] because alasql returns unknown
  return alasql('SELECT * FROM temp_events') as any[];
};
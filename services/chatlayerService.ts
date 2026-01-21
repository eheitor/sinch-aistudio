import { ChatlayerResponse, ChatlayerEvent } from '../types';

interface FetchParams {
  botId: string;
  apiKey: string;
  startTime: string;
  endTime: string;
}

export const fetchChatlayerEvents = async ({
  botId,
  apiKey,
  startTime,
  endTime,
}: FetchParams): Promise<ChatlayerResponse> => {
  // Convert local datetime inputs to ISO strings if they aren't already
  // The input type="datetime-local" returns YYYY-MM-DDTHH:mm
  // We need to ensure it's ISO 8601 with Z or offset. Assuming user inputs local time, we convert to UTC.
  
  const startIso = new Date(startTime).toISOString();
  const endIso = new Date(endTime).toISOString();

  const baseUrl = `https://analytics.api.chatlayer.ai/v1/bots/${botId}/events/stream`;
  
  let allEvents: ChatlayerEvent[] = [];
  let nextPageToken: string | undefined = undefined;

  do {
    const params = new URLSearchParams({
      version: 'DRAFT', // Defaulting to DRAFT as per example, could be parameterized
      start_time: startIso,
      end_time: endIso,
      page_size: '100', // Default page size
    });

    if (nextPageToken) {
      params.append('page_token', nextPageToken);
    }

    const url = `${baseUrl}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data: ChatlayerResponse = await response.json();
    
    if (data.events && Array.isArray(data.events)) {
      allEvents = allEvents.concat(data.events);
    }
    
    nextPageToken = data.next_page_token;

  } while (nextPageToken);

  // Return accumulated events and undefined token as we fetched everything
  return { events: allEvents };
};
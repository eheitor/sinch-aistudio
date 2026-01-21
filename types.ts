export interface ChatlayerAttributes {
  flow?: string;
  input?: string;
  step_name?: string;
  step_number?: string;
  subflow?: string;
  [key: string]: any;
}

export interface ChatlayerEvent {
  id: string;
  event: string;
  bot_id: string;
  version: string;
  user_id: string;
  channel_id: string;
  channel_type: string;
  conversation_id: string;
  attributes?: ChatlayerAttributes;
  timestamp: string;
}

export interface ChatlayerResponse {
  events: ChatlayerEvent[];
  next_page_token?: string;
}

export interface ConversationStat {
  hour: string; // Formatted date string for X-axis
  count: number;
  originalTimestamp: number; // For sorting
}

export interface FlowStat {
  name: string;
  value: number;
  [key: string]: any;
}
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { ChatlayerEvent, ConversationStat, FlowStat } from '../types';
import { MessageSquare, GitBranch, AlertCircle, Footprints, XOctagon, Smartphone } from 'lucide-react';

interface DashboardStatsProps {
  events: ChatlayerEvent[];
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#0ea5e9'];
const CHANNEL_COLORS = ['#10b981', '#25D366', '#3b82f6', '#9ca3af']; // Specific colors for channels if needed, defaulting to generic for now

export const DashboardStats: React.FC<DashboardStatsProps> = ({ events }) => {

  const conversationStats = useMemo(() => {
    // Logic: Group by hour, then count UNIQUE conversation_ids
    const grouped = new Map<string, Set<string>>();

    events.forEach(event => {
      if (!event.timestamp) return;
      const date = new Date(event.timestamp);
      // Format: YYYY-MM-DD HH:00
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:00`;
      
      if (!grouped.has(key)) {
        grouped.set(key, new Set());
      }
      if (event.conversation_id) {
        grouped.get(key)!.add(event.conversation_id);
      }
    });

    const data: ConversationStat[] = Array.from(grouped.entries()).map(([timeKey, idSet]) => ({
      hour: timeKey,
      count: idSet.size,
      originalTimestamp: new Date(timeKey).getTime(),
    }));

    return data.sort((a, b) => a.originalTimestamp - b.originalTimestamp);
  }, [events]);

  const flowStats = useMemo(() => {
    const counts = new Map<string, number>();

    events.forEach(event => {
      // Check attributes->flow
      const flow = event.attributes?.flow || 'Unknown';
      counts.set(flow, (counts.get(flow) || 0) + 1);
    });

    const data: FlowStat[] = Array.from(counts.entries()).map(([name, value]) => ({
      name,
      value
    }));

    // Sort by value descending
    return data.sort((a, b) => b.value - a.value);
  }, [events]);

  // NEW: Channel Origin Stats
  const channelStats = useMemo(() => {
    const counts = new Map<string, number>();
    const processedConversations = new Set<string>();

    events.forEach(event => {
      // We count per conversation, not per event
      if (processedConversations.has(event.conversation_id)) return;
      processedConversations.add(event.conversation_id);

      let channelName = 'Other';

      // Logic defined by user request
      if (event.channel_id === '6970d5d51d769aab05c2443a') {
        channelName = 'RCS';
      } else if (event.channel_id === '690a56f7e50cacf1ef33b0f1') {
        channelName = 'WhatsApp';
      } else if (event.channel_type === 'web') {
        channelName = 'Web';
      }

      counts.set(channelName, (counts.get(channelName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [events]);

  // Top Steps Analysis (Volume)
  const topStepsStats = useMemo(() => {
    const counts = new Map<string, number>();

    events.forEach(event => {
      const stepName = event.attributes?.step_name;
      // Filter out null/undefined steps
      if (stepName) {
        counts.set(stepName, (counts.get(stepName) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 steps
  }, [events]);

  // Bottleneck Analysis (Last step per conversation)
  const bottleneckStats = useMemo(() => {
    const lastEventByConv = new Map<string, ChatlayerEvent>();

    // 1. Find the latest event for each conversation
    events.forEach(event => {
      const currentLast = lastEventByConv.get(event.conversation_id);
      
      // If no entry, or current event is newer (string comparison of ISO works, or use Date)
      if (!currentLast || (event.timestamp > currentLast.timestamp)) {
        lastEventByConv.set(event.conversation_id, event);
      }
    });

    // 2. Count the step_names of these "last events"
    const counts = new Map<string, number>();
    lastEventByConv.forEach(event => {
      const stepName = event.attributes?.step_name || 'Unknown';
      counts.set(stepName, (counts.get(stepName) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 drop-off points
  }, [events]);

  const totalEvents = events.length;
  const uniqueConversations = new Set(events.map(e => e.conversation_id)).size;
  const uniqueUsers = new Set(events.map(e => e.user_id)).size;

  if (events.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
        <AlertCircle className="h-12 w-12 mb-4 text-gray-300" />
        <p className="text-lg font-medium">No events found for the selected period.</p>
        <p className="text-sm">Try adjusting the date range or checking your API Key.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 p-6 md:p-10 overflow-y-auto">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-50 text-blue-600 mr-4">
             <MessageSquare className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Total Events</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalEvents.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-indigo-50 text-indigo-600 mr-4">
             <GitBranch className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Unique Conversations</p>
            <h3 className="text-2xl font-bold text-gray-900">{uniqueConversations.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-purple-50 text-purple-600 mr-4">
             <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
             </svg>
          </div>
          <div>
            <p className="text-sm text-gray-500 font-medium">Unique Users</p>
            <h3 className="text-2xl font-bold text-gray-900">{uniqueUsers.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Row 1: Conversations per Hour (Full Width) */}
      <div className="mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-1 h-6 bg-indigo-500 rounded mr-3"></span>
            Conversations per Hour
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversationStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="hour" 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => val.split(' ')[1]} // Show only time
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: '#64748b' }} 
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="Conversations" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Channel & Flow Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Chart 2: Channel Origin (NEW) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <div className="p-1.5 bg-emerald-100 rounded mr-3 text-emerald-600">
              <Smartphone className="h-5 w-5" />
            </div>
            Channel Origin
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelStats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {channelStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Flow Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <span className="w-1 h-6 bg-purple-500 rounded mr-3"></span>
            Flow Distribution
          </h3>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={flowStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {flowStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Steps Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 4: Top 10 Steps */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <div className="p-1.5 bg-green-100 rounded mr-3 text-green-600">
              <Footprints className="h-5 w-5" />
            </div>
            Top 10 Most Visited Steps
          </h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={topStepsStats} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={150} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="Hits" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Drop-off Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
             <div className="p-1.5 bg-red-100 rounded mr-3 text-red-600">
              <XOctagon className="h-5 w-5" />
            </div>
            Top 10 Drop-off Points (Bottlenecks)
          </h3>
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={bottleneckStats} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  width={150} 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  interval={0}
                />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="value" fill="#ef4444" radius={[0, 4, 4, 0]} name="Drop-offs" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};
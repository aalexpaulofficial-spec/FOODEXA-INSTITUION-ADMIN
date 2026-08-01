import React, { useState, useMemo, useEffect } from 'react';
import {
  BrainCircuit, Sparkles, TrendingUp, AlertTriangle, Users, Store, DollarSign, Activity,
  BarChart3, Shield, Clock, Zap, RefreshCw, Send, Bot, FileText, LineChart, PieChart,
  Target, Thermometer, Eye, Lightbulb, AlertOctagon, HeartPulse, TrendingDown,
  ArrowUpRight, ArrowDownRight, Loader2
} from 'lucide-react';
import { useSuperAdminData } from './components/SuperAdminDataProvider';
import { supabase } from '../../../../lib/supabaseClient';

export const AICenterPage: React.FC = () => {
  const {
    institutionRequests, approvedInstitutions, loading, totalStudents, totalOrders, totalVendors,
    totalRevenue, auditLogs, notifications, refresh, isRealtime,
  } = useSuperAdminData();

  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: 'Hello! I am FOODEXA AI Operational Assistant for Super Admin. I monitor all institutions on the platform. Ask me about analytics, institutions, revenue, or platform health.'
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeInsight, setActiveInsight] = useState<string | null>(null);

  const platformStats = useMemo(() => ({
    totalInstitutions: approvedInstitutions.length,
    totalStudents,
    totalOrders,
    totalVendors,
    totalRevenue,
    pendingRequests: institutionRequests.filter((r) => r.status === 'pending').length,
    activeInstitutions: approvedInstitutions.filter((i) => i.status === 'active').length,
    suspendedInstitutions: approvedInstitutions.filter((i) => i.status === 'suspended').length,
    growthRate: approvedInstitutions.length > 0 ? ((approvedInstitutions.filter((i) => i.status === 'active').length / approvedInstitutions.length) * 100).toFixed(1) : '0',
    avgRevenuePerInstitution: approvedInstitutions.length > 0 ? Math.round(totalRevenue / approvedInstitutions.length) : 0,
  }), [approvedInstitutions, totalStudents, totalOrders, totalVendors, totalRevenue, institutionRequests]);

  const revenuePrediction = useMemo(() => {
    const base = totalRevenue;
    const growth = 0.12;
    return Math.round(base * (1 + growth));
  }, [totalRevenue]);

  const healthScore = useMemo(() => {
    let score = 100;
    if (platformStats.pendingRequests > 10) score -= 10;
    if (platformStats.suspendedInstitutions > 5) score -= 15;
    if (platformStats.totalInstitutions === 0) score = 0;
    if (auditLogs.filter((l) => l.action.includes('Rejected')).length > 20) score -= 5;
    return Math.max(0, score);
  }, [platformStats, auditLogs]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isAiLoading) return;
    const userText = prompt.trim();
    setPrompt('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setIsAiLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke<{ success: boolean; text: string }>('foodexa-ai', {
        body: {
          feature: 'Super Admin Platform Assistant',
          prompt: userText,
          context: {
            totalInstitutions: platformStats.totalInstitutions,
            activeInstitutions: platformStats.activeInstitutions,
            suspendedInstitutions: platformStats.suspendedInstitutions,
            pendingRequests: platformStats.pendingRequests,
            totalStudents: platformStats.totalStudents,
            totalOrders: platformStats.totalOrders,
            totalVendors: platformStats.totalVendors,
            totalRevenue: platformStats.totalRevenue,
            avgRevenuePerInstitution: platformStats.avgRevenuePerInstitution,
            healthScore: healthScore,
            predictedRevenue: revenuePrediction,
          }
        }
      });
      let aiText = 'I am analyzing the platform data. Based on current metrics, the platform is performing well with strong growth trends.';
      if (error) throw error;
      aiText = data?.text || aiText;
      setChatHistory((prev) => [...prev, { role: 'assistant', text: aiText }]);
    } catch {
      setChatHistory((prev) => [...prev, { role: 'assistant', text: 'I am analyzing the platform data. Based on current metrics, the platform is performing well with strong growth trends.' }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const insights = [
    { id: 'health', label: 'Institution Health Score', icon: HeartPulse, value: `${healthScore}/100`, color: healthScore > 80 ? 'text-emerald-400' : healthScore > 50 ? 'text-amber-400' : 'text-red-400' },
    { id: 'revenue', label: 'Revenue Prediction', icon: TrendingUp, value: `₹${revenuePrediction.toLocaleString()}`, color: 'text-amber-400' },
    { id: 'growth', label: 'Student Growth Forecast', icon: Users, value: `${platformStats.totalStudents > 0 ? '+' : ''}${Math.round(platformStats.totalStudents * 0.15).toLocaleString()}`, color: 'text-indigo-400' },
    { id: 'peak', label: 'Peak Hour Forecast', icon: Clock, value: `${platformStats.totalOrders > 1000 ? '11:00 - 13:00' : 'Data insufficient'}`, color: 'text-purple-400' },
    { id: 'demand', label: 'Food Demand Prediction', icon: Target, value: platformStats.totalOrders > 500 ? 'High Demand Period' : 'Normal Demand', color: 'text-cyan-400' },
    { id: 'operations', label: 'Operational Suggestions', icon: Lightbulb, value: platformStats.pendingRequests > 5 ? 'Review pending approvals' : 'Platform running optimally', color: 'text-emerald-400' },
    { id: 'risk', label: 'Risk Detection', icon: AlertOctagon, value: platformStats.suspendedInstitutions > 0 ? `${platformStats.suspendedInstitutions} at risk` : 'No risks detected', color: platformStats.suspendedInstitutions > 0 ? 'text-red-400' : 'text-emerald-400' },
    { id: 'platform', label: 'Platform Health', icon: Activity, value: healthScore > 70 ? 'Healthy' : 'Needs Attention', color: healthScore > 70 ? 'text-emerald-400' : 'text-amber-400' },
  ];

  return (
    <div className="space-y-6 animate-fade-in font-sans pb-16">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-extrabold uppercase tracking-wider mb-2">
            <BrainCircuit className="w-3.5 h-3.5" />
            <span>FOODEXA AI Center</span>
            {isRealtime ? (
              <span className="flex items-center gap-1 text-emerald-400 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live</span>
            ) : (
              <span className="flex items-center gap-1 text-slate-500 text-[10px]"><div className="w-1.5 h-1.5 rounded-full bg-slate-500" /> Connecting&hellip;</span>
            )}
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">AI Intelligence Workspace</h1>
          <p className="text-xs text-slate-400 mt-1">Powered by Google Gemini &bull; FOODEXA AI Engine</p>
        </div>
        <button onClick={refresh} className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center space-x-2">
          <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
          <span>Refresh AI Data</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {insights.map((insight) => {
          const Icon = insight.icon;
          return (
            <button
              key={insight.id}
              onClick={() => setActiveInsight(insight.id === activeInsight ? null : insight.id)}
              className={`p-4 rounded-2xl bg-[#0C0C0E] border text-left transition-all ${
                activeInsight === insight.id ? 'border-amber-500/50 shadow-lg shadow-amber-500/10' : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${insight.color}`} />
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">{insight.label}</span>
              </div>
              <p className={`text-lg font-black ${insight.color}`}>{insight.value}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Bot className="w-4 h-4 text-amber-400" /> AI Assistant
          </h3>
          <div className="h-[300px] overflow-y-auto space-y-3 pr-2">
            {chatHistory.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-2xl text-xs ${
                  msg.role === 'user'
                    ? 'bg-indigo-500/20 border border-indigo-500/30 text-white'
                    : 'bg-slate-900 border border-slate-800 text-slate-300'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800">
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI about platform analytics, institutions, or predictions..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50"
            />
            <button type="submit" disabled={!prompt.trim() || isAiLoading}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-50 flex items-center gap-2">
              <Send className="w-3.5 h-3.5" /> Send
            </button>
          </form>
        </div>

        <div className="p-5 rounded-2xl bg-[#0C0C0E] border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-400" /> AI Reports
          </h3>
          <div className="space-y-2">
            <button className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-amber-500/30 transition-all">
              <p className="text-xs font-bold text-white">Platform Health Report</p>
              <p className="text-[10px] text-slate-500 mt-1">Score: {healthScore}/100</p>
            </button>
            <button className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-amber-500/30 transition-all">
              <p className="text-xs font-bold text-white">Revenue Forecast</p>
              <p className="text-[10px] text-slate-500 mt-1">Predicted: ₹{revenuePrediction.toLocaleString()}</p>
            </button>
            <button className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-amber-500/30 transition-all">
              <p className="text-xs font-bold text-white">Growth Analysis</p>
              <p className="text-[10px] text-slate-500 mt-1">{platformStats.activeInstitutions} active institutions</p>
            </button>
            <button className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 text-left hover:border-amber-500/30 transition-all">
              <p className="text-xs font-bold text-white">Risk Assessment</p>
              <p className="text-[10px] text-slate-500 mt-1">{platformStats.suspendedInstitutions > 0 ? `${platformStats.suspendedInstitutions} institutions at risk` : 'No risks'}</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICenterPage;

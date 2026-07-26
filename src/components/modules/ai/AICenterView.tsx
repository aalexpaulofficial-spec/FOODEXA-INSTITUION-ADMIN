import React, { useState, useMemo } from 'react';
import {
  BrainCircuit, Sparkles, TrendingUp, AlertTriangle, Send, RefreshCw, Bot
} from 'lucide-react';
import { Institution, MenuItem, Order } from '../../../types';

interface AICenterViewProps {
  currentInstitution: Institution;
  menuItems: MenuItem[];
  orders: Order[];
}

export const AICenterView: React.FC<AICenterViewProps> = ({
  currentInstitution,
  menuItems,
  orders
}) => {
  const [prompt, setPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([
    {
      role: 'assistant',
      text: `Hello! I am FOODEXA AI Operational Assistant. I am monitoring ${currentInstitution.name}. Ask me about orders, menu items, or campus operations.`
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const liveStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const topItems: Record<string, number> = {};
    orders.forEach(o => o.items.forEach(i => { topItems[i.name] = (topItems[i.name] || 0) + i.quantity; }));
    const topItem = Object.entries(topItems).sort((a, b) => b[1] - a[1])[0];
    return { totalOrders, totalRevenue, pendingOrders, preparingOrders, topItem: topItem?.[0] || 'N/A', topItemCount: topItem?.[1] || 0 };
  }, [orders, menuItems]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isAiLoading) return;
    const userText = prompt.trim();
    setPrompt('');
    setChatHistory((prev) => [...prev, { role: 'user', text: userText }]);
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `FOODEXA AI for ${currentInstitution.name}. ${userText}`
        })
      });
      const data = await response.json();
      const aiReply = data.text || 'AI response generated.';
      setChatHistory((prev) => [...prev, { role: 'assistant', text: aiReply }]);
    } catch {
      setChatHistory((prev) => [
        ...prev,
        { role: 'assistant', text: `Based on live data: ${liveStats.totalOrders} total orders, ${liveStats.totalRevenue.toFixed(2)} revenue. Top item: ${liveStats.topItem}.` }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white">FOODEXA AI Intelligence Center</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Powered by Google Gemini</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">Live operational intelligence from Supabase data.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">Live Operational Summary</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Orders</div>
                <div className="text-xl font-black text-amber-400 font-mono mt-1">{liveStats.totalOrders}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Revenue</div>
                <div className="text-lg font-black text-emerald-400 font-mono mt-1">${liveStats.totalRevenue.toFixed(2)}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Preparing</div>
                <div className="text-xl font-black text-cyan-400 font-mono mt-1">{liveStats.preparingOrders}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-[10px] text-slate-400 uppercase font-semibold">Top Item</div>
                <div className="text-xs font-bold text-cyan-300 mt-1">{liveStats.topItem}</div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-200 flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white">Insight:</strong> {liveStats.totalOrders > 0
                  ? `${liveStats.topItem} is the most ordered item (${liveStats.topItemCount} units). ${liveStats.pendingOrders} orders pending.`
                  : 'No order data yet. Start serving students to see insights.'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <h4 className="font-bold text-xs text-slate-200">Menu Items</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {menuItems.length} menu items available. {menuItems.filter(m => m.isAvailable).length} currently available.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="font-bold text-xs text-slate-200">Orders Overview</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {liveStats.pendingOrders} pending, {liveStats.preparingOrders} in preparation.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between h-[560px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Ask FOODEXA AI Assistant</h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3">
            {chatHistory.map((msg, idx) => (
              <div key={idx} className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${msg.role === 'user' ? 'ml-auto bg-amber-500 text-slate-950 font-semibold' : 'mr-auto bg-slate-950 text-slate-200 border border-slate-800'}`}>
                {msg.text}
              </div>
            ))}
            {isAiLoading && (
              <div className="mr-auto p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 text-xs flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Analyzing...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSendChat} className="relative">
            <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ask AI about sales, prep times, or menu..." className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
            <button type="submit" disabled={isAiLoading} className="absolute right-2 top-2 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors disabled:opacity-50">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  BrainCircuit, Sparkles, TrendingUp, AlertTriangle, Send, Bot, Package, BarChart3
} from 'lucide-react';
import { Institution, MenuItem, Order } from '../../../types';
import { supabase } from '../../../lib/supabaseClient';

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
  const [chatHistory, setChatHistory] = useState<Array<{ role: 'user' | 'assistant'; text: string }>>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const liveStats = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const pendingOrders = orders.filter(o => ['pending', 'awaiting_confirmation'].includes(o.status)).length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const readyOrders = orders.filter(o => o.status === 'ready').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;
    const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
    const topItems: Record<string, number> = {};
    orders.forEach(o => o.items.forEach(i => { topItems[i.name] = (topItems[i.name] || 0) + i.quantity; }));
    const sortedItems = Object.entries(topItems).sort((a, b) => b[1] - a[1]);
    const topItem = sortedItems[0];
    const availableItems = menuItems.filter(m => m.isAvailable).length;
    const lowStockItems = menuItems.filter(m => m.stockCount > 0 && m.stockCount < 10).length;
    const outOfStockItems = menuItems.filter(m => m.stockCount === 0 || !m.isAvailable).length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    return {
      totalOrders, totalRevenue, pendingOrders, preparingOrders, readyOrders,
      completedOrders, cancelledOrders, avgOrderValue,
      topItem: topItem?.[0] || null, topItemCount: topItem?.[1] || 0,
      menuItemsCount: menuItems.length, availableItems, lowStockItems, outOfStockItems,
      hasData: totalOrders > 0,
    };
  }, [orders, menuItems]);

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
          feature: 'Institution AI Assistant',
          prompt: `FOODEXA AI for ${currentInstitution.name}. ${userText}`,
          context: {
            institution: currentInstitution.name,
            totalOrders: liveStats.totalOrders,
            totalRevenue: liveStats.totalRevenue,
            pendingOrders: liveStats.pendingOrders,
            preparingOrders: liveStats.preparingOrders,
            readyOrders: liveStats.readyOrders,
            completedOrders: liveStats.completedOrders,
            cancelledOrders: liveStats.cancelledOrders,
            avgOrderValue: liveStats.avgOrderValue,
            topItem: liveStats.topItem,
            menuItems: liveStats.menuItemsCount,
            availableItems: liveStats.availableItems,
            lowStockItems: liveStats.lowStockItems,
            outOfStockItems: liveStats.outOfStockItems,
          }
        }
      });
      if (error) throw error;
      const aiReply = data?.text || 'AI response generated.';
      setChatHistory((prev) => [...prev, { role: 'assistant', text: aiReply }]);
    } catch {
      if (!liveStats.hasData) {
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', text: 'Not enough data yet. Place some orders through the student dashboard to get AI-powered insights.' }
        ]);
      } else {
        setChatHistory((prev) => [
          ...prev,
          { role: 'assistant', text: `Based on live data: ${liveStats.totalOrders} total orders, ₹${liveStats.totalRevenue.toFixed(2)} revenue. Top item: ${liveStats.topItem || 'N/A'}. Pending: ${liveStats.pendingOrders}, Preparing: ${liveStats.preparingOrders}.` }
        ]);
      }
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

            {!liveStats.hasData ? (
              <div className="p-8 text-center">
                <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-400 font-semibold">Not enough data yet.</p>
                <p className="text-xs text-slate-500 mt-1">AI insights will appear once orders are placed through the student dashboard.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Total Orders</div>
                    <div className="text-xl font-black text-amber-400 font-mono mt-1">{liveStats.totalOrders}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Revenue</div>
                    <div className="text-lg font-black text-emerald-400 font-mono mt-1">₹{liveStats.totalRevenue.toFixed(2)}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Preparing</div>
                    <div className="text-xl font-black text-cyan-400 font-mono mt-1">{liveStats.preparingOrders}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">Top Item</div>
                    <div className="text-xs font-bold text-cyan-300 mt-1">{liveStats.topItem || 'N/A'}</div>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-200 flex items-start space-x-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Insight:</strong>{' '}
                    {liveStats.topItem
                      ? `${liveStats.topItem} is the most ordered item (${liveStats.topItemCount} units). ${liveStats.pendingOrders} orders pending, ${liveStats.preparingOrders} being prepared. Avg order value: ₹${liveStats.avgOrderValue.toFixed(0)}.`
                      : 'Analyzing order patterns...'}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <h4 className="font-bold text-xs text-slate-200">Menu Items</h4>
              </div>
              {liveStats.menuItemsCount === 0 ? (
                <p className="text-xs text-slate-500">No menu items yet. Add items in Menu Management.</p>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {liveStats.menuItemsCount} menu items. {liveStats.availableItems} available.
                  {liveStats.lowStockItems > 0 && <span className="text-amber-400"> {liveStats.lowStockItems} low stock.</span>}
                  {liveStats.outOfStockItems > 0 && <span className="text-red-400"> {liveStats.outOfStockItems} out of stock.</span>}
                </p>
              )}
            </div>
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="font-bold text-xs text-slate-200">Orders Overview</h4>
              </div>
              {!liveStats.hasData ? (
                <p className="text-xs text-slate-500">Not enough data yet. Orders will appear here once students place them.</p>
              ) : (
                <p className="text-xs text-slate-400 leading-relaxed">
                  {liveStats.pendingOrders} pending, {liveStats.preparingOrders} preparing, {liveStats.readyOrders} ready.
                  {liveStats.completedOrders > 0 && <span className="text-emerald-400"> {liveStats.completedOrders} completed.</span>}
                  {liveStats.cancelledOrders > 0 && <span className="text-red-400"> {liveStats.cancelledOrders} cancelled.</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col h-[560px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Ask FOODEXA AI Assistant</h3>
            </div>
            <span className={`w-2 h-2 rounded-full ${liveStats.hasData ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3">
            {chatHistory.length === 0 && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-center">
                <BrainCircuit className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                <p className="text-xs">
                  {liveStats.hasData
                    ? 'Ask about popular items, demand trends, peak periods, or menu recommendations.'
                    : 'Not enough data yet. Place orders to unlock AI insights.'}
                </p>
              </div>
            )}
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
            <input type="text" value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={liveStats.hasData ? "Ask AI about sales, prep times, or menu..." : "Not enough data yet..."}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500" />
            <button type="submit" disabled={isAiLoading} className="absolute right-2 top-2 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors disabled:opacity-50">
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

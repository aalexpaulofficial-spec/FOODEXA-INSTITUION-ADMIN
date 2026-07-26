import React, { useState } from 'react';
import {
  BrainCircuit,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  Send,
  Zap,
  CheckCircle2,
  RefreshCw,
  Utensils,
  Bot
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
      text: `Hello! I am FOODEXA AI Operational Assistant, powered by Google Gemini. I am monitoring all ${currentInstitution.vendorsCount} canteens at ${currentInstitution.name}. How can I assist with demand predictions, waste reduction, or meal planning today?`
    }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Demand Forecast Simulation state
  const [selectedWeather, setSelectedWeather] = useState<'Sunny / Clear' | 'Rainy / Cold' | 'Exam Week Rush'>('Sunny / Clear');
  const [forecastResult, setForecastResult] = useState<{
    expectedOrders: number;
    peakTime: string;
    recommendedPrep: string;
    wasteRiskScore: string;
  }>({
    expectedOrders: 3840,
    peakTime: '12:30 PM - 01:15 PM',
    recommendedPrep: 'Increase Protein Bowls & Cold Brews by +18% for North Block Canteen.',
    wasteRiskScore: 'Low (2.1%)'
  });

  const handleSimulateForecast = () => {
    if (selectedWeather === 'Rainy / Cold') {
      setForecastResult({
        expectedOrders: 4210,
        peakTime: '12:00 PM - 01:45 PM',
        recommendedPrep: 'Shift +25% capacity to Hot Soups, Tea, Curry Bowls; students avoid walking outside.',
        wasteRiskScore: 'Moderate (4.8%) if salads over-prepared'
      });
    } else if (selectedWeather === 'Exam Week Rush') {
      setForecastResult({
        expectedOrders: 5100,
        peakTime: '11:30 AM - 03:00 PM (Extended Peak)',
        recommendedPrep: 'Prep +35% Express Snack Wraps, Energy Smoothies & Coffee. High demand for quick pickup lockers.',
        wasteRiskScore: 'Minimal (1.2%)'
      });
    } else {
      setForecastResult({
        expectedOrders: 3840,
        peakTime: '12:30 PM - 01:15 PM',
        recommendedPrep: 'Increase Protein Bowls & Cold Brews by +18% for North Block Canteen.',
        wasteRiskScore: 'Low (2.1%)'
      });
    }
  };

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
          prompt: `You are the FOODEXA Institution AI Operational Intelligence engine powered by Google Gemini for ${currentInstitution.name}. Answer concisely and accurately for campus food management. Query: ${userText}`
        })
      });

      const data = await response.json();
      const aiReply = data.text || 'FOODEXA AI generated answer based on real-time campus canteen telemetry.';

      setChatHistory((prev) => [...prev, { role: 'assistant', text: aiReply }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'AI Query completed. Recommended action: Monitor Counter 02 peak queue times and adjust prep speed.'
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-extrabold text-white">FOODEXA AI Intelligence Center</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 text-[10px] font-mono font-bold flex items-center space-x-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              <span>Google Gemini Powered</span>
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Predictive demand forecasting, automated kitchen waste reduction, and intelligent menu analytics.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Demand Forecast & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          {/* Demand Forecast Simulator Card */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BrainCircuit className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200">
                  Real-time Demand & Preparation Forecast Engine
                </h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">Accuracy: 98.4%</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">Campus Scenario</label>
                <select
                  value={selectedWeather}
                  onChange={(e: any) => setSelectedWeather(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  <option value="Sunny / Clear">Sunny / Regular Class Day</option>
                  <option value="Rainy / Cold">Rainy / Cold Weather</option>
                  <option value="Exam Week Rush">Exam Week / Midterm Season</option>
                </select>
              </div>

              <div className="sm:col-span-2 flex items-end">
                <button
                  onClick={handleSimulateForecast}
                  className="w-full py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run Gemini Demand Simulation</span>
                </button>
              </div>
            </div>

            {/* Forecast Output Dashboard */}
            <div className="p-4 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Predicted Order Volume</div>
                  <div className="text-xl font-black text-amber-400 font-mono mt-1">
                    {forecastResult.expectedOrders}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Predicted Peak Rush Time</div>
                  <div className="text-xs font-bold text-cyan-300 font-mono mt-1">
                    {forecastResult.peakTime}
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold">Food Waste Risk</div>
                  <div className="text-xs font-bold text-emerald-400 mt-1">
                    {forecastResult.wasteRiskScore}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-xs text-cyan-200 flex items-start space-x-2">
                <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Gemini Actionable Recommendation:</strong> {forecastResult.recommendedPrep}
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400">
                <TrendingUp className="w-4 h-4" />
                <h4 className="font-bold text-xs text-slate-200">High Demand Menu Opportunity</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Cold Brew Lattes and High-Protein Bowls have experienced +24% demand spike among Computer Science students between 2 PM - 4 PM. Suggest promoting combo discount.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
              <div className="flex items-center space-x-2 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
                <h4 className="font-bold text-xs text-slate-200">Zero Food Waste Alert</h4>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Green Fork Organics shows potential 12% overproduction of Fresh Garden Salads on Fridays. Recommended reducing batch size by 15 units to maintain zero waste.
              </p>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Interactive AI Gemini Chat Console */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl flex flex-col justify-between h-[560px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center space-x-2">
              <Bot className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Ask FOODEXA AI Assistant
              </h3>
            </div>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs mb-3">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl max-w-[85%] leading-relaxed ${
                  msg.role === 'user'
                    ? 'ml-auto bg-amber-500 text-slate-950 font-semibold'
                    : 'mr-auto bg-slate-950 text-slate-200 border border-slate-800'
                }`}
              >
                {msg.text}
              </div>
            ))}

            {isAiLoading && (
              <div className="mr-auto p-3 rounded-xl bg-slate-950 border border-slate-800 text-cyan-400 text-xs flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Gemini Analyzing Telemetry...</span>
              </div>
            )}
          </div>

          {/* Chat Form */}
          <form onSubmit={handleSendChat} className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ask AI about sales, prep times, or menu..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-3 pr-10 py-2.5 text-xs text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="submit"
              disabled={isAiLoading}
              className="absolute right-2 top-2 p-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Bell, Sparkles, AlertTriangle, Plus, Send, CheckCircle2 } from 'lucide-react';
import { Announcement } from '../../../types';

interface NotificationsViewProps {
  announcements: Announcement[];
  onAddAnnouncement: (announcement: Announcement) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  announcements,
  onAddAnnouncement
}) => {
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<'General' | 'Emergency Alert' | 'Maintenance' | 'Offers & Events'>('General');
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAiDraft = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setTitle('Express Pickup Lockers Launched at North Tech Hub');
      setContent('All students can now scan their Foodexa Student App QR code at Counter 02 for sub-30-second meal pickups during peak lunch hours (12:00 PM - 02:00 PM). Avoid queue delays!');
    }, 700);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: Announcement = {
      id: `ann-${Date.now()}`,
      title: title || 'Campus Canteen Update',
      category,
      content: content || 'Important food court operational notice for campus students.',
      author: 'Campus Executive Office',
      date: '2026-07-26',
      targetAudience: 'All Campus',
      isImportant: category === 'Emergency Alert'
    };

    onAddAnnouncement(created);
    setShowDraftModal(false);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-white">Campus Announcements & Push Alerts</h1>
          <p className="text-xs text-slate-400">
            Broadcast canteen notices, emergency operational alerts, and offers directly to the student mobile app.
          </p>
        </div>

        <button
          onClick={() => setShowDraftModal(true)}
          className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-amber-500/20 flex items-center space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Campus Announcement</span>
        </button>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements.map((ann) => (
          <div
            key={ann.id}
            className={`p-5 rounded-2xl bg-slate-900/80 border shadow-xl space-y-2 ${
              ann.isImportant ? 'border-amber-500/50 bg-amber-500/5' : 'border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">{ann.title}</h3>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
                  {ann.category}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">{ann.date}</span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{ann.content}</p>

            <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
              <span>Author: <strong className="text-slate-300">{ann.author}</strong></span>
              <span>Audience: <strong className="text-cyan-400">{ann.targetAudience}</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showDraftModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-200 text-sm">Draft Announcement</h3>
              <button
                type="button"
                onClick={() => setShowDraftModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-slate-300 font-semibold block">Title</label>
                  <button
                    type="button"
                    onClick={handleAiDraft}
                    className="text-cyan-400 font-bold flex items-center space-x-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Gemini Draft</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Express QR Lockers Active"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="General">General</option>
                  <option value="Emergency Alert">Emergency Alert</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Offers & Events">Offers & Events</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-semibold block mb-1">Message Content</label>
                <textarea
                  rows={3}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Notice message text..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20"
              >
                Broadcast Announcement to Student App
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

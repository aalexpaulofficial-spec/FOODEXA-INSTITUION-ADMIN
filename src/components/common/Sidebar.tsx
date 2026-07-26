import React from 'react';
import {
  LayoutDashboard, Users, Store, ChefHat, ShoppingBag, UtensilsCrossed,
  TrendingUp, FileText, Building, UserCheck, Bell, Sparkles, Settings,
  ShieldCheck, Building2, CheckSquare, BarChart3, CreditCard, BrainCircuit, Sliders, X
} from 'lucide-react';
import { PortalRole } from '../../types';

interface SidebarProps {
  currentPortal: PortalRole;
  currentTab: string;
  onTabChange: (tab: string) => void;
  pendingVendorCount?: number;
  activeKitchenOrdersCount?: number;
  isMobileMenuOpen?: boolean;
  onCloseMobileMenu?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentPortal,
  currentTab,
  onTabChange,
  pendingVendorCount = 0,
  activeKitchenOrdersCount = 0,
  isMobileMenuOpen = false,
  onCloseMobileMenu
}) => {
  const institutionNav: { id: string; label: string; icon: any; badge?: string | null; badgeColor?: string; isAi?: boolean }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Student Management', icon: Users },
    { id: 'canteens', label: 'Canteen Management', icon: Store, badge: pendingVendorCount > 0 ? `${pendingVendorCount} Pending` : null, badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    { id: 'kitchen', label: 'Kitchen Queue', icon: ChefHat },
    { id: 'orders', label: 'Order Management', icon: ShoppingBag, badge: activeKitchenOrdersCount > 0 ? `${activeKitchenOrdersCount}` : null, badgeColor: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    { id: 'menus', label: 'Menu Management', icon: UtensilsCrossed },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'reports', label: 'Reports & Exports', icon: FileText },
    { id: 'campus', label: 'Campus Management', icon: Building },
    { id: 'staff', label: 'Staff & Roles', icon: UserCheck },
    { id: 'notifications', label: 'Announcements', icon: Bell },
    { id: 'ai_center', label: 'AI Center', icon: Sparkles, isAi: true },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  const superAdminNav: { id: string; label: string; icon: any; badge?: string | null; badgeColor?: string; isAi?: boolean }[] = [
    { id: 'superadmin', label: 'Platform Overview', icon: ShieldCheck },
    { id: 'institution_approval', label: 'Institution Approval', icon: Building2 },
    { id: 'vendor_approval', label: 'Global Vendors', icon: CheckSquare },
    { id: 'global_analytics', label: 'Global Analytics', icon: BarChart3 },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
    { id: 'ai_insights', label: 'AI Risk & Insights', icon: BrainCircuit, isAi: true },
    { id: 'system_settings', label: 'System Audit Logs', icon: Sliders }
  ];

  const navItems = currentPortal === 'super_admin' ? superAdminNav : institutionNav;

  const handleSelectTab = (tabId: string) => {
    onTabChange(tabId);
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between select-none">
      <div className="p-4 space-y-6 overflow-y-auto">
        <div className="flex items-center justify-between lg:hidden pb-2 border-b border-zinc-800">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center font-black text-white text-xs">FX</div>
            <span className="font-bold text-sm text-white">FOODEXA Menu</span>
          </div>
          <button onClick={onCloseMobileMenu} className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-3 px-2">
            {currentPortal === 'super_admin' ? 'Super Admin Portal' : 'Management'}
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)] font-semibold'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {item.isAi ? (
                      <div className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
                    ) : (
                      <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-500'}`} />
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-zinc-800/50 mt-auto bg-[#09090B]/50">
        <div className="p-3 rounded-xl bg-gradient-to-b from-indigo-950/20 to-zinc-900 border border-indigo-500/20 text-center relative overflow-hidden">
          <div className="flex items-center justify-center space-x-1.5 text-xs font-bold text-zinc-200 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>FOODEXA AI Center</span>
          </div>
          <p className="text-[10px] text-zinc-400 font-medium">Powered by Google Gemini</p>
          <button
            onClick={() => handleSelectTab('ai_center')}
            className="mt-2.5 w-full py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)] flex items-center justify-center space-x-1"
          >
            <span>Launch AI Center →</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex w-60 bg-[#0C0C0E] border-r border-zinc-800/50 flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
        {navContent}
      </aside>

      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" onClick={onCloseMobileMenu} />
          <aside className="relative w-72 max-w-[80vw] bg-[#0C0C0E] border-r border-zinc-800 shadow-2xl flex flex-col h-full z-10">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};

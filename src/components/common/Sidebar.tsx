import React from 'react';
import {
  LayoutDashboard, Users, Store, ChefHat, ShoppingBag, UtensilsCrossed,
  TrendingUp, FileText, Building, UserCheck, Bell, Sparkles, Settings,
  ShieldCheck, Building2, BarChart3, CreditCard, Sliders, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { PortalRole } from '../../types';
import { useLanguage } from '../../context/LanguageContext';

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
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const superAdminRoutes: Record<string, string> = {
    'institution-requests': '/super-admin/institution-requests',
    'institutions': '/super-admin/institutions',
    'analytics': '/super-admin/analytics',
    'subscriptions': '/super-admin/subscriptions',
    'notifications': '/super-admin/notifications',
    'audit-logs': '/super-admin/audit-logs',
    'ai-center': '/super-admin/ai-center',
  };

  const isActiveRoute = (routePath: string) => location.pathname === routePath;

  const institutionNav: { id: string; label: string; icon: any; badge?: string | null; badgeColor?: string; section?: string }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: LayoutDashboard, section: 'Overview' },
    { id: 'students', label: t('nav.students'), icon: Users, section: 'Management' },
    { id: 'canteens', label: t('nav.canteens'), icon: Store, badge: pendingVendorCount > 0 ? `${pendingVendorCount}` : null, badgeColor: 'bg-amber-500/10 text-amber-400', section: 'Management' },
    { id: 'kitchen', label: t('nav.kitchen'), icon: ChefHat, section: 'Operations' },
    { id: 'orders', label: t('nav.orders'), icon: ShoppingBag, badge: activeKitchenOrdersCount > 0 ? `${activeKitchenOrdersCount}` : null, badgeColor: 'bg-indigo-500/10 text-indigo-400', section: 'Operations' },
    { id: 'menus', label: t('nav.menu'), icon: UtensilsCrossed, section: 'Operations' },
    { id: 'analytics', label: t('nav.analytics'), icon: TrendingUp, section: 'Intelligence' },
    { id: 'reports', label: t('nav.reports'), icon: FileText, section: 'Intelligence' },
    { id: 'campus', label: t('nav.campus'), icon: Building, section: 'Administration' },
    { id: 'staff', label: t('nav.staff'), icon: UserCheck, section: 'Administration' },
    { id: 'notifications', label: t('nav.notifications'), icon: Bell, section: 'Administration' },
    { id: 'ai_center', label: t('nav.ai_center'), icon: Sparkles, section: 'Intelligence' },
    { id: 'settings', label: t('nav.settings'), icon: Settings, section: 'Administration' }
  ];

  const superAdminNav: { id: string; label: string; icon: any; path: string; section?: string }[] = [
    { id: 'institution-requests', label: 'Requests', icon: Building2, path: '/super-admin/institution-requests', section: 'Management' },
    { id: 'institutions', label: 'Institutions', icon: Building, path: '/super-admin/institutions', section: 'Management' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/super-admin/analytics', section: 'Intelligence' },
    { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard, path: '/super-admin/subscriptions', section: 'Administration' },
    { id: 'notifications', label: 'Notifications', icon: Bell, path: '/super-admin/notifications', section: 'Administration' },
    { id: 'audit-logs', label: 'Audit Logs', icon: Sliders, path: '/super-admin/audit-logs', section: 'Administration' },
    { id: 'ai-center', label: 'AI Center', icon: Sparkles, path: '/super-admin/ai-center', section: 'Intelligence' }
  ];

  const handleSelectTab = (tabId: string, eventPath?: string) => {
    if (currentPortal === 'super_admin' && eventPath) {
      navigate(eventPath);
    } else {
      onTabChange(tabId);
    }
    if (onCloseMobileMenu) onCloseMobileMenu();
  };

  const navItems: any[] = currentPortal === 'super_admin'
    ? superAdminNav.map(item => ({ ...item, isActive: isActiveRoute(item.path) }))
    : institutionNav.map(item => ({ ...item, isActive: currentTab === item.id }));

  // Group items by section
  const groupedItems = navItems.reduce((acc: Record<string, any[]>, item: any) => {
    const section = item.section || 'Other';
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const navContent = (
    <div className="flex flex-col h-full select-none">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-zinc-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="font-black text-white text-[10px] tracking-tight">FX</span>
          </div>
          <span className="font-bold text-sm text-white">Menu</span>
        </div>
        <button onClick={onCloseMobileMenu} className="p-2 rounded-xl hover:bg-zinc-800/60 text-zinc-400 hover:text-white transition-all">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 foodexa-scroll">
        {Object.entries(groupedItems).map(([section, items]: [string, any[]]) => (
          <div key={section}>
            <div className="px-3 mb-2">
              <span className="text-[10px] uppercase tracking-[0.08em] font-semibold text-zinc-600">
                {section}
              </span>
            </div>
            <div className="space-y-0.5">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = (item as any).isActive;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id, (item as any).path)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group ${
                      isActive
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/40'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`relative ${isActive ? 'text-indigo-400' : 'text-zinc-600 group-hover:text-zinc-400'} transition-colors`}>
                        {item.isAi ? (
                          <div className="w-[18px] h-[18px] flex items-center justify-center">
                            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-zinc-600 group-hover:bg-zinc-400'} transition-colors`} />
                          </div>
                        ) : (
                          <Icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.2 : 1.8} />
                        )}
                      </div>
                      <span className="truncate">{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom AI Card */}
      {currentPortal !== 'super_admin' && (
        <div className="p-3 border-t border-zinc-800/50">
          <div className="p-4 rounded-2xl bg-gradient-to-b from-indigo-950/30 to-zinc-900/50 border border-indigo-500/10 text-center relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-16 h-16 bg-indigo-600/10 blur-[30px] pointer-events-none" />
            <div className="flex items-center justify-center gap-1.5 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px] font-bold text-zinc-200">{t('nav.ai_center')}</span>
            </div>
            <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">Intelligent insights for your campus</p>
            <button
              onClick={() => handleSelectTab('ai_center')}
              className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all shadow-lg shadow-indigo-500/20"
            >
              Launch AI
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-[#0C0C0E]/90 backdrop-blur-xl border-r border-zinc-800/50 flex-col shrink-0 min-h-[calc(100vh-4rem)]">
        {navContent}
      </aside>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onCloseMobileMenu} />
          <aside className="relative w-72 max-w-[80vw] bg-[#0C0C0E] border-r border-zinc-800 shadow-2xl flex flex-col h-full z-10 animate-slide-in-left">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
};

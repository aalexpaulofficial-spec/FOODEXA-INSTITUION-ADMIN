import React, { useMemo } from 'react';
import {
  ShoppingBag, TrendingUp, Clock, CheckCircle2, ChefHat,
  Store, ArrowRight, Package, Users, IndianRupee, CircleDot,
  Timer, AlertCircle, UtensilsCrossed
} from 'lucide-react';
import { Institution, Order, Vendor } from '../../../types';
import { useLanguage } from '../../../context/LanguageContext';

interface HomeDashboardProps {
  currentInstitution: Institution;
  orders: Order[];
  vendors: Vendor[];
  onNavigate: (tab: string) => void;
  onOpenQRScanner: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  currentInstitution,
  orders,
  vendors,
  onNavigate,
  onOpenQRScanner
}) => {
  const { t } = useLanguage();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.greeting.morning');
    if (hour < 17) return t('dashboard.greeting.afternoon');
    return t('dashboard.greeting.evening');
  };

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Live metrics
  const todayOrders = useMemo(() => {
    const today = new Date().toDateString();
    return orders.filter(o => new Date(o.orderTime || o.created_at || '').toDateString() === today);
  }, [orders]);

  const todaysRevenue = useMemo(() =>
    todayOrders.filter(o => o.paymentStatus === 'paid').reduce((sum, o) => sum + o.totalAmount, 0),
    [todayOrders]
  );

  const preparingCount = useMemo(() =>
    orders.filter(o => o.kitchenStatus === 'Preparing' || o.kitchenStatus === 'Accepted').length,
    [orders]
  );

  const readyCount = useMemo(() =>
    orders.filter(o => o.kitchenStatus === 'Ready').length,
    [orders]
  );

  const completedToday = useMemo(() =>
    todayOrders.filter(o => o.kitchenStatus === 'Completed' || o.status === 'completed').length,
    [todayOrders]
  );

  const activeCanteens = useMemo(() =>
    vendors.filter(v => v.status === 'approved').length,
    [vendors]
  );

  // Order flow counts
  const orderFlow = useMemo(() => {
    const paid = orders.filter(o => o.paymentStatus === 'paid' && o.kitchenStatus !== 'Completed' && o.kitchenStatus !== 'Cancelled').length;
    const accepted = orders.filter(o => o.kitchenStatus === 'Accepted').length;
    const preparing = orders.filter(o => o.kitchenStatus === 'Preparing').length;
    const ready = orders.filter(o => o.kitchenStatus === 'Ready').length;
    const completed = todayOrders.filter(o => o.kitchenStatus === 'Completed' || o.status === 'completed').length;
    return { paid, accepted, preparing, ready, completed };
  }, [orders, todayOrders]);

  // Kitchen queue - active orders needing attention
  const kitchenQueue = useMemo(() =>
    orders
      .filter(o => ['Pending', 'Accepted', 'Preparing', 'Ready'].includes(o.kitchenStatus || '') && o.paymentStatus === 'paid')
      .sort((a, b) => {
        const order = { 'Pending': 0, 'Accepted': 1, 'Preparing': 2, 'Ready': 3 };
        return (order[a.kitchenStatus as keyof typeof order] || 0) - (order[b.kitchenStatus as keyof typeof order] || 0);
      })
      .slice(0, 6),
    [orders]
  );

  // Metrics configuration
  const metrics = [
    {
      label: t('dashboard.todays_orders'),
      value: todayOrders.length,
      icon: ShoppingBag,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20',
    },
    {
      label: t('dashboard.todays_revenue'),
      value: `₹${todaysRevenue.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
      icon: IndianRupee,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: t('dashboard.preparing'),
      value: preparingCount,
      icon: ChefHat,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
    {
      label: t('dashboard.ready'),
      value: readyCount,
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
    },
    {
      label: t('dashboard.completed'),
      value: completedToday,
      icon: Package,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
    },
    {
      label: t('dashboard.active_canteens'),
      value: activeCanteens,
      icon: Store,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20',
    },
  ];

  const flowSteps = [
    { key: 'paid', label: 'Paid', count: orderFlow.paid, color: 'bg-indigo-500' },
    { key: 'accepted', label: 'Accepted', count: orderFlow.accepted, color: 'bg-blue-500' },
    { key: 'preparing', label: 'Preparing', count: orderFlow.preparing, color: 'bg-amber-500' },
    { key: 'ready', label: 'Ready', count: orderFlow.ready, color: 'bg-emerald-500' },
    { key: 'completed', label: 'Completed', count: orderFlow.completed, color: 'bg-purple-500' },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
      case 'Accepted': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'Preparing': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Ready': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Completed': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero */}
      <section className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-indigo-600/20 via-[#0C0C0E] to-[#0C0C0E] border border-indigo-500/10 p-8 sm:p-10">
        <div className="absolute top-0 right-0 w-1/3 h-full opacity-[0.07] pointer-events-none hidden sm:block">
          <svg viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-indigo-400">
            <circle cx="200" cy="200" r="150" stroke="currentColor" strokeWidth="0.5" />
            <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="0.5" strokeDasharray="4 4" />
            <circle cx="200" cy="200" r="50" stroke="currentColor" strokeWidth="1" />
          </svg>
        </div>

        <div className="relative z-10">
          <p className="text-zinc-500 text-xs font-medium mb-1">{todayStr}</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
            {getGreeting()}, {currentInstitution?.contactPerson || 'Administrator'}
          </h1>
          <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
            <span className="text-white font-medium">{currentInstitution?.name || 'Your Institution'}</span>
            {' '}&mdash; {orders.length} total orders, {activeCanteens} active canteens.
            {preparingCount > 0 && (
              <span className="text-amber-400 font-medium"> {preparingCount} orders being prepared.</span>
            )}
          </p>
        </div>
      </section>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((metric, idx) => {
          const Icon = metric.icon;
          return (
            <div
              key={metric.label}
              className={`foodexa-metric animate-fade-in-up stagger-${idx + 1}`}
            >
              <div className="flex items-center gap-2.5 mb-3">
                <div className={`w-8 h-8 rounded-xl ${metric.bgColor} border ${metric.borderColor} flex items-center justify-center`}>
                  <Icon className={`w-4 h-4 ${metric.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-white font-mono">
                {metric.value}
              </p>
              <p className="text-[11px] text-zinc-500 font-medium mt-1">{metric.label}</p>
            </div>
          );
        })}
      </div>

      {/* Live Operations Flow */}
      <section className="foodexa-card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">{t('dashboard.live_operations')}</h2>
            <p className="text-xs text-zinc-500 mt-0.5">{t('dashboard.realtime_pipeline')}</p>
          </div>
          <button
            onClick={() => onNavigate('kitchen')}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
          >
            {t('dashboard.view_kitchen')}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 sm:gap-4 overflow-x-auto pb-2">
          {flowSteps.map((step, idx) => (
            <React.Fragment key={step.key}>
              <div className="flex flex-col items-center gap-2.5 min-w-[80px] flex-1">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold text-white ${step.color} shadow-lg`}
                  style={{ boxShadow: `0 4px 14px -3px ${step.color.replace('bg-', 'rgba(').replace('500', '500, 0.3)')}` }}>
                  {step.count}
                </div>
                <span className="text-[11px] font-medium text-zinc-400">{step.label}</span>
              </div>
              {idx < flowSteps.length - 1 && (
                <div className="flex-shrink-0 w-6 h-px bg-zinc-800 relative">
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-700" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kitchen Queue Preview */}
        <div className="lg:col-span-8 foodexa-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/50">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">{t('dashboard.kitchen_queue')}</h2>
              <p className="text-xs text-zinc-500 mt-0.5">{t('dashboard.orders_requiring_attention')}</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
            >
              {t('dashboard.view_all')}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {kitchenQueue.length === 0 ? (
            <div className="foodexa-empty py-12">
              <div className="foodexa-empty-icon">
                <ChefHat className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-zinc-400">{t('dashboard.no_active_orders')}</p>
              <p className="text-xs text-zinc-600 mt-1">{t('dashboard.orders_will_appear')}</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/50">
              {kitchenQueue.map((order) => (
                <div key={order.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-zinc-800/20 transition-colors">
                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <span className="text-xs font-mono font-bold text-indigo-400">{order.orderNumber}</span>
                      {order.tokenNumber && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400">
                          T-{order.tokenNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-300 font-medium truncate">{order.studentName}</p>
                    <p className="text-[11px] text-zinc-500 truncate mt-0.5">
                      {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                    </p>
                  </div>

                  {/* Pickup Code */}
                  {order.pickupCode && (
                    <div className="hidden sm:block text-center">
                      <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-0.5">Pickup</p>
                      <p className="text-xs font-mono font-bold text-zinc-300">{order.pickupCode}</p>
                    </div>
                  )}

                  {/* Amount */}
                  <div className="hidden sm:block text-right">
                    <p className="text-xs font-semibold text-white font-mono">₹{order.totalAmount}</p>
                  </div>

                  {/* Status */}
                  <div className={`foodexa-badge ${getStatusStyle(order.kitchenStatus || 'Pending')}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      order.kitchenStatus === 'Preparing' ? 'bg-amber-400' :
                      order.kitchenStatus === 'Ready' ? 'bg-emerald-400' :
                      order.kitchenStatus === 'Accepted' ? 'bg-blue-400' :
                      order.kitchenStatus === 'Completed' ? 'bg-purple-400' : 'bg-zinc-400'
                    }`} />
                    {order.kitchenStatus || 'Pending'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-6">
          {/* Quick Actions */}
          <div className="foodexa-card p-5">
            <h3 className="text-sm font-semibold text-white tracking-tight mb-4">{t('dashboard.quick_actions')}</h3>
            <div className="space-y-2">
              <button
                onClick={() => onNavigate('menus')}
                className="w-full p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/50 flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                  <UtensilsCrossed className="w-4 h-4 text-indigo-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">{t('dashboard.manage_menu')}</p>
                  <p className="text-[10px] text-zinc-500">{t('dashboard.add_or_update')}</p>
                </div>
              </button>

              <button
                onClick={() => onNavigate('notifications')}
                className="w-full p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/50 flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">{t('dashboard.announcements')}</p>
                  <p className="text-[10px] text-zinc-500">{t('dashboard.broadcast_to_campus')}</p>
                </div>
              </button>

              <button
                onClick={onOpenQRScanner}
                className="w-full p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/50 flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">{t('dashboard.scan_pickup')}</p>
                  <p className="text-[10px] text-zinc-500">{t('dashboard.qr_code_scanner')}</p>
                </div>
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className="w-full p-3 rounded-xl bg-zinc-900/40 hover:bg-zinc-800/60 border border-zinc-800/50 flex items-center gap-3 text-left transition-all group"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">{t('dashboard.reports')}</p>
                  <p className="text-[10px] text-zinc-500">{t('dashboard.export_data')}</p>
                </div>
              </button>
            </div>
          </div>

          {/* Active Canteens */}
          <div className="foodexa-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white tracking-tight">{t('dashboard.canteens')}</h3>
              <button
                onClick={() => onNavigate('canteens')}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
              >
                {t('dashboard.view_all')}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {vendors.length === 0 ? (
              <div className="text-center py-6">
                <Store className="w-8 h-8 text-zinc-700 mx-auto mb-2" />
                <p className="text-xs text-zinc-500">No canteens registered</p>
              </div>
            ) : (
              <div className="space-y-2">
                {vendors.slice(0, 4).map((vendor) => (
                  <div key={vendor.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-zinc-800/30 transition-colors">
                    <div className={`w-2 h-2 rounded-full ${
                      vendor.status === 'approved' ? 'bg-emerald-400' :
                      vendor.status === 'pending' ? 'bg-amber-400' : 'bg-zinc-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-zinc-200 truncate">{vendor.name}</p>
                      <p className="text-[10px] text-zinc-500">{vendor.campusBlock || 'Campus'}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      vendor.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400' :
                      vendor.status === 'pending' ? 'bg-amber-500/10 text-amber-400' :
                      'bg-zinc-500/10 text-zinc-400'
                    }`}>
                      {vendor.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

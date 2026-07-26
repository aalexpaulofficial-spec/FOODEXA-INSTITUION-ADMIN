import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { PortalRole } from './types';

import { LoginView } from './components/modules/auth/LoginView';
import { Header } from './components/common/Header';
import { Sidebar } from './components/common/Sidebar';
import { QRPickupScannerModal } from './components/common/QRPickupScannerModal';
import { AISmartSearchModal } from './components/common/AISmartSearchModal';
import { StudentDashboardSyncModal } from './components/common/StudentDashboardSyncModal';

import { HomeDashboard } from './components/modules/dashboard/HomeDashboard';
import { StudentManagement } from './components/modules/students/StudentManagement';
import { CanteenManagement } from './components/modules/canteens/CanteenManagement';
import { KitchenDashboard } from './components/modules/kitchen/KitchenDashboard';
import { OrderManagement } from './components/modules/orders/OrderManagement';
import { MenuManagement } from './components/modules/menu/MenuManagement';
import { AnalyticsView } from './components/modules/analytics/AnalyticsView';
import { ReportsView } from './components/modules/reports/ReportsView';
import { CampusManagement } from './components/modules/campus/CampusManagement';
import { StaffManagement } from './components/modules/staff/StaffManagement';
import { NotificationsView } from './components/modules/notifications/NotificationsView';
import { AICenterView } from './components/modules/ai/AICenterView';
import { SettingsView } from './components/modules/settings/SettingsView';
import { SuperAdminView } from './components/modules/superadmin/SuperAdminView';

import { useInstitutionData } from './hooks/useInstitutionData';

export function App() {
  const { user, role, institutionId: authInstId, loading: authLoading, signOut } = useAuth();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const [isStudentSyncOpen, setIsStudentSyncOpen] = useState(false);

  const currentPortal: PortalRole = role === 'super_admin' ? 'super_admin' : 'campus_admin';

  const institutionTabs = useMemo(() => [
    'dashboard', 'students', 'canteens', 'kitchen', 'orders', 'menus',
    'analytics', 'reports', 'campus', 'staff', 'notifications', 'ai_center', 'settings'
  ], []);

  const superAdminTabs = useMemo(() => [
    'superadmin', 'institution_approval', 'vendor_approval', 'global_analytics',
    'subscriptions', 'ai_insights', 'system_settings'
  ], []);

  useEffect(() => {
    if (role === 'super_admin' && institutionTabs.includes(currentTab)) {
      setCurrentTab('superadmin');
    } else if (role === 'institution_admin' && superAdminTabs.includes(currentTab)) {
      setCurrentTab('dashboard');
    }
  }, [role, currentTab, institutionTabs, superAdminTabs]);

  const institutionId = role === 'institution_admin' ? authInstId : null;
  const {
    institution, students, vendors, counters, orders, menuItems, kitchenQueue,
    campusBlocks, staff, announcements, auditLogs,
    loading: dataLoading,
    refresh,
    updateStudentStatus, approveVendor, rejectVendor, suspendVendor,
    addCounter, toggleCounterAvailability, updateKitchenStatus, updateOrderStatus,
    addMenuItem, toggleMenuAvailability, toggleStaffPermission, addAnnouncement,
  } = useInstitutionData(institutionId);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm text-zinc-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginView />;
  }

  if (role === 'institution_admin' && !authInstId) {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex items-center justify-center">
        <div className="max-w-md w-full p-8 bg-[#0C0C0E] rounded-2xl border border-zinc-800 text-center">
          <h2 className="text-xl font-bold mb-4 text-red-500">Access Error</h2>
          <p className="text-zinc-400 mb-6">You are logged in but not associated with an institution. Please contact support or sign in with a different account.</p>
          <button
            onClick={signOut}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateOrderStatus = (orderId: string, status: any) => {
    updateOrderStatus(orderId, status);
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <Header
        currentPortal={currentPortal}
        onPortalChange={() => {}}
        currentInstitution={institution || { id: '', name: 'Unknown Institution', code: '', location: '', studentsCount: 0, vendorsCount: 0, dailyOrdersCount: 0, monthlyRevenue: 0, status: 'active', contactPerson: '', email: '', phone: '', joinedDate: '', plan: 'Basic' }}
        onInstitutionSelect={() => {}}
        onOpenAISearch={() => setIsAISearchOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenStudentSync={() => setIsStudentSyncOpen(true)}
        onLogout={signOut}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => { setCurrentTab(tab); setIsMobileMenuOpen(false); }}
          currentPortal={currentPortal}
          pendingVendorCount={vendors.filter((v) => v.status === 'pending').length}
          activeKitchenOrdersCount={kitchenQueue.filter((k) => k.status === 'preparing').length}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#09090B]">
          <div className="max-w-7xl mx-auto">
            {dataLoading ? (
              <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <p className="text-xs text-zinc-500">Loading institution data...</p>
                </div>
              </div>
            ) : (
              <>
                {currentPortal === 'super_admin' && role === 'super_admin' && (
                  <SuperAdminView />
                )}

                {currentPortal === 'campus_admin' && role === 'institution_admin' && (
                  <>
                    {currentTab === 'dashboard' && (
                      <HomeDashboard
                        currentInstitution={institution || { id: '', name: 'Your Institution', code: '', location: '', studentsCount: 0, vendorsCount: 0, dailyOrdersCount: 0, monthlyRevenue: 0, status: 'active', contactPerson: '', email: '', phone: '', joinedDate: '', plan: 'Basic' }}
                        orders={orders}
                        vendors={vendors}
                        onNavigate={setCurrentTab}
                        onOpenQRScanner={() => setIsQRScannerOpen(true)}
                      />
                    )}

                    {currentTab === 'students' && (
                      <StudentManagement
                        students={students}
                        orders={orders}
                        onUpdateStudentStatus={updateStudentStatus}
                      />
                    )}

                    {currentTab === 'canteens' && (
                      <CanteenManagement
                        vendors={vendors}
                        counters={counters}
                        campusBlocks={campusBlocks}
                        onApproveVendor={approveVendor}
                        onRejectVendor={rejectVendor}
                        onSuspendVendor={suspendVendor}
                        onAddCounter={addCounter}
                        onToggleCounterAvailability={toggleCounterAvailability}
                      />
                    )}

                    {currentTab === 'kitchen' && (
                      <KitchenDashboard
                        queueItems={kitchenQueue}
                        onUpdateKitchenStatus={updateKitchenStatus}
                      />
                    )}

                    {currentTab === 'orders' && (
                      <OrderManagement
                        orders={orders}
                        onUpdateOrderStatus={handleUpdateOrderStatus}
                        onOpenQRScanner={() => setIsQRScannerOpen(true)}
                      />
                    )}

                    {currentTab === 'menus' && (
                      <MenuManagement
                        menuItems={menuItems}
                        onAddMenuItem={addMenuItem}
                        onToggleAvailability={toggleMenuAvailability}
                      />
                    )}

                    {currentTab === 'analytics' && <AnalyticsView orders={orders} />}

                    {currentTab === 'reports' && <ReportsView />}

                    {currentTab === 'campus' && <CampusManagement campusBlocks={campusBlocks} />}

                    {currentTab === 'staff' && (
                      <StaffManagement staff={staff} onTogglePermission={toggleStaffPermission} />
                    )}

                    {currentTab === 'notifications' && (
                      <NotificationsView
                        announcements={announcements}
                        onAddAnnouncement={addAnnouncement}
                      />
                    )}

                    {currentTab === 'ai_center' && (
                      <AICenterView
                        currentInstitution={institution || { id: '', name: 'Your Institution', code: '', location: '', studentsCount: 0, vendorsCount: 0, dailyOrdersCount: 0, monthlyRevenue: 0, status: 'active', contactPerson: '', email: '', phone: '', joinedDate: '', plan: 'Basic' }}
                        menuItems={menuItems}
                        orders={orders}
                      />
                    )}

                    {currentTab === 'settings' && (
                      <SettingsView currentInstitution={institution || { id: '', name: 'Your Institution', code: '', location: '', studentsCount: 0, vendorsCount: 0, dailyOrdersCount: 0, monthlyRevenue: 0, status: 'active', contactPerson: '', email: '', phone: '', joinedDate: '', plan: 'Basic' }} auditLogs={auditLogs} />
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </div>

      <QRPickupScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        orders={orders}
        onCompleteOrder={(orderId) => handleUpdateOrderStatus(orderId, 'completed')}
      />

      <AISmartSearchModal
        isOpen={isAISearchOpen}
        onClose={() => setIsAISearchOpen(false)}
        students={students}
        vendors={vendors}
        menuItems={menuItems}
        orders={orders}
        onSelectResult={(type) => {
          if (type === 'student') setCurrentTab('students');
          else if (type === 'order') setCurrentTab('orders');
          else if (type === 'vendor') setCurrentTab('canteens');
        }}
      />

      <StudentDashboardSyncModal
        isOpen={isStudentSyncOpen}
        onClose={() => setIsStudentSyncOpen(false)}
        menuItems={menuItems}
        orders={orders}
        announcements={announcements}
        onPlaceTestOrder={() => {}}
      />
    </div>
  );
}

export default App;

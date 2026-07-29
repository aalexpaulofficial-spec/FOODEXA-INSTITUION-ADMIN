import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
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

import { SuperAdminDataProvider } from './components/modules/superadmin/pages/components/SuperAdminDataProvider';
import { InstitutionRequestsPage } from './components/modules/superadmin/pages/InstitutionRequestsPage';
import { InstitutionDirectoryPage } from './components/modules/superadmin/pages/InstitutionDirectoryPage';
import { GlobalAnalyticsPage } from './components/modules/superadmin/pages/GlobalAnalyticsPage';
import { SubscriptionsPage } from './components/modules/superadmin/pages/SubscriptionsPage';
import { NotificationsPage } from './components/modules/superadmin/pages/NotificationsPage';
import { AuditLogsPage } from './components/modules/superadmin/pages/AuditLogsPage';
import { AICenterPage } from './components/modules/superadmin/pages/AICenterPage';

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
    'institution-requests', 'institutions', 'analytics', 'subscriptions', 'notifications', 'audit-logs'
  ], []);

  const institutionId = role === 'institution_admin' ? authInstId : null;
  const {
    institution, students, vendors, counters, orders, menuItems, menuCategories,
    kitchenQueue, campusBlocks, staff, announcements, auditLogs,
    loading: dataLoading,
    refresh,
    updateStudentStatus, approveVendor, rejectVendor, suspendVendor,
    addCounter, updateCounter, deleteCounter, archiveCounter, restoreCounter, updateCounterStatus, toggleCounterAvailability,
    updateKitchenStatus, updateOrderStatus,
    addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuAvailability,
    addMenuCategory, updateMenuCategory, deleteMenuCategory,
    toggleStaffPermission, deleteStudent, addStaff, updateStaff, deleteStaff, deleteAnnouncement, deleteVendor, updateInstitution, addAnnouncement,
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
        currentInstitution={institution || { id: authInstId || '', name: 'Loading...', institution_code: '', studentsCount: 0, vendorsCount: 0, dailyOrdersCount: 0, monthlyRevenue: 0, status: 'active', contactPerson: '', email: '', phone: '', joinedDate: '', plan: 'Basic' }}
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
            {role === 'super_admin' ? (
              <SuperAdminDataProvider>
                <Routes>
                  <Route path="/super-admin/institution-requests" element={<InstitutionRequestsPage />} />
                  <Route path="/super-admin/institutions" element={<InstitutionDirectoryPage />} />
                  <Route path="/super-admin/analytics" element={<GlobalAnalyticsPage />} />
                  <Route path="/super-admin/subscriptions" element={<SubscriptionsPage />} />
                  <Route path="/super-admin/notifications" element={<NotificationsPage />} />
                  <Route path="/super-admin/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/super-admin/ai-center" element={<AICenterPage />} />
                  <Route path="*" element={<Navigate to="/super-admin/institution-requests" replace />} />
                </Routes>
              </SuperAdminDataProvider>
            ) : (
              <>
                {dataLoading ? (
                  <div className="flex items-center justify-center py-32">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                      <p className="text-xs text-zinc-500">Loading institution data...</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {currentTab === 'dashboard' && (
                      <HomeDashboard
                        currentInstitution={institution || { id: authInstId || '', name: 'Your Institution', institution_code: '', studentsCount: 0, vendorsCount: 0, dailyOrdersCount: 0, monthlyRevenue: 0, status: 'active', contactPerson: '', email: '', phone: '', joinedDate: '', plan: 'Basic' }}
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
                        onDeleteStudent={deleteStudent}
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
                        onUpdateCounter={updateCounter}
                        onDeleteCounter={deleteCounter}
                        onArchiveCounter={archiveCounter}
                        onRestoreCounter={restoreCounter}
                        onUpdateCounterStatus={updateCounterStatus}
                        onToggleCounterAvailability={toggleCounterAvailability}
                        onDeleteVendor={deleteVendor}
                      />
                    )}

                    {currentTab === 'kitchen' && (
                      <KitchenDashboard
                        queueItems={kitchenQueue}
                        currentInstitution={institution}
                        onUpdateKitchenStatus={updateKitchenStatus}
                      />
                    )}

                    {currentTab === 'orders' && (
                      <OrderManagement
                        currentInstitution={institution}
                        onUpdateOrderStatus={handleUpdateOrderStatus}
                        onOpenQRScanner={() => setIsQRScannerOpen(true)}
                      />
                    )}

                    {currentTab === 'menus' && (
                      <MenuManagement
                        menuItems={menuItems}
                        categories={menuCategories}
                        counters={counters}
                        onAddMenuItem={addMenuItem}
                        onUpdateMenuItem={updateMenuItem}
                        onDeleteMenuItem={deleteMenuItem}
                        onToggleAvailability={toggleMenuAvailability}
                        addMenuCategory={addMenuCategory}
                        updateMenuCategory={updateMenuCategory}
                        deleteMenuCategory={deleteMenuCategory}
                        institutionId={institutionId}
                      />
                    )}

                    {currentTab === 'reports' && <ReportsView />}

                    {currentTab === 'campus' && <CampusManagement campusBlocks={campusBlocks} />}

                    {currentTab === 'staff' && (
                      <StaffManagement staff={staff} onTogglePermission={toggleStaffPermission} onAddStaff={addStaff} onUpdateStaff={updateStaff} onDeleteStaff={deleteStaff} />
                    )}

                    {currentTab === 'notifications' && (
                      <NotificationsView
                        announcements={announcements}
                        onAddAnnouncement={addAnnouncement}
                        onDeleteAnnouncement={deleteAnnouncement}
                      />
                    )}

                    {currentTab === 'ai_center' && (
                      <AICenterView
                          currentInstitution={institution || { id: authInstId || '', name: 'Your Institution', institution_code: '', studentsCount: 0, vendorsCount: 0, dailyOrdersCount: 0, monthlyRevenue: 0, status: 'active', contactPerson: '', email: '', phone: '', joinedDate: '', plan: 'Basic' }}
                          menuItems={menuItems}
                          orders={orders}
                        />
                    )}

                    {currentTab === 'settings' && (
                      <SettingsView currentInstitution={institution || { id: authInstId || '', name: 'Your Institution', institution_code: '', studentsCount: 0, vendorsCount: 0, dailyOrdersCount: 0, monthlyRevenue: 0, status: 'active', contactPerson: '', email: '', phone: '', joinedDate: '', plan: 'Basic' }} auditLogs={auditLogs} onUpdateInstitution={updateInstitution} />
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
       />
    </div>
  );
}

export default App;

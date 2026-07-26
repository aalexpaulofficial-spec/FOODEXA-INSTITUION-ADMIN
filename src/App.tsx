import React, { useState } from 'react';
import {
  INITIAL_INSTITUTIONS,
  INITIAL_STUDENTS,
  INITIAL_VENDORS,
  INITIAL_ORDERS,
  INITIAL_MENU_ITEMS,
  INITIAL_KITCHEN_QUEUE,
  INITIAL_CAMPUS_BLOCKS,
  INITIAL_STAFF,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_COUNTERS
} from './data/mockData';
import {
  Institution,
  Student,
  Vendor,
  Order,
  MenuItem,
  KitchenQueueItem,
  CampusBlock,
  StaffMember,
  Announcement,
  AuditLog,
  PortalRole,
  OrderStatus,
  Counter
} from './types';

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

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentPortal, setCurrentPortal] = useState<PortalRole>('campus_admin');
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  // Institutions State
  const [currentInstitution, setCurrentInstitution] = useState<Institution>(INITIAL_INSTITUTIONS[0]);

  // Operational Domain State
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);
  const [counters, setCounters] = useState<Counter[]>(INITIAL_COUNTERS);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [kitchenQueue, setKitchenQueue] = useState<KitchenQueueItem[]>(INITIAL_KITCHEN_QUEUE);
  const [campusBlocks] = useState<CampusBlock[]>(INITIAL_CAMPUS_BLOCKS);
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF);
  const [announcements, setAnnouncements] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);
  const [auditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);

  // Modals
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [isAISearchOpen, setIsAISearchOpen] = useState(false);
  const [isStudentSyncOpen, setIsStudentSyncOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handlers
  const handleLoginSuccess = (portal: PortalRole) => {
    setCurrentPortal(portal);
    setIsAuthenticated(true);
    if (portal === 'super_admin') {
      setCurrentTab('superadmin');
    } else {
      setCurrentTab('dashboard');
    }
  };

  const handlePortalChange = (portal: PortalRole) => {
    setCurrentPortal(portal);
    if (portal === 'super_admin') {
      setCurrentTab('superadmin');
    } else if (currentTab === 'superadmin') {
      setCurrentTab('dashboard');
    }
  };


  const handleUpdateStudentStatus = (studentId: string, status: 'active' | 'suspended') => {
    setStudents((prev) =>
      prev.map((s) => (s.id === studentId ? { ...s, status } : s))
    );
  };

  const handleApproveVendor = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, status: 'approved' } : v))
    );
  };

  const handleRejectVendor = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, status: 'rejected' } : v))
    );
  };

  const handleSuspendVendor = (vendorId: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === vendorId ? { ...v, status: 'suspended' } : v))
    );
  };

  const handleUpdateKitchenStatus = (itemId: string, status: OrderStatus) => {
    setKitchenQueue((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, status } : item))
    );
    // Real-time synchronization with orders list
    setOrders((prev) =>
      prev.map((o) => (o.id === itemId || o.orderNumber.includes(itemId) ? { ...o, status } : o))
    );
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const handleAddMenuItem = (item: MenuItem) => {
    setMenuItems((prev) => [item, ...prev]);
  };

  const handleToggleMenuAvailability = (itemId: string) => {
    setMenuItems((prev) =>
      prev.map((m) => (m.id === itemId ? { ...m, isAvailable: !m.isAvailable } : m))
    );
  };

  const handleToggleStaffPermission = (staffId: string, permKey: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === staffId
          ? {
              ...s,
              permissions: {
                ...s.permissions,
                [permKey as keyof typeof s.permissions]: !s.permissions[
                  permKey as keyof typeof s.permissions
                ]
              }
            }
          : s
      )
    );
  };

  const handleAddAnnouncement = (ann: Announcement) => {
    setAnnouncements((prev) => [ann, ...prev]);
  };



  // If unauthenticated, render login view
  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Top Header */}
      <Header
        currentPortal={currentPortal}
        onPortalChange={handlePortalChange}
        institutions={INITIAL_INSTITUTIONS}
        currentInstitution={currentInstitution}
        onInstitutionSelect={setCurrentInstitution}
        onOpenAISearch={() => setIsAISearchOpen(true)}
        onOpenQRScanner={() => setIsQRScannerOpen(true)}
        onOpenStudentSync={() => setIsStudentSyncOpen(true)}
        onLogout={() => setIsAuthenticated(false)}
        isMobileMenuOpen={isMobileMenuOpen}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      {/* Main Layout Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onTabChange={(tab) => {
            setCurrentTab(tab);
            setIsMobileMenuOpen(false);
          }}
          currentPortal={currentPortal}
          pendingVendorCount={vendors.filter((v) => v.status === 'pending').length}
          activeKitchenOrdersCount={kitchenQueue.filter((k) => k.status === 'preparing').length}
          isMobileMenuOpen={isMobileMenuOpen}
          onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
        />

        {/* Dynamic Workspace Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#09090B]">
          <div className="max-w-7xl mx-auto">
            {currentPortal !== 'super_admin' && (
              <>
                {currentTab === 'dashboard' && (
                  <HomeDashboard
                    currentInstitution={currentInstitution}
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
                    onUpdateStudentStatus={handleUpdateStudentStatus}
                  />
                )}

                {currentTab === 'canteens' && (
                  <CanteenManagement
                    vendors={vendors}
                    counters={counters}
                    onApproveVendor={handleApproveVendor}
                    onRejectVendor={handleRejectVendor}
                    onSuspendVendor={handleSuspendVendor}
                    onAddCounter={(c) => setCounters((prev) => [...prev, c])}
                    onToggleCounterAvailability={(counterId) =>
                      setCounters((prev) =>
                        prev.map((c) => (c.id === counterId ? { ...c, isAvailable: !c.isAvailable } : c))
                      )
                    }
                  />
                )}

                {currentTab === 'kitchen' && (
                  <KitchenDashboard
                    queueItems={kitchenQueue}
                    onUpdateKitchenStatus={handleUpdateKitchenStatus}
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
                    onAddMenuItem={handleAddMenuItem}
                    onToggleAvailability={handleToggleMenuAvailability}
                  />
                )}

                {currentTab === 'analytics' && <AnalyticsView />}

                {currentTab === 'reports' && <ReportsView />}

                {currentTab === 'campus' && <CampusManagement campusBlocks={campusBlocks} />}

                {currentTab === 'staff' && (
                  <StaffManagement staff={staff} onTogglePermission={handleToggleStaffPermission} />
                )}

                {currentTab === 'notifications' && (
                  <NotificationsView
                    announcements={announcements}
                    onAddAnnouncement={handleAddAnnouncement}
                  />
                )}

                {currentTab === 'ai_center' && (
                  <AICenterView
                    currentInstitution={currentInstitution}
                    menuItems={menuItems}
                    orders={orders}
                  />
                )}

                {currentTab === 'settings' && (
                  <SettingsView currentInstitution={currentInstitution} auditLogs={auditLogs} />
                )}
              </>
            )}

            {currentPortal === 'super_admin' && (
              <SuperAdminView />
            )}
          </div>
        </main>
      </div>

      {/* Global Modals */}
      <QRPickupScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        orders={orders}
        onVerifyPickup={(orderId) => handleUpdateOrderStatus(orderId, 'completed')}
      />

      <AISmartSearchModal
        isOpen={isAISearchOpen}
        onClose={() => setIsAISearchOpen(false)}
        students={students}
        vendors={vendors}
        menuItems={menuItems}
        orders={orders}
        onSelectEntity={(tab) => setCurrentTab(tab)}
      />

      <StudentDashboardSyncModal
        isOpen={isStudentSyncOpen}
        onClose={() => setIsStudentSyncOpen(false)}
        menuItems={menuItems}
        orders={orders}
        announcements={announcements}
        onPlaceTestOrder={(newOrd) => {
          setOrders((prev) => [newOrd, ...prev]);
          setKitchenQueue((prev) => [
            {
              id: newOrd.id,
              orderNumber: newOrd.orderNumber,
              itemsSummary: newOrd.items.map((i) => `${i.quantity}x ${i.name}`).join(', '),
              counterNumber: newOrd.pickupCounter || 'Counter B',
              status: 'pending',
              orderTime: newOrd.orderTime,
              elapsedSeconds: 0,
              isPriority: false,
              notes: newOrd.notes
            },
            ...prev
          ]);
        }}
      />
    </div>
  );
}

export default App;

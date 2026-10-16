
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import CustomerList from './components/CustomerList';
import POS from './components/POS';
import CheckInSimulator from './components/CheckInSimulator';
import AttendanceHistory from './components/AttendanceHistory';
import PlansManager from './components/PlansManager';
import Settings from './components/Settings';
import Reports from './components/Reports';
import InventoryManager from './components/InventoryManager';
import LoginScreen from './components/LoginScreen';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import AuthCard, { primaryButtonClass } from './components/AuthCard';
import { UserRole, Customer, Product, Sale, AttendanceRecord } from './types';
import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_ATTENDANCE } from './constants';
import { toLocalDateString } from './utils/date';
import { Session, clearSession, fetchMe, loadSession, roleLabel, saveSession, toUiRole } from './services/auth';
import { ApiError } from './services/api';
import { MembershipSummary, getCustomerDetail } from './services/members';

const SESSION_EXPIRED = 'Tu sesión expiró. Inicia sesión de nuevo.';

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [sessionNotice, setSessionNotice] = useState('');
  // The customer's own membership, read from the API. undefined = still loading, null = none.
  const [membership, setMembership] = useState<MembershipSummary | null | undefined>(undefined);
  const userRole = (session && toUiRole(session.user.role)) || UserRole.CUSTOMER;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Centralized State (Nuestra "Base de Datos" en vivo)
  const [customers, setCustomers] = useState<Customer[]>(MOCK_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [allowWithoutPlan, setAllowWithoutPlan] = useState(false);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const endSession = useCallback((notice = '') => {
    clearSession();
    setSession(null);
    setMembership(undefined);
    setSessionNotice(notice);
    setActiveTab('dashboard');
  }, []);

  const startSession = (next: Session) => {
    saveSession(next);
    setSession(next);
    setSessionNotice('');
    setActiveTab('dashboard');
  };

  // Resume the session of this tab, but only if the server still accepts the token.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = loadSession();
      if (stored) {
        try {
          await fetchMe(stored.accessToken);
          if (!cancelled) setSession(stored);
        } catch (err) {
          if (err instanceof ApiError && err.status === 401) {
            clearSession();
            if (!cancelled) setSessionNotice(SESSION_EXPIRED);
          } else if (!cancelled) {
            setSession(stored); // server unreachable: keep working with what we have
          }
        }
      }
      if (!cancelled) setBooting(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // A customer's header shows their real membership.
  useEffect(() => {
    if (!session || session.user.role !== 'customer' || !session.user.customerId || session.user.mustChangePassword) {
      setMembership(undefined);
      return;
    }
    let cancelled = false;
    getCustomerDetail(session.accessToken, session.user.customerId)
      .then((detail) => !cancelled && setMembership(detail.membership))
      .catch((err) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) endSession(SESSION_EXPIRED);
        else setMembership(null);
      });
    return () => {
      cancelled = true;
    };
  }, [session, endSession]);

  const handleLogout = () => endSession();

  const addCustomer = (newCustomer: Omit<Customer, 'id' | 'clientCode' | 'joinDate'>) => {
    const nextId = Math.max(...customers.map(c => c.id)) + 1;
    const nextCode = Math.max(...customers.map(c => c.clientCode)) + 1;
    const customer: Customer = {
      ...newCustomer,
      id: nextId,
      clientCode: nextCode,
      joinDate: new Date().toISOString().split('T')[0]
    };
    setCustomers([...customers, customer]);
  };

  const handleCheckIn = (customerId: number) => {
    const now = new Date();
    const newRecord: AttendanceRecord = {
      id: Date.now(),
      customerId,
      date: toLocalDateString(now),
      checkIn: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setAttendance([newRecord, ...attendance]);
  };

  const processSale = (cart: { id: number; qty: number; price: number }[]) => {
    const newProducts = products.map(p => {
      const cartItem = cart.find(item => item.id === p.id);
      if (cartItem) return { ...p, stock: p.stock - cartItem.qty };
      return p;
    });
    setProducts(newProducts);

    const newSales: Sale[] = cart.map(item => ({
      id: Date.now() + Math.random(),
      productId: item.id,
      amount: item.price * item.qty,
      quantity: item.qty,
      date: new Date().toISOString()
    }));
    setSales([...sales, ...newSales]);
  };

  const toggleCustomerStatus = (id: number) => {
    setCustomers(customers.map(c => 
      c.id === id ? { ...c, planStatus: c.planStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : c
    ));
  };

  // Función para descargar la "Base de Datos"
  const downloadDatabase = () => {
    const fullBackup = {
      metadata: {
        system: "FitOS Gym Manager",
        version: "1.0.0",
        exportDate: new Date().toISOString(),
        totalCustomers: customers.length,
        totalSales: sales.length
      },
      data: {
        customers,
        products,
        sales,
        attendance,
        config: {
          allowWithoutPlan,
          isDarkMode
        }
      }
    };

    const dataStr = JSON.stringify(fullBackup, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `fitos_backup_${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    linkElement.remove();
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'customers': return <CustomerList customers={customers} onAdd={addCustomer} onToggleStatus={toggleCustomerStatus} />;
      case 'pos': return <POS products={products} onProcessSale={processSale} />;
      case 'plans': return <PlansManager />;
      case 'attendance': return <AttendanceHistory records={userRole === UserRole.CUSTOMER ? [] : attendance} />;
      case 'checkin': return <CheckInSimulator customers={customers} allowWithoutPlan={allowWithoutPlan} onCheckIn={handleCheckIn} />;
      case 'settings': return (
        <Settings 
          allowWithoutPlan={allowWithoutPlan} 
          setAllowWithoutPlan={setAllowWithoutPlan} 
          onDownloadBackup={downloadDatabase} 
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
      );
      case 'reports': return <Reports customers={customers} sales={sales} />;
      case 'inventory': return <InventoryManager products={products} onUpdate={setProducts} />;
      default: return <Dashboard />;
    }
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-500 font-bold">
        Cargando…
      </div>
    );
  }

  if (!session) {
    return <LoginScreen onLoggedIn={startSession} notice={sessionNotice} />;
  }

  if (session.user.mustChangePassword) {
    return (
      <ChangePasswordScreen
        session={session}
        onChanged={startSession}
        onExpired={() => endSession(SESSION_EXPIRED)}
        onLogout={handleLogout}
      />
    );
  }

  if (toUiRole(session.user.role) === null) {
    return (
      <AuthCard subtitle="Cuenta de plataforma">
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8">
          Esta cuenta administra la plataforma, no un gimnasio. Este panel es para el personal y los socios de cada gimnasio.
        </p>
        <button onClick={handleLogout} className={primaryButtonClass}>Salir</button>
      </AuthCard>
    );
  }

  const badge = session.user.role !== 'customer'
    ? roleLabel(session.user.role)
    : membership === undefined
      ? 'Cargando…'
      : membership && (membership.state === 'current' || membership.state === 'scheduled')
        ? `${membership.planName} · ${membership.state === 'current' ? 'Activo' : 'Programado'}`
        : 'Sin plan vigente';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout} 
        userRole={userRole}
        isDarkMode={isDarkMode}
        toggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />
      
      <main className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="max-w-7xl mx-auto p-10">
          <header className="flex justify-between items-center mb-12 bg-white dark:bg-slate-900/40 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800/50 backdrop-blur-xl shadow-sm dark:shadow-none">
            <div>
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Operaciones de Gimnasio</span>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                {userRole === UserRole.ADMIN ? 'Consola de Mando' : 'Mi Membresía'}
              </h2>
            </div>
            <div className="flex items-center gap-5">
              <div className="text-right hidden sm:block">
                <p className="text-lg font-black text-slate-900 dark:text-white leading-none">
                  {session.user.displayName}
                </p>
                <p className="text-[10px] text-slate-500 font-black uppercase mt-1.5 tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block">
                  {badge}
                </p>
              </div>
              <div aria-hidden="true" className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center text-xl font-black shadow-lg">
                {initials(session.user.displayName)}
              </div>
            </div>
          </header>

          <div className="pb-24">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

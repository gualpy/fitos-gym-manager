
import React, { useState, useEffect } from 'react';
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
import { UserRole, Product, Sale } from './types';
import { MOCK_PRODUCTS } from './constants';
import { Session, getSession, logout, restoreSession, roleLabel, setSession as startSessionOf, subscribe, toUiRole } from './services/auth';
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
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // The session lives in the session manager (it renews itself); this component only mirrors it.
  useEffect(() => {
    let cancelled = false;
    const unsubscribe = subscribe((next, reason) => {
      if (cancelled) return;
      setSession(next);
      if (reason === 'expired') {
        setSessionNotice(SESSION_EXPIRED);
        setActiveTab('dashboard');
      }
    });

    (async () => {
      await restoreSession();
      if (!cancelled) {
        setSession(getSession());
        setBooting(false);
      }
    })();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  const startSession = (next: Session) => {
    startSessionOf(next);
    setSessionNotice('');
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    void logout();
    setSessionNotice('');
    setActiveTab('dashboard');
  };

  // A customer's header shows their real membership.
  const role = session?.user.role;
  const customerId = session?.user.customerId;
  const passwordPending = session?.user.mustChangePassword ?? false;
  useEffect(() => {
    if (role !== 'customer' || !customerId || passwordPending) {
      setMembership(undefined);
      return;
    }
    let cancelled = false;
    getCustomerDetail(customerId)
      .then((detail) => !cancelled && setMembership(detail.membership))
      .catch((err) => {
        if (!cancelled && !(err instanceof ApiError && err.status === 401)) setMembership(null);
      });
    return () => {
      cancelled = true;
    };
  }, [role, customerId, passwordPending]);

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

  const renderContent = () => {
    if (!session) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard session={session} />;
      case 'customers': return <CustomerList />;
      case 'pos': return <POS products={products} onProcessSale={processSale} />;
      case 'plans': return <PlansManager />;
      case 'attendance': return <AttendanceHistory session={session} />;
      case 'checkin': return <CheckInSimulator />;
      case 'settings': return (
        <Settings
          canEdit={session.user.role === 'owner' || session.user.role === 'admin'}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
      );
      case 'reports': return <Reports sales={sales} />;
      case 'inventory': return <InventoryManager products={products} onUpdate={setProducts} />;
      default: return <Dashboard session={session} />;
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


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
import { UserRole, Customer, Product, Sale, AttendanceRecord, AppUser } from './types';
import { MOCK_CUSTOMERS, MOCK_PRODUCTS, MOCK_ATTENDANCE, MOCK_USERS } from './constants';
import { Dumbbell } from 'lucide-react';

const sha256Hex = async (text: string) => {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const isLoggedIn = currentUser !== null;
  const userRole = currentUser?.role ?? UserRole.CUSTOMER;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginBusy(true);
    setLoginError('');
    try {
      const username = loginUser.trim().toLowerCase();
      const hash = await sha256Hex(`${username}:${loginPass}`);
      const user = MOCK_USERS.find(u => u.username === username && u.passwordHash === hash);
      if (!user) {
        setLoginError('Usuario o contraseña incorrectos');
        return;
      }
      setCurrentUser(user);
      setActiveTab('dashboard');
      setLoginPass('');
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setLoginUser('');
    setLoginPass('');
  };

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
      date: now.toISOString().split('T')[0],
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
      case 'attendance': return <AttendanceHistory records={attendance} customerId={userRole === UserRole.CUSTOMER ? currentUser?.customerId : undefined} />;
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

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-10 shadow-2xl animate-in zoom-in duration-500">
          <div className="flex justify-center mb-8">
            <div className="bg-blue-600 p-5 rounded-3xl shadow-2xl shadow-blue-600/30">
              <Dumbbell className="text-white w-12 h-12" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-center text-slate-900 dark:text-white mb-2 tracking-tighter">Fit<span className="text-blue-500">OS</span></h1>
          <p className="text-slate-500 text-center mb-10 font-bold uppercase tracking-[0.2em] text-xs">Gym Intelligence System</p>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Acceso de Usuario</label>
              <input 
                type="text" 
                required
                autoComplete="username"
                value={loginUser}
                onChange={(e) => setLoginUser(e.target.value)}
                placeholder="Usuario"
                className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase ml-1 tracking-widest">Contraseña</label>
              <input 
                type="password" 
                required
                autoComplete="current-password"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all font-bold"
              />
            </div>
            {loginError && <p role="alert" className="text-red-500 text-sm font-bold text-center">{loginError}</p>}
            <button disabled={loginBusy} className="w-full disabled:opacity-60 bg-blue-600 hover:bg-blue-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-blue-600/20 transition-all active:scale-[0.98] text-lg uppercase tracking-widest">
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

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
                  {currentUser?.displayName}
                </p>
                <p className="text-[10px] text-slate-500 font-black uppercase mt-1.5 tracking-widest bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full inline-block">
                  {userRole === UserRole.ADMIN ? 'Control Total' : 'Plan Gold · Activo'}
                </p>
              </div>
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.username}`} className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 p-0.5 shadow-lg" alt="Avatar" />
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

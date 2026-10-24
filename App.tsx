
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
import BodyProgress from './components/BodyProgress';
import TeamManager from './components/TeamManager';
import InventoryManager from './components/InventoryManager';
import LoginScreen from './components/LoginScreen';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import AuthCard, { primaryButtonClass } from './components/AuthCard';
import PlatformPanel from './components/PlatformPanel';
import SubscriptionBanner from './components/SubscriptionBanner';
import { ConfirmLoginScreen, ConfirmationSentScreen, SetPasswordScreen } from './components/LinkScreens';
import { UserRole } from './types';
import { PendingLogin, Session, clearSession, getSession, logout, restoreSession, roleLabel, setSession as startSessionOf, subscribe, toUiRole } from './services/auth';
import { ApiError } from './services/api';
import { MembershipSummary, getCustomerDetail } from './services/members';

const SESSION_EXPIRED = 'Tu sesión expiró. Inicia sesión de nuevo.';

// The theme is a per-person preference kept in this browser, under the user's id (a shared computer keeps each one's own).
const themeKey = (userId: string) => `fitos.theme.${userId}`;

const readTheme = (userId: string): boolean | null => {
  try {
    const stored = localStorage.getItem(themeKey(userId));
    return stored === 'dark' ? true : stored === 'light' ? false : null;
  } catch {
    return null;
  }
};

// One-time links from e-mails carry their token in the URL fragment (it never reaches a server log).
type EmailLink = { kind: 'confirm' | 'setup'; token: string };

const readEmailLink = (): EmailLink | null => {
  const match = /^#(confirm|setup)=([A-Za-z0-9_-]{10,200})$/.exec(window.location.hash);
  return match ? { kind: match[1] as EmailLink['kind'], token: match[2] } : null;
};

const dropEmailLink = () => window.history.replaceState(null, '', window.location.pathname + window.location.search);

const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || '?';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [booting, setBooting] = useState(true);
  const [sessionNotice, setSessionNotice] = useState('');
  const [emailLink, setEmailLink] = useState<EmailLink | null>(readEmailLink);
  const [pending, setPending] = useState<PendingLogin | null>(null);
  // The customer's own membership, read from the API. undefined = still loading, null = none.
  const [membership, setMembership] = useState<MembershipSummary | null | undefined>(undefined);
  const userRole = (session && toUiRole(session.user.role)) || UserRole.CUSTOMER;
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setDarkMode] = useState(false);
  const userId = session?.user.id;

  // Light by default; whoever signs in gets back the theme they chose, and the login screen goes back to light.
  useEffect(() => {
    setDarkMode((userId && readTheme(userId)) || false);
  }, [userId]);

  const setIsDarkMode = (dark: boolean) => {
    setDarkMode(dark);
    if (!userId) return;
    try {
      localStorage.setItem(themeKey(userId), dark ? 'dark' : 'light');
    } catch {
      // Storage blocked (private window): the choice just lasts for this visit.
    }
  };

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

  // A link can also be opened in a tab that is already running the app (only the fragment changes, nothing reloads).
  useEffect(() => {
    const onHashChange = () => {
      const link = readEmailLink();
      if (link) setEmailLink(link);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const closeEmailLink = () => {
    dropEmailLink();
    setEmailLink(null);
  };

  // The administrator typed the right password; the session only exists once the e-mailed link is opened.
  const handlePending = (next: PendingLogin) => {
    clearSession();
    setPending(next);
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

  const canManageTeam = session?.user.role === 'owner' || session?.user.role === 'admin';

  const renderContent = () => {
    if (!session) return null;
    switch (activeTab) {
      case 'dashboard': return <Dashboard session={session} />;
      case 'customers': return <CustomerList canGiveFree={session.user.role === 'owner' || session.user.role === 'admin'} />;
      case 'pos': return <POS />;
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
      case 'progress': return <BodyProgress session={session} />;
      case 'reports': return <Reports session={session} />;
      case 'team': return canManageTeam ? <TeamManager session={session} /> : <Dashboard session={session} />;
      case 'inventory': return <InventoryManager canEdit={session.user.role === 'owner' || session.user.role === 'admin'} />;
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

  if (emailLink?.kind === 'confirm') {
    return <ConfirmLoginScreen token={emailLink.token} onLoggedIn={startSession} onDone={closeEmailLink} />;
  }

  if (emailLink?.kind === 'setup') {
    return <SetPasswordScreen token={emailLink.token} onDone={closeEmailLink} />;
  }

  if (!session) {
    return pending
      ? <ConfirmationSentScreen pending={pending} onBack={() => setPending(null)} />
      : <LoginScreen onLoggedIn={startSession} onPending={setPending} notice={sessionNotice} />;
  }

  if (session.user.mustChangePassword) {
    return (
      <ChangePasswordScreen
        session={session}
        onChanged={startSession}
        onPending={handlePending}
        onLogout={handleLogout}
      />
    );
  }

  if (session.user.role === 'platform_admin') {
    return <PlatformPanel session={session} onLogout={handleLogout} />;
  }

  if (toUiRole(session.user.role) === null) {
    return (
      <AuthCard subtitle="Cuenta no compatible">
        <p className="text-slate-500 dark:text-slate-400 text-sm text-center mb-8">
          Esta cuenta no puede usar este panel.
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
        canManageTeam={canManageTeam}
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

          {session.user.role !== 'customer' && <SubscriptionBanner />}

          <div className="pb-24">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PasswordInputProps {
  value: string;
  onChange: (value: string) => void;
  autoComplete: 'current-password' | 'new-password';
  placeholder?: string;
  autoFocus?: boolean;
}

/** Password field with a show/hide toggle. */
const PasswordInput: React.FC<PasswordInputProps> = ({ value, onChange, autoComplete, placeholder = '••••••••', autoFocus }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? 'text' : 'password'}
        required
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl pl-5 pr-14 py-4 text-slate-900 dark:text-white focus:border-blue-600 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600 transition-all font-bold"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-blue-500 focus:text-blue-500 focus:outline-none transition-colors"
      >
        {visible ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
      </button>
    </div>
  );
};

export default PasswordInput;

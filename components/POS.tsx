
import React, { useState } from 'react';
import { Product } from '../types';
import { ShoppingBasket, Search, Plus, Minus, Receipt, CheckCircle2 } from 'lucide-react';

interface POSProps {
  products: Product[];
  onProcessSale: (cart: any[]) => void;
}

const POS: React.FC<POSProps> = ({ products, onProcessSale }) => {
  const [cart, setCart] = useState<{ id: number; name: string; price: number; qty: number }[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setCart(prev => {
      const existing = prev.find(p => p.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev;
        return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
      }
      return [...prev, { id: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(p => p.id !== id));
  };

  const handleProcess = () => {
    onProcessSale(cart);
    setCart([]);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const total = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">Venta de Productos</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products.map((product) => (
            <button
              key={product.id}
              disabled={product.stock <= 0}
              onClick={() => addToCart(product)}
              className={`flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-2xl transition-all text-left active:scale-[0.98] ${product.stock <= 0 ? 'opacity-50 grayscale' : 'hover:bg-slate-750'}`}
            >
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{product.category}</span>
                <h4 className="font-bold text-white mt-0.5">{product.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-slate-400 font-mono text-lg font-bold">${product.price.toFixed(2)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${product.stock < 5 ? 'bg-red-500/20 text-red-500' : 'bg-slate-700 text-slate-400'}`}>
                    Stock: {product.stock}
                  </span>
                </div>
              </div>
              <div className="bg-blue-600/10 p-3 rounded-xl text-blue-500">
                <Plus className="w-5 h-5" />
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-3xl border border-slate-700 p-6 h-fit sticky top-8 flex flex-col shadow-2xl overflow-hidden">
        {showSuccess && (
          <div className="absolute inset-0 bg-blue-600 flex flex-col items-center justify-center text-white z-10 animate-in fade-in duration-300">
            <CheckCircle2 className="w-16 h-16 mb-4 animate-bounce" />
            <h3 className="text-2xl font-black">¡Venta Exitosa!</h3>
            <p className="opacity-80">Inventario actualizado.</p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <ShoppingBasket className="text-blue-500 w-6 h-6" />
          <h3 className="text-xl font-bold text-white">Carrito</h3>
        </div>

        <div className="flex-1 space-y-3 mb-8 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic text-sm">El carrito está vacío.</div>
          ) : (
            cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                <div>
                  <h5 className="text-xs font-bold text-white">{item.name}</h5>
                  <p className="text-[10px] text-slate-500">{item.qty} uni x ${item.price}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono font-bold text-blue-400">${(item.price * item.qty).toFixed(2)}</span>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t border-slate-700 pt-6 space-y-4">
          <div className="flex justify-between text-2xl font-black text-white">
            <span>Total</span>
            <span className="text-blue-500">${total.toFixed(2)}</span>
          </div>
          <button 
            onClick={handleProcess}
            disabled={cart.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <Receipt className="w-5 h-5" /> COBRAR AHORA
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;

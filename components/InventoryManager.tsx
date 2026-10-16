
import React, { useState } from 'react';
import { Product } from '../types';
import { Package, Plus, Edit2, Trash2, Save, X } from 'lucide-react';

interface InventoryManagerProps {
  products: Product[];
  onUpdate: (products: Product[]) => void;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ products, onUpdate }) => {
  const [editingId, setEditingId] = useState<number | null>(null);

  const handleStockChange = (id: number, delta: number) => {
    const updated = products.map(p => 
      p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p
    );
    onUpdate(updated);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Inventario de Productos</h2>
          <p className="text-slate-400">Control de stock de suplementos, bebidas y accesorios.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
          <Plus className="w-5 h-5" /> Nuevo Producto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.id} className="bg-slate-800 border border-slate-700 rounded-3xl p-6 hover:border-slate-500 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <Package className="w-6 h-6" />
              </div>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"><Edit2 className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-red-500/10 rounded-lg text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-white mb-1">{product.name}</h3>
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-4">{product.category}</p>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Precio</p>
                <p className="text-2xl font-black text-white">${product.price.toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">En Stock</p>
                <div className="flex items-center gap-3 bg-slate-900 rounded-xl p-1 border border-slate-700">
                  <button 
                    onClick={() => handleStockChange(product.id, -1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-400"
                  >-</button>
                  <span className={`font-mono font-bold w-8 text-center ${product.stock < 10 ? 'text-red-500' : 'text-blue-400'}`}>
                    {product.stock}
                  </span>
                  <button 
                    onClick={() => handleStockChange(product.id, 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded-lg text-slate-400"
                  >+</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InventoryManager;

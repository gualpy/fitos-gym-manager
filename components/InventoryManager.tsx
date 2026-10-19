import React, { useCallback, useEffect, useState } from 'react';
import { Package, Plus, Edit3, Power, X, Search, PackagePlus } from 'lucide-react';
import { Product, ProductInput, StockReason, adjustStock, createProduct, listProducts, setProductActive, updateProduct } from '../services/products';
import { errorText, formErrorText } from '../utils/errors';

const LOW_STOCK = 10;

const emptyForm = { name: '', sku: '', barcode: '', category: '', price: '', ivaRate: '15', stock: '0' };
type Form = typeof emptyForm;

const toForm = (product: Product): Form => ({
  name: product.name,
  sku: product.sku ?? '',
  barcode: product.barcode ?? '',
  category: product.category ?? '',
  price: String(product.price),
  ivaRate: String(product.ivaRate),
  stock: String(product.stock),
});

const money = (value: number) => value.toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

const inputClass = 'w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl px-5 py-4 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold';
const labelClass = 'text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1';
const errorClass = 'text-sm font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl px-5 py-3';

interface InventoryManagerProps {
  /** Only owners and administrators change the catalogue and the stock. */
  canEdit: boolean;
}

const InventoryManager: React.FC<InventoryManagerProps> = ({ canEdit }) => {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [editing, setEditing] = useState<Product | 'new' | null>(null);
  const [form, setForm] = useState<Form>(emptyForm);
  const [adjusting, setAdjusting] = useState<Product | null>(null);
  const [adjust, setAdjust] = useState({ delta: '', reason: 'purchase' as StockReason });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Wait for a pause in typing before asking the server.
  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    try {
      setProducts(await listProducts({ q: query || undefined, includeInactive: showInactive }));
      setLoadError('');
    } catch (err) {
      setLoadError(errorText(err, 'No se pudo cargar el inventario.'));
    }
  }, [query, showInactive]);

  useEffect(() => {
    void load();
  }, [load]);

  const openForm = (target: Product | 'new') => {
    setEditing(target);
    setForm(target === 'new' ? emptyForm : toForm(target));
    setFormError('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input: ProductInput = {
      name: form.name,
      sku: form.sku,
      barcode: form.barcode,
      category: form.category,
      price: Number(form.price),
      ivaRate: Number(form.ivaRate),
      ...(editing === 'new' ? { stock: Number(form.stock) } : {}),
    };
    setSaving(true);
    setFormError('');
    try {
      if (editing === 'new') await createProduct(input);
      else if (editing) await updateProduct(editing.id, input);
      setEditing(null);
      await load();
    } catch (err) {
      setFormError(formErrorText(err, 'No se pudo guardar el producto.'));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (product: Product) => {
    try {
      await setProductActive(product.id, !product.isActive);
      await load();
    } catch (err) {
      setLoadError(formErrorText(err, 'No se pudo cambiar el estado del producto.'));
    }
  };

  const openAdjust = (product: Product) => {
    setAdjusting(product);
    setAdjust({ delta: '', reason: 'purchase' });
    setFormError('');
  };

  const submitAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjusting) return;
    setSaving(true);
    setFormError('');
    try {
      await adjustStock(adjusting.id, Number(adjust.delta), adjust.reason);
      setAdjusting(null);
      await load();
    } catch (err) {
      setFormError(formErrorText(err, 'No se pudo cambiar el stock.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Inventario de Productos</h2>
          <p className="text-slate-500 dark:text-slate-400">Control de stock de suplementos, bebidas y accesorios.</p>
        </div>
        {canEdit && (
          <button onClick={() => openForm('new')} className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20">
            <Plus className="w-5 h-5" /> Nuevo Producto
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            aria-label="Buscar productos"
            placeholder="Buscar por nombre, código o categoría"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold"
          />
        </div>
        <label className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
          <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} className="w-5 h-5" />
          Mostrar desactivados
        </label>
      </div>

      {loadError && <p role="alert" className={errorClass}>{loadError}</p>}
      {products === null && !loadError && <p className="text-slate-500 font-bold">Cargando inventario…</p>}
      {products?.length === 0 && (
        <p className="text-slate-500 font-bold">{query ? 'Ningún producto coincide con la búsqueda.' : 'Aún no hay productos.'}</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products?.map((product) => (
          <div key={product.id} className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 hover:border-slate-400 dark:hover:border-slate-500 transition-colors ${product.isActive ? '' : 'opacity-60'}`}>
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
                <Package className="w-6 h-6" />
              </div>
              <div className="flex gap-2 items-center">
                {!product.isActive && <span className="bg-slate-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">Desactivado</span>}
                {canEdit && (
                  <>
                    <button onClick={() => openForm(product)} aria-label={`Editar ${product.name}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"><Edit3 className="w-4 h-4" /></button>
                    <button onClick={() => toggle(product)} aria-label={product.isActive ? `Desactivar ${product.name}` : `Activar ${product.name}`} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400"><Power className="w-4 h-4" /></button>
                  </>
                )}
              </div>
            </div>

            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{product.name}</h3>
            <p className="text-xs text-slate-500 uppercase font-black tracking-widest mb-1">{product.category ?? 'Sin categoría'}</p>
            <p className="text-[11px] text-slate-400 mb-4 min-h-4">{[product.sku, product.barcode].filter(Boolean).join(' · ')}</p>

            <div className="flex justify-between items-end">
              <div>
                <p className="text-xs text-slate-500 font-bold uppercase mb-1">Precio</p>
                <p className="text-2xl font-black text-slate-900 dark:text-white">{money(product.price)}</p>
                <p className="text-[10px] text-slate-400">+ IVA {product.ivaRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold uppercase mb-2">En Stock</p>
                <div className="flex items-center gap-3">
                  <span className={`font-mono text-2xl font-black ${product.stock < LOW_STOCK ? 'text-red-500' : 'text-blue-500'}`}>{product.stock}</span>
                  {canEdit && (
                    <button onClick={() => openAdjust(product)} aria-label={`Ajustar stock de ${product.name}`} className="p-2 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-slate-500 border border-slate-200 dark:border-slate-700">
                      <PackagePlus className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-[3rem] overflow-hidden shadow-2xl max-h-full overflow-y-auto">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editing === 'new' ? 'Nuevo producto' : 'Editar producto'}</h3>
              <button onClick={() => setEditing(null)} aria-label="Cerrar" className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={submit} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className={labelClass} htmlFor="prod-name">Nombre</label>
                <input id="prod-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="prod-sku">Código interno</label>
                  <input id="prod-sku" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="prod-barcode">Código de barras</label>
                  <input id="prod-barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="space-y-2">
                <label className={labelClass} htmlFor="prod-category">Categoría</label>
                <input id="prod-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="prod-price">Precio sin IVA (USD)</label>
                  <input id="prod-price" required type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="prod-iva">IVA</label>
                  <select id="prod-iva" value={form.ivaRate} onChange={(e) => setForm({ ...form, ivaRate: e.target.value })} className={inputClass}>
                    <option value="15">15 %</option>
                    <option value="5">5 %</option>
                    <option value="0">0 %</option>
                  </select>
                </div>
              </div>
              {editing === 'new' ? (
                <div className="space-y-2">
                  <label className={labelClass} htmlFor="prod-stock">Stock inicial</label>
                  <input id="prod-stock" type="number" min="0" step="1" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} />
                </div>
              ) : (
                <p className="text-xs text-slate-500">El stock se cambia con el botón de ajuste de la tarjeta, para que quede registrado el motivo.</p>
              )}
              {formError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-blue-600/30 uppercase tracking-widest">
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
            </form>
          </div>
        </div>
      )}

      {adjusting && (
        <div className="fixed inset-0 bg-slate-900/60 dark:bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/30">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Ajustar stock</h3>
                <p className="text-sm text-slate-500 font-bold">{adjusting.name} · hay {adjusting.stock}</p>
              </div>
              <button onClick={() => setAdjusting(null)} aria-label="Cerrar" className="p-3 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-2xl text-slate-400 transition-colors"><X className="w-8 h-8" /></button>
            </div>
            <form onSubmit={submitAdjust} className="p-10 space-y-6">
              <div className="space-y-2">
                <label className={labelClass} htmlFor="adj-reason">Motivo</label>
                <select id="adj-reason" value={adjust.reason} onChange={(e) => setAdjust({ ...adjust, reason: e.target.value as StockReason })} className={inputClass}>
                  <option value="purchase">Compra de mercadería</option>
                  <option value="adjustment">Ajuste de inventario</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className={labelClass} htmlFor="adj-delta">Cantidad (negativa para restar)</label>
                <input id="adj-delta" required type="number" step="1" value={adjust.delta} onChange={(e) => setAdjust({ ...adjust, delta: e.target.value })} className={inputClass} />
              </div>
              {formError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{formError}</p>}
              <button type="submit" disabled={saving} className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-blue-600/30 uppercase tracking-widest">
                {saving ? 'Guardando…' : 'Aplicar'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;

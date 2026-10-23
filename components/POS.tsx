import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ShoppingBasket, Search, Plus, Minus, Receipt, CheckCircle2, UserRound, X } from 'lucide-react';
import { Product, listProducts } from '../services/products';
import { Customer, searchCustomers } from '../services/customers';
import { PAYMENT_METHODS, PaymentMethod, Sale, cartTotals, createSale } from '../services/sales';
import { errorText, formErrorText } from '../utils/errors';

const LOW_STOCK = 5;

const money = (value: number) => value.toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

const fieldClass = 'w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold';

const POS: React.FC = () => {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [loadError, setLoadError] = useState('');
  const [filter, setFilter] = useState('');
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [method, setMethod] = useState<PaymentMethod>('cash');

  const [paying, setPaying] = useState(false);
  const [saleError, setSaleError] = useState('');
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const load = useCallback(async () => {
    try {
      setProducts(await listProducts());
      setLoadError('');
    } catch (err) {
      setLoadError(errorText(err, 'No se pudieron cargar los productos.'));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Look for the member after a pause in typing.
  useEffect(() => {
    const text = customerSearch.trim();
    if (!text) {
      setCustomerResults([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      searchCustomers({ q: text, status: 'active', pageSize: 5 })
        .then((page) => !cancelled && setCustomerResults(page.items))
        .catch(() => !cancelled && setCustomerResults([]));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customerSearch]);

  const visible = useMemo(() => {
    const text = filter.trim().toLowerCase();
    return (products ?? []).filter(
      (p) => !text || [p.name, p.category, p.sku, p.barcode].some((value) => value?.toLowerCase().includes(text)),
    );
  }, [products, filter]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    setLastSale(null);
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (!existing) return [...prev, { product, quantity: 1 }];
      if (existing.quantity >= product.stock) return prev;
      return prev.map((line) => (line.product.id === product.id ? { ...line, quantity: line.quantity + 1 } : line));
    });
  };

  const decrease = (id: string) =>
    setCart((prev) =>
      prev.flatMap((line) => (line.product.id !== id ? [line] : line.quantity > 1 ? [{ ...line, quantity: line.quantity - 1 }] : [])),
    );

  const totals = cartTotals(cart.map((line) => ({ price: line.product.price, ivaRate: line.product.ivaRate, quantity: line.quantity })));

  const charge = async () => {
    setPaying(true);
    setSaleError('');
    try {
      const sale = await createSale({
        customerId: customer?.id,
        lines: cart.map((line) => ({ productId: line.product.id, quantity: line.quantity })),
        payments: [{ method, amount: totals.total }],
      });
      setLastSale(sale);
      setCart([]);
      setCustomer(null);
      setCustomerSearch('');
      await load();
    } catch (err) {
      setSaleError(formErrorText(err, 'No se pudo registrar la venta.'));
      await load(); // stock may have changed under us
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Venta de Productos</h2>
          <div className="relative sm:w-72">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input autoComplete="off"
              type="search"
              aria-label="Buscar producto"
              placeholder="Buscar producto"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:border-blue-600 outline-none font-bold"
            />
          </div>
        </div>

        {loadError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{loadError}</p>}
        {products === null && !loadError && <p className="text-slate-500 font-bold">Cargando productos…</p>}
        {products && visible.length === 0 && (
          <p className="text-slate-500 font-bold">{products.length === 0 ? 'No hay productos a la venta. Créalos en Inventario.' : 'Ningún producto coincide.'}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {visible.map((product) => (
            <button
              key={product.id}
              disabled={product.stock <= 0}
              onClick={() => addToCart(product)}
              className={`flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl transition-all text-left active:scale-[0.98] ${product.stock <= 0 ? 'opacity-50 grayscale' : 'hover:border-blue-500'}`}
            >
              <div>
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{product.category ?? 'Sin categoría'}</span>
                <h4 className="font-bold text-slate-900 dark:text-white mt-0.5">{product.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <p className="text-slate-500 dark:text-slate-400 font-mono text-lg font-bold">{money(product.price)}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${product.stock < LOW_STOCK ? 'bg-red-500/20 text-red-500' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
                    {product.stock <= 0 ? 'Agotado' : `Stock: ${product.stock}`}
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

      <div className="relative bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 h-fit sticky top-8 flex flex-col shadow-2xl overflow-hidden">
        {lastSale && (
          <div className="absolute inset-0 bg-blue-600 flex flex-col items-center justify-center text-white z-10 animate-in fade-in duration-300 p-6 text-center">
            <CheckCircle2 className="w-16 h-16 mb-4" />
            <h3 className="text-2xl font-black">¡Venta registrada!</h3>
            <p className="opacity-90 mt-1">Total cobrado: {money(lastSale.total)}</p>
            <p className="opacity-70 text-sm">Inventario actualizado.</p>
            <button onClick={() => setLastSale(null)} className="mt-6 bg-white text-blue-600 font-black px-6 py-3 rounded-2xl">Nueva venta</button>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6">
          <ShoppingBasket className="text-blue-500 w-6 h-6" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">Carrito</h3>
        </div>

        <div className="flex-1 space-y-3 mb-6 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-500 italic text-sm">El carrito está vacío.</div>
          ) : (
            cart.map(({ product, quantity }) => (
              <div key={product.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
                <div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">{product.name}</h5>
                  <p className="text-[10px] text-slate-500">{quantity} × {money(product.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-blue-500 mr-1">{money(product.price * quantity)}</span>
                  <button onClick={() => decrease(product.id)} aria-label={`Quitar una unidad de ${product.name}`} className="text-red-500 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => addToCart(product)}
                    disabled={quantity >= product.stock}
                    aria-label={`Agregar una unidad de ${product.name}`}
                    className="text-blue-500 hover:bg-blue-500/10 disabled:opacity-30 p-1.5 rounded-lg transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="pos-customer">Socio (opcional)</label>
            {customer ? (
              <div className="mt-1 flex items-center justify-between bg-slate-50 dark:bg-slate-900 border-2 border-blue-500/40 rounded-xl px-4 py-3">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white"><UserRound className="w-4 h-4 text-blue-500" />{customer.name}</span>
                <button onClick={() => setCustomer(null)} aria-label="Quitar socio" className="text-slate-400 hover:text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <>
                <input autoComplete="off"
                  id="pos-customer"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Nombre, cédula o código; vacío = consumidor final"
                  className={`${fieldClass} mt-1`}
                />
                {customerResults.length > 0 && (
                  <ul className="mt-2 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                    {customerResults.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => {
                            setCustomer(c);
                            setCustomerResults([]);
                          }}
                          className="w-full text-left px-4 py-2 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-blue-500/10"
                        >
                          {c.name} <span className="text-slate-400 font-normal">#{c.clientCode}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest" htmlFor="pos-method">Forma de pago</label>
            <select id="pos-method" value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)} className={`${fieldClass} mt-1`}>
              {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        <div className="border-t border-slate-200 dark:border-slate-700 pt-6 space-y-4">
          <div className="space-y-1 text-sm text-slate-500 dark:text-slate-400 font-bold">
            <div className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
            <div className="flex justify-between"><span>IVA</span><span>{money(totals.tax)}</span></div>
          </div>
          <div className="flex justify-between text-2xl font-black text-slate-900 dark:text-white">
            <span>Total</span>
            <span className="text-blue-500">{money(totals.total)}</span>
          </div>
          {saleError && <p role="alert" className="text-sm font-bold text-red-600 dark:text-red-400">{saleError}</p>}
          <button
            onClick={charge}
            disabled={cart.length === 0 || paying}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-600/20 flex items-center justify-center gap-3 transition-all active:scale-95"
          >
            <Receipt className="w-5 h-5" /> {paying ? 'COBRANDO…' : 'COBRAR AHORA'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default POS;

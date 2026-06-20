import { useState } from 'react';

interface Sale {
  id: string;
  date: string;
  time: string;
  seller: string;
  payment: string;
  paymentIcon: string;
  total: number;
}

const sales: Sale[] = [
  { id: 'VP-29831', date: '24 May 2024', time: '14:22', seller: 'Silvana', payment: 'Tarjeta', paymentIcon: 'credit_card', total: 145.20 },
  { id: 'VP-29830', date: '24 May 2024', time: '13:58', seller: 'Marcelo', payment: 'Efectivo', paymentIcon: 'payments', total: 52.00 },
  { id: 'VP-29829', date: '24 May 2024', time: '12:45', seller: 'Ariana', payment: 'Transferencia', paymentIcon: 'swap_horiz', total: 312.80 },
  { id: 'VP-29828', date: '24 May 2024', time: '11:30', seller: 'Silvana', payment: 'QR', paymentIcon: 'qr_code_2', total: 88.50 },
  { id: 'VP-29827', date: '24 May 2024', time: '10:15', seller: 'Marcelo', payment: 'Tarjeta', paymentIcon: 'credit_card', total: 540.00 },
  { id: 'VP-29826', date: '23 May 2024', time: '17:45', seller: 'Ariana', payment: 'Efectivo', paymentIcon: 'payments', total: 120.00 },
];

const saleDetails: Record<string, { products: { name: string; qty: number; price: number }[] }> = {
  'VP-29831': { products: [{ name: 'Alimento Premium Perro (15kg)', qty: 2, price: 65.00 }, { name: 'Juguete Mordedor Caucho', qty: 1, price: 15.20 }] },
  'VP-29830': { products: [{ name: 'Shampoo Avena 500ml', qty: 1, price: 52.00 }] },
  'VP-29829': { products: [{ name: 'Royal Canin Mini Adult 3kg', qty: 2, price: 125.00 }, { name: 'Pipeta Antipulgas', qty: 1, price: 62.80 }] },
  'VP-29828': { products: [{ name: 'Snacks Dentales Pack', qty: 3, price: 29.50 }] },
  'VP-29827': { products: [{ name: 'Pro Plan Puppy 7.5kg', qty: 1, price: 284.00 }, { name: 'Cat Chow Gatitos 1.5kg', qty: 2, price: 128.00 }] },
  'VP-29826': { products: [{ name: 'Juguete Mordedor KONG L', qty: 1, price: 89.00 }, { name: 'Caña de Juguete Gato', qty: 1, price: 31.00 }] },
};

const paymentColors: Record<string, string> = {
  'Tarjeta': 'bg-secondary/10 text-secondary border-secondary/20',
  'Efectivo': 'bg-tertiary/10 text-tertiary border-tertiary/20',
  'Transferencia': 'bg-secondary/10 text-secondary border-secondary/20',
  'QR': 'bg-primary/10 text-primary border-primary/20',
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const fmt = (n: number) => `$${n.toFixed(2)}`;

export default function Historial() {
  const [filter, setFilter] = useState<'today' | 'month' | 'custom'>('today');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const totalRevenue = sales.reduce((a, s) => a + s.total, 0);
  const avgTicket = totalRevenue / sales.length;

  return (
    <section className="p-lg max-w-7xl mx-auto">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-md mb-lg bg-tertiary/5 p-md rounded-xl border border-outline-variant/10">
        <div className="flex items-center gap-sm flex-wrap">
          <span className="text-label-md text-on-surface-variant">Filtrar por:</span>
          <div className="flex bg-surface-container rounded-lg p-1">
            {(['today', 'month', 'custom'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-md py-1 rounded-md text-label-md transition-all ${
                  filter === f ? 'bg-white text-primary shadow-sm font-bold' : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {f === 'today' ? 'Hoy' : f === 'month' ? 'Mes' : 'Personalizado'}
              </button>
            ))}
          </div>

          {filter === 'month' && (
            <select
              className="bg-surface border border-outline-variant/20 rounded-lg px-sm py-1 text-body-md outline-none focus:border-primary"
              value={selectedMonth}
              onChange={e => setSelectedMonth(parseInt(e.target.value))}
            >
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>{m}</option>
              ))}
            </select>
          )}

          {filter === 'custom' && (
            <div className="flex items-center gap-sm">
              <div className="flex flex-col gap-xs">
                <label className="text-caption text-on-surface-variant">Desde</label>
                <input
                  type="date"
                  className="bg-surface border border-outline-variant/20 rounded-lg px-sm py-1 text-body-md outline-none focus:border-primary"
                  value={customFrom}
                  onChange={e => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-xs">
                <label className="text-caption text-on-surface-variant">Hasta</label>
                <input
                  type="date"
                  className="bg-surface border border-outline-variant/20 rounded-lg px-sm py-1 text-body-md outline-none focus:border-primary"
                  value={customTo}
                  onChange={e => setCustomTo(e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-md">
          <div className="flex items-center gap-sm">
            <span className="text-label-md text-on-surface-variant">Vendedor:</span>
            <select className="bg-surface border border-outline-variant/20 rounded-lg px-sm py-1 text-body-md text-sm outline-none focus:border-primary">
              <option>Todos</option>
              <option>Silvana</option>
              <option>Marcelo</option>
              <option>Ariana</option>
            </select>
          </div>
          <button className="bg-primary text-white px-lg py-sm rounded-lg font-bold flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all">
            <span className="material-symbols-outlined">filter_list</span>
            Aplicar Filtros
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-md mb-xl">
        <div className="bg-surface border border-outline-variant/20 p-md rounded-xl">
          <span className="text-on-surface-variant text-label-md">Ventas Hoy</span>
          <div className="flex items-baseline gap-2 mt-sm">
            <span className="text-headline-md font-bold text-primary">{sales.length}</span>
            <span className="text-secondary text-xs font-bold">+12% ↑</span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 p-md rounded-xl">
          <span className="text-on-surface-variant text-label-md">Total Ingresos</span>
          <div className="flex items-baseline gap-2 mt-sm">
            <span className="text-headline-md font-bold text-primary">{fmt(totalRevenue)}</span>
          </div>
        </div>
        <div className="bg-surface border border-outline-variant/20 p-md rounded-xl">
          <span className="text-on-surface-variant text-label-md">Ticket Promedio</span>
          <div className="flex items-baseline gap-2 mt-sm">
            <span className="text-headline-md font-bold text-primary">{fmt(avgTicket)}</span>
          </div>
        </div>
        <div className="bg-primary-container p-md rounded-xl">
          <span className="text-on-primary-container text-label-md opacity-80">Método más usado</span>
          <div className="flex items-center gap-2 mt-sm">
            <span className="material-symbols-outlined text-on-primary-container">credit_card</span>
            <span className="text-headline-md font-bold text-on-primary-container">Tarjetas</span>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-surface border border-outline-variant/20 rounded-xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low border-b border-outline-variant/20">
              <th className="px-md py-md text-label-md text-on-surface-variant uppercase tracking-wider">ID Venta</th>
              <th className="px-md py-md text-label-md text-on-surface-variant uppercase tracking-wider">Fecha y Hora</th>
              <th className="px-md py-md text-label-md text-on-surface-variant uppercase tracking-wider">Vendedor</th>
              <th className="px-md py-md text-label-md text-on-surface-variant uppercase tracking-wider">Método de Pago</th>
              <th className="px-md py-md text-label-md text-on-surface-variant uppercase tracking-wider text-right">Total</th>
              <th className="px-md py-md"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {sales.map(sale => (
              <tr
                key={sale.id}
                className="hover:bg-tertiary-fixed/10 cursor-pointer transition-colors group"
                onClick={() => setSelectedSale(sale)}
              >
                <td className="px-md py-md font-bold text-primary">#{sale.id}</td>
                <td className="px-md py-md text-body-md text-on-surface-variant text-sm">{sale.date}, {sale.time}</td>
                <td className="px-md py-md text-body-md text-sm">{sale.seller}</td>
                <td className="px-md py-md">
                  <span className={`px-sm py-1 rounded-full text-xs font-bold border flex items-center gap-1 w-max ${paymentColors[sale.payment] || 'bg-surface-container text-on-surface-variant border-outline-variant/20'}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>{sale.paymentIcon}</span>
                    {sale.payment}
                  </span>
                </td>
                <td className="px-md py-md font-bold text-right text-on-surface">{fmt(sale.total)}</td>
                <td className="px-md py-md text-right">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">chevron_right</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="px-md py-md bg-surface-container-low flex items-center justify-between border-t border-outline-variant/20">
          <span className="text-caption text-on-surface-variant">Mostrando {sales.length} de 142 ventas</span>
          <div className="flex gap-2">
            <button className="p-1 rounded-md border border-outline-variant/20 hover:bg-surface active:scale-95 transition-all">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_left</span>
            </button>
            <button className="p-1 rounded-md border border-outline-variant/20 hover:bg-surface active:scale-95 transition-all">
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detail Slide-over */}
      {selectedSale && (
        <>
          <div
            className="fixed inset-0 bg-on-surface/40 backdrop-blur-sm z-20"
            onClick={() => setSelectedSale(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-md bg-surface shadow-2xl z-30 flex flex-col">
            <div className="p-md border-b border-outline-variant/20 flex items-center justify-between">
              <h2 className="text-headline-md font-bold text-primary">Detalle de Venta</h2>
              <button
                className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors"
                onClick={() => setSelectedSale(null)}
              >
                close
              </button>
            </div>
            <div className="flex-grow overflow-y-auto p-md space-y-lg">
              <div className="bg-tertiary-fixed/20 p-md rounded-xl border border-tertiary-fixed-dim/30">
                <div className="flex justify-between items-start mb-base">
                  <div>
                    <span className="text-caption text-on-surface-variant block uppercase tracking-wide">ID de Transacción</span>
                    <span className="font-bold text-lg text-primary">#{selectedSale.id}</span>
                  </div>
                  <span className="bg-white text-primary text-[10px] font-bold px-2 py-1 rounded border border-primary/20">COMPLETADA</span>
                </div>
                <div className="grid grid-cols-2 gap-sm text-sm">
                  <div><span className="text-on-surface-variant block">Fecha</span><span className="font-bold">{selectedSale.date}</span></div>
                  <div><span className="text-on-surface-variant block">Hora</span><span className="font-bold">{selectedSale.time}</span></div>
                  <div><span className="text-on-surface-variant block">Vendedor</span><span className="font-bold">{selectedSale.seller}</span></div>
                  <div><span className="text-on-surface-variant block">Método</span><span className="font-bold">{selectedSale.payment}</span></div>
                </div>
              </div>
              <div>
                <h3 className="text-label-md text-on-surface-variant uppercase mb-sm border-b border-outline-variant/20 pb-xs">Productos</h3>
                <div className="space-y-sm">
                  {saleDetails[selectedSale.id]?.products.map((p, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold">{p.name}</p>
                        <p className="text-on-surface-variant text-xs">x{p.qty} unidades • {fmt(p.price / p.qty)} c/u</p>
                      </div>
                      <span className="font-bold">{fmt(p.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-xl pt-lg border-t-2 border-dashed border-outline-variant/30 space-y-sm">
                <div className="flex justify-between text-on-surface-variant">
                  <span>Subtotal</span><span>{fmt(selectedSale.total)}</span>
                </div>
                <div className="flex justify-between text-on-surface-variant">
                  <span>IVA (0%)</span><span>$0.00</span>
                </div>
                <div className="flex justify-between items-center pt-base">
                  <span className="font-bold text-lg">Total</span>
                  <span className="font-bold text-2xl text-primary">{fmt(selectedSale.total)}</span>
                </div>
              </div>
            </div>
            <div className="p-md bg-surface-container-low border-t border-outline-variant/20 flex gap-sm">
              <button className="flex-1 bg-primary text-white py-sm rounded-lg font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
                <span className="material-symbols-outlined">print</span>
                Imprimir Comprobante
              </button>
              <button className="w-12 h-12 flex items-center justify-center border border-outline-variant/30 rounded-lg text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">share</span>
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

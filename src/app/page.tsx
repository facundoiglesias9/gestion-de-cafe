'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { Coffee, ShoppingCart, Package, Users, TrendingUp, AlertCircle, Wifi, WifiOff, LogOut, Clock, ShoppingBag, Plus, ClipboardList, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const router = useRouter()

  const handleLogout = () => {
    document.cookie = "auth=; path=/; max-age=0"
    router.push('/login')
    router.refresh()
  }

  const [storeName, setStoreName] = useState('Café Manager')
  const [salesToday, setSalesToday] = useState(0)
  const [activeOrders, setActiveOrders] = useState(0)
  const [stockAlerts, setStockAlerts] = useState(0)

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('products').select('count', { count: 'exact', head: true })
        if (error && error.code !== '42P01') {
          console.error('Supabase error:', error)
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('connected')
        }
      } catch (e) {
        console.error('Connection error:', e)
        setConnectionStatus('error')
      }
    }

    async function fetchStoreName() {
      const { data } = await supabase.from('store_settings').select('store_name').single()
      if (data) setStoreName(data.store_name)
    }

    async function fetchStats() {
      // 1. Sales Today
      const today = new Date().toISOString().split('T')[0]
      const { data: salesData } = await supabase
        .from('orders')
        .select('total')
        .eq('status', 'completed')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)

      const totalSales = salesData?.reduce((sum, order) => sum + order.total, 0) || 0
      setSalesToday(totalSales)

      // 2. Active Orders
      const { count: activeCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .neq('status', 'completed')

      setActiveOrders(activeCount || 0)

      // 3. Stock Alerts
      // We need to fetch items where quantity <= min_stock. 
      // Since Supabase filter for column comparison is tricky in simple query without RPC, 
      // we'll fetch all and filter in JS for now (assuming inventory isn't huge yet), 
      // or use a raw query if we had that setup. 
      // Actually, we can just fetch all items and filter.
      const { data: inventory } = await supabase
        .from('inventory')
        .select('quantity, min_stock')

      const alerts = inventory?.filter(item => item.quantity <= item.min_stock).length || 0
      setStockAlerts(alerts)
    }

    checkConnection()
    fetchStoreName()
    fetchStats()

    // Realtime subscription for updates
    const channel = supabase
      .channel('dashboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchStats())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, () => fetchStats())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{storeName}</h1>
          <p className={styles.subtitle}>Panel de Control & Gestión</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            backgroundColor: connectionStatus === 'connected' ? '#2a9d8f' : '#e63946',
            boxShadow: connectionStatus === 'connected' ? '0 0 10px #2a9d8f' : 'none'
          }} />
          <span style={{ fontSize: '0.9rem', color: '#888' }}>
            {connectionStatus === 'connected' ? 'Sistema Online' : 'Desconectado'}
          </span>
          <button
            onClick={handleLogout}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#e63946',
              marginLeft: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              cursor: 'pointer'
            }}
          >
            <LogOut size={16} /> Salir
          </button>
        </div>
      </header>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>${salesToday.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
          <div className={styles.statLabel}>Ventas Hoy</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{activeOrders}</div>
          <div className={styles.statLabel}>Pedidos Activos</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: stockAlerts > 0 ? '#e63946' : 'white' }}>{stockAlerts}</div>
          <div className={styles.statLabel}>Alertas Stock</div>
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Coffee className={styles.icon} size={24} />
            <h2 className={styles.cardTitle}>Menú & Productos</h2>
          </div>
          <p className={styles.cardContent}>Gestiona tu catálogo de café, pastelería y agregados. Actualiza precios y disponibilidad.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/products')}
          >
            Gestionar Menú
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <ShoppingBag className={styles.icon} size={24} />
            <h2 className={styles.cardTitle}>Pedidos</h2>
          </div>
          <p className={styles.cardContent}>Visualiza y procesa los pedidos entrantes en tiempo real. Control de estados y tiempos.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/orders')}
          >
            <Plus size={18} /> Nuevo Pedido
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <ClipboardList className={styles.icon} size={24} />
            <h2 className={styles.cardTitle}>Inventario</h2>
          </div>
          <p className={styles.cardContent}>Control de stock de insumos. Granos, leche, jarabes y descartables.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/inventory')}
          >
            Ver Stock
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Users className={styles.icon} size={24} />
            <h2 className={styles.cardTitle}>Personal</h2>
          </div>
          <p className={styles.cardContent}>Administra turnos, accesos y rendimiento de tus baristas y camareros.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/staff')}
          >
            Equipo
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <TrendingUp className={styles.icon} size={24} />
            <h2 className={styles.cardTitle}>Reportes</h2>
          </div>
          <p className={styles.cardContent}>Analíticas de ventas, productos más vendidos y horarios punta.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/reports')}
          >
            Ver Métricas
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <AlertCircle className={styles.icon} size={24} />
            <h2 className={styles.cardTitle}>Editar Tienda</h2>
          </div>
          <p className={styles.cardContent}>Modificar el nombre de tu cafetería.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/settings')}
          >
            Editar
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Clock className={styles.icon} size={24} />
            <h2 className={styles.cardTitle}>Historial</h2>
          </div>
          <p className={styles.cardContent}>Consulta pedidos pasados, filtra por fecha y revisa el detalle de ventas diarias.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/history')}
          >
            Ver Historial
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <Package className={styles.icon} size={24} />
            <h2 className={styles.cardTitle}>Mayorista</h2>
          </div>
          <p className={styles.cardContent}>Gestiona compras de stock, proveedores y pedidos masivos de insumos.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/wholesale')}
          >
            Hacer Pedido
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <DollarSign className={styles.icon} size={24} />
            <h2 className={styles.cardTitle}>Caja</h2>
          </div>
          <p className={styles.cardContent}>Control de ingresos y egresos. Registra gastos de alquiler y servicios.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/cash-register')}
          >
            Ver Movimientos
          </button>
        </div>
      </div>
    </main>
  )
}

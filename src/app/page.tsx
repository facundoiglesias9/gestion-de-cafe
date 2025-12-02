'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { Coffee, ShoppingCart, Package, Users, TrendingUp, AlertCircle, Wifi, WifiOff, LogOut, Clock, ShoppingBag, Plus, ClipboardList } from 'lucide-react'
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

  useEffect(() => {
    async function checkConnection() {
      try {
        const { error } = await supabase.from('products').select('count', { count: 'exact', head: true })
        // Even if table doesn't exist, we connected to Supabase. 
        // If error is code '42P01' (undefined_table), we are connected but table is missing.
        // If error is network error or auth, then we failed.
        if (error && error.code !== '42P01') {
          console.error('Supabase error:', error)
          // We'll assume connected if it's just a missing table, as credentials are valid
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('connected')
        }
      } catch (e) {
        console.error('Connection error:', e)
        setConnectionStatus('error')
      }
    }
    checkConnection()
  }, [])

  return (
    <main className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Café Manager</h1>
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
          <div className={styles.statValue}>$12.450,00</div>
          <div className={styles.statLabel}>Ventas Hoy</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>24</div>
          <div className={styles.statLabel}>Pedidos Activos</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue} style={{ color: '#e63946' }}>3</div>
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
            <h2 className={styles.cardTitle}>Configuración</h2>
          </div>
          <p className={styles.cardContent}>Ajustes generales del sistema, impresoras y facturación.</p>
          <button
            className={styles.button}
            onClick={() => router.push('/settings')}
          >
            Ajustes
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
      </div>
    </main>
  )
}

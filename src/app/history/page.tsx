
'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { ArrowLeft, Calendar, DollarSign, ShoppingBag, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Order {
    id: string
    created_at: string
    customer_name: string
    status: string
    total: number
    order_items: {
        quantity: number
        products: {
            name: string
        }
    }[]
}

export default function HistoryPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchHistory()
    }, [selectedDate])

    async function fetchHistory() {
        setLoading(true)
        try {
            // Create start and end of the selected day in UTC
            const startDate = new Date(selectedDate)
            startDate.setUTCHours(0, 0, 0, 0)

            const endDate = new Date(selectedDate)
            endDate.setUTCHours(23, 59, 59, 999)

            const { data, error } = await supabase
                .from('orders')
                .select('*, order_items(quantity, products(name))')
                .gte('created_at', startDate.toISOString())
                .lte('created_at', endDate.toISOString())
                .order('created_at', { ascending: false })

            if (error) throw error
            setOrders(data || [])
        } catch (error) {
            console.error('Error fetching history:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteOrder(id: string) {
        if (!confirm('¿Estás seguro de eliminar este pedido del historial? Esta acción no se puede deshacer.')) return

        try {
            // 1. Delete associated order items first (manual cascade)
            const { error: itemsError } = await supabase
                .from('order_items')
                .delete()
                .eq('order_id', id)

            if (itemsError) throw itemsError

            // 2. Delete the order
            const { error: orderError } = await supabase
                .from('orders')
                .delete()
                .eq('id', id)

            if (orderError) throw orderError

            // Refresh the list
            fetchHistory()
        } catch (error: any) {
            console.error('Error deleting order:', error)
            alert('Error al eliminar el pedido: ' + (error.message || 'Error desconocido'))
        }
    }

    const totalSales = orders.reduce((sum, order) => sum + order.total, 0)
    const totalOrders = orders.length

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Historial de Pedidos</h1>
                </div>
                <div className={styles.controls}>
                    <Calendar size={20} color="#ccc" />
                    <input
                        type="date"
                        className={styles.dateInput}
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                    />
                </div>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Ventas del Día</span>
                    <div className={styles.statValue}>
                        <DollarSign size={24} style={{ display: 'inline', marginRight: '0.5rem', color: 'var(--primary)' }} />
                        {formatCurrency(totalSales)}
                    </div>
                </div>
                <div className={styles.statCard}>
                    <span className={styles.statLabel}>Pedidos Totales</span>
                    <div className={styles.statValue}>
                        <ShoppingBag size={24} style={{ display: 'inline', marginRight: '0.5rem', color: '#2a9d8f' }} />
                        {totalOrders}
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Hora</th>
                            <th>Cliente</th>
                            <th>Descripción</th>
                            <th>Estado</th>
                            <th>Total</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Cargando...</td>
                            </tr>
                        ) : orders.length === 0 ? (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No hay pedidos para esta fecha.</td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.id}>
                                    <td style={{ fontFamily: 'monospace', color: '#888' }}>#{order.id.slice(0, 4)}</td>
                                    <td>
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td style={{ fontWeight: '600' }}>{order.customer_name}</td>
                                    <td style={{ fontSize: '0.9rem', color: '#ccc', maxWidth: '300px' }}>
                                        {order.order_items?.map(item => `${item.products?.name || 'Producto'} (x${item.quantity})`).join(', ') || 'Sin detalles'}
                                    </td>
                                    <td>
                                        <span className={`${styles.statusBadge} ${order.status === 'completed' ? styles.statusCompleted : styles.statusPending}`}>
                                            {order.status === 'completed' ? 'Completado' : order.status}
                                        </span>
                                    </td>
                                    <td style={{ color: 'var(--primary)', fontWeight: '700' }}>{formatCurrency(order.total)}</td>
                                    <td>
                                        <button
                                            className={styles.deleteButton}
                                            onClick={() => handleDeleteOrder(order.id)}
                                            title="Eliminar pedido"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </main>
    )
}

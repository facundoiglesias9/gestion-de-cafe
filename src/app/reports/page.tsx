
'use client'

import styles from './page.module.css'
import { ArrowLeft, TrendingUp, DollarSign, ShoppingBag, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

export default function ReportsPage() {
    const router = useRouter()

    // Mock data for the chart (Initialized to 0)
    const weeklySales = [0, 0, 0, 0, 0, 0, 0]
    const maxSale = 100 // Default scale

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Reportes y Métricas</h1>
                </div>
            </header>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <DollarSign size={18} /> Ventas Totales (Mes)
                    </div>
                    <div className={styles.cardValue}>{formatCurrency(0)}</div>
                    <div className={styles.cardTrend} style={{ color: '#888' }}>
                        <TrendingUp size={14} /> 0% vs mes anterior
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <ShoppingBag size={18} /> Pedidos Completados
                    </div>
                    <div className={styles.cardValue}>0</div>
                    <div className={styles.cardTrend} style={{ color: '#888' }}>
                        <TrendingUp size={14} /> 0% vs mes anterior
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardTitle}>
                        <Users size={18} /> Clientes Nuevos
                    </div>
                    <div className={styles.cardValue}>0</div>
                    <div className={styles.cardTrend} style={{ color: '#888' }}>
                        <TrendingUp size={14} /> 0% vs mes anterior
                    </div>
                </div>
            </div>

            <div className={styles.chartContainer}>
                <h3 style={{ alignSelf: 'flex-start', marginBottom: '1.5rem', fontSize: '1.2rem' }}>Ventas de la Semana</h3>
                <div className={styles.chartPlaceholder}>
                    {weeklySales.map((value, index) => (
                        <div
                            key={index}
                            className={styles.bar}
                            style={{ height: `${(value / maxSale) * 100}%` }}
                            title={`Día ${index + 1}: ${value} ventas`}
                        />
                    ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '1rem', color: '#888', fontSize: '0.8rem' }}>
                    <span>Lun</span>
                    <span>Mar</span>
                    <span>Mié</span>
                    <span>Jue</span>
                    <span>Vie</span>
                    <span>Sáb</span>
                    <span>Dom</span>
                </div>
            </div>
        </main>
    )
}

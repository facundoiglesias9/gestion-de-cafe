'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { ArrowLeft, Plus, TrendingUp, TrendingDown, DollarSign, X, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Transaction {
    id: string
    created_at: string
    type: 'income' | 'expense'
    amount: number
    description: string
    category: string
}

export default function CashRegisterPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newExpense, setNewExpense] = useState<Partial<Transaction>>({ type: 'expense' })
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    useEffect(() => {
        fetchTransactions()
    }, [])

    async function fetchTransactions() {
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })

            if (error) throw error
            setTransactions(data || [])
        } catch (error) {
            console.error('Error fetching transactions:', error)
        } finally {
            setLoading(false)
        }
    }

    const incomeTransactions = transactions.filter(t => t.type === 'income')
    const expenseTransactions = transactions.filter(t => t.type === 'expense')

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0)
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0)

    async function handleAddExpense() {
        if (!newExpense.description || !newExpense.amount || !newExpense.category) {
            alert('Por favor complete todos los campos')
            return
        }

        try {
            const { error } = await supabase
                .from('transactions')
                .insert([{
                    type: 'expense',
                    amount: parseFloat(newExpense.amount.toString()),
                    description: newExpense.description,
                    category: newExpense.category,
                    created_at: new Date().toISOString()
                }])

            if (error) throw error

            setIsModalOpen(false)
            setNewExpense({ type: 'expense' })
            fetchTransactions()
        } catch (error) {
            console.error('Error adding expense:', error)
            alert('Error al agregar gasto')
        }
    }

    async function handleDeleteTransaction(id: string) {
        if (!confirm('¿Estás seguro de eliminar este movimiento?')) return

        try {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchTransactions()
        } catch (error) {
            console.error('Error deleting transaction:', error)
            alert('Error al eliminar movimiento')
        }
    }

    const netBalance = totalIncome - totalExpenses

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Caja y Movimientos</h1>
                </div>
                <button className={styles.addButton} onClick={() => setIsModalOpen(true)}>
                    <Plus size={20} /> Agregar Gasto
                </button>
            </header>

            <div className={styles.balanceCard}>
                <div>
                    <div className={styles.balanceTitle}>Balance de Caja</div>
                    <div className={styles.balanceAmount} style={{ color: netBalance >= 0 ? '#2a9d8f' : '#e63946' }}>
                        {formatCurrency(netBalance)}
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ color: '#888', fontSize: '0.9rem' }}>Estado Actual</div>
                    <div style={{ color: netBalance >= 0 ? '#2a9d8f' : '#e63946', fontWeight: '600' }}>
                        {netBalance >= 0 ? 'Superávit' : 'Déficit'}
                    </div>
                </div>
            </div>

            <div className={styles.grid}>
                {/* Income Column */}
                <div className={styles.column}>
                    <div className={styles.columnHeader}>
                        <div>
                            <div className={styles.columnTitle} style={{ color: '#2a9d8f' }}>
                                <TrendingUp size={24} /> Ingresos
                            </div>
                            <span style={{ fontSize: '0.9rem', color: '#888' }}>Ventas realizadas</span>
                        </div>
                        <div className={styles.totalAmount} style={{ color: '#2a9d8f' }}>
                            {formatCurrency(totalIncome)}
                        </div>
                    </div>
                    <div className={styles.transactionList}>
                        {incomeTransactions.map(t => (
                            <div key={t.id} className={styles.transactionCard}>
                                <div className={styles.transactionInfo}>
                                    <h4>{t.description}</h4>
                                    <div className={styles.transactionMeta}>
                                        <span>{new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>{t.category}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className={styles.transactionAmount} style={{ color: '#2a9d8f' }}>
                                        +{formatCurrency(t.amount)}
                                    </div>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => handleDeleteTransaction(t.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {incomeTransactions.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No hay ingresos registrados.</p>
                        )}
                    </div>
                </div>

                {/* Expense Column */}
                <div className={styles.column}>
                    <div className={styles.columnHeader}>
                        <div>
                            <div className={styles.columnTitle} style={{ color: '#e63946' }}>
                                <TrendingDown size={24} /> Gastos
                            </div>
                            <span style={{ fontSize: '0.9rem', color: '#888' }}>Compras y servicios</span>
                        </div>
                        <div className={styles.totalAmount} style={{ color: '#e63946' }}>
                            {formatCurrency(totalExpenses)}
                        </div>
                    </div>
                    <div className={styles.transactionList}>
                        {expenseTransactions.map(t => (
                            <div key={t.id} className={styles.transactionCard}>
                                <div className={styles.transactionInfo}>
                                    <h4>{t.description}</h4>
                                    <div className={styles.transactionMeta}>
                                        <span>{new Date(t.created_at).toLocaleDateString()} {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        <span>{t.category}</span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div className={styles.transactionAmount} style={{ color: '#e63946' }}>
                                        -{formatCurrency(t.amount)}
                                    </div>
                                    <button
                                        className={styles.deleteButton}
                                        onClick={() => handleDeleteTransaction(t.id)}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {expenseTransactions.length === 0 && (
                            <p style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>No hay gastos registrados.</p>
                        )}
                    </div>
                </div>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className={styles.modalTitle}>Registrar Gasto</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Descripción</label>
                            <input
                                className={styles.input}
                                value={newExpense.description || ''}
                                onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                placeholder="Ej: Pago de Alquiler"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Monto ($)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={newExpense.amount || ''}
                                onChange={e => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Categoría</label>
                            <select
                                className={styles.select}
                                value={newExpense.category || ''}
                                onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Alquiler">Alquiler</option>
                                <option value="Servicios">Servicios (Luz, Gas, Internet)</option>
                                <option value="Mantenimiento">Mantenimiento</option>
                                <option value="Sueldos">Sueldos</option>
                                <option value="Insumos">Insumos (Manual)</option>
                                <option value="Otros">Otros</option>
                            </select>
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={styles.cancelButton}
                                onClick={() => setIsModalOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                className={styles.saveButton}
                                onClick={handleAddExpense}
                            >
                                Guardar Gasto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

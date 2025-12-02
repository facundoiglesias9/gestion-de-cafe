
'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { Plus, ArrowLeft, Search, Filter, AlertTriangle, Package, Edit2, Trash2, X } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
    id: string
    name: string
    category: string
    quantity: number
    unit: string
    min_stock: number
    updated_at: string
    cost?: number
}

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentItem, setCurrentItem] = useState<Partial<InventoryItem>>({})
    const router = useRouter()

    useEffect(() => {
        fetchInventory()
    }, [])

    async function fetchInventory() {
        try {
            const { data, error } = await supabase
                .from('inventory')
                .select('*')
                .order('name')

            if (error) throw error
            setItems(data || [])
        } catch (error) {
            console.error('Error fetching inventory:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        try {
            if (!currentItem.name || currentItem.quantity === undefined) return

            if (currentItem.id) {
                const { error } = await supabase
                    .from('inventory')
                    .update({ ...currentItem, updated_at: new Date().toISOString() })
                    .eq('id', currentItem.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('inventory')
                    .insert([currentItem])
                if (error) throw error
            }

            setIsModalOpen(false)
            setCurrentItem({})
            fetchInventory()
        } catch (error) {
            console.error('Error saving item:', error)
            alert('Error al guardar el ítem')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este ítem?')) return

        try {
            const { error } = await supabase
                .from('inventory')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchInventory()
        } catch (error) {
            console.error('Error deleting item:', error)
        }
    }

    const lowStockItems = items.filter(item => item.quantity <= item.min_stock)

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Inventario de Insumos</h1>
                </div>
                <button
                    className={styles.addButton}
                    onClick={() => {
                        setCurrentItem({ unit: 'unidades', min_stock: 5 })
                        setIsModalOpen(true)
                    }}
                >
                    <Plus size={20} /> Nuevo Ítem
                </button>
            </header>

            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={styles.statIcon}>
                        <Package size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue}>{items.length}</span>
                        <span className={styles.statLabel}>Total Ítems</span>
                    </div>
                </div>
                <div className={styles.statCard}>
                    <div className={styles.statIcon} style={{ color: '#e63946' }}>
                        <AlertTriangle size={24} />
                    </div>
                    <div className={styles.statInfo}>
                        <span className={styles.statValue} style={{ color: '#e63946' }}>{lowStockItems.length}</span>
                        <span className={styles.statLabel}>Stock Bajo</span>
                    </div>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Categoría</th>
                            <th>Stock Actual</th>
                            <th>Costo Unit.</th>
                            <th>Unidad</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                            <tr key={item.id}>
                                <td style={{ fontWeight: '600' }}>{item.name}</td>
                                <td>{item.category}</td>
                                <td>{item.quantity}</td>
                                <td>{formatCurrency(item.cost || 0)}</td>
                                <td>{item.unit}</td>
                                <td>
                                    <span className={`${styles.stockBadge} ${item.quantity <= item.min_stock ? styles.stockLow : styles.stockOk}`}>
                                        {item.quantity <= item.min_stock ? 'Bajo Stock' : 'OK'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={styles.actionButton}
                                            onClick={() => {
                                                setCurrentItem(item)
                                                setIsModalOpen(true)
                                            }}
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            className={styles.actionButton}
                                            onClick={() => handleDelete(item.id)}
                                            style={{ color: '#e63946' }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {items.length === 0 && !loading && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: '#888' }}>
                                    No hay ítems en el inventario.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className={styles.modalTitle}>
                                {currentItem.id ? 'Editar Ítem' : 'Nuevo Ítem'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre</label>
                            <input
                                className={styles.input}
                                value={currentItem.name || ''}
                                onChange={e => setCurrentItem({ ...currentItem, name: e.target.value })}
                                placeholder="Ej: Café en Grano Colombia"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Categoría</label>
                            <select
                                className={styles.select}
                                value={currentItem.category || ''}
                                onChange={e => setCurrentItem({ ...currentItem, category: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Grano">Grano</option>
                                <option value="Leche">Leche</option>
                                <option value="Jarabe">Jarabe</option>
                                <option value="Descartable">Descartable</option>
                                <option value="Limpieza">Limpieza</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Cantidad</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={currentItem.quantity || ''}
                                    onChange={e => setCurrentItem({ ...currentItem, quantity: Number(e.target.value) })}
                                    placeholder="0"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Unidad</label>
                                <select
                                    className={styles.select}
                                    value={currentItem.unit || 'unidades'}
                                    onChange={e => setCurrentItem({ ...currentItem, unit: e.target.value })}
                                >
                                    <option value="unidades">Unidades</option>
                                    <option value="kg">Kilogramos (kg)</option>
                                    <option value="lt">Litros (lt)</option>
                                    <option value="gr">Gramos (gr)</option>
                                    <option value="ml">Mililitros (ml)</option>
                                </select>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Alerta de Stock Mínimo</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={currentItem.min_stock || ''}
                                onChange={e => setCurrentItem({ ...currentItem, min_stock: Number(e.target.value) })}
                                placeholder="5"
                            />
                            <span style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem', display: 'block' }}>
                                Se mostrará una alerta cuando el stock sea menor o igual a este valor.
                            </span>
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
                                onClick={handleSave}
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

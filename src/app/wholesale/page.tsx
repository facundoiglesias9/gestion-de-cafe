
'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { ArrowLeft, Plus, ShoppingCart, Check, X, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { formatCurrency } from '@/lib/utils'

interface WholesaleItem {
    id: string
    name: string
    cost: number
    batch_quantity: number
    unit: string
}

export default function WholesalePage() {
    const [items, setItems] = useState<WholesaleItem[]>([])
    const [selectedItems, setSelectedItems] = useState<string[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [newItem, setNewItem] = useState<Partial<WholesaleItem>>({})
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    useEffect(() => {
        fetchItems()
    }, [])

    async function fetchItems() {
        const { data, error } = await supabase
            .from('wholesale_products')
            .select('*')
            .order('name')

        if (data) setItems(data)
    }

    const handleAddItem = async () => {
        if (!newItem.name || !newItem.cost || !newItem.batch_quantity) {
            alert('Por favor complete todos los campos')
            return
        }

        try {
            const { error } = await supabase
                .from('wholesale_products')
                .insert([{
                    name: newItem.name,
                    cost: parseFloat(newItem.cost.toString()),
                    batch_quantity: parseInt(newItem.batch_quantity.toString()),
                    unit: newItem.unit || 'Unidad'
                }])

            if (error) throw error

            setIsModalOpen(false)
            setNewItem({})
            fetchItems()
        } catch (error) {
            console.error('Error adding item:', error)
            alert('Error al agregar producto')
        }
    }

    const handleDeleteItem = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return

        try {
            const { error } = await supabase
                .from('wholesale_products')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchItems()
        } catch (error) {
            console.error('Error deleting item:', error)
            alert('Error al eliminar producto')
        }
    }

    const toggleSelection = (id: string) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter(item => item !== id))
        } else {
            setSelectedItems([...selectedItems, id])
        }
    }

    const handleGenerateOrder = async () => {
        if (selectedItems.length === 0) return
        if (!confirm(`¿Generar pedido con ${selectedItems.length} productos? Se actualizará el inventario.`)) return

        setLoading(true)
        try {
            const itemsToOrder = items.filter(i => selectedItems.includes(i.id))

            for (const item of itemsToOrder) {
                // Check if item exists in inventory
                const { data: existingInventory } = await supabase
                    .from('inventory')
                    .select('*')
                    .eq('name', item.name)
                    .single()

                // Calculate cost per unit
                const costPerUnit = item.cost / item.batch_quantity

                if (existingInventory) {
                    // Update quantity and cost (weighted average or just latest? Let's use latest for now as it's simpler for margin calc)
                    await supabase
                        .from('inventory')
                        .update({
                            quantity: existingInventory.quantity + item.batch_quantity,
                            cost: costPerUnit, // Updating to latest cost
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', existingInventory.id)
                } else {
                    // Insert new item
                    await supabase
                        .from('inventory')
                        .insert([{
                            name: item.name,
                            category: 'Insumo', // Default category
                            quantity: item.batch_quantity,
                            unit: item.unit || 'Unidad',
                            cost: costPerUnit,
                            status: 'En Stock',
                            min_stock: 10 // Default min stock
                        }])
                }
            }

            // Calculate total order cost
            const totalOrderCost = itemsToOrder.reduce((sum, item) => sum + item.cost, 0)

            // Record Transaction
            await supabase.from('transactions').insert([{
                type: 'expense',
                amount: totalOrderCost,
                description: `Pedido Mayorista (${selectedItems.length} productos)`,
                category: 'Compra Mayorista',
                created_at: new Date().toISOString()
            }])

            alert('Pedido generado, stock actualizado y gasto registrado!')
            setSelectedItems([])
        } catch (error) {
            console.error('Error generating order:', error)
            alert('Error al generar el pedido')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Pedidos Mayoristas</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={styles.generateButton}
                        onClick={handleGenerateOrder}
                        disabled={selectedItems.length === 0 || loading}
                    >
                        <ShoppingCart size={20} />
                        {loading ? 'Procesando...' : `Generar Pedido (${selectedItems.length})`}
                    </button>
                    <button
                        className={styles.addButton}
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus size={20} /> Agregar Producto
                    </button>
                </div>
            </header>

            <div className={styles.grid}>
                {items.map(item => (
                    <div
                        key={item.id}
                        className={`${styles.card} ${selectedItems.includes(item.id) ? styles.selected : ''}`}
                        onClick={() => toggleSelection(item.id)}
                    >
                        <input
                            type="checkbox"
                            className={styles.checkbox}
                            checked={selectedItems.includes(item.id)}
                            readOnly
                        />
                        <div className={styles.cardInfo}>
                            <h3 className={styles.cardTitle}>{item.name}</h3>
                            <div className={styles.cardDetails}>
                                <span>Costo: {formatCurrency(item.cost)}</span>
                                <span>Lote: {item.batch_quantity} {item.unit}</span>
                            </div>
                        </div>
                        <button
                            className={styles.deleteButton}
                            onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteItem(item.id)
                            }}
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className={styles.modalTitle}>Nuevo Producto Mayorista</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre del Producto</label>
                            <input
                                className={styles.input}
                                value={newItem.name || ''}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                placeholder="Ej: Leche Entera (Caja x12)"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Costo ($)</label>
                            <input
                                type="number"
                                className={styles.input}
                                value={newItem.cost || ''}
                                onChange={e => setNewItem({ ...newItem, cost: parseFloat(e.target.value) })}
                                placeholder="0.00"
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Cantidad por Lote</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <input
                                    type="number"
                                    className={styles.input}
                                    style={{ flex: 2 }}
                                    value={newItem.batch_quantity || ''}
                                    onChange={e => setNewItem({ ...newItem, batch_quantity: parseInt(e.target.value) })}
                                    placeholder="Ej: 12"
                                />
                                <select
                                    className={styles.input}
                                    style={{ flex: 1 }}
                                    value={newItem.unit || 'Unidad'}
                                    onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                >
                                    <option value="Unidad">Unidad</option>
                                    <option value="Kg">Kg</option>
                                    <option value="L">Litros</option>
                                    <option value="g">Gramos</option>
                                    <option value="ml">ml</option>
                                    <option value="Paquete">Paquete</option>
                                    <option value="Caja">Caja</option>
                                </select>
                            </div>
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
                                onClick={handleAddItem}
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

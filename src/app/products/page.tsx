
'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { Plus, Edit2, Trash2, Coffee, Image as ImageIcon, X, ArrowLeft, Beaker } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface InventoryItem {
    id: string
    name: string
    unit: string
    cost?: number
}

interface ProductIngredient {
    id?: string
    inventory_id: string
    quantity_required: number
    inventory_item?: InventoryItem
}

interface Product {
    id: string
    name: string
    description: string
    price: number
    category: string
    stock: number
    image_url?: string
    ingredients?: ProductIngredient[]
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({})
    const [currentIngredients, setCurrentIngredients] = useState<ProductIngredient[]>([])
    const [profitMargin, setProfitMargin] = useState<number>(30) // Default 30% margin
    const router = useRouter()

    useEffect(() => {
        fetchProducts()
        fetchInventory()
    }, [])

    async function fetchInventory() {
        const { data } = await supabase.from('inventory').select('id, name, unit, cost').order('name')
        if (data) setInventoryItems(data)
    }

    async function fetchProducts() {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .order('name')

            if (error) throw error
            setProducts(data || [])
        } catch (error) {
            console.error('Error fetching products:', error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchProductIngredients(productId: string) {
        try {
            const { data, error } = await supabase
                .from('product_ingredients')
                .select('*, inventory_item:inventory(id, name, unit, cost)')
                .eq('product_id', productId)

            if (error) throw error
            setCurrentIngredients(data || [])

            // Calculate initial margin if price exists
            // We need to wait for state update or calculate here.
            // Let's just rely on the effect below or manual calc.
        } catch (error) {
            console.error('Error fetching ingredients:', error)
            setCurrentIngredients([])
        }
    }

    // Calculate total cost based on ingredients
    const totalCost = currentIngredients.reduce((sum, ing) => {
        const item = inventoryItems.find(i => i.id === ing.inventory_id)
        const cost = item?.cost || 0
        return sum + (cost * ing.quantity_required)
    }, 0)

    // Calculate suggested price
    const suggestedPrice = totalCost * (1 + (profitMargin / 100))

    // Sync margin when cost or price changes (to reflect actual margin)
    useEffect(() => {
        if (currentProduct.price && totalCost > 0) {
            const margin = ((currentProduct.price - totalCost) / totalCost) * 100
            if (Math.abs(profitMargin - margin) > 0.1) {
                setProfitMargin(Number(margin.toFixed(2)))
            }
        }
    }, [totalCost, currentProduct.price])

    // Update margin when price changes manually
    const handlePriceChange = (price: number) => {
        setCurrentProduct({ ...currentProduct, price })
        if (totalCost > 0) {
            const margin = ((price - totalCost) / totalCost) * 100
            setProfitMargin(Number(margin.toFixed(2)))
        }
    }

    // Update price when margin changes
    const handleMarginChange = (margin: number) => {
        setProfitMargin(margin)
        const price = totalCost * (1 + (margin / 100))
        setCurrentProduct({ ...currentProduct, price: Number(price.toFixed(2)) })
    }

    async function handleSave() {
        try {
            if (!currentProduct.name || !currentProduct.price) return

            let productId = currentProduct.id

            if (productId) {
                // Update Product
                const { error } = await supabase
                    .from('products')
                    .update({
                        name: currentProduct.name,
                        description: currentProduct.description,
                        price: currentProduct.price,
                        category: currentProduct.category,
                        stock: 0, // Stock not relevant for menu items
                        image_url: currentProduct.image_url
                    })
                    .eq('id', productId)
                if (error) throw error
            } else {
                // Create Product
                const { data, error } = await supabase
                    .from('products')
                    .insert([{
                        name: currentProduct.name,
                        description: currentProduct.description,
                        price: currentProduct.price,
                        category: currentProduct.category,
                        stock: 0, // Stock not relevant for menu items
                        image_url: currentProduct.image_url
                    }])
                    .select()
                    .single()

                if (error) throw error
                productId = data.id
            }

            // Handle Ingredients
            if (productId) {
                // 1. Delete existing ingredients (simplest way to update)
                await supabase.from('product_ingredients').delete().eq('product_id', productId)

                // 2. Insert new ingredients
                if (currentIngredients.length > 0) {
                    const ingredientsToInsert = currentIngredients.map(ing => ({
                        product_id: productId,
                        inventory_id: ing.inventory_id,
                        quantity_required: ing.quantity_required
                    }))

                    const { error: ingError } = await supabase
                        .from('product_ingredients')
                        .insert(ingredientsToInsert)

                    if (ingError) throw ingError
                }
            }

            setIsModalOpen(false)
            setCurrentProduct({})
            setCurrentIngredients([])
            fetchProducts()
        } catch (error) {
            console.error('Error saving product:', error)
            alert('Error al guardar el producto')
        }
    }

    async function handleDelete(id: string) {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return

        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id)

            if (error) throw error
            fetchProducts()
        } catch (error: any) {
            console.error('Error deleting product:', error)

            // Check for foreign key constraint violation (Postgres code 23503)
            if (error.code === '23503' || error.message?.includes('violates foreign key constraint')) {
                if (confirm('Este producto es parte de pedidos existentes. ¿Deseas eliminarlo de todos modos? \n\nADVERTENCIA: El producto desaparecerá de los pedidos históricos, aunque el total del pedido se mantendrá.')) {
                    try {
                        // 1. Delete associated order items
                        const { error: itemsError } = await supabase
                            .from('order_items')
                            .delete()
                            .eq('product_id', id)

                        if (itemsError) throw itemsError

                        // 2. Delete the product
                        const { error: deleteError } = await supabase
                            .from('products')
                            .delete()
                            .eq('id', id)

                        if (deleteError) throw deleteError

                        alert('Producto eliminado correctamente.')
                        fetchProducts()
                    } catch (cascadeError: any) {
                        console.error('Error executing cascade delete:', cascadeError)
                        alert('Error al forzar la eliminación: ' + cascadeError.message)
                    }
                }
            } else {
                alert('Error al eliminar producto: ' + (error.message || error.error_description || JSON.stringify(error)))
            }
        }
    }

    function addIngredient() {
        setCurrentIngredients([...currentIngredients, { inventory_id: '', quantity_required: 0 }])
    }

    function updateIngredient(index: number, field: keyof ProductIngredient, value: any) {
        const newIngredients = [...currentIngredients]
        newIngredients[index] = { ...newIngredients[index], [field]: value }
        setCurrentIngredients(newIngredients)
    }

    function removeIngredient(index: number) {
        const newIngredients = [...currentIngredients]
        newIngredients.splice(index, 1)
        setCurrentIngredients(newIngredients)
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button
                        onClick={() => router.push('/')}
                        className={styles.backButton}
                    >
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Menú y Productos</h1>
                </div>
                <button
                    className={styles.addButton}
                    onClick={() => {
                        setCurrentProduct({})
                        setCurrentIngredients([])
                        setIsModalOpen(true)
                    }}
                >
                    <Plus size={20} /> Nuevo Producto
                </button>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#888' }}>Cargando productos...</div>
            ) : products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem', color: '#888', background: 'rgba(255,255,255,0.05)', borderRadius: '16px' }}>
                    <Coffee size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>No hay productos registrados aún.</p>
                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Comienza agregando uno nuevo.</p>
                </div>
            ) : (
                <div className={styles.grid}>
                    {products.map((product) => (
                        <div key={product.id} className={styles.productCard}>
                            <div className={styles.productImage}>
                                {product.image_url ? (
                                    <img src={product.image_url} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <Coffee size={48} />
                                )}
                            </div>
                            <div className={styles.productContent}>
                                <div className={styles.productHeader}>
                                    <h3 className={styles.productName}>{product.name}</h3>
                                    <span className={styles.productPrice}>{formatCurrency(product.price)}</span>
                                </div>
                                <div className={styles.productCategory}>{product.category}</div>
                                <p className={styles.productDescription}>{product.description}</p>

                                <div className={styles.actions}>
                                    <button
                                        className={styles.actionButton}
                                        onClick={() => {
                                            setCurrentProduct(product)
                                            fetchProductIngredients(product.id)
                                            setIsModalOpen(true)
                                        }}
                                    >
                                        <Edit2 size={16} /> Editar
                                    </button>
                                    <button
                                        className={`${styles.actionButton} ${styles.deleteButton}`}
                                        onClick={() => handleDelete(product.id)}
                                    >
                                        <Trash2 size={16} /> Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className={styles.modalTitle}>
                                {currentProduct.id ? 'Editar Producto' : 'Nuevo Producto'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Receta / Ingredientes FIRST to drive cost */}
                        <div style={{ marginBottom: '2rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <label className={styles.label} style={{ marginBottom: 0 }}>Receta (Ingredientes)</label>
                                <button
                                    onClick={addIngredient}
                                    type="button"
                                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--primary)', padding: '0.25rem 0.5rem', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                                >
                                    <Plus size={14} /> Agregar Insumo
                                </button>
                            </div>

                            {currentIngredients.map((ing, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <select
                                        className={styles.select}
                                        value={ing.inventory_id}
                                        onChange={e => updateIngredient(index, 'inventory_id', e.target.value)}
                                        style={{ padding: '0.5rem' }}
                                    >
                                        <option value="">Seleccionar insumo...</option>
                                        {inventoryItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.name} ({formatCurrency(item.cost || 0)}/{item.unit})
                                            </option>
                                        ))}
                                    </select>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <input
                                            type="number"
                                            className={styles.input}
                                            value={ing.quantity_required}
                                            onChange={e => updateIngredient(index, 'quantity_required', Number(e.target.value))}
                                            placeholder="Cant."
                                            style={{ padding: '0.5rem', flex: 1 }}
                                        />
                                        <span style={{ fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap', minWidth: '20px' }}>
                                            {inventoryItems.find(i => i.id === ing.inventory_id)?.unit || '-'}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => removeIngredient(index)}
                                        style={{ background: 'transparent', border: 'none', color: '#e63946', cursor: 'pointer' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                            {currentIngredients.length === 0 && (
                                <p style={{ fontSize: '0.8rem', color: '#666', fontStyle: 'italic' }}>No hay ingredientes definidos para este producto.</p>
                            )}

                            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ color: '#aaa' }}>Costo Total de Insumos:</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e63946' }}>{formatCurrency(totalCost)}</span>
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre</label>
                            <input
                                className={styles.input}
                                value={currentProduct.name || ''}
                                onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                placeholder="Ej: Café Latte"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Margen (%)</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={profitMargin}
                                    onChange={e => handleMarginChange(Number(e.target.value))}
                                    placeholder="30"
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Precio Venta</label>
                                <input
                                    type="number"
                                    className={styles.input}
                                    value={currentProduct.price || ''}
                                    onChange={e => handlePriceChange(Number(e.target.value))}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Categoría</label>
                            <select
                                className={styles.select}
                                value={currentProduct.category || ''}
                                onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                            >
                                <option value="">Seleccionar...</option>
                                <option value="Café">Café</option>
                                <option value="Pastelería">Pastelería</option>
                                <option value="Bebidas Frías">Bebidas Frías</option>
                                <option value="Agregados">Agregados</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Descripción</label>
                            <textarea
                                className={styles.textarea}
                                rows={3}
                                value={currentProduct.description || ''}
                                onChange={e => setCurrentProduct({ ...currentProduct, description: e.target.value })}
                                placeholder="Descripción del producto..."
                            />
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
                                Guardar Producto
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

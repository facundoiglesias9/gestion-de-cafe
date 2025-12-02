'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { Plus, ArrowLeft, X, Clock, CheckCircle, Coffee, AlertCircle, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'

interface Product {
    id: string
    name: string
    price: number
    category: string
}

interface OrderItem {
    product: Product
    quantity: number
}

interface Order {
    id: string
    created_at: string
    customer_name: string
    status: 'pending' | 'preparing' | 'ready' | 'completed'
    total: number
    items?: any[]
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [cart, setCart] = useState<OrderItem[]>([])
    const [customerName, setCustomerName] = useState('')
    const router = useRouter()

    useEffect(() => {
        fetchOrders()
        fetchProducts()

        // Realtime subscription
        const channel = supabase
            .channel('orders_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                fetchOrders()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    async function fetchOrders() {
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .neq('status', 'completed') // Only active orders
            .order('created_at', { ascending: true })

        if (data) setOrders(data)
    }

    async function fetchProducts() {
        const { data } = await supabase.from('products').select('*').order('name')
        if (data) setProducts(data)
    }

    function addToCart(product: Product) {
        setCart(prev => {
            const existing = prev.find(item => item.product.id === product.id)
            if (existing) {
                return prev.map(item =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                )
            }
            return [...prev, { product, quantity: 1 }]
        })
    }

    function removeFromCart(productId: string) {
        setCart(prev => prev.filter(item => item.product.id !== productId))
    }

    const cartTotal = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)

    async function handleCreateOrder() {
        if (!customerName || cart.length === 0) return

        try {
            // 1. Validate Stock
            for (const item of cart) {
                const { data: ingredients, error: ingError } = await supabase
                    .from('product_ingredients')
                    .select('inventory_id, quantity_required')
                    .eq('product_id', item.product.id)

                if (ingError && ingError.code !== '42P01') { // Ignore if table doesn't exist yet
                    console.error('Error checking ingredients:', ingError)
                }

                if (ingredients && ingredients.length > 0) {
                    for (const ing of ingredients) {
                        const { data: inventoryItem } = await supabase
                            .from('inventory')
                            .select('id, quantity, name')
                            .eq('id', ing.inventory_id)
                            .single()

                        if (inventoryItem) {
                            const totalNeeded = ing.quantity_required * item.quantity
                            if (inventoryItem.quantity < totalNeeded) {
                                throw new Error(`Stock insuficiente de ${inventoryItem.name}. Necesario: ${totalNeeded}, Disponible: ${inventoryItem.quantity}`)
                            }
                        }
                    }
                }
            }

            // 2. Create Order
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .insert([{
                    customer_name: customerName,
                    total: cartTotal,
                    status: 'pending'
                }])
                .select()
                .single()

            if (orderError) throw orderError

            // 3. Create Order Items
            const orderItems = cart.map(item => ({
                order_id: orderData.id,
                product_id: item.product.id,
                quantity: item.quantity,
                price: item.product.price
            }))

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItems)

            if (itemsError) throw itemsError

            // 4. Deduct Inventory
            for (const item of cart) {
                const { data: ingredients } = await supabase
                    .from('product_ingredients')
                    .select('inventory_id, quantity_required')
                    .eq('product_id', item.product.id)

                if (ingredients && ingredients.length > 0) {
                    for (const ing of ingredients) {
                        // We fetch again to be safe, or we could optimize
                        const { data: inventoryItem } = await supabase
                            .from('inventory')
                            .select('quantity')
                            .eq('id', ing.inventory_id)
                            .single()

                        if (inventoryItem) {
                            const newQuantity = inventoryItem.quantity - (ing.quantity_required * item.quantity)
                            await supabase
                                .from('inventory')
                                .update({ quantity: newQuantity })
                                .eq('id', ing.inventory_id)
                        }
                    }
                }
            }

            setIsModalOpen(false)
            setCart([])
            setCustomerName('')
            fetchOrders()
            alert('Pedido creado correctamente')
        } catch (error: any) {
            console.error('Error creating order:', error)
            alert(error.message || 'Error al crear el pedido')
        }
    }

    async function updateStatus(orderId: string, newStatus: string) {
        await supabase
            .from('orders')
            .update({ status: newStatus })
            .eq('id', orderId)

        fetchOrders()
    }

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#e63946'
            case 'preparing': return '#d4a373'
            case 'ready': return '#2a9d8f'
            default: return '#888'
        }
    }

    const getNextStatusColor = (currentStatus: string) => {
        switch (currentStatus) {
            case 'pending': return '#d4a373' // Next is preparing (orange)
            case 'preparing': return '#2a9d8f' // Next is ready (teal)
            case 'ready': return '#2a9d8f' // Next is completed (teal/green)
            default: return '#888'
        }
    }

    const columns = [
        { id: 'pending', title: 'Pendientes', icon: <AlertCircle size={18} /> },
        { id: 'preparing', title: 'En Preparación', icon: <Clock size={18} /> },
        { id: 'ready', title: 'Listos', icon: <CheckCircle size={18} /> },
    ]

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Gestión de Pedidos</h1>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        className={styles.newOrderButton}
                        onClick={() => router.push('/history')}
                        style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--glass-border)' }}
                    >
                        <Clock size={20} /> Historial
                    </button>
                    <button className={styles.newOrderButton} onClick={() => setIsModalOpen(true)}>
                        <Plus size={20} /> Nuevo Pedido
                    </button>
                </div>
            </header>

            <div className={styles.columnsGrid}>
                {columns.map(col => (
                    <div key={col.id} className={styles.column}>
                        <div className={styles.columnHeader}>
                            <div className={styles.columnTitle} style={{ color: getStatusColor(col.id) }}>
                                {col.icon} {col.title}
                            </div>
                            <span className={styles.columnCount}>
                                {orders.filter(o => o.status === col.id).length}
                            </span>
                        </div>

                        {orders.filter(o => o.status === col.id).map(order => (
                            <div
                                key={order.id}
                                className={styles.orderCard}
                                onClick={() => {
                                    if (col.id === 'pending') updateStatus(order.id, 'preparing')
                                    else if (col.id === 'preparing') updateStatus(order.id, 'ready')
                                    else if (col.id === 'ready') updateStatus(order.id, 'completed')
                                }}
                            >
                                <div className={styles.orderHeader}>
                                    <span className={styles.orderId}>#{order.id.slice(0, 4)}</span>
                                    <span className={styles.orderTime}>
                                        {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className={styles.customerName}>{order.customer_name}</div>
                                <div className={styles.orderFooter}>
                                    <span className={styles.orderTotal}>{formatCurrency(order.total)}</span>
                                    <button
                                        className={styles.advanceButton}
                                        style={{ color: getNextStatusColor(col.id) }}
                                    >
                                        {col.id === 'pending' && 'En Preparación'}
                                        {col.id === 'preparing' && 'Listo'}
                                        {col.id === 'ready' && 'Entregado'}
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>Nuevo Pedido</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <div className={styles.modalBody}>
                            <div className={styles.productsList}>
                                {products.map(product => (
                                    <div key={product.id} className={styles.productItem} onClick={() => addToCart(product)}>
                                        <Coffee size={32} style={{ marginBottom: '0.5rem', color: '#d4a373' }} />
                                        <div style={{ fontWeight: '600' }}>{product.name}</div>
                                        <div style={{ color: '#888' }}>{formatCurrency(product.price)}</div>
                                    </div>
                                ))}
                            </div>
                            <div className={styles.cartSection}>
                                <input
                                    className={styles.input}
                                    placeholder="Nombre del Cliente"
                                    value={customerName}
                                    onChange={e => setCustomerName(e.target.value)}
                                    autoFocus
                                />
                                <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem' }}>
                                    {cart.map((item, idx) => (
                                        <div key={idx} className={styles.cartItem}>
                                            <div>
                                                <div style={{ fontWeight: '500' }}>{item.product.name}</div>
                                                <div style={{ fontSize: '0.8rem', color: '#888' }}>x{item.quantity}</div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span>{formatCurrency(item.product.price * item.quantity)}</span>
                                                <button
                                                    onClick={() => removeFromCart(item.product.id)}
                                                    style={{ background: 'transparent', border: 'none', color: '#e63946', cursor: 'pointer' }}
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className={styles.cartTotal}>
                                    <div className={styles.totalRow}>
                                        <span>Total</span>
                                        <span>{formatCurrency(cartTotal)}</span>
                                    </div>
                                    <button className={styles.confirmButton} onClick={handleCreateOrder}>
                                        Confirmar Pedido
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    )
}

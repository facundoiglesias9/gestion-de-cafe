
'use client'

import styles from './page.module.css'
import { ArrowLeft, Store, Printer, CreditCard, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function SettingsPage() {
    const router = useRouter()
    const [storeName, setStoreName] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    async function fetchSettings() {
        try {
            const { data, error } = await supabase
                .from('store_settings')
                .select('store_name')
                .single() // Assuming only one row

            if (data) {
                setStoreName(data.store_name)
            } else {
                // Fallback if no row exists (though SQL script creates one)
                setStoreName('Café Manager')
            }
        } catch (error) {
            console.error('Error fetching settings:', error)
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            // We update the first row found, or we could assume ID 1
            // A safer way is to update where id is not null (updates all rows, but we only have 1)
            // Or better, fetch the ID first. But let's assume single row logic.

            // First, let's just update all rows since we only want one store name
            const { error } = await supabase
                .from('store_settings')
                .update({ store_name: storeName })
                .gt('id', 0) // Update all rows

            if (error) throw error

            alert('Nombre actualizado correctamente')
            router.push('/')
            router.refresh()
        } catch (error) {
            console.error('Error saving settings:', error)
            alert('Error al guardar')
        } finally {
            setSaving(false)
        }
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Editar Tienda</h1>
                </div>
            </header>

            <div className={styles.section} style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre de la Tienda</label>
                    <input
                        className={styles.input}
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        placeholder="Ej: Mi Cafetería"
                        disabled={loading}
                    />
                </div>

                <button
                    className={styles.saveButton}
                    onClick={handleSave}
                    disabled={loading || saving}
                    style={{ marginTop: '2rem', width: '100%', justifyContent: 'center' }}
                >
                    <Save size={18} style={{ marginRight: '0.5rem' }} />
                    {saving ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>
        </main>
    )
}

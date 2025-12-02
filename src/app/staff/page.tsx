
'use client'

import { useEffect, useState } from 'react'
import styles from './page.module.css'
import { Plus, ArrowLeft, User, Shield, Edit2, Trash2, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

interface StaffMember {
    id: string
    name: string
    role: string
}

export default function StaffPage() {
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentMember, setCurrentMember] = useState<Partial<StaffMember>>({})
    const router = useRouter()

    useEffect(() => {
        fetchStaff()
    }, [])

    async function fetchStaff() {
        const { data, error } = await supabase
            .from('staff')
            .select('*')
            .order('name')

        if (data) setStaff(data)
    }

    const handleSave = async () => {
        if (!currentMember.name) {
            alert('Por favor complete el nombre.')
            return
        }

        try {
            if (currentMember.id) {
                const { error } = await supabase
                    .from('staff')
                    .update({ name: currentMember.name, role: currentMember.role })
                    .eq('id', currentMember.id)
                if (error) throw error
            } else {
                const { error } = await supabase
                    .from('staff')
                    .insert([{ name: currentMember.name, role: currentMember.role || 'Camarero' }])
                if (error) throw error
            }

            setIsModalOpen(false)
            setCurrentMember({})
            fetchStaff()
        } catch (error) {
            console.error('Error saving staff:', error)
            alert('Error al guardar empleado')
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Eliminar empleado?')) {
            try {
                const { error } = await supabase
                    .from('staff')
                    .delete()
                    .eq('id', id)

                if (error) throw error
                fetchStaff()
            } catch (error) {
                console.error('Error deleting staff:', error)
            }
        }
    }

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Personal</h1>
                </div>
                <button
                    className={styles.addButton}
                    onClick={() => {
                        setCurrentMember({ role: 'Camarero' })
                        setIsModalOpen(true)
                    }}
                >
                    <Plus size={20} /> Nuevo Empleado
                </button>
            </header>

            <div className={styles.grid}>
                {staff.map(member => (
                    <div key={member.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <div className={styles.avatar}>
                                {member.name.charAt(0)}
                            </div>
                            <span className={styles.roleBadge}>{member.role}</span>
                        </div>
                        <div>
                            <h3 className={styles.name}>{member.name}</h3>
                        </div>
                        <div className={styles.actions}>
                            <button
                                className={styles.actionButton}
                                onClick={() => {
                                    setCurrentMember(member)
                                    setIsModalOpen(true)
                                }}
                            >
                                <Edit2 size={16} /> Editar
                            </button>
                            <button
                                className={styles.actionButton}
                                onClick={() => handleDelete(member.id)}
                                style={{ color: '#e63946', borderColor: 'rgba(230, 57, 70, 0.3)' }}
                            >
                                <Trash2 size={16} /> Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h2 className={styles.modalTitle}>
                                {currentMember.id ? 'Editar Empleado' : 'Nuevo Empleado'}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer' }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className={styles.formGroup}>
                            <label className={styles.label}>Nombre Completo</label>
                            <input
                                className={styles.input}
                                value={currentMember.name || ''}
                                onChange={e => setCurrentMember({ ...currentMember, name: e.target.value })}
                                placeholder="Ej: Juan Pérez"
                            />
                        </div>



                        <div className={styles.formGroup}>
                            <label className={styles.label}>Rol</label>
                            <select
                                className={styles.select}
                                value={currentMember.role || 'Camarero'}
                                onChange={e => setCurrentMember({ ...currentMember, role: e.target.value })}
                            >
                                <option value="Gerente">Gerente</option>
                                <option value="Barista">Barista</option>
                                <option value="Camarero">Camarero</option>
                                <option value="Cajero">Cajero</option>
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

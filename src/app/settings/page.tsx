
'use client'

import styles from './page.module.css'
import { ArrowLeft, Store, Printer, CreditCard, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
    const router = useRouter()

    return (
        <main className={styles.container}>
            <header className={styles.header}>
                <div>
                    <button onClick={() => router.push('/')} className={styles.backButton}>
                        <ArrowLeft size={18} /> Volver al Inicio
                    </button>
                    <h1 className={styles.title}>Configuración</h1>
                </div>
                <button className={styles.saveButton}>
                    <Save size={18} style={{ marginRight: '0.5rem' }} /> Guardar Cambios
                </button>
            </header>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Store size={24} /> Datos del Negocio
                </h2>
                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Nombre del Café</label>
                        <input className={styles.input} defaultValue="Café Manager" />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Dirección</label>
                        <input className={styles.input} defaultValue="Av. Principal 123" />
                    </div>
                </div>
                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Teléfono</label>
                        <input className={styles.input} defaultValue="+54 11 1234-5678" />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Email de Contacto</label>
                        <input className={styles.input} defaultValue="contacto@cafe.com" />
                    </div>
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <Printer size={24} /> Impresoras y Tickets
                </h2>
                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Impresora de Cocina</label>
                        <select className={styles.select}>
                            <option>EPSON TM-T20III</option>
                            <option>Generic Text Printer</option>
                        </select>
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Impresora de Caja</label>
                        <select className={styles.select}>
                            <option>EPSON TM-T20III</option>
                            <option>Generic Text Printer</option>
                        </select>
                    </div>
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.label}>Mensaje al pie del ticket</label>
                    <input className={styles.input} defaultValue="¡Gracias por su visita! Vuelva pronto." />
                </div>
            </div>

            <div className={styles.section}>
                <h2 className={styles.sectionTitle}>
                    <CreditCard size={24} /> Impuestos y Facturación
                </h2>
                <div className={styles.row}>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>IVA (%)</label>
                        <input className={styles.input} type="number" defaultValue="21" />
                    </div>
                    <div className={styles.formGroup}>
                        <label className={styles.label}>Moneda</label>
                        <select className={styles.select}>
                            <option>ARS ($)</option>
                            <option>USD ($)</option>
                            <option>EUR (€)</option>
                        </select>
                    </div>
                </div>
            </div>
        </main>
    )
}

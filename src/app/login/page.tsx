
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { Coffee, Lock, User } from 'lucide-react'

export default function LoginPage() {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault()

        if (username === 'marcelo' && password === 'marcelo') {
            // Set a simple cookie for middleware to check
            document.cookie = "auth=true; path=/; max-age=86400" // 1 day
            router.push('/')
            router.refresh() // Force refresh to update middleware state
        } else {
            setError('Credenciales incorrectas. Intenta de nuevo.')
        }
    }

    return (
        <div className={styles.container}>
            <div className={styles.loginCard}>
                <div className={styles.header}>
                    <Coffee size={48} color="#d4a373" style={{ marginBottom: '1rem' }} />
                    <h1 className={styles.title}>Bienvenido</h1>
                    <p className={styles.subtitle}>Inicia sesión para gestionar tu cafetería</p>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <form onSubmit={handleLogin} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Usuario</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={styles.input}
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="Ingresa tu usuario"
                            />
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Contraseña</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={styles.input}
                                style={{ paddingLeft: '2.5rem' }}
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button type="submit" className={styles.button}>
                        Ingresar al Sistema
                    </button>
                </form>
            </div>
        </div>
    )
}

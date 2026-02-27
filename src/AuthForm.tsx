import { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from './services/firebase';

interface AuthFormProps {
    onRegisterSuccess?: (user: any) => void;
}

export default function AuthForm({ onRegisterSuccess }: AuthFormProps) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isRegister) {
                // register new user
                const res = await createUserWithEmailAndPassword(auth, email, password);
                onRegisterSuccess?.(res.user);
                console.log('Registered user:', res.user);

            } else {
                // login existing user
                const res = await signInWithEmailAndPassword(auth, email, password);
                console.log('Logged in user:', res.user);
            }
            // clear form
            setEmail('');
            setPassword('');
        } catch (err: any) {
            console.error(err.message);
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-sm mx-auto mt-20 p-6 bg-white rounded-2xl shadow-lg">
            <h2 className="text-xl font-bold mb-4">{isRegister ? 'Register' : 'Login'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-stone-900 text-white rounded-xl font-bold hover:bg-stone-800 transition"
                >
                    {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
                </button>
            </form>
            <p className="text-xs mt-3 text-center">
                {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
                <button className="underline" onClick={() => setIsRegister(!isRegister)}>
                    {isRegister ? 'Login' : 'Register'}
                </button>
            </p>
        </div>
    );
}
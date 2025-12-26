import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) throw loginError;

      if (data.session) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Email ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark">
      {/* Header Image */}
      <div className="w-full p-4 pb-2">
        <div
          className="w-full h-48 bg-center bg-no-repeat bg-cover rounded-2xl shadow-sm relative overflow-hidden"
          style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuAQoLn2kHnjaVwfT9sGqxebyGfVivzO2D1HTlykgfuX4lPpFiuyN13dwOyBsggBIIv1Z48V17Wh4S5k5ZKAVt5wGMBVtxSi9Lsqq_gflvnacfbHBoi-EntX3m3Oh4lwFVZ9I2h_mLXT7G080RM6F9b7z_yfuDpjuX5EVO9Ku9u_ihGWFnFAalofUMxJiLxcYBxtPX92_zlkFzwZKjvnd0JZu--SpjpWnakSylAiqTJA24RCJBTTEw8JKwrdi5zg8M9J_9BV8SIamHM")' }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="absolute bottom-4 left-4">
            <button onClick={() => navigate('/')} className="text-white/80 hover:text-white flex items-center gap-1 mb-2 text-xs uppercase tracking-wider font-medium">
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              AgendaCasaES
            </button>
            <p className="text-white text-lg font-bold leading-tight">Gestão Inteligente</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col px-6 pt-4 pb-2">
        <h1 className="text-slate-900 dark:text-white text-[28px] font-bold leading-tight">Bem-vindo(a)</h1>
        <p className="text-slate-500 dark:text-slate-400 text-base mt-1">Faça login para gerenciar seu negócio.</p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

      <form className="flex flex-col gap-4 px-6 py-2" onSubmit={handleLogin}>
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-900 dark:text-slate-200 text-sm font-semibold" htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary h-12 px-4 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-slate-900 dark:text-slate-200 text-sm font-semibold" htmlFor="password">Senha</label>
          </div>
          <div className="relative flex items-center">
            <input
              id="password"
              type="password"
              placeholder="Sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark text-slate-900 dark:text-white focus:border-primary focus:ring-1 focus:ring-primary h-12 pl-4 pr-12 transition-all"
            />
            <button type="button" className="absolute right-0 pr-4 text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-[20px]">visibility</span>
            </button>
          </div>
          <div className="flex justify-end pt-1">
            <a href="#" className="text-primary hover:text-primary-dark text-sm font-medium">Esqueci minha senha</a>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary-dark text-white h-12 rounded-xl font-semibold text-base shadow-md shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : (
              <>
                <span>Entrar</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </>
            )}
          </button>
        </div>
      </form>

      <div className="px-6 pb-8 pt-4 mt-auto">
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-slate-500 dark:text-slate-400 text-sm">Não tem uma conta?</span>
          <button onClick={() => navigate('/signup')} className="text-primary hover:text-primary-dark font-semibold text-sm">Criar conta grátis</button>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
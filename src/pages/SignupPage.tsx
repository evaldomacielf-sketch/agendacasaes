import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import { PhoneInput } from '../components/PhoneInput';

const SignupScreen: React.FC = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [nomeSalao, setNomeSalao] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validação simples de frontend
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setError("Por favor, insira um telefone válido com DDD.");
      return;
    }

    if (!nomeSalao.trim()) {
      setError("Por favor, insira o nome do seu estabelecimento.");
      return;
    }

    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    try {
      setLoading(true);
      const { data, error: signupError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            phone: phone, // Lido pelo Trigger
            nome_salao: nomeSalao, // Lido pelo Trigger
          },
        },
      });

      if (signupError) throw signupError;

      if (data.user) {
        alert("Conta criada com sucesso! Verifique seu e-mail para confirmar.");
        navigate('/login');
      }
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Erro ao criar conta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark">
      <div className="flex items-center p-4 pb-2 justify-between sticky top-0 z-10 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md">
        <button onClick={() => navigate('/')} className="flex size-12 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-slate-900 dark:text-white">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
      </div>

      <main className="flex-1 flex flex-col px-6 pb-6">
        <div className="flex flex-col pt-2 pb-6">
          <h1 className="text-slate-900 dark:text-white text-[32px] font-bold leading-tight">Criar conta</h1>
          <p className="text-slate-600 dark:text-gray-400 text-base mt-2">Junte-se ao AgendaCasaES e gerencie seu negócio com facilidade.</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">error</span>
            {error}
          </div>
        )}

        <form className="flex flex-col gap-5" onSubmit={handleSignup}>
          <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">Nome completo</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Maria Silva"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-[#d2e5dd] dark:border-[#2a4035] bg-surface-light dark:bg-surface-dark focus:border-primary focus:ring-1 focus:ring-primary h-14 px-4 text-base text-slate-900 dark:text-white shadow-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <span className="material-symbols-outlined filled-icon text-[20px]">person</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">Nome do Estabelecimento</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Studio Glamour"
                value={nomeSalao}
                onChange={(e) => setNomeSalao(e.target.value)}
                required
                className="w-full rounded-xl border border-[#d2e5dd] dark:border-[#2a4035] bg-surface-light dark:bg-surface-dark focus:border-primary focus:ring-1 focus:ring-primary h-14 px-4 text-base text-slate-900 dark:text-white shadow-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <span className="material-symbols-outlined filled-icon text-[20px]">storefront</span>
              </span>
            </div>
          </div>

          <PhoneInput value={phone} onChange={setPhone} />

          <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">E-mail</label>
            <div className="relative">
              <input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border border-[#d2e5dd] dark:border-[#2a4035] bg-surface-light dark:bg-surface-dark focus:border-primary focus:ring-1 focus:ring-primary h-14 px-4 text-base text-slate-900 dark:text-white shadow-sm"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none">
                <span className="material-symbols-outlined filled-icon text-[20px]">mail</span>
              </span>
            </div>
          </div>

          {/* Passwords */}
          <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">Senha</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-[#d2e5dd] dark:border-[#2a4035] bg-surface-light dark:bg-surface-dark focus:border-primary focus:ring-1 focus:ring-primary h-14 px-4 text-base text-slate-900 dark:text-white shadow-sm pr-12"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-slate-900 dark:text-gray-200 text-sm font-medium">Confirmar senha</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-[#d2e5dd] dark:border-[#2a4035] bg-surface-light dark:bg-surface-dark focus:border-primary focus:ring-1 focus:ring-primary h-14 px-4 text-base text-slate-900 dark:text-white shadow-sm pr-12"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-gray-500 mt-2 leading-relaxed">
            Ao clicar em "Criar conta", você concorda com os nossos <a href="#" className="text-primary hover:underline font-medium">Termos de Uso</a> e <a href="#" className="text-primary hover:underline font-medium">Política de Privacidade</a>.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-xl bg-primary py-4 px-6 text-base font-bold text-white shadow-lg shadow-primary/25 hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <span className="material-symbols-outlined animate-spin">progress_activity</span> : 'Criar conta'}
          </button>
        </form>

        <div className="flex justify-center py-4 border-t border-gray-100 dark:border-white/5 mt-8">
          <p className="text-sm text-slate-900 dark:text-gray-300">
            Já tem uma conta? <button onClick={() => navigate('/login')} className="font-bold text-primary hover:text-primary/80 ml-1">Entrar</button>
          </p>
        </div>
      </main>
    </div>
  );
};

export default SignupScreen;
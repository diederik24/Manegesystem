import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Laad opgeslagen email en wachtwoord bij mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const rememberedEmail = localStorage.getItem('remembered_email');
      const rememberedPassword = localStorage.getItem('remembered_password');
      const shouldRemember = localStorage.getItem('remember_me') === 'true';
      
      if (rememberedEmail) {
        setEmail(rememberedEmail);
      }
      
      if (rememberedPassword && shouldRemember) {
        setPassword(rememberedPassword);
        setRememberMe(true);
      } else if (shouldRemember) {
        setRememberMe(true);
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          // Maak session persistent als "onthouden" is aangevinkt
          persistSession: rememberMe,
        }
      });

      if (signInError) {
        console.error('Sign in error:', signInError);
        throw signInError;
      }

      if (data?.user) {
        console.log('Login successful');
        
        // Als "onthouden" is aangevinkt, sla email en wachtwoord op
        if (rememberMe && typeof window !== 'undefined') {
          localStorage.setItem('remembered_email', email);
          localStorage.setItem('remembered_password', password);
          localStorage.setItem('remember_me', 'true');
        } else if (typeof window !== 'undefined') {
          // Verwijder opgeslagen gegevens als "onthouden" is uitgezet
          localStorage.removeItem('remembered_email');
          localStorage.removeItem('remembered_password');
          localStorage.removeItem('remember_me');
        }
        
        // Wacht even zodat de session is opgeslagen
        await new Promise(resolve => setTimeout(resolve, 100));
        onLoginSuccess();
      } else {
        throw new Error('Geen gebruiker data ontvangen');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Fout bij inloggen. Controleer je email en wachtwoord.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo en Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mb-4 shadow-md overflow-hidden">
            <img 
              src="/Logo.png" 
              alt="Manege Duikse Hoef Logo" 
              className="h-20 w-20 object-contain rounded-full"
            />
          </div>
          <h1 className="text-3xl font-bold text-brand-dark mb-2">Welkom</h1>
          <p className="text-brand-primary">Manege Duiksehoef Beheer</p>
        </div>

        {/* Login Form Card */}
        <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          {/* Email Field */}
          <div className="mb-4">
            <label className="block text-brand-dark font-medium mb-2">E-mailadres</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-brand-primary" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jouw@email.nl"
                className="w-full pl-10 pr-4 py-3 border border-brand-soft/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="mb-4">
            <label className="block text-brand-dark font-medium mb-2">Wachtwoord</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-brand-primary" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="........"
                className="w-full pl-10 pr-12 py-3 border border-brand-soft/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5 text-brand-soft" />
                ) : (
                  <Eye className="w-5 h-5 text-brand-soft" />
                )}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 text-red-700 text-sm p-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Remember Me Checkbox */}
          <div className="mb-4 flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-brand-soft focus:ring-brand-primary focus:ring-2"
              style={{ accentColor: '#e72d81' }}
            />
            <label htmlFor="rememberMe" className="ml-2 text-sm text-brand-dark cursor-pointer">
              Wachtwoord onthouden
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-primary text-white py-3 rounded-lg font-semibold hover:bg-brand-hover transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading ? 'Laden...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;


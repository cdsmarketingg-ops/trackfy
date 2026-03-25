import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  TrendingUp, Users, DollarSign, MousePointer2, 
  Filter, Calendar, RefreshCw, ChevronRight,
  Target, BarChart3, LayoutDashboard, Settings,
  LogOut, User, Link2, Globe, MessageSquare, 
  ShieldCheck, FileText, Bell, Percent, Wallet, 
  Gavel, Facebook, Chrome, Music2, Video, Code2,
  ChevronDown, Search, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from './firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface Stats {
  totalRevenue: number;
  totalSales: number;
  totalSessions: number;
  campaignStats: {
    campaign: string;
    revenue: number;
    sales: number;
    cost: number;
  }[];
}

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeMenu, setActiveMenu] = useState('Integrações');
  const [activeTab, setActiveTab] = useState('Anúncios');
  const [settings, setSettings] = useState({
    meta_pixel_id: '',
    meta_access_token: '',
    webhook_secret: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    // Mock user for development/preview as requested
    setUser({
      uid: 'mock-user-id',
      displayName: 'Usuário Teste',
      email: 'teste@exemplo.com',
      photoURL: 'https://ui-avatars.com/api/?name=Usuario+Teste&background=0D8ABC&color=fff'
    });
    setLoading(false);
    fetchStats();
    fetchSettings();
  }, []);

  const fetchStats = async () => {
    setRefreshing(true);
    try {
      const response = await fetch('/api/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'settings', 'config');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setSettings(docSnap.data() as any);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const { doc, setDoc } = await import('firebase/firestore');
      await setDoc(doc(db, 'settings', 'config'), settings);
      alert("Configurações salvas com sucesso!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Erro ao salvar configurações.");
    } finally {
      setSavingSettings(false);
    }
  };

  const login = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Login bypass enabled
  /*
  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#151619] border border-white/10 rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Target className="w-8 h-8 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">UTMify Clone</h1>
          <p className="text-gray-400 mb-8">
            Sistema profissional de rastreamento de conversões para infoprodutos.
          </p>
          <button 
            onClick={login}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <User className="w-5 h-5" />
            Entrar com Google
          </button>
        </motion.div>
      </div>
    );
  }
  */

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col sticky top-0 h-screen overflow-y-auto scrollbar-hide">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
            <span className="text-black font-black text-2xl">U</span>
          </div>
          <span className="font-bold text-2xl tracking-tighter">utmify</span>
          <div className="ml-auto w-5 h-5 rounded-full border border-white/20 flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-white/40"></div>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-0.5">
          <SidebarItem icon={<LayoutDashboard className="w-5 h-5" />} label="Dashboards" hasSubmenu />
          <div className="pl-10 py-1">
            <SidebarSubItem label="Principal" active={activeMenu === 'Principal'} onClick={() => setActiveMenu('Principal')} />
          </div>
          
          <SidebarItem icon={<FileText className="w-5 h-5" />} label="Resumo" active={activeMenu === 'Resumo'} onClick={() => setActiveMenu('Resumo')} />
          <SidebarItem icon={<Facebook className="w-5 h-5" />} label="Meta" active={activeMenu === 'Meta'} onClick={() => setActiveMenu('Meta')} />
          <SidebarItem icon={<Chrome className="w-5 h-5" />} label="Google" active={activeMenu === 'Google'} onClick={() => setActiveMenu('Google')} />
          <SidebarItem icon={<Video className="w-5 h-5" />} label="Kwai" active={activeMenu === 'Kwai'} onClick={() => setActiveMenu('Kwai')} />
          <SidebarItem icon={<Music2 className="w-5 h-5" />} label="TikTok" active={activeMenu === 'TikTok'} onClick={() => setActiveMenu('TikTok')} />
          <SidebarItem icon={<BarChart3 className="w-5 h-5" />} label="UTMs" active={activeMenu === 'UTMs'} onClick={() => setActiveMenu('UTMs')} />
          <SidebarItem icon={<Link2 className="w-5 h-5" />} label="Integrações" active={activeMenu === 'Integrações'} onClick={() => setActiveMenu('Integrações')} />
          <SidebarItem icon={<Gavel className="w-5 h-5" />} label="Regras" active={activeMenu === 'Regras'} onClick={() => setActiveMenu('Regras')} />
          <SidebarItem icon={<Percent className="w-5 h-5" />} label="Taxas" active={activeMenu === 'Taxas'} onClick={() => setActiveMenu('Taxas')} />
          <SidebarItem icon={<Wallet className="w-5 h-5" />} label="Despesas" active={activeMenu === 'Despesas'} onClick={() => setActiveMenu('Despesas')} />
          <SidebarItem icon={<BarChart className="w-5 h-5" />} label="Relatórios" active={activeMenu === 'Relatórios'} onClick={() => setActiveMenu('Relatórios')} />
          <SidebarItem icon={<Bell className="w-5 h-5" />} label="Notificação..." active={activeMenu === 'Notificação'} onClick={() => setActiveMenu('Notificação')} />
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <div className="bg-white/5 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm">
              ES
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.displayName || 'Usuário'}</p>
              <p className="text-xs text-gray-500 truncate">Usuário</p>
            </div>
            <button onClick={logout} className="text-gray-500 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[#0a0a0a]">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-xl sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-medium text-gray-200">Dashboard - Principal</h2>
            <RefreshCw className="w-4 h-4 text-gray-500 cursor-pointer hover:text-white transition-colors" />
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <img src="https://flagcdn.com/w20/br.png" alt="BR" className="w-5 h-auto rounded-sm" />
              <span className="text-xs font-medium text-gray-400">PT-BR</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>Prêmios</span>
              <RefreshCw className="w-3 h-3" />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-xs font-bold text-gray-200">R$ 374.1K / R$ 1M</span>
              <div className="w-32 h-1.5 bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className="h-full bg-blue-600 w-[37.4%]"></div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {activeMenu === 'Integrações' && (
            <div className="space-y-8">
              {/* Tabs */}
              <div className="flex items-center gap-8 border-b border-white/5 overflow-x-auto scrollbar-hide">
                <TabItem icon={<TrendingUp className="w-4 h-4" />} label="Anúncios" active={activeTab === 'Anúncios'} onClick={() => setActiveTab('Anúncios')} />
                <TabItem icon={<RefreshCw className="w-4 h-4" />} label="Webhooks" active={activeTab === 'Webhooks'} onClick={() => setActiveTab('Webhooks')} />
                <TabItem icon={<BarChart3 className="w-4 h-4" />} label="UTMs" active={activeTab === 'UTMs'} onClick={() => setActiveTab('UTMs')} />
                <TabItem icon={<Code2 className="w-4 h-4" />} label="Pixel" active={activeTab === 'Pixel'} onClick={() => setActiveTab('Pixel')} />
                <TabItem icon={<MessageSquare className="w-4 h-4" />} label="WhatsApp" active={activeTab === 'WhatsApp'} onClick={() => setActiveTab('WhatsApp')} />
                <TabItem icon={<FileText className="w-4 h-4" />} label="Testes" active={activeTab === 'Testes'} onClick={() => setActiveTab('Testes')} />
              </div>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {activeTab === 'Anúncios' && (
                  <motion.div 
                    key="anuncios"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <IntegrationCard 
                      icon={<Facebook className="w-6 h-6 text-blue-500" />} 
                      label="Meta Ads" 
                      description="Conecte sua conta para importar campanhas, gastos e métricas em tempo real."
                      status="Conectar"
                    />
                    <IntegrationCard 
                      icon={<Chrome className="w-6 h-6 text-orange-500" />} 
                      label="Google Ads" 
                      description="Importe dados de custo e performance diretamente do Google Ads."
                      status="Conectar"
                    />
                    <IntegrationCard 
                      icon={<Video className="w-6 h-6 text-orange-600" />} 
                      label="Kwai Ads" 
                      description="Sincronize seus gastos e métricas da conta Kwai Ads."
                      status="Em breve"
                    />
                    <IntegrationCard 
                      icon={<Music2 className="w-6 h-6 text-pink-500" />} 
                      label="TikTok Ads" 
                      description="Conecte sua conta do TikTok para análise completa de ROI."
                      status="Em breve"
                    />
                  </motion.div>
                )}

                {activeTab === 'Webhooks' && (
                  <motion.div 
                    key="webhooks"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-2xl bg-[#111111] border border-white/5 rounded-2xl p-8"
                  >
                    <h3 className="text-xl font-bold mb-6">Configuração de Webhooks</h3>
                    <p className="text-gray-400 mb-8">
                      Utilize a URL abaixo para receber notificações de vendas de plataformas como Kiwify, Hotmart, Perfect Pay, etc.
                    </p>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">URL do Webhook</label>
                        <div className="flex gap-2">
                          <code className="flex-1 bg-black/50 p-4 rounded-xl text-xs text-blue-300 break-all flex items-center">
                            {`${window.location.origin}/webhook/purchase`}
                          </code>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(`${window.location.origin}/webhook/purchase`);
                              alert("URL copiada!");
                            }}
                            className="bg-white/5 hover:bg-white/10 p-4 rounded-xl transition-all"
                          >
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-6 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                        <h4 className="font-bold text-orange-500 mb-2">Segurança</h4>
                        <p className="text-sm text-gray-400">
                          Certifique-se de configurar o <strong>Webhook Secret Token</strong> na aba <strong>Pixel</strong> para validar as requisições recebidas.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'UTMs' && (
                  <motion.div 
                    key="utms"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-3xl bg-[#111111] border border-white/5 rounded-2xl p-8"
                  >
                    <h3 className="text-xl font-bold mb-6">Configuração de UTMs</h3>
                    <p className="text-gray-400 mb-8">
                      Para que o rastreamento funcione corretamente, você deve adicionar os parâmetros UTM aos seus links de anúncios.
                    </p>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h4 className="font-bold text-blue-500 mb-2">utm_source</h4>
                          <p className="text-xs text-gray-500">Origem do tráfego (ex: facebook, google, tiktok)</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h4 className="font-bold text-blue-500 mb-2">utm_medium</h4>
                          <p className="text-xs text-gray-500">Meio do tráfego (ex: cpc, organic, email)</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h4 className="font-bold text-blue-500 mb-2">utm_campaign</h4>
                          <p className="text-xs text-gray-500">Nome da campanha</p>
                        </div>
                        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                          <h4 className="font-bold text-blue-500 mb-2">utm_content</h4>
                          <p className="text-xs text-gray-500">Conteúdo do anúncio (ex: ad1, video_vsl)</p>
                        </div>
                      </div>

                      <div className="p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                        <h4 className="font-bold text-blue-500 mb-2">Exemplo de Link</h4>
                        <code className="block bg-black/50 p-4 rounded-xl text-xs text-blue-300 break-all">
                          {`https://seusite.com.br/?utm_source=facebook&utm_medium=cpc&utm_campaign=vendas_vsl&utm_content=ad_01`}
                        </code>
                      </div>

                      <div className="p-6 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl">
                        <h4 className="font-bold text-yellow-500 mb-2">Dica Pro</h4>
                        <p className="text-sm text-gray-400">
                          Utilize o <strong>Gerador de UTMs</strong> do Facebook Ads para automatizar a criação desses parâmetros em suas campanhas.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'Pixel' && (
                  <motion.div 
                    key="pixel"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-2xl bg-[#111111] border border-white/5 rounded-2xl p-8"
                  >
                    <h3 className="text-xl font-bold mb-6">Configurações do Pixel & CAPI</h3>
                    <form onSubmit={saveSettings} className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Meta Pixel ID</label>
                        <input 
                          type="text" 
                          value={settings.meta_pixel_id}
                          onChange={(e) => setSettings({...settings, meta_pixel_id: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                          placeholder="Ex: 1234567890"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Meta Access Token (CAPI)</label>
                        <textarea 
                          value={settings.meta_access_token}
                          onChange={(e) => setSettings({...settings, meta_access_token: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all h-32 resize-none"
                          placeholder="EAAB..."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">Webhook Secret Token</label>
                        <input 
                          type="password" 
                          value={settings.webhook_secret}
                          onChange={(e) => setSettings({...settings, webhook_secret: e.target.value})}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 transition-all"
                          placeholder="Token para validar webhooks"
                        />
                      </div>
                      <button 
                        type="submit"
                        disabled={savingSettings}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                      >
                        {savingSettings ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Salvar Configurações'}
                      </button>
                    </form>

                    <div className="mt-12 p-6 bg-blue-500/5 border border-blue-500/10 rounded-2xl">
                      <h4 className="font-bold text-blue-500 mb-2">Instruções do Pixel</h4>
                      <p className="text-sm text-gray-400 mb-4">
                        Copie o código abaixo e cole no head do seu site para começar a rastrear.
                      </p>
                      <code className="block bg-black/50 p-4 rounded-xl text-xs text-blue-300 break-all">
                        {`<script src="${window.location.origin}/pixel.js"></script>`}
                      </code>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'WhatsApp' && (
                  <motion.div 
                    key="whatsapp"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-2xl bg-[#111111] border border-white/5 rounded-2xl p-8 text-center"
                  >
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <MessageSquare className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">Integração com WhatsApp</h3>
                    <p className="text-gray-400 mb-8">
                      Em breve você poderá rastrear conversas e vendas iniciadas via WhatsApp diretamente no seu dashboard.
                    </p>
                    <button className="bg-white/5 text-white px-6 py-2 rounded-xl border border-white/10 hover:bg-white/10 transition-all">
                      Avisar-me quando estiver disponível
                    </button>
                  </motion.div>
                )}

                {activeTab === 'Testes' && (
                  <motion.div 
                    key="testes"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="max-w-2xl bg-[#111111] border border-white/5 rounded-2xl p-8"
                  >
                    <h3 className="text-xl font-bold mb-6">Testar Integração</h3>
                    <p className="text-gray-400 mb-8">
                      Envie um evento de teste para verificar se o seu pixel e CAPI estão configurados corretamente.
                    </p>
                    <div className="space-y-4">
                      <button className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-left hover:bg-white/10 transition-all flex items-center justify-between group">
                        <span>Enviar evento ViewContent de teste</span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                      </button>
                      <button className="w-full bg-white/5 border border-white/10 p-4 rounded-xl text-left hover:bg-white/10 transition-all flex items-center justify-between group">
                        <span>Simular Webhook de Venda</span>
                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeMenu === 'Principal' && (
            <div className="space-y-8">
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Faturamento Líquido" 
                  value={`R$ ${stats?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}`}
                  icon={<DollarSign className="w-6 h-6 text-green-500" />}
                  trend="+12.5%"
                />
                <StatCard 
                  title="Vendas Aprovadas" 
                  value={stats?.totalSales.toString() || '0'}
                  icon={<ChevronRight className="w-6 h-6 text-blue-500" />}
                  trend="+5.2%"
                />
                <StatCard 
                  title="Cliques / Sessões" 
                  value={stats?.totalSessions.toString() || '0'}
                  icon={<MousePointer2 className="w-6 h-6 text-purple-500" />}
                  trend="-2.1%"
                />
                <StatCard 
                  title="ROAS Médio" 
                  value="1.10"
                  icon={<TrendingUp className="w-6 h-6 text-orange-500" />}
                  trend="+0.4%"
                />
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-8">Receita por Campanha</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats?.campaignStats || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                        <XAxis dataKey="campaign" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }} />
                        <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-[#111111] border border-white/5 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-8">Distribuição de Vendas</h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={stats?.campaignStats || []} cx="50%" cy="50%" innerRadius={80} outerRadius={100} paddingAngle={5} dataKey="sales" nameKey="campaign">
                          {(stats?.campaignStats || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick, hasSubmenu = false }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void, hasSubmenu?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all group ${
        active 
          ? 'bg-blue-600/10 text-blue-500 font-medium' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      <span className={active ? 'text-blue-500' : 'text-gray-500 group-hover:text-white transition-colors'}>
        {icon}
      </span>
      <span className="text-sm font-medium">{label}</span>
      {hasSubmenu && <ChevronDown className="ml-auto w-4 h-4 text-gray-600" />}
    </button>
  );
}

function SidebarSubItem({ label, active = false, onClick }: { label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-sm ${
        active 
          ? 'text-white font-semibold' 
          : 'text-gray-500 hover:text-white'
      }`}
    >
      <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-blue-500' : 'bg-transparent'}`}></div>
      {label}
    </button>
  );
}

function TabItem({ icon, label, active = false, onClick }: { icon: React.ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-4 border-b-2 transition-all whitespace-nowrap ${
        active 
          ? 'border-blue-500 text-blue-500' 
          : 'border-transparent text-gray-500 hover:text-white'
      }`}
    >
      {icon}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}

function IntegrationCard({ icon, label, description, onClick, status }: { icon: React.ReactNode, label: string, description?: string, onClick?: () => void, status?: string }) {
  return (
    <div 
      onClick={onClick}
      className="bg-[#111111] border border-white/5 rounded-2xl p-6 flex items-center justify-between group hover:border-white/10 transition-all cursor-pointer"
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center group-hover:bg-white/10 transition-all">
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-200">{label}</h4>
            {status && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-bold ${
                status === 'Conectar' ? 'bg-blue-500/10 text-blue-500' : 'bg-white/5 text-gray-500'
              }`}>
                {status}
              </span>
            )}
          </div>
          {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-700 group-hover:text-white transition-all" />
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-[#111111] border border-white/5 rounded-2xl p-6 hover:border-white/10 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-white/5 rounded-xl">
          {icon}
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${
          trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
        }`}>
          {trend}
        </span>
      </div>
      <p className="text-gray-400 text-sm mb-1">{title}</p>
      <h4 className="text-2xl font-bold">{value}</h4>
    </div>
  );
}

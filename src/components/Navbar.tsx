import React, { useState } from 'react';
import { 
  Search, Gift, PlusCircle, Heart, MessageSquare, 
  User as UserIcon, ShieldCheck, LogOut, Package, 
  Menu, X, Lock, CheckCircle2, ChevronDown 
} from 'lucide-react';
import { User, AdminSettings } from '../types.js';

interface NavbarProps {
  currentUser: User | null;
  settings: AdminSettings | null;
  currentView: string;
  favoritesCount: number;
  onNavigate: (view: string, param?: string) => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  currentView,
  favoritesCount,
  onNavigate,
  onOpenAuth,
  onLogout,
  onSearch,
  searchQuery
}) => {
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(localSearch);
    if (currentView !== 'home' && currentView !== 'browse') {
      onNavigate('browse');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      {/* Platform banner announcement if configured by admin */}
      {settings?.bannerNotice && (
        <div className="bg-indigo-600 text-white text-xs py-1.5 px-4 text-center font-medium">
          {settings.bannerNotice}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3 sm:gap-4">
          
          {/* Logo */}
          <button 
            id="nav-brand-logo"
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-left cursor-pointer group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-xl shadow-md group-hover:scale-105 transition-transform">
              <span className="tracking-tighter">MX</span>
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900 block font-heading leading-tight">
                {settings?.platformName || 'MercadoX'}
              </span>
              <span className="text-[10px] font-semibold text-indigo-600 tracking-wider uppercase block">
                España · Seguro
              </span>
            </div>
          </button>

          {/* Search bar */}
          <form 
            onSubmit={handleSearchSubmit} 
            className="hidden md:flex flex-1 max-w-lg relative items-center"
          >
            <div className="relative w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                id="main-search-input"
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Buscar móviles, ropa, muebles, electrónica..."
                className="w-full pl-10 pr-10 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white text-sm text-slate-900 placeholder:text-slate-500 rounded-full border border-transparent focus:border-indigo-400 focus:outline-hidden transition-all shadow-inner"
              />
              {localSearch && (
                <button 
                  type="button" 
                  onClick={() => { setLocalSearch(''); onSearch(''); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>

          {/* Desktop Navigation buttons */}
          <div className="hidden lg:flex items-center gap-1.5">
            <button
              id="nav-btn-comprar"
              onClick={() => onNavigate('browse')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                currentView === 'browse' 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              Comprar
            </button>

            <button
              id="nav-btn-regala"
              onClick={() => onNavigate('gifts')}
              className={`px-3.5 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                currentView === 'gifts'
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-emerald-700 hover:bg-emerald-50/70'
              }`}
            >
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>🎁 Regala gratis</span>
            </button>

            <button
              id="nav-btn-vender"
              onClick={() => {
                if (!currentUser) {
                  onOpenAuth();
                } else {
                  onNavigate('sell');
                }
              }}
              className="ml-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold flex items-center gap-1.5 shadow-sm hover:shadow transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Vender</span>
            </button>
          </div>

          {/* User icons & authentication */}
          <div className="flex items-center gap-2">
            {currentUser && (
              <>
                <button
                  id="nav-btn-favoritos"
                  onClick={() => onNavigate('favorites')}
                  title="Mis favoritos"
                  className="p-2 text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-full relative transition-colors cursor-pointer"
                >
                  <Heart className={`w-5 h-5 ${favoritesCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
                  {favoritesCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                      {favoritesCount}
                    </span>
                  )}
                </button>

                <button
                  id="nav-btn-mensajes"
                  onClick={() => onNavigate('chat')}
                  title="Mensajes y chat"
                  className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full relative transition-colors cursor-pointer"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </>
            )}

            {/* User Dropdown or Login button */}
            {currentUser ? (
              <div className="relative">
                <button
                  id="nav-user-dropdown-btn"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pl-2 rounded-full border border-slate-200 hover:border-slate-300 bg-white transition-all cursor-pointer text-left"
                >
                  <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    {currentUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block max-w-[110px] truncate text-xs font-semibold text-slate-800">
                    {currentUser.name}
                  </div>
                  {currentUser.verificationLevel === 'identity_verified' && (
                    <span title="Identidad verificada" className="hidden sm:inline-flex">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  )}
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-900 truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                      <div className="mt-1.5 flex items-center gap-1">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          currentUser.verificationLevel === 'identity_verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : currentUser.verificationLevel === 'verified'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {currentUser.verificationLevel === 'identity_verified' 
                            ? '✓ Identidad verificada' 
                            : currentUser.verificationLevel === 'verified'
                            ? '✓ Cuenta verificada'
                            : 'Cuenta básica'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => { onNavigate('profile'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      <span>Mi perfil y confianza</span>
                    </button>

                    <button
                      onClick={() => { onNavigate('orders'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-slate-400" />
                      <span>Mis compras y ventas</span>
                    </button>

                    <button
                      onClick={() => { onNavigate('gifts'); setUserDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Gift className="w-4 h-4 text-emerald-500" />
                      <span>Mis solicitudes de regalo</span>
                    </button>

                    {/* Admin Access only if backend confirms authorized admin */}
                    {currentUser.isAuthorizedAdmin && (
                      <>
                        <div className="border-t border-slate-100 my-1"></div>
                        <button
                          id="nav-admin-link"
                          onClick={() => { onNavigate('admin'); setUserDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50 flex items-center gap-2 cursor-pointer rounded-md mx-1 w-[calc(100%-8px)]"
                        >
                          <Lock className="w-4 h-4 text-indigo-600" />
                          <span>Panel de Administración</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => { onLogout(); setUserDropdownOpen(false); }}
                      className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={onOpenAuth}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-indigo-600 transition-colors cursor-pointer"
                >
                  Acceso / Registro
                </button>
                <button
                  onClick={onOpenAuth}
                  className="hidden sm:inline-flex px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs cursor-pointer"
                >
                  Entrar
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Abrir menú"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden pb-3 pt-1">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Buscar en MercadoX..."
              className="w-full pl-9 pr-8 py-2 bg-slate-100 text-xs rounded-full border border-transparent focus:border-indigo-400 focus:bg-white focus:outline-hidden"
            />
            {localSearch && (
              <button 
                type="button" 
                onClick={() => { setLocalSearch(''); onSearch(''); }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-3 border-t border-slate-200 flex flex-col gap-2">
            <button
              onClick={() => { onNavigate('browse'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 rounded-lg flex items-center justify-between"
            >
              <span>Comprar productos</span>
              <span className="text-xs text-indigo-600 font-normal">Explorar</span>
            </button>

            <button
              onClick={() => { onNavigate('gifts'); setMobileMenuOpen(false); }}
              className="text-left px-3 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50/60 rounded-lg flex items-center gap-2"
            >
              <Gift className="w-4 h-4 text-emerald-600" />
              <span>🎁 Regala gratis (0 €)</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (!currentUser) onOpenAuth();
                else onNavigate('sell');
              }}
              className="text-left px-3 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Publicar anuncio (Vender o regalar)</span>
            </button>

            {currentUser?.isAuthorizedAdmin && (
              <button
                id="nav-admin-link-mobile"
                onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                className="text-left px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50/70 rounded-lg flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Panel de Administración</span>
              </button>
            )}
          </div>
        )}

      </div>
    </header>
  );
};

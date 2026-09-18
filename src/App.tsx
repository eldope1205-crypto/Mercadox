import React, { useState, useEffect } from 'react';
import { api } from './services/api.js';
import { User, Product, Category, AdminSettings } from './types.js';

// Components
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { AuthModal } from './components/AuthModal.js';

// Views
import { HomeView } from './views/HomeView.js';
import { BrowseView } from './views/BrowseView.js';
import { ProductDetailView } from './views/ProductDetailView.js';
import { GiftsView } from './views/GiftsView.js';
import { SellView } from './views/SellView.js';
import { ChatView } from './views/ChatView.js';
import { CheckoutView } from './views/CheckoutView.js';
import { OrdersView } from './views/OrdersView.js';
import { ProfileView } from './views/ProfileView.js';
import { AdminView } from './views/AdminView.js';
import { 
  ComoFuncionaView, SeguridadView, 
  TerminosView, PrivacidadView 
} from './views/StaticViews.js';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [settings, setSettings] = useState<AdminSettings | null>(null);

  // Navigation state
  const [currentView, setCurrentView] = useState<string>('home');
  const [viewParam, setViewParam] = useState<string | undefined>(undefined);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);

  // Initial data loading
  const loadInitialData = async () => {
    try {
      // Me
      api.getMe().then(res => {
        setCurrentUser(res.user);
      }).catch(() => {
        setCurrentUser(null);
      });

      // Categories
      const catRes = await api.getCategories();
      setCategories(catRes.categories);

      // Public platform config
      const cfgRes = await api.getConfig();
      setSettings(cfgRes as any);

      // Products
      const prodRes = await api.getProducts();
      setProducts(prodRes.products);

      // Favorites
      api.getFavorites().then(favRes => {
        setFavorites(favRes.favoriteIds);
      }).catch(() => {});
    } catch (err) {
      console.error('Error loading initial data:', err);
    }
  };

  useEffect(() => {
    loadInitialData();

    // Sync from current URL
    const parseUrl = () => {
      const path = window.location.pathname.replace(/^\//, '');
      if (path === 'admin' || path.startsWith('admin/')) {
        const parts = path.split('/');
        setCurrentView('admin');
        setViewParam(parts[1] || 'resumen');
      } else if (path === 'regalos') {
        setCurrentView('gifts');
      } else if (path === 'vender') {
        setCurrentView('sell');
      } else if (path === 'explorar' || path === 'browse') {
        setCurrentView('browse');
      } else if (path === 'pedidos' || path === 'orders') {
        setCurrentView('orders');
      } else if (path === 'perfil' || path === 'profile') {
        setCurrentView('profile');
      } else if (path === 'mensajes' || path === 'chat') {
        setCurrentView('chat');
      } else if (path === 'seguridad') {
        setCurrentView('seguridad');
      } else if (path === 'como-funciona') {
        setCurrentView('como-funciona');
      } else if (path === 'terminos') {
        setCurrentView('terminos');
      } else if (path === 'privacidad') {
        setCurrentView('privacidad');
      }
    };

    parseUrl();
    window.addEventListener('popstate', parseUrl);
    return () => window.removeEventListener('popstate', parseUrl);
  }, []);

  const handleNavigate = (view: string, param?: string) => {
    setCurrentView(view);
    setViewParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    let targetPath = '/';
    if (view === 'admin') {
      targetPath = param && param !== 'resumen' ? `/admin/${param}` : '/admin';
    } else if (view === 'gifts') {
      targetPath = '/regalos';
    } else if (view === 'sell') {
      targetPath = '/vender';
    } else if (view === 'browse') {
      targetPath = '/explorar';
    } else if (view === 'orders') {
      targetPath = '/pedidos';
    } else if (view === 'profile') {
      targetPath = '/perfil';
    } else if (view === 'chat') {
      targetPath = '/mensajes';
    } else if (view !== 'home') {
      targetPath = `/${view}${param ? `/${param}` : ''}`;
    }

    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
      setCurrentUser(null);
      setFavorites([]);
      handleNavigate('home');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await api.toggleFavorite(productId);
      if (res.isFavorite) {
        setFavorites(prev => [...prev, productId]);
      } else {
        setFavorites(prev => prev.filter(id => id !== productId));
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await api.deleteProduct(id);
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar anuncio.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      
      {/* Main Header / Navbar (hidden in dedicated Admin console) */}
      {currentView !== 'admin' && (
        <Navbar
          currentUser={currentUser}
          settings={settings}
          currentView={currentView}
          favoritesCount={favorites.length}
          onNavigate={handleNavigate}
          onOpenAuth={() => setAuthModalOpen(true)}
          onLogout={handleLogout}
          onSearch={(q) => {
            setSearchQuery(q);
            if (q) {
              handleNavigate('browse');
            }
          }}
          searchQuery={searchQuery}
        />
      )}

      {/* Main Content Router */}
      <main className="flex-1">
        {currentView === 'home' && (
          <HomeView
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(slug) => {
              setSelectedCategory(slug);
              handleNavigate('browse');
            }}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onProductClick={(id) => handleNavigate('product', id)}
            onNavigate={handleNavigate}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            settings={settings}
          />
        )}

        {currentView === 'browse' && (
          <BrowseView
            products={products}
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onProductClick={(id) => handleNavigate('product', id)}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'product' && viewParam && (
          <ProductDetailView
            productId={viewParam}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigate={handleNavigate}
            isFavorite={favorites.includes(viewParam)}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {currentView === 'gifts' && (
          <GiftsView
            products={products}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onProductClick={(id) => handleNavigate('product', id)}
            onNavigate={handleNavigate}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {currentView === 'sell' && (
          <SellView
            categories={categories}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSuccess={(newProduct) => {
              setProducts(prev => [newProduct, ...prev]);
              handleNavigate('product', newProduct.id);
            }}
            settings={settings}
          />
        )}

        {currentView === 'chat' && (
          <ChatView
            initialConversationId={viewParam}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'checkout' && viewParam && (
          <CheckoutView
            productId={viewParam}
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigate={handleNavigate}
            settings={settings}
          />
        )}

        {currentView === 'orders' && (
          <OrdersView
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'profile' && (
          <ProfileView
            currentUser={currentUser}
            onOpenAuth={() => setAuthModalOpen(true)}
            userProducts={products.filter(p => p.sellerId === currentUser?.id)}
            onUserUpdated={setCurrentUser}
            onNavigate={handleNavigate}
            onDeleteProduct={handleDeleteProduct}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
          />
        )}

        {currentView === 'favorites' && (
          <BrowseView
            products={products.filter(p => favorites.includes(p.id))}
            categories={categories}
            selectedCategory={null}
            onSelectCategory={() => {}}
            favorites={favorites}
            onToggleFavorite={handleToggleFavorite}
            onProductClick={(id) => handleNavigate('product', id)}
            searchQuery=""
            onSearch={() => {}}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'admin' && (
          <AdminView
            currentUser={currentUser}
            subView={viewParam}
            onOpenAuth={() => setAuthModalOpen(true)}
            onNavigate={handleNavigate}
          />
        )}

        {currentView === 'como-funciona' && (
          <ComoFuncionaView onNavigate={handleNavigate} />
        )}

        {currentView === 'seguridad' && (
          <SeguridadView onNavigate={handleNavigate} />
        )}

        {currentView === 'terminos' && (
          <TerminosView onNavigate={handleNavigate} />
        )}

        {currentView === 'privacidad' && (
          <PrivacidadView onNavigate={handleNavigate} />
        )}
      </main>

      {/* Footer (hidden in dedicated Admin console) */}
      {currentView !== 'admin' && (
        <Footer
          onNavigate={handleNavigate}
          platformName={settings?.platformName || 'MercadoX'}
          currentUser={currentUser}
        />
      )}

      {/* Global Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => {
          setCurrentUser(user);
          loadInitialData();
        }}
      />

    </div>
  );
}

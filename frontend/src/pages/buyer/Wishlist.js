import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axiosConfig';
import { 
  Heart, 
  ShoppingBag, 
  ChevronRight, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Package, 
  User, 
  Wheat, 
  AlertCircle,
  CheckCircle,
  Eye,
  ShieldCheck,
  ChevronLeft
} from 'lucide-react';
import VerifiedBadge from '../../components/common/VerifiedBadge';

const Wishlist = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchFavorites = async () => {
    try {
      const res = await api.get('/favorites/');
      setFavorites(res.data.results || res.data);
    } catch (err) {
      console.error("Failed to fetch favorites", err);
      setError("Could not load your wishlist.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const removeFavorite = async (productId) => {
    try {
      await api.delete('/favorites/remove/', { data: { product: productId } });
      setFavorites(favorites.filter(f => f.product !== productId));
      showMsg('success', 'Removed from wishlist.');
    } catch (err) {
      showMsg('danger', 'Failed to remove favorite.');
    }
  };

  const addToCart = async (productId) => {
    setCartLoading(true);
    try {
      await api.post('/cart/items/', { product: productId, quantity: 1 });
      showMsg('success', 'Added to basket!');
    } catch (err) {
      showMsg('danger', err.response?.data?.error || 'Failed to add to basket.');
    } finally {
      setCartLoading(false);
    }
  };

  if (loading) return (
    <div className="flex-center py-5" style={{ minHeight: '60vh' }}>
      <div className="spinner-agr"></div>
      <span className="ms-3 text-muted">Opening your Wishlist...</span>
    </div>
  );

  return (
    <div className="wishlist-page animate-fade-in">
      <div className="agr-breadcrumb">
        <Link to="/buyer-dashboard">Marketplace</Link>
        <span className="agr-breadcrumb-sep"><ChevronRight size={12} /></span>
        <span>My Wishlist</span>
      </div>

      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
        <div>
          <h1 className="page-title d-flex align-items-center">
            <Heart className="text-danger me-3" fill="#ef4444" size={28} /> My Wishlist
          </h1>
          <p className="page-subtitle text-muted">Your curated list of premium produce for future orders.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn-agr btn-outline d-flex align-items-center gap-2" onClick={() => navigate('/buyer-dashboard')}>
            <ChevronLeft size={16} /> Browse More
          </button>
          <button className="btn-agr btn-primary d-flex align-items-center gap-2" onClick={() => navigate('/buyer/cart')}>
            <ShoppingCart size={16} /> View Basket
          </button>
        </div>
      </div>

      {message && (
        <div className={`alert-agr alert-agr-${message.type} animate-slide-in mb-4`}>
          <div className="d-flex align-items-center">
            {message.type === 'success' ? <CheckCircle size={18} className="me-2" /> : <AlertCircle size={18} className="me-2" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {favorites.length === 0 ? (
        <div className="agr-card p-5 text-center mt-4 border-0 shadow-sm bg-white">
          <div className="mb-4 d-inline-flex p-4 bg-light-soft rounded-circle text-muted opacity-50">
            <Heart size={64} />
          </div>
          <h3 className="h4 fw-bold text-dark mb-2">Your wishlist is empty</h3>
          <p className="text-muted mb-4 mx-auto" style={{ maxWidth: '400px' }}>
            Start saving your favorite products today! Browse the marketplace and tap the heart icon to add items here.
          </p>
          <Link to="/buyer-dashboard" className="btn-agr btn-primary px-5 py-3 fw-bold">
            Explore Marketplace
          </Link>
        </div>
      ) : (
        <div className="product-grid mt-4">
          {favorites.map(fav => {
            const p = fav.product_detail;
            if (!p) return null;
            return (
              <div key={fav.id} className="product-card-premium animate-scale-in">
                <div className="product-card-image">
                  {p.image ? (
                    <img src={p.image} alt={p.title} />
                  ) : (
                    <div className="placeholder-image"><Package size={32} /></div>
                  )}
                  <button 
                    className="fav-btn-floating active"
                    onClick={() => removeFavorite(p.id)}
                    title="Remove from favorites"
                  >
                    <Heart size={18} fill="#ef4444" className="text-danger" />
                  </button>
                </div>
                <div className="product-card-body">
                  <div className="d-flex justify-content-between align-items-start mb-1">
                    <h4 className="product-title">{p.title}</h4>
                    <span className="category-tag">{p.category_name}</span>
                  </div>

                  <div className="product-price-row mb-2">
                    <span className="price">{p.price} DZD</span>
                    <span className="unit">/{p.unit}</span>
                  </div>

                  <div className="farmer-info mb-3 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                      <div className="avatar-xs-circle me-2">{p.farm_name?.charAt(0)}</div>
                      <span className="very-small text-muted">From <span className="fw-bold">{p.farm_name}</span></span>
                    </div>
                    <VerifiedBadge role="farmer" isVerified={p.farmer_is_verified} trustLevel={p.farmer_trust_level} showLabel={false} />
                  </div>

                  <div className="product-actions mt-auto d-flex gap-2">
                    <button
                      className="btn-agr btn-primary flex-fill btn-sm fw-bold d-flex align-items-center justify-content-center gap-2"
                      onClick={() => addToCart(p.id)}
                      disabled={cartLoading || p.stock <= 0}
                    >
                      {p.stock <= 0 ? 'Sold Out' : <><Plus size={16} /> Add to Basket</>}
                    </button>
                    <button
                      className="btn-agr btn-outline-danger btn-sm"
                      title="Remove"
                      onClick={() => removeFavorite(p.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Wishlist;

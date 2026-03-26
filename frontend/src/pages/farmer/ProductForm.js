import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { useNavigate, Link } from 'react-router-dom';

function ProductForm() {
  const [formData, setFormData] = useState({ 
    catalog_product: '', 
    description: '', 
    price: '', 
    stock: '', 
    farm: '',
    title: '' // Still need a title for the farmer's specific listing? Or use catalog name?
  });
  const [farms, setFarms] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function loadDeps() {
      try {
        const [farmRes, catalogRes] = await Promise.all([
          api.get('/farms/'), 
          api.get('/catalog-products/')
        ]);
        setFarms(farmRes.data.results || farmRes.data);
        setCatalog(catalogRes.data.results || catalogRes.data);
      } catch (err) { console.error('Failed to load deps', err); }
    }
    loadDeps();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'catalog_product') {
      const item = catalog.find(i => i.id === parseInt(value));
      setSelectedCatalogItem(item);
      if (item) {
        setFormData(prev => ({ ...prev, price: item.official_price, title: item.name }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Dynamic title if empty
    const finalData = { ...formData };
    if (!finalData.title && selectedCatalogItem) {
      finalData.title = selectedCatalogItem.name;
    }

    try {
      await api.post('/products/', finalData);
      navigate('/farmer-dashboard');
    } catch (err) {
      const data = err.response?.data;
      const msg = typeof data === 'object' ? Object.values(data).flat().join(' ') : 'Failed to save product.';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div className="agr-breadcrumb">
        <Link to="/farmer-dashboard">Dashboard</Link>
        <span className="agr-breadcrumb-sep">›</span>
        <span>Add Product</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">List Your Produce</h1>
          <p className="page-subtitle">Select a product from the official catalog to list it for sale.</p>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <div className="agr-card p-4 p-md-5">
            {error && <div className="alert alert-danger">{error}</div>}
            {farms.length === 0 && (
              <div className="alert alert-warning">
                ⚠️ You need to <Link to="/farmer-dashboard/farm/new">add a farm first</Link>.
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Select Product from Catalog *</label>
                <select name="catalog_product" className="form-input" onChange={handleChange} required value={formData.catalog_product}>
                  <option value="">Search catalog...</option>
                  {catalog.map(i => <option key={i.id} value={i.id}>{i.name} ({i.unit})</option>)}
                </select>
                <p className="form-hint">Only products defined in the master catalog can be listed.</p>
              </div>

              <div className="form-group">
                <label className="form-label">Associated Farm *</label>
                <select name="farm" className="form-input" onChange={handleChange} required value={formData.farm}>
                  <option value="">Select Farm...</option>
                  {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Your Selling Price (DZD) *</label>
                  <input 
                    type="number" step="0.01" name="price" className="form-input" 
                    placeholder="0.00" onChange={handleChange} required value={formData.price}
                  />
                  {selectedCatalogItem && (
                    <p className="form-hint">
                      Recommended: <span className="fw-bold">{selectedCatalogItem.min_price} - {selectedCatalogItem.max_price} DZD</span>
                    </p>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Available Stock ({selectedCatalogItem?.unit || 'qty'}) *</label>
                  <input 
                    type="number" step="0.01" name="stock" className="form-input" 
                    placeholder="Quantity" onChange={handleChange} required value={formData.stock}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Listing Description</label>
                <textarea 
                  name="description" className="form-input" 
                  placeholder="Describe your harvest quality, color, size etc." 
                  onChange={handleChange} value={formData.description}
                />
              </div>

              <div className="d-flex gap-2 mt-4">
                <button type="submit" className="btn-agr btn-primary" disabled={loading || farms.length === 0}>
                  {loading ? 'Publishing...' : '🚀 List Product for Sale'}
                </button>
                <button type="button" className="btn-agr btn-outline" onClick={() => navigate('/farmer-dashboard')}>Cancel</button>
              </div>
            </form>
          </div>
        </div>

        <div className="col-lg-5">
          {selectedCatalogItem && (
            <div className="agr-card glass-box p-4">
              <h3 className="h5 fw-bold mb-3 border-bottom pb-2">📋 Catalog Reference</h3>
              <div className="mb-3">
                <label className="text-muted small d-block">Official Price</label>
                <div className="h4 fw-bold text-primary">{selectedCatalogItem.official_price} DZD / {selectedCatalogItem.unit}</div>
              </div>
              <div className="mb-3">
                <label className="text-muted small d-block">Admin Requirements</label>
                <p className="small mb-0">{selectedCatalogItem.description || 'No specific requirements defined for this product.'}</p>
              </div>
              <div className="alert alert-info py-2 small mb-0">
                💡 High quality photos of your produce will help you sell faster!
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProductForm;

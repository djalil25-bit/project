import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, Users, Package, Activity, AlertCircle, 
  Trophy, Medal, Award, ShoppingCart, Calendar, Filter
} from 'lucide-react';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
const ROLE_COLORS = {
  'farmer': '#10b981',
  'buyer': '#3b82f6', 
  'transporter': '#f59e0b'
};

const AdminAnalytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all');

  useEffect(() => {
    fetchAnalytics();
  }, [timeframe]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/dashboards/admin-analytics/?timeframe=${timeframe}`);
      setData(res.data);
    } catch (err) {
      setError('Failed to load analytics data. Please ensure the backend is reachable.');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    switch(index) {
      case 0: return <Trophy className="text-amber" size={20} />;
      case 1: return <Medal className="text-secondary" size={20} />;
      case 2: return <Award className="text-primary-light" size={20} />;
      default: return null;
    }
  };

  if (loading && !data) {
    return (
      <div className="flex-center py-5">
        <div className="spinner-agr"></div>
        <span className="ms-3 text-muted">Gathering metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert-agr alert-danger d-flex align-items-center">
        <AlertCircle className="me-2" /> {error}
      </div>
    );
  }

  return (
    <div className="admin-analytics-page animate-fade-in">
      <div className="page-header d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
        <div className="d-flex align-items-center">
          <TrendingUp className="text-primary me-3" size={32} />
          <div>
            <h1 className="page-title">Platform Analytics</h1>
            <p className="page-subtitle text-muted">Comprehensive overview of platform growth, revenue, and entity distributions.</p>
          </div>
        </div>
        
        <div className="timeframe-selector d-flex align-items-center bg-white p-2 rounded-lg shadow-sm border">
          <Calendar className="text-primary me-2" size={18} />
          <span className="small fw-bold me-3 text-muted">Interval:</span>
          <select 
            className="form-select form-select-sm border-0 fw-bold text-primary" 
            style={{ width: '130px', cursor: 'pointer' }}
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {data && (
        <div className="row g-4">
          {/* Top 3 Farmers - Highlight Section */}
          <div className="col-12">
            <div className="agr-card p-4 bg-light-soft border-primary-soft">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h6 fw-bold mb-0 d-flex align-items-center">
                  <Trophy size={20} className="text-amber me-2" /> Top 3 Farmers by Sales
                </h3>
                <span className="very-small text-muted fw-medium text-uppercase letter-spacing-1">Top Producers this period</span>
              </div>
              
              <div className="row g-3">
                {data.top_farmers?.length > 0 ? data.top_farmers.map((farmer, index) => (
                  <div key={farmer.id} className="col-md-4">
                    <div className="agr-card p-3 border-0 shadow-sm hover-bg-light h-100 animate-scale-in">
                      <div className="d-flex align-items-start justify-content-between mb-2">
                        <div className="rank-badge bg-white shadow-xs rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                          {getRankIcon(index)}
                        </div>
                        <div className="text-end">
                          <div className="very-small text-muted text-uppercase fw-bold">Rank #{index + 1}</div>
                        </div>
                      </div>
                      <div className="fw-bold text-dark mt-2 mb-1">{farmer.name}</div>
                      <div className="d-flex align-items-baseline gap-1 mb-3">
                        <span className="h5 fw-bold text-primary mb-0">{farmer.sales.toLocaleString()}</span>
                        <span className="very-small text-muted fw-medium">DZD</span>
                      </div>
                      
                      <div className="farmer-stats-mini d-flex justify-content-between align-items-center pt-2 border-top">
                        <div className="d-flex align-items-center text-muted very-small">
                          <ShoppingCart size={12} className="me-1" /> {farmer.orders} Orders
                        </div>
                        <div className="progress w-50" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar bg-primary" 
                            role="progressbar" 
                            style={{ width: `${(farmer.sales / data.top_farmers[0].sales) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-12 text-center py-4 text-muted small">No producer data found for this period.</div>
                )}
              </div>
            </div>
          </div>

          {/* Revenue Over Time */}
          <div className="col-lg-8">
            <div className="agr-card h-100 p-4">
              <h3 className="h6 fw-bold mb-4 d-flex align-items-center">
                <Activity size={18} className="text-primary me-2" /> Revenue Generation (Monthly)
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                {data.revenue_trend?.length > 0 ? (
                  <ResponsiveContainer>
                    <AreaChart data={data.revenue_trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `${value}`} />
                      <Tooltip formatter={(value) => [`${value} DZD`, 'Revenue']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-center h-100 text-muted small">No revenue data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="col-lg-4">
            <div className="agr-card h-100 p-4">
              <h3 className="h6 fw-bold mb-4 d-flex align-items-center">
                <Users size={18} className="text-primary me-2" /> Role Distribution
              </h3>
              <div style={{ width: '100%', height: 250 }}>
                {data.role_distribution?.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.role_distribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {data.role_distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={ROLE_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-center h-100 text-muted small">No role data available</div>
                )}
              </div>
            </div>
          </div>

          {/* Top 3 Products Section */}
          <div className="col-lg-6">
            <div className="agr-card h-100 p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="h6 fw-bold mb-0 d-flex align-items-center">
                  <Package size={18} className="text-primary me-2" /> Top 3 Best-Sellers
                </h3>
                <span className="very-small text-muted fw-medium text-uppercase letter-spacing-1">Most demanded products</span>
              </div>
              
              <div className="product-ranking-list">
                {data.top_products?.length > 0 ? data.top_products.map((product, index) => (
                  <div key={product.id} className="ranking-item d-flex align-items-center p-3 mb-2 rounded-lg bg-light-soft hover-bg-light animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                    <div className="rank-number h4 fw-bold text-muted me-3 mb-0" style={{ opacity: 0.3, width: '30px' }}>0{index + 1}</div>
                    <div className="flex-grow-1">
                      <div className="fw-bold text-dark">{product.name}</div>
                      <div className="very-small text-muted">{product.quantity.toLocaleString()} units sold</div>
                    </div>
                    <div className="text-end">
                      <div className="fw-bold text-primary">{product.revenue.toLocaleString()} <small className="very-small">DZD</small></div>
                      <div className="progress mt-1" style={{ height: '4px', width: '60px', marginLeft: 'auto' }}>
                        <div 
                          className="progress-bar bg-success" 
                          role="progressbar" 
                          style={{ width: `${(product.revenue / data.top_products[0].revenue) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-5 text-muted small">No product sales recorded yet.</div>
                )}
              </div>
            </div>
          </div>

          {/* User Registration Trend */}
          <div className="col-lg-6">
            <div className="agr-card h-100 p-4">
              <h3 className="h6 fw-bold mb-4 d-flex align-items-center">
                <Users size={18} className="text-blue me-2" style={{color: '#3b82f6'}} /> New Registrations (Monthly)
              </h3>
              <div style={{ width: '100%', height: 300 }}>
                {data.users_trend?.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={data.users_trend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip cursor={{fill: 'rgba(59, 130, 246, 0.1)'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="users" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex-center h-100 text-muted small">No user registration data</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;

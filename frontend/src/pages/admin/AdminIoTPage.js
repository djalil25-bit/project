import React, { useState, useEffect, useCallback } from 'react';
import api from '../../api/axiosConfig';
import { useToast } from '../../context/ToastContext';
import { 
  Home, 
  Wifi, 
  AlertTriangle, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Activity,
  Droplets,
  Thermometer,
  Sprout,
  FlaskConical,
  CloudRain,
  History,
  BarChart3,
  Search,
  ArrowUpDown,
  Filter,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

const AdminIoTPage = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState({});
  const [data, setData] = useState({
    overview: null,
    history: null,
    stats: null,
    soil: null,
    compare: null
  });
  const [lastUpdated, setLastUpdated] = useState(new Date().toLocaleTimeString());
  
  // Overview Filters
  const [wilayaFilter, setWilayaFilter] = useState('All');
  
  // Table sorting & searching
  const [historySearch, setHistorySearch] = useState('');
  const [compareSearch, setCompareSearch] = useState('');
  const [compareSort, setCompareSort] = useState({ key: 'status', direction: 'asc' });
  const [expandedRows, setExpandedRows] = useState({});

  const fetchData = useCallback(async (tab) => {
    setLoading(prev => ({ ...prev, [tab]: true }));
    try {
      let endpoint = '';
      switch(tab) {
        case 'overview': endpoint = '/iot/admin/overview/'; break;
        case 'history':  endpoint = '/iot/admin/alerts-history/'; break;
        case 'stats':    endpoint = '/iot/admin/sensor-stats/'; break;
        case 'soil':     endpoint = '/iot/admin/soil-by-wilaya/'; break;
        case 'compare':  endpoint = '/iot/admin/farm-comparison/'; break;
        default: return;
      }
      
      const res = await api.get(endpoint);
      setData(prev => ({ ...prev, [tab]: res.data }));
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error(`Failed to fetch ${tab} data`, err);
      error(`Failed to load ${tab} data`);
    } finally {
      setLoading(prev => ({ ...prev, [tab]: false }));
    }
  }, [error]);

  // Lazy load data on tab change
  useEffect(() => {
    if (!data[activeTab]) {
      fetchData(activeTab);
    }
  }, [activeTab, data, fetchData]);

  const refreshCurrentTab = () => fetchData(activeTab);

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // ── TAB RENDERING ────────────────────────────────────────────────────────

  // --- TAB 1: OVERVIEW ---
  const renderOverview = () => {
    const oData = data.overview;
    if (!oData) return null;

    const filteredCritical = wilayaFilter === 'All' ? oData.critical_alerts : oData.critical_alerts.filter(a => a.wilaya === wilayaFilter);
    const filteredWarning = wilayaFilter === 'All' ? oData.warning_alerts : oData.warning_alerts.filter(a => a.wilaya === wilayaFilter);
    const filteredNormal = wilayaFilter === 'All' ? oData.normal_farms : oData.normal_farms.filter(a => a.wilaya === wilayaFilter);

    // Bug Fix 1: Filter and round on frontend
    const chartData = (oData.farms_by_wilaya || [])
      .filter(w => w.avg_temperature !== null)
      .map(w => ({ ...w, avg_temperature: parseFloat(w.avg_temperature.toFixed(1)) }));

    const wilayas = Array.from(new Set([
      ...(oData.critical_alerts || []).map(f => f.wilaya),
      ...(oData.warning_alerts || []).map(f => f.wilaya),
      ...(oData.normal_farms || []).map(f => f.wilaya)
    ])).sort();

    return (
      <div className="space-y-6 anim-fade-up">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-stat-card p-4 stat-accent-blue">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-50 text-blue-600"><Home size={20} /></div>
            <div className="text-2xl font-extrabold text-gray-900">{oData.summary?.farms_danger + oData.summary?.farms_warning + oData.summary?.farms_normal || 0}</div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active Nodes</div>
          </div>
          <div className="glass-stat-card p-4 stat-accent-orange bg-red-50/30">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-red-100 text-red-600"><AlertTriangle size={20} /></div>
            <div className="text-2xl font-extrabold text-red-600">{oData.summary?.farms_danger || 0}</div>
            <div className="text-xs text-red-500 uppercase font-bold tracking-wider">Critical</div>
          </div>
          <div className="glass-stat-card p-4 stat-accent-orange">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-orange-100 text-orange-500"><AlertCircle size={20} /></div>
            <div className="text-2xl font-extrabold text-orange-500">{oData.summary?.farms_warning || 0}</div>
            <div className="text-xs text-orange-500 uppercase font-bold tracking-wider">Warnings</div>
          </div>
          <div className="glass-stat-card p-4 stat-accent-green">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-green-50 text-green-600"><CheckCircle size={20} /></div>
            <div className="text-2xl font-extrabold text-green-600">{oData.summary?.farms_normal || 0}</div>
            <div className="text-xs text-green-500 uppercase font-bold tracking-wider">Normal</div>
          </div>
          <div className="glass-stat-card p-4 stat-accent-blue">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 bg-blue-50 text-blue-600"><Wifi size={20} /></div>
            <div className="text-2xl font-extrabold text-blue-600">{oData.summary?.total_readings?.toLocaleString() || 0}</div>
            <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Readings</div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <Filter size={18} className="text-gray-400" />
          <span className="text-sm font-bold text-gray-700">Filter by Wilaya:</span>
          <select 
            className="adm-input py-1 px-3 w-48"
            value={wilayaFilter}
            onChange={(e) => setWilayaFilter(e.target.value)}
          >
            <option value="All">All Wilayas</option>
            {wilayas.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        {/* Alerts Tables */}
        {filteredCritical.length > 0 && renderAlertSubTable(filteredCritical, 'danger')}
        {filteredWarning.length > 0 && renderAlertSubTable(filteredWarning, 'warning')}

        {/* Temperature Bar Chart */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            📈 Avg Temperature by Wilaya (°C)
          </h3>
          {chartData.length > 0 ? (
            <div style={{ width: '100%', height: 320 }}>
              <ResponsiveContainer>
                <BarChart data={chartData} margin={{ top:10, right:30, left:0, bottom:60 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis 
                    dataKey="farm__wilaya" 
                    angle={-35} 
                    textAnchor="end"
                    interval={0}
                    height={70}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                  />
                  <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f9fafb' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Bar dataKey="avg_temperature" radius={[4, 4, 0, 0]} name="Average Temperature (°C)">
                    {chartData.map((entry, index) => {
                      let color = '#22c55e'; // Normal
                      if (entry.avg_temperature > 35) color = '#ef4444'; // Hot
                      else if (entry.avg_temperature < 5) color = '#8b5cf6'; // Cold
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">📊 No temperature data available yet</div>
          )}
        </div>

        {/* Normal Farms Grid */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={18} className="text-green-600" />
            Normal Farms {wilayaFilter !== 'All' ? `in ${wilayaFilter}` : ''} ({filteredNormal.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {filteredNormal.map(farm => (
              <div key={farm.farm_id} className="glass-card p-4 border-l-4 border-green-500">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-bold text-gray-900 truncate">{farm.farm_name}</h4>
                  <span className="text-[10px] bg-green-50 text-green-600 px-2 py-0.5 rounded-full font-bold">NORMAL</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">{farm.farmer_name} • {farm.wilaya}</p>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-gray-600">
                  <div className="flex items-center gap-1"><Thermometer size={12} className="text-red-400" /> {farm.last_reading?.temperature ?? '--'}°C</div>
                  <div className="flex items-center gap-1"><Droplets size={12} className="text-blue-400" /> {farm.last_reading?.humidity ?? '--'}%</div>
                  <div className="flex items-center gap-1"><Sprout size={12} className="text-green-400" /> {farm.last_reading?.soil_moisture ?? '--'}%</div>
                  <div className="flex items-center gap-1"><FlaskConical size={12} className="text-yellow-400" /> {farm.last_reading?.ph ?? '--'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderAlertSubTable = (alertsList, level) => {
    const isDanger = level === 'danger';
    const bgClass = isDanger ? 'bg-red-50' : 'bg-orange-50';
    const borderClass = isDanger ? 'border-red-200' : 'border-orange-200';
    const textClass = isDanger ? 'text-red-700' : 'text-orange-700';
    const badgeClass = isDanger ? 'bg-red-600' : 'bg-orange-500';

    return (
      <div className={`glass-card overflow-hidden border-2 ${borderClass}`}>
        <div className={`px-4 py-3 flex items-center justify-between border-b ${borderClass} ${bgClass}`}>
          <div className="flex items-center gap-2">
            {isDanger ? <AlertTriangle size={18} className="text-red-600" /> : <AlertCircle size={18} className="text-orange-500" />}
            <h4 className={`font-bold ${textClass}`}>{isDanger ? 'CRITICAL ALERTS' : 'WARNING ALERTS'}</h4>
          </div>
          <span className={`${badgeClass} text-white text-xs px-2 py-1 rounded-full font-bold`}>{alertsList.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="admin-table w-full">
            <thead>
              <tr className={bgClass}>
                <th>Farm</th>
                <th>Farmer</th>
                <th>Wilaya</th>
                <th>Active Alerts</th>
                <th>Last Update</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {alertsList.map(farm => (
                <React.Fragment key={farm.farm_id}>
                  <tr className="cursor-pointer hover:bg-white" onClick={() => toggleRow(farm.farm_id)}>
                    <td className="font-bold">{farm.farm_name}</td>
                    <td>{farm.farmer_name}</td>
                    <td>{farm.wilaya}</td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {farm.alerts?.map((a, i) => (
                          <span key={i} className={`${badgeClass} text-[10px] text-white px-2 py-0.5 rounded font-bold flex items-center gap-1`}>
                            {a.icon} {a.sensor}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs text-gray-500">{farm.last_reading?.recorded_at || '--:--'}</td>
                    <td>{expandedRows[farm.farm_id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                  </tr>
                  {expandedRows[farm.farm_id] && (
                    <tr className="bg-gray-50">
                      <td colSpan="6" className="p-4">
                        <div className="grid grid-cols-4 gap-4">
                          {[
                            { label: 'Temp', val: farm.last_reading?.temperature, unit: '°C', icon: <Thermometer size={14}/>, color: 'text-red-600' },
                            { label: 'Humidity', val: farm.last_reading?.humidity, unit: '%', icon: <Droplets size={14}/>, color: 'text-blue-600' },
                            { label: 'Soil', val: farm.last_reading?.soil_moisture, unit: '%', icon: <Sprout size={14}/>, color: 'text-green-600' },
                            { label: 'pH', val: farm.last_reading?.ph, unit: '', icon: <FlaskConical size={14}/>, color: 'text-orange-600' }
                          ].map(s => (
                            <div key={s.label} className="bg-white p-3 rounded-lg border border-gray-200 text-center">
                              <div className={`flex items-center justify-center gap-1 text-[10px] font-bold uppercase ${s.color} mb-1`}>{s.icon} {s.label}</div>
                              <div className="text-lg font-extrabold text-gray-800">{s.val ?? '--'}<small className="text-[10px] ml-0.5 font-normal">{s.unit}</small></div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- TAB 2: ALERT HISTORY ---
  const renderHistory = () => {
    const hData = data.history || [];
    const filtered = hData.filter(a => 
      a.farm_name.toLowerCase().includes(historySearch.toLowerCase()) || 
      a.wilaya.toLowerCase().includes(historySearch.toLowerCase())
    );

    return (
      <div className="space-y-4 anim-fade-up">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by farm or wilaya..." 
              className="adm-input pl-10 w-full"
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
            />
          </div>
          <div className="text-sm font-medium text-gray-500">Showing {filtered.length} recent alerts</div>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th>Triggered At</th>
                <th>Farm Node</th>
                <th>Wilaya</th>
                <th>Sensor</th>
                <th>Message</th>
                <th>Severity</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((a, i) => (
                <tr key={i}>
                  <td className="text-xs font-medium text-gray-500">{a.triggered_at}</td>
                  <td className="font-bold">{a.farm_name}</td>
                  <td>{a.wilaya}</td>
                  <td>{a.sensor}</td>
                  <td className="text-sm">{a.message}</td>
                  <td>
                    <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      a.level === 'danger' ? 'bg-red-100 text-red-600' : 
                      a.level === 'warning' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {a.level}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="py-12 text-center text-gray-400">📋 No alert history yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // --- TAB 3: STATISTICS ---
  const renderStats = () => {
    const sData = data.stats;
    if (!sData) return null;

    const cards = [
      { id: 'temperature', label: 'Temperature', unit: '°C', icon: <Thermometer size={20} />, data: sData.temperature, color: '#ef4444', max: 50 },
      { id: 'humidity', label: 'Air Humidity', unit: '%', icon: <Droplets size={20} />, data: sData.humidity, color: '#3b82f6', max: 100 },
      { id: 'soil', label: 'Soil Moisture', unit: '%', icon: <Sprout size={20} />, data: sData.soil_moisture, color: '#22c55e', max: 100 },
      { id: 'ph', label: 'Soil pH', unit: 'pH', icon: <FlaskConical size={20} />, data: sData.ph, color: '#f97316', max: 14 }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 anim-fade-up">
        {cards.map(card => {
          const avgPercent = (card.data.avg / card.max) * 100;
          let progressColor = card.color;
          // Conditional colors for progress bar
          if (card.id === 'soil' && card.data.avg < 30) progressColor = '#ef4444';
          if (card.id === 'ph' && (card.data.avg < 6 || card.data.avg > 7.5)) progressColor = '#f97316';

          return (
            <div key={card.id} className="glass-card p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 text-gray-600">{card.icon}</div>
                  <div>
                    <h4 className="font-bold text-lg text-gray-900">{card.label}</h4>
                    <p className="text-xs text-gray-500">Based on {sData.total_readings.toLocaleString()} readings</p>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mb-6 border-y border-gray-50 py-4">
                <div className="text-center">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Min</div>
                  <div className="text-xl font-extrabold text-gray-800">{card.data.min}{card.unit}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Average</div>
                  <div className="text-xl font-extrabold text-blue-600">{card.data.avg}{card.unit}</div>
                </div>
                <div className="text-center">
                  <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Max</div>
                  <div className="text-xl font-extrabold text-gray-800">{card.data.max}{card.unit}</div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-gray-500">
                  <span>Current Average Profile</span>
                  <span>{Math.round(avgPercent)}% of capacity</span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-1000 ease-out" 
                    style={{ width: `${avgPercent}%`, backgroundColor: progressColor }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // --- TAB 4: SOIL MOISTURE ---
  const renderSoil = () => {
    const soilData = data.soil || [];
    const criticalWilayas = soilData.filter(w => w.avg_soil_moisture < 30);

    return (
      <div className="space-y-6 anim-fade-up">
        <div className="glass-card p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Sprout size={20} className="text-green-600" />
            🌱 Average Soil Moisture by Wilaya
          </h3>
          <div style={{ width: '100%', height: Math.max(300, soilData.length * 40) }}>
            <ResponsiveContainer>
              <BarChart data={soilData} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                <YAxis dataKey="wilaya" type="category" width={100} tick={{ fontSize: 11, fontWeight: 'bold' }} />
                <Tooltip cursor={{ fill: '#f9fafb' }} />
                <Bar dataKey="avg_soil_moisture" radius={[0, 4, 4, 0]}>
                  {soilData.map((entry, index) => {
                    let color = '#22c55e'; // Good
                    if (entry.avg_soil_moisture < 30) color = '#ef4444'; // Urgent
                    else if (entry.avg_soil_moisture < 50) color = '#f97316'; // Low
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-gray-400 mt-4 italic text-right">* Sorted driest → wettest</p>
        </div>

        {criticalWilayas.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 flex gap-4 animate-pulse">
            <AlertTriangle size={32} className="text-red-600 shrink-0" />
            <div>
              <h4 className="text-red-700 font-bold text-lg">🚨 Critical Alert: Irrigation Required</h4>
              <p className="text-red-600 text-sm mb-3">
                {criticalWilayas.length} wilaya(s) are reporting average soil moisture below 30%. Urgent intervention needed.
              </p>
              <div className="flex flex-wrap gap-2">
                {criticalWilayas.map(w => (
                  <span key={w.wilaya} className="bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                    {w.wilaya}: {w.avg_soil_moisture}%
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- TAB 5: COMPARISON ---
  const renderCompare = () => {
    const cData = data.compare || [];
    
    const sorted = [...cData].sort((a, b) => {
      let aVal = a[compareSort.key] || a.stats[compareSort.key];
      let bVal = b[compareSort.key] || b.stats[compareSort.key];
      
      // Handle special status sorting
      if (compareSort.key === 'status') {
        const priority = { danger: 0, warning: 1, normal: 2 };
        aVal = priority[a.status];
        bVal = priority[b.status];
      }

      if (compareSort.direction === 'asc') return aVal > bVal ? 1 : -1;
      return aVal < bVal ? 1 : -1;
    }).filter(f => f.farm_name.toLowerCase().includes(compareSearch.toLowerCase()));

    const handleSort = (key) => {
      setCompareSort(prev => ({
        key,
        direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
      }));
    };

    const statusCounts = {
      danger: cData.filter(f => f.status === 'danger').length,
      warning: cData.filter(f => f.status === 'warning').length,
      normal: cData.filter(f => f.status === 'normal').length
    };

    return (
      <div className="space-y-4 anim-fade-up">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="relative flex-1 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search farm..." 
              className="adm-input pl-10 w-full"
              value={compareSearch}
              onChange={(e) => setCompareSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500">{cData.length} Farms Compared:</span>
            <div className="flex gap-1">
              <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-bold">{statusCounts.danger} CRITICAL</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-500 text-[10px] font-bold">{statusCounts.warning} WARNING</span>
              <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-600 text-[10px] font-bold">{statusCounts.normal} NORMAL</span>
            </div>
          </div>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="admin-table w-full">
            <thead>
              <tr>
                <th className="cursor-pointer" onClick={() => handleSort('farm_name')}>Farm <ArrowUpDown size={12} className="inline ml-1"/></th>
                <th>Wilaya</th>
                <th className="cursor-pointer" onClick={() => handleSort('avg_temperature')}>Avg Temp <ArrowUpDown size={12} className="inline ml-1"/></th>
                <th>Avg Hum</th>
                <th className="cursor-pointer" onClick={() => handleSort('avg_soil_moisture')}>Avg Soil <ArrowUpDown size={12} className="inline ml-1"/></th>
                <th>Avg pH</th>
                <th>Readings</th>
                <th className="cursor-pointer" onClick={() => handleSort('status')}>Status <ArrowUpDown size={12} className="inline ml-1"/></th>
                <th>Last Ping</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(f => (
                <tr key={f.farm_id}>
                  <td className="font-bold">{f.farm_name}</td>
                  <td className="text-xs">{f.wilaya}</td>
                  <td className={`font-bold ${f.stats.avg_temperature > 35 ? 'text-red-600' : ''}`}>{f.stats.avg_temperature}°C</td>
                  <td>{f.stats.avg_humidity}%</td>
                  <td className={`font-bold ${f.stats.avg_soil_moisture < 30 ? 'text-red-600' : ''}`}>{f.stats.avg_soil_moisture}%</td>
                  <td className={`${(f.stats.avg_ph < 6 || f.stats.avg_ph > 7.5) ? 'text-orange-500' : ''}`}>{f.stats.avg_ph}</td>
                  <td className="text-xs text-gray-500">{f.stats.readings_count}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      f.status === 'danger' ? 'bg-red-600 text-white shadow-sm' : 
                      f.status === 'warning' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {f.status === 'danger' ? '🔴 Critical' : f.status === 'warning' ? '🟡 Warning' : '✅ Normal'}
                    </span>
                  </td>
                  <td className="text-[10px] text-gray-400 font-mono">{f.stats.last_update}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── MAIN RENDER ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen p-6 admin-mode space-y-6">
      
      {/* Header */}
      <div className="admin-hero-strip p-8 anim-fade-up relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 text-blue-200 text-xs font-bold uppercase tracking-widest mb-3">
              <Wifi size={14} className="animate-pulse" /> National IoT Operations
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">🌐 IoT Global Overview</h1>
            <p className="text-blue-100/70 text-sm max-w-lg">Monitoring environmental metrics across Algeria's connected agricultural network.</p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10">
              <RefreshCw size={12} className="text-blue-300" />
              <span className="text-blue-200 text-[11px] font-bold">SYC {lastUpdated}</span>
            </div>
            <button 
              onClick={refreshCurrentTab}
              disabled={loading[activeTab]}
              className="bg-white text-blue-900 hover:bg-blue-50 px-6 py-2 rounded-xl font-black text-sm flex items-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading[activeTab] ? 'animate-spin' : ''} />
              REFRESH DATA
            </button>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 text-[160px] opacity-10 select-none rotate-12">📡</div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-2xl w-fit border border-gray-200 anim-fade-up" style={{ animationDelay: '0.1s' }}>
        {[
          { id: 'overview', label: 'Overview', icon: <Activity size={16}/> },
          { id: 'history',  label: 'History',  icon: <History size={16}/> },
          { id: 'stats',    label: 'Stats',    icon: <BarChart3 size={16}/> },
          { id: 'soil',     label: 'Soil',     icon: <Sprout size={16}/> },
          { id: 'compare',  label: 'Compare',  icon: <ArrowUpDown size={16}/> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === tab.id 
                ? 'bg-white text-blue-600 shadow-md scale-100' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {loading[activeTab] && !data[activeTab] ? (
          <div className="flex flex-col items-center justify-center py-32 text-gray-400 gap-4 anim-fade-up">
            <div className="adm-spinner h-10 w-10 border-4 border-blue-100 border-t-blue-600"></div>
            <p className="text-sm font-bold uppercase tracking-widest">Polling secure sensor streams...</p>
          </div>
        ) : (
          <>
            {activeTab === 'overview' && renderOverview()}
            {activeTab === 'history' && renderHistory()}
            {activeTab === 'stats' && renderStats()}
            {activeTab === 'soil' && renderSoil()}
            {activeTab === 'compare' && renderCompare()}
          </>
        )}
      </div>

    </div>
  );
};

export default AdminIoTPage;


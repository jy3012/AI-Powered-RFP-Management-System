import React from 'react';
import { FiFilePlus, FiUsers, FiRefreshCw, FiFileText, FiCalendar, FiDollarSign, FiPackage } from 'react-icons/fi';
import { listRfps } from '../api';

export default function Dashboard({ selectedRfp, onCreateClick, onVendorsClick, onDetailClick, onSelectRfp }) {
  const [rfps, setRfps] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadRfps();
  }, []);

  async function loadRfps() {
    setLoading(true);
    try {
      const data = await listRfps();
      setRfps(data || []);
    } catch (err) {
      console.error('Error loading RFPs:', err);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="panel stack">
      <div className="row" style={{alignItems:'center', justifyContent:'space-between', flexWrap: 'wrap', gap: '16px'}}>
        <div>
          <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <FiFileText />
            RFP Dashboard
          </h2>
          <p className="muted" style={{fontSize: '15px', marginTop: '8px'}}>
            Centralized view of all your RFPs. Track proposals, compare vendors, and manage your procurement process.
          </p>
        </div>
        <div className="row" style={{gap: 12, flexWrap: 'wrap'}}>
          <button className="button" onClick={onCreateClick}>
            <FiFilePlus />
            New RFP
          </button>
          <button className="button ghost" onClick={onVendorsClick}>
            <FiUsers />
            Vendors
          </button>
          <button className="button ghost" onClick={loadRfps} disabled={loading}>
            {loading ? (
              <span className="loading" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
            ) : (
              <FiRefreshCw />
            )}
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="card" style={{textAlign: 'center', padding: '60px'}}>
          <div className="loading" style={{margin: '0 auto', width: '40px', height: '40px', borderWidth: '4px'}}></div>
          <p className="muted" style={{marginTop: '20px', fontSize: '15px'}}>Loading your RFPs...</p>
        </div>
      ) : rfps.length === 0 ? (
        <div className="card" style={{
          textAlign: 'center', 
          padding: '60px',
          backgroundColor: 'rgba(99,102,241,0.05)',
          borderColor: 'rgba(99,102,241,0.2)'
        }}>
          <div style={{fontSize: '64px', marginBottom: '20px', display: 'flex', justifyContent: 'center'}}>
            <FiFileText style={{opacity: 0.5}} />
          </div>
          <h3 style={{marginBottom: '12px', color: '#f1f5f9'}}>No RFPs Yet</h3>
          <p className="muted" style={{fontSize: '15px', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px'}}>
            Get started by creating your first RFP. Describe what you need and our AI will structure it for you.
          </p>
          <button className="button" onClick={onCreateClick} style={{minWidth: '200px'}}>
            <FiFilePlus />
            Create Your First RFP
          </button>
        </div>
      ) : (
        <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px'}}>
          {rfps.map(rfp => (
            <div 
              key={rfp._id} 
              className="card" 
              style={{
                cursor: 'pointer',
                border: selectedRfp?._id === rfp._id ? '2px solid var(--primary)' : '1px solid var(--border)',
                transition: 'all 0.3s ease',
                background: selectedRfp?._id === rfp._id ? 'rgba(99,102,241,0.1)' : 'rgba(30,41,59,0.3)',
                position: 'relative',
                overflow: 'hidden'
              }}
              onClick={() => {
                if (onSelectRfp) onSelectRfp(rfp);
                onDetailClick();
              }}
            >
              {selectedRfp?._id === rfp._id && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: 'linear-gradient(90deg, var(--primary), var(--secondary))'
                }}></div>
              )}
              <div className="row" style={{justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12}}>
                <h3 style={{margin: 0, flex: 1, fontSize: '20px', lineHeight: '1.3'}}>
                  {rfp.title || 'Untitled RFP'}
                </h3>
                {selectedRfp?._id === rfp._id && (
                  <span className="tag" style={{
                    backgroundColor: 'rgba(99,102,241,0.2)',
                    color: '#a5b4fc',
                    borderColor: 'rgba(99,102,241,0.4)'
                  }}>
                    ✓ Active
                  </span>
                )}
              </div>
              <p className="muted" style={{fontSize: '13px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: '6px'}}>
                <FiCalendar size={14} />
                {formatDate(rfp.createdAt)}
              </p>
              <div className="row" style={{gap: 20, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border)'}}>
                <div style={{flex: 1}}>
                  <div className="muted" style={{fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Proposals
                  </div>
                  <div style={{fontSize: '24px', fontWeight: 'bold', color: '#67e8f9'}}>
                    {rfp.proposalCount || 0}
                  </div>
                </div>
                <div style={{flex: 1}}>
                  <div className="muted" style={{fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px'}}>
                    Budget
                  </div>
                  <div style={{fontSize: '20px', fontWeight: 'bold', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <FiDollarSign size={18} />
                    {rfp.requirements?.budget ? `$${(rfp.requirements.budget / 1000).toFixed(0)}k` : 'N/A'}
                  </div>
                </div>
              </div>
              {rfp.requirements?.items?.length > 0 && (
                <div style={{marginBottom: 16, padding: '12px', backgroundColor: 'rgba(99,102,241,0.05)', borderRadius: '8px'}}>
                  <div className="muted" style={{fontSize: '12px', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px'}}>
                    <FiPackage size={12} />
                    Items
                  </div>
                  <div style={{fontSize: '16px', fontWeight: '600', color: '#e2e8f0'}}>
                    {rfp.requirements.items.length} item{rfp.requirements.items.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
              <button 
                className="button" 
                style={{width: '100%', marginTop: '8px'}}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectRfp) onSelectRfp(rfp);
                  onDetailClick();
                }}
              >
                <FiFileText />
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


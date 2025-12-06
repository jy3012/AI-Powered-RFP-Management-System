import React from 'react';
import { FiUsers, FiRefreshCw, FiUserPlus, FiZap, FiMail, FiUser } from 'react-icons/fi';
import { createVendor, listVendors } from '../api';

export default function Vendors(){
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [vendors, setVendors] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(()=>{ refresh(); }, []);

  async function refresh(){
    setLoading(true);
    try { setVendors(await listVendors()); }
    finally { setLoading(false); }
  }

  async function add(){
    if(!name || !email) return;
    setLoading(true);
    await createVendor({ name, email });
    setName(''); setEmail('');
    refresh();
  }

  return (
    <div className="panel stack">
      <div className="row" style={{alignItems: 'center', justifyContent: 'space-between'}}>
        <div>
          <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <FiUsers />
            Vendor Management
          </h2>
          <p className="muted" style={{fontSize: '15px', marginTop: '8px'}}>
            Manage your vendor contacts. Add vendors to send RFPs and receive proposals automatically.
          </p>
        </div>
        <button className="button ghost" onClick={refresh} disabled={loading}>
          {loading ? (
            <span className="loading" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
          ) : (
            <FiRefreshCw />
          )}
          Refresh
        </button>
      </div>

      <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
        <div className="card" style={{backgroundColor: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)'}}>
          <h4 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
            <FiUserPlus />
            Add New Vendor
          </h4>
          <div className="stack" style={{gap: '12px'}}>
            <div>
              <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', color: '#cbd5e1', fontWeight: '500'}}>
                Vendor Name
              </label>
              <input 
                value={name} 
                onChange={e=>setName(e.target.value)} 
                placeholder="e.g., Acme Corporation"
                onKeyPress={e => e.key === 'Enter' && add()}
              />
            </div>
            <div>
              <label style={{display: 'block', marginBottom: '6px', fontSize: '14px', color: '#cbd5e1', fontWeight: '500'}}>
                Email Address
              </label>
              <input 
                type="email"
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="vendor@example.com"
                onKeyPress={e => e.key === 'Enter' && add()}
              />
            </div>
            <button 
              className="button" 
              onClick={add} 
              disabled={loading || !name.trim() || !email.trim()}
              style={{width: '100%'}}
            >
              {loading ? (
                <>
                  <span className="loading" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
                  Adding...
                </>
              ) : (
                <>
                  <FiUserPlus />
                  Add Vendor
                </>
              )}
            </button>
          </div>
        </div>

        <div className="card" style={{backgroundColor: 'rgba(34,211,238,0.05)', borderColor: 'rgba(34,211,238,0.2)'}}>
          <h4 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
            <FiZap style={{color: '#67e8f9'}} />
            How It Works
          </h4>
          <ul style={{marginLeft: '20px', color: '#cbd5e1', lineHeight: '1.8', marginTop: '12px'}}>
            <li>Add vendor contacts with their email addresses</li>
            <li>Select vendors when sending an RFP</li>
            <li>Vendors receive the RFP via email</li>
            <li>Their email replies are automatically parsed into proposals</li>
            <li>Proposals appear in the RFP Detail page</li>
          </ul>
        </div>
      </div>

      <div style={{marginTop: '24px'}}>
        <div className="row" style={{alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px'}}>
          <h3 style={{margin: 0}}>Vendor Directory ({vendors.length})</h3>
          {vendors.length > 0 && (
            <span className="muted" style={{fontSize: '14px'}}>
              {vendors.length} vendor{vendors.length !== 1 ? 's' : ''} registered
            </span>
          )}
        </div>

        {loading ? (
          <div className="card" style={{textAlign: 'center', padding: '40px'}}>
            <div className="loading" style={{margin: '0 auto'}}></div>
            <p className="muted" style={{marginTop: '16px'}}>Loading vendors...</p>
          </div>
        ) : vendors.length === 0 ? (
          <div className="card" style={{textAlign: 'center', padding: '40px', backgroundColor: 'rgba(148,163,184,0.05)'}}>
            <div style={{fontSize: '48px', marginBottom: '16px', display: 'flex', justifyContent: 'center'}}>
              <FiMail style={{opacity: 0.5}} />
            </div>
            <h4 style={{marginBottom: '8px'}}>No Vendors Yet</h4>
            <p className="muted">Add your first vendor to start sending RFPs</p>
          </div>
        ) : (
          <div className="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))'}}>
            {vendors.map(v=> (
              <div 
                key={v._id} 
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  color: '#fff',
                  flexShrink: 0
                }}>
                  <FiUser size={24} />
                </div>
                <div style={{flex: 1, minWidth: 0}}>
                  <div style={{fontWeight: '600', fontSize: '16px', marginBottom: '4px', color: '#f1f5f9'}}>
                    {v.name}
                  </div>
                  <div style={{fontSize: '14px', color: '#94a3b8', wordBreak: 'break-all'}}>
                    {v.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { 
  FiFileText, 
  FiCalendar, 
  FiEdit3, 
  FiMail, 
  FiRefreshCw, 
  FiZap,
  FiDollarSign,
  FiPackage,
  FiClock,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import { sendRfp, listVendors, getProposals, compareRfp, listRfps, createProposal } from '../api';

export default function RfpDetail({ rfp, onSelectRfp }) {
  const [vendors, setVendors] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const [proposals, setProposals] = React.useState([]);
  const [scores, setScores] = React.useState(null);
  const [loadingSend, setLoadingSend] = React.useState(false);
  const [loadingData, setLoadingData] = React.useState(false);
  const [allRfps, setAllRfps] = React.useState([]);
  const [currentRfp, setCurrentRfp] = React.useState(rfp);
  const [showCreateProposal, setShowCreateProposal] = React.useState(false);
  const [proposalText, setProposalText] = React.useState('');
  const [selectedVendorForProposal, setSelectedVendorForProposal] = React.useState('');

  React.useEffect(() => {
    listVendors().then(setVendors);
    listRfps().then(setAllRfps);
  }, []);

  React.useEffect(() => {
    setCurrentRfp(rfp);
    if (rfp?._id) {
      loadProposals();
    }
  }, [rfp]);

  // Auto-refresh proposals every 30 seconds when viewing an RFP
  React.useEffect(() => {
    if (!currentRfp?._id) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing proposals...');
      loadProposals();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [currentRfp?._id]);

  async function handleSend(){
    if(!rfp || !rfp._id) {
      alert('RFP ID missing. Please create a new RFP.');
      return;
    }
    if(selected.length === 0) {
      alert('Please select at least one vendor.');
      return;
    }
    setLoadingSend(true);
    try {
      await sendRfp(rfp._id, selected);
      alert('RFP sent to selected vendors');
    } catch (err) {
      alert('Error sending RFP: ' + (err.message || err));
    } finally {
      setLoadingSend(false);
    }
  }

  async function loadProposals(){
    if(!currentRfp || !currentRfp._id) {
      alert('RFP ID missing. Please select an RFP.');
      return;
    }
    setLoadingData(true);
    setScores(null);
    try {
      console.log('Loading proposals for RFP:', currentRfp._id);
      const p = await getProposals(currentRfp._id);
      console.log('Received proposals:', p);
      setProposals(Array.isArray(p) ? p : []);
      if (Array.isArray(p) && p.length === 0) {
        console.log('No proposals found for this RFP');
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Unknown error';
      console.error('Load proposals error:', err);
      console.error('Error response:', err?.response);
      alert('Error loading proposals: ' + errorMsg + '\n\nCheck browser console for details.');
    } finally {
      setLoadingData(false);
    }
  }

  async function doCompare(){
    if(!currentRfp || !currentRfp._id) {
      alert('RFP ID missing. Please select an RFP.');
      return;
    }
    if(proposals.length === 0) {
      alert('No proposals to compare. Load proposals first.');
      return;
    }
    setLoadingData(true);
    try {
      const s = await compareRfp(currentRfp._id);
      setScores(s?.aiScores || s?.scores || []);
      if (!s?.aiScores && !s?.scores) {
        alert('Comparison completed but no scores returned.');
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.error || err?.message || 'Unknown error';
      alert('Error comparing proposals: ' + errorMsg);
      console.error('Compare error:', err);
    } finally {
      setLoadingData(false);
    }
  }

  function handleRfpChange(e) {
    const rfpId = e.target.value;
    if (rfpId && rfpId !== 'none') {
      const selected = allRfps.find(r => r._id === rfpId);
      if (selected) {
        setCurrentRfp(selected);
        if (onSelectRfp) onSelectRfp(selected);
        setProposals([]);
        setScores(null);
      }
    }
  }

  function getScoreColor(score) {
    if (score >= 8) return '#10b981'; // green
    if (score >= 6) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  }

  async function handleCreateProposal() {
    if (!currentRfp?._id || !selectedVendorForProposal || !proposalText.trim()) {
      alert('Please select a vendor and enter proposal text');
      return;
    }
    setLoadingData(true);
    try {
      await createProposal(currentRfp._id, selectedVendorForProposal, proposalText);
      alert('Proposal created successfully!');
      setProposalText('');
      setSelectedVendorForProposal('');
      setShowCreateProposal(false);
      loadProposals(); // Reload proposals
    } catch (err) {
      alert('Error creating proposal: ' + (err?.response?.data?.error || err?.message || 'Unknown error'));
      console.error('Create proposal error:', err);
    } finally {
      setLoadingData(false);
    }
  }

  if(!currentRfp && allRfps.length === 0) {
    return (
      <div className="panel">
        <h2>RFP Detail</h2>
        <p className="muted">Create an RFP first to send it and track responses.</p>
      </div>
    );
  }

  return (
    <div className="panel stack">
      <div className="row" style={{alignItems:'center', justifyContent:'space-between', marginBottom: 24, flexWrap: 'wrap', gap: '16px'}}>
        <div style={{flex: 1, minWidth: '300px'}}>
          <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
            <FiFileText />
            RFP Management
          </h2>
          <p className="muted" style={{fontSize: '15px', marginTop: '8px'}}>
            Select an RFP, send to vendors, track proposals, and compare with AI-powered scoring.
          </p>
        </div>
        <div style={{minWidth: '280px'}}>
          <label style={{display: 'block', marginBottom: 8, fontSize: '14px', color: '#cbd5e1', fontWeight: '500'}}>
            Select RFP:
          </label>
          <select 
            value={currentRfp?._id || 'none'} 
            onChange={handleRfpChange}
            style={{
              width: '100%',
              padding: '12px 16px',
              backgroundColor: 'rgba(15,23,42,0.6)',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              color: '#e2e8f0',
              fontSize: '15px',
              cursor: 'pointer'
            }}
          >
            <option value="none">-- Select RFP --</option>
            {allRfps.map(r => (
              <option key={r._id} value={r._id}>
                {r.title} ({r.proposalCount || 0} proposals)
              </option>
            ))}
          </select>
        </div>
      </div>

      {!currentRfp ? (
        <div className="card" style={{textAlign: 'center', padding: '40px'}}>
          <p className="muted">Select an RFP from the dropdown above to view details</p>
        </div>
      ) : (
        <>
          <div className="row" style={{alignItems:'flex-start', marginBottom: 24, gap: '20px'}}>
            <div className="stack" style={{flex:2}}>
              <div>
                <h3 style={{marginBottom: '8px', fontSize: '24px'}}>{currentRfp.title}</h3>
                <p className="muted" style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <FiCalendar size={14} />
                  Created: {new Date(currentRfp.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="card" style={{
                backgroundColor: 'rgba(99,102,241,0.05)',
                borderColor: 'rgba(99,102,241,0.2)'
              }}>
                <h4 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                  <FiEdit3 />
                  Requirements
                </h4>
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16}}>
                  {currentRfp.requirements?.budget && (
                    <div>
                      <div className="muted" style={{fontSize: '0.85em'}}>Budget</div>
                      <div style={{fontSize: '1.3em', fontWeight: 'bold', color: '#67e8f9'}}>
                        ${currentRfp.requirements.budget.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {currentRfp.requirements?.delivery_days && (
                    <div>
                      <div className="muted" style={{fontSize: '0.85em'}}>Delivery Days</div>
                      <div style={{fontSize: '1.3em', fontWeight: 'bold', color: '#cbd5e1'}}>
                        {currentRfp.requirements.delivery_days}
                      </div>
                    </div>
                  )}
                  {currentRfp.requirements?.items?.length > 0 && (
                    <div>
                      <div className="muted" style={{fontSize: '0.85em'}}>Items</div>
                      <div style={{fontSize: '1.3em', fontWeight: 'bold', color: '#cbd5e1'}}>
                        {currentRfp.requirements.items.length}
                      </div>
                    </div>
                  )}
                </div>
                {currentRfp.requirements?.items?.length > 0 && (
                  <div style={{marginTop: 16}}>
                    <div className="muted" style={{fontSize: '0.9em', marginBottom: 8}}>Item Details:</div>
                    <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                      {currentRfp.requirements.items.map((item, i) => (
                        <div key={i} style={{padding: '8px', marginBottom: 4, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 4}}>
                          <strong>{item.name}</strong> - Qty: {item.qty} {item.specs && `(${item.specs})`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="card" style={{
              flex:1,
              backgroundColor: 'rgba(34,211,238,0.05)',
              borderColor: 'rgba(34,211,238,0.2)'
            }}>
              <h4 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <FiMail />
                Send to Vendors
              </h4>
              <div className="stack" style={{gap: '12px'}}>
                {vendors.length === 0 ? (
                  <div style={{
                    padding: '16px',
                    backgroundColor: 'rgba(148,163,184,0.1)',
                    borderRadius: '8px',
                    textAlign: 'center'
                  }}>
                    <p className="muted" style={{margin: 0}}>
                      No vendors added yet.<br/>
                      Go to <strong>Vendors</strong> page to add them.
                    </p>
                  </div>
                ) : (
                  vendors.map(v=>(
                    <label 
                      key={v._id} 
                      style={{
                        display:'flex', 
                        gap:'12px', 
                        alignItems:'center',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: selected.includes(v._id) ? 'rgba(99,102,241,0.15)' : 'rgba(30,41,59,0.3)',
                        border: `1px solid ${selected.includes(v._id) ? 'rgba(99,102,241,0.4)' : 'var(--border)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <input 
                        type="checkbox" 
                        value={v._id} 
                        checked={selected.includes(v._id)}
                        onChange={e=>{
                          const id = v._id;
                          setSelected(prev => e.target.checked ? [...prev,id] : prev.filter(x=>x!==id));
                        }}
                        style={{
                          width: '18px',
                          height: '18px',
                          cursor: 'pointer'
                        }}
                      />
                      <div style={{flex: 1}}>
                        <div style={{fontWeight: '500', color: '#f1f5f9'}}>{v.name}</div>
                        <div className="muted" style={{fontSize: '13px'}}>{v.email}</div>
                      </div>
                    </label>
                  ))
                )}
                <button 
                  className="button" 
                  onClick={handleSend} 
                  disabled={loadingSend || selected.length===0 || !currentRfp?._id}
                  style={{width: '100%', marginTop: '8px'}}
                >
                  {loadingSend ? (
                    <>
                      <span className="loading" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FiMail />
                      Send to {selected.length || 0} vendor{selected.length !== 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div style={{borderTop: '1px solid rgba(148,163,184,0.2)', paddingTop: 24}}>
            {/* Workflow Guide */}
            <div className="card" style={{backgroundColor: 'rgba(59,130,246,0.1)', marginBottom: 16, borderLeft: '4px solid #3b82f6'}}>
              <h4 style={{marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                <FiFileText />
                How Proposals Work
              </h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, fontSize: '0.9em'}}>
                <div>
                  <strong style={{color: '#67e8f9'}}>Step 1:</strong> Send RFP to vendors using the "Send to vendors" section above
                </div>
                <div>
                  <strong style={{color: '#67e8f9'}}>Step 2:</strong> Vendors reply via email (or create manually below for testing)
                </div>
                <div>
                  <strong style={{color: '#67e8f9'}}>Step 3:</strong> Click "Load Proposals" to fetch vendor responses
                </div>
                <div>
                  <strong style={{color: '#67e8f9'}}>Step 4:</strong> Click "Compare (AI)" to get AI-powered rankings
                </div>
              </div>
              <p className="muted" style={{marginTop: 12, fontSize: '0.85em', display: 'flex', alignItems: 'center', gap: '6px'}}>
                <FiZap size={16} style={{color: '#67e8f9'}} />
                <strong>Real-time Processing:</strong> Proposals are automatically created when vendors email you (if IMAP is configured). 
                The system extracts pricing, delivery terms, warranty, and item breakdowns using AI. 
                Proposals auto-refresh every 30 seconds. You can also create test proposals manually below.
              </p>
            </div>

            <div className="row" style={{gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center'}}>
              <button 
                className="button ghost" 
                onClick={loadProposals} 
                disabled={loadingData || !currentRfp?._id}
              >
                {loadingData ? (
                  <>
                    <span className="loading" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
                    Loading...
                  </>
                ) : (
                  <>
                    <FiRefreshCw />
                    Load Proposals
                  </>
                )}
              </button>
              {currentRfp?._id && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  backgroundColor: 'rgba(16,185,129,0.1)',
                  borderRadius: '6px',
                  fontSize: '0.85em',
                  color: '#10b981'
                }}>
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#10b981',
                    animation: 'pulse 2s infinite'
                  }}></span>
                  Auto-refresh: 30s
                </div>
              )}
              <button 
                className="button" 
                onClick={doCompare} 
                disabled={loadingData || proposals.length===0 || !currentRfp?._id}
              >
                {loadingData ? (
                  <>
                    <span className="loading" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
                    Comparing...
                  </>
                ) : (
                  <>
                    <FiZap />
                    Compare {proposals.length} Proposal{proposals.length !== 1 ? 's' : ''} (AI)
                  </>
                )}
              </button>
              <button 
                className="button ghost" 
                onClick={() => setShowCreateProposal(!showCreateProposal)}
                disabled={!currentRfp?._id}
              >
                {showCreateProposal ? '✕ Cancel' : '+ Create Test Proposal'}
              </button>
            </div>

            {/* Manual Proposal Creation Form */}
            {showCreateProposal && currentRfp && (
              <div className="card" style={{backgroundColor: 'rgba(15,23,42,0.5)', marginBottom: 16, border: '2px solid #3b82f6'}}>
                <h4 style={{marginTop: 0}}>Create Test Proposal</h4>
                <p className="muted" style={{fontSize: '0.9em', marginBottom: 12}}>
                  Simulate a vendor response. Paste proposal text (pricing, delivery, warranty, etc.) and AI will parse it.
                </p>
                <div className="stack" style={{gap: 12}}>
                  <div>
                    <label style={{display: 'block', marginBottom: 4, fontSize: '0.9em', color: '#94a3b8'}}>
                      Select Vendor:
                    </label>
                    <select
                      value={selectedVendorForProposal}
                      onChange={e => setSelectedVendorForProposal(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(15,23,42,0.5)',
                        border: '1px solid rgba(148,163,184,0.2)',
                        borderRadius: 6,
                        color: '#e2e8f0'
                      }}
                    >
                      <option value="">-- Select Vendor --</option>
                      {vendors.map(v => (
                        <option key={v._id} value={v._id}>{v.name} ({v.email})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{display: 'block', marginBottom: 4, fontSize: '0.9em', color: '#94a3b8'}}>
                      Proposal Text (paste vendor's response):
                    </label>
                    <textarea
                      value={proposalText}
                      onChange={e => setProposalText(e.target.value)}
                      placeholder="Example: Thank you for the RFP. We can provide: Total cost $45,000. Delivery in 25 days. 2-year warranty. Item breakdown: 50 laptops @ $800 = $40,000, 10 printers @ $500 = $5,000."
                      rows={6}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        backgroundColor: 'rgba(15,23,42,0.5)',
                        border: '1px solid rgba(148,163,184,0.2)',
                        borderRadius: 6,
                        color: '#e2e8f0',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>
                  <button 
                    className="button" 
                    onClick={handleCreateProposal}
                    disabled={loadingData || !selectedVendorForProposal || !proposalText.trim()}
                  >
                    {loadingData ? 'Creating...' : 'Create Proposal'}
                  </button>
                </div>
              </div>
            )}

            <div className="row" style={{gap: 16, alignItems: 'flex-start'}}>
              <div className="stack" style={{flex: 1}}>
                <h4>
                  Proposals ({proposals.length})
                  {proposals.filter(p => p.isUnassigned).length > 0 && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '0.7em',
                      padding: '4px 8px',
                      backgroundColor: 'rgba(245,158,11,0.2)',
                      color: '#f59e0b',
                      borderRadius: '4px',
                      fontWeight: 'normal'
                    }}>
                      {proposals.filter(p => p.isUnassigned).length} unassigned
                    </span>
                  )}
                </h4>
                {loadingData && <div className="muted">Loading...</div>}
                {proposals.length === 0 && !loadingData && (
                  <div className="card" style={{textAlign: 'center', padding: '20px'}}>
                    <p className="muted">No proposals yet. Send the RFP to vendors and they will appear here.</p>
                  </div>
                )}
                {proposals.map(p=>{
                  const proposalScore = scores?.find(s => 
                    s.proposalId === p._id?.toString() || s.vendorId === p.vendor?._id?.toString()
                  );
                  return (
                    <div key={p._id} className="card" style={{
                      borderLeft: proposalScore ? `4px solid ${getScoreColor(proposalScore?.finalScore || 0)}` : p.isUnassigned ? '4px solid #f59e0b' : '4px solid transparent',
                      backgroundColor: p.isUnassigned ? 'rgba(245,158,11,0.05)' : undefined
                    }}>
                      <div className="row" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                        <div style={{flex: 1}}>
                          <h5 style={{margin: 0, display: 'flex', alignItems: 'center', gap: '8px'}}>
                            {p.vendor?.name || p.vendor?.email || 'Unknown Vendor'}
                            {p.isUnassigned && (
                              <span style={{
                                fontSize: '0.7em',
                                padding: '2px 6px',
                                backgroundColor: '#f59e0b',
                                color: '#fff',
                                borderRadius: '4px',
                                fontWeight: 'normal'
                              }}>
                                Unassigned
                              </span>
                            )}
                          </h5>
                        </div>
                        {proposalScore && (
                          <span className="tag" style={{
                            backgroundColor: getScoreColor(proposalScore.finalScore),
                            color: '#fff'
                          }}>
                            Score: {proposalScore.finalScore?.toFixed(1) || 'N/A'}
                          </span>
                        )}
                      </div>
                      {p.isUnassigned && (
                        <div style={{
                          padding: '8px 12px',
                          marginBottom: 12,
                          backgroundColor: 'rgba(245,158,11,0.15)',
                          borderRadius: '6px',
                          fontSize: '0.9em',
                          color: '#fbbf24',
                          border: '1px solid rgba(245,158,11,0.3)'
                        }}>
                          ⚠️ This proposal was received but couldn't be automatically matched to this RFP. 
                          It will be assigned automatically if the vendor email matches.
                        </div>
                      )}
                      {p.emailDate && (
                        <div className="muted" style={{fontSize: '0.8em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: '4px'}}>
                          <FiClock size={12} />
                          Received: {new Date(p.emailDate).toLocaleString()}
                          {p.hasAttachments && (
                            <span style={{marginLeft: '8px', color: '#f59e0b'}}>📎 {p.attachmentInfo?.length || 0} attachment(s)</span>
                          )}
                        </div>
                      )}
                      {p.parsed && (
                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 12}}>
                          {p.parsed.total_cost && (
                            <div>
                              <div className="muted" style={{fontSize: '0.85em'}}>Total Cost</div>
                              <div style={{fontSize: '1.1em', fontWeight: 'bold', color: '#67e8f9'}}>
                                {p.parsed.currency || '$'}{p.parsed.total_cost.toLocaleString()}
                              </div>
                            </div>
                          )}
                          {p.parsed.delivery_days && (
                            <div>
                              <div className="muted" style={{fontSize: '0.85em'}}>Delivery</div>
                              <div style={{fontSize: '1.1em', fontWeight: 'bold', color: '#cbd5e1'}}>
                                {p.parsed.delivery_days} days
                                {p.parsed.delivery_date && (
                                  <div style={{fontSize: '0.8em', color: '#94a3b8', marginTop: '2px'}}>
                                    ({p.parsed.delivery_date})
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                          {p.parsed.warranty && (
                            <div>
                              <div className="muted" style={{fontSize: '0.85em'}}>Warranty</div>
                              <div style={{fontSize: '1.1em', color: '#cbd5e1'}}>{p.parsed.warranty}</div>
                            </div>
                          )}
                          {p.parsed.payment_terms && (
                            <div>
                              <div className="muted" style={{fontSize: '0.85em'}}>Payment Terms</div>
                              <div style={{fontSize: '1.1em', color: '#cbd5e1'}}>{p.parsed.payment_terms}</div>
                            </div>
                          )}
                          {p.parsed.valid_until && (
                            <div>
                              <div className="muted" style={{fontSize: '0.85em'}}>Valid Until</div>
                              <div style={{fontSize: '1.1em', color: '#f59e0b'}}>{p.parsed.valid_until}</div>
                            </div>
                          )}
                        </div>
                      )}
                      {p.parsed?.contact_info && (p.parsed.contact_info.name || p.parsed.contact_info.phone || p.parsed.contact_info.email) && (
                        <div style={{marginBottom: 12, padding: '8px', backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: '4px', fontSize: '0.9em'}}>
                          <div className="muted" style={{fontSize: '0.85em', marginBottom: '4px'}}>Contact Info:</div>
                          {p.parsed.contact_info.name && <div>👤 {p.parsed.contact_info.name}</div>}
                          {p.parsed.contact_info.phone && <div>📞 {p.parsed.contact_info.phone}</div>}
                          {p.parsed.contact_info.email && <div>✉️ {p.parsed.contact_info.email}</div>}
                        </div>
                      )}
                      {p.parsed?.notes && (
                        <div style={{marginBottom: 12, padding: '8px', backgroundColor: 'rgba(148,163,184,0.1)', borderRadius: '4px', fontSize: '0.9em', fontStyle: 'italic'}}>
                          <div className="muted" style={{fontSize: '0.85em', marginBottom: '4px'}}>Notes:</div>
                          {p.parsed.notes}
                        </div>
                      )}
                      {p.parsed?.item_breakdown?.length > 0 && (
                        <details style={{marginTop: 8}}>
                          <summary style={{cursor: 'pointer', color: '#67e8f9'}}>View Item Breakdown</summary>
                          <div style={{marginTop: 8, maxHeight: '200px', overflowY: 'auto'}}>
                            {p.parsed.item_breakdown.map((item, i) => (
                              <div key={i} style={{padding: '6px', marginBottom: 4, backgroundColor: 'rgba(59,130,246,0.1)', borderRadius: 4, fontSize: '0.9em'}}>
                                {item.name} - Qty: {item.qty} @ ${item.unit_price} = ${item.total_price}
                              </div>
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="stack" style={{flex: 1}}>
                <h4>AI Comparison Results</h4>
                {!scores || scores.length === 0 ? (
                  <div className="card" style={{textAlign: 'center', padding: '20px'}}>
                    <p className="muted">Run AI comparison to see scores and rankings</p>
                  </div>
                ) : (
                  <div className="card" style={{backgroundColor: 'rgba(15,23,42,0.3)'}}>
                    {scores
                      .sort((a, b) => (b.finalScore || 0) - (a.finalScore || 0))
                      .map((s, i) => {
                        const proposal = proposals.find(p => 
                          p._id?.toString() === s.proposalId || p.vendor?._id?.toString() === s.vendorId
                        );
                        return (
                          <div key={i} style={{
                            padding: 16,
                            marginBottom: 12,
                            backgroundColor: 'rgba(59,130,246,0.1)',
                            borderRadius: 8,
                            border: `2px solid ${getScoreColor(s.finalScore || 0)}`
                          }}>
                            <div className="row" style={{justifyContent: 'space-between', alignItems: 'center', marginBottom: 12}}>
                              <h5 style={{margin: 0}}>
                                #{i + 1} {proposal?.vendor?.name || s.vendor || 'Unknown'}
                              </h5>
                              <div style={{
                                fontSize: '1.5em',
                                fontWeight: 'bold',
                                color: getScoreColor(s.finalScore || 0)
                              }}>
                                {s.finalScore?.toFixed(1) || 'N/A'}
                              </div>
                            </div>
                            <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12}}>
                              <div>
                                <div className="muted" style={{fontSize: '0.85em'}}>Price</div>
                                <div style={{fontSize: '1.1em', fontWeight: 'bold', color: getScoreColor(s.priceScore || 0)}}>
                                  {s.priceScore?.toFixed(1) || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="muted" style={{fontSize: '0.85em'}}>Delivery</div>
                                <div style={{fontSize: '1.1em', fontWeight: 'bold', color: getScoreColor(s.deliveryScore || 0)}}>
                                  {s.deliveryScore?.toFixed(1) || 'N/A'}
                                </div>
                              </div>
                              <div>
                                <div className="muted" style={{fontSize: '0.85em'}}>Match</div>
                                <div style={{fontSize: '1.1em', fontWeight: 'bold', color: getScoreColor(s.matchScore || 0)}}>
                                  {s.matchScore?.toFixed(1) || 'N/A'}
                                </div>
                              </div>
                            </div>
                            {s.reason && (
                              <div style={{
                                padding: 8,
                                backgroundColor: 'rgba(15,23,42,0.5)',
                                borderRadius: 4,
                                fontSize: '0.9em',
                                color: '#cbd5e1'
                              }}>
                                {s.reason}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

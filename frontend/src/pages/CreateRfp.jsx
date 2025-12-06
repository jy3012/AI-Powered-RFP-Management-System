import React from 'react';
import { FiFilePlus, FiZap, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { generateRfp } from '../api';

export default function CreateRfp({ onCreated }) {
  const [text, setText] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [rfp, setRfp] = React.useState(null);
  const [error, setError] = React.useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const res = await generateRfp(text);
      setRfp(res);
      if (onCreated) onCreated(res);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'Error generating RFP');
    } finally { setLoading(false); }
  }

  return (
    <div className="panel stack">
      <div>
        <h2 style={{display: 'flex', alignItems: 'center', gap: '12px'}}>
          <FiFilePlus />
          Create New RFP
        </h2>
        <p className="muted" style={{fontSize: '15px', marginTop: '8px'}}>
          Describe your requirements in plain English. Our AI will automatically structure it into a professional RFP with items, budget, delivery timeline, and terms.
        </p>
      </div>

      <div className="card" style={{backgroundColor: 'rgba(99,102,241,0.05)', borderColor: 'rgba(99,102,241,0.2)'}}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'}}>
          <FiZap size={20} style={{color: '#67e8f9'}} />
          <strong style={{color: '#67e8f9'}}>Tips for best results:</strong>
        </div>
        <ul style={{marginLeft: '20px', color: '#cbd5e1', lineHeight: '1.8'}}>
          <li>Include quantities, specifications, and technical requirements</li>
          <li>Mention your budget range or total budget</li>
          <li>Specify delivery timeline and payment terms</li>
          <li>Add warranty or support requirements</li>
        </ul>
      </div>

      <div>
        <label style={{display: 'block', marginBottom: '8px', fontWeight: '500', color: '#cbd5e1'}}>
          Describe Your Requirements:
        </label>
        <textarea
          value={text}
          onChange={e=>setText(e.target.value)}
          rows={10}
          placeholder="Example: We need 50 business laptops with Intel i7 processors, 16GB RAM, 512GB SSD, 14-inch displays, and Windows 11 Pro. Also need 10 color laser printers with network connectivity and duplex printing. Total budget around $50,000. Delivery required within 30 days. Payment terms: Net 30. All items must include 1-year onsite warranty and asset tagging service."
          style={{fontSize: '15px', lineHeight: '1.6'}}
        />
        <div style={{marginTop: '8px', fontSize: '13px', color: '#94a3b8'}}>
          {text.length} characters
        </div>
      </div>

      <div className="row" style={{alignItems: 'center'}}>
        <button 
          className="button" 
          onClick={handleGenerate} 
          disabled={loading || !text.trim()}
          style={{minWidth: '180px'}}
        >
          {loading ? (
            <>
              <span className="loading" style={{width: '16px', height: '16px', borderWidth: '2px'}}></span>
              Generating...
            </>
          ) : (
            <>
              <FiFilePlus />
              Generate RFP
            </>
          )}
        </button>
        {rfp && (
          <span className="tag" style={{backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', borderColor: 'rgba(16,185,129,0.3)'}}>
            ✓ Successfully Generated
          </span>
        )}
      </div>

      {error && (
        <div className="card" style={{
          borderColor: 'rgba(239,68,68,0.4)',
          backgroundColor: 'rgba(239,68,68,0.1)',
          color: '#fca5a5'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
            <FiAlertCircle size={20} />
            <strong>Error:</strong> {error}
          </div>
        </div>
      )}

      {rfp && (
        <div className="card" style={{
          borderColor: 'rgba(16,185,129,0.3)',
          backgroundColor: 'rgba(16,185,129,0.05)'
        }}>
          <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px'}}>
            <FiCheckCircle size={24} style={{color: '#10b981'}} />
            <div>
              <h3 style={{margin: 0, color: '#10b981'}}>{rfp.title}</h3>
              <p className="muted" style={{marginTop: '4px'}}>RFP has been created and saved</p>
            </div>
          </div>
          <details style={{marginTop: '12px'}}>
            <summary style={{cursor: 'pointer', color: '#67e8f9', fontWeight: '500', marginBottom: '12px'}}>
              View Structured Requirements
            </summary>
            <pre style={{marginTop: '12px', maxHeight: '400px', overflow: 'auto'}}>
              {JSON.stringify(rfp.requirements, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { 
  FiLayout, 
  FiFilePlus, 
  FiUsers, 
  FiFileText, 
  FiMessageCircle,
  FiMenu,
  FiX
} from 'react-icons/fi';
import CreateRfp from './pages/CreateRfp';
import Vendors from './pages/Vendors';
import RfpDetail from './pages/RfpDetail';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';

export default function App() {
  const [page, setPage] = React.useState('dashboard');
  const [selectedRfp, setSelectedRfp] = React.useState(null);
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FiLayout, desc: 'Overview and quick actions' },
    { id: 'create', label: 'Create RFP', icon: FiFilePlus, desc: 'Turn your needs into a structured RFP' },
    { id: 'vendors', label: 'Vendors', icon: FiUsers, desc: 'Add and manage vendors' },
    { id: 'detail', label: 'RFP Detail', icon: FiFileText, desc: 'Send, track proposals, and compare' },
    { id: 'chat', label: 'AI Chat', icon: FiMessageCircle, desc: 'Ask questions or iterate on RFPs' },
  ];

  return (
    <div className="app-shell">
      <div className="app-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
          <div className="sidebar-header">
            <div className="brand">
              <FiLayout style={{marginRight: '8px', fontSize: '24px'}} />
              <span>AI RFP</span>
            </div>
            <button 
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <FiX /> : <FiMenu />}
            </button>
          </div>
          
          <nav className="sidebar-nav">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  className={`sidebar-item ${page === t.id ? 'active' : ''}`}
                  onClick={() => setPage(t.id)}
                  title={t.desc}
                >
                  <Icon className="sidebar-icon" />
                  {sidebarOpen && <span className="sidebar-label">{t.label}</span>}
                </button>
              );
            })}
          </nav>

          {sidebarOpen && (
            <div className="sidebar-footer">
              <div className="status-bar">
                <span className="dot" />
                <span className="muted">
                  {selectedRfp ? selectedRfp.title : 'Ready to create'}
                </span>
              </div>
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="main-content">
          <header className="topbar">
            <div>
              <h1 className="page-title">
                {tabs.find(t => t.id === page)?.label || 'Dashboard'}
              </h1>
              <p className="subtitle">
                {tabs.find(t => t.id === page)?.desc || 'Manage your RFPs'}
              </p>
            </div>
          </header>

          <main className="content-area">
            {page === 'dashboard' && (
              <Dashboard
                selectedRfp={selectedRfp}
                onCreateClick={()=>setPage('create')}
                onVendorsClick={()=>setPage('vendors')}
                onDetailClick={()=>setPage('detail')}
                onSelectRfp={setSelectedRfp}
              />
            )}
            {page === 'create' && <CreateRfp onCreated={(r)=>{ setSelectedRfp(r); setPage('detail'); }} />}
            {page === 'vendors' && <Vendors />}
            {page === 'detail' && <RfpDetail rfp={selectedRfp} onSelectRfp={setSelectedRfp} />}
            {page === 'chat' && <Chat selectedRfp={selectedRfp} />}
          </main>
        </div>
      </div>
    </div>
  );
}

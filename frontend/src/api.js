import axios from 'axios';
// Default to backend port 5000 (server.js uses 5000); override with VITE_API_URL if needed
const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api' });

export async function generateRfp(text) {
  const r = await API.post('/rfp/generate', { text });
  return r.data;
}
export async function listRfps() {
  const r = await API.get('/rfp/list');
  return r.data;
}
export async function getRfp(id) {
  const r = await API.get(`/rfp/${id}`);
  return r.data;
}
export async function createVendor(vendor) {
  const r = await API.post('/vendors', vendor);
  return r.data;
}
export async function listVendors() {
  const r = await API.get('/vendors');
  return r.data;
}
export async function sendRfp(rfpId, vendorIds) {
  const r = await API.post(`/rfp/${rfpId}/send`, { vendorIds });
  return r.data;
}
export async function getProposals(rfpId) {
  const r = await API.get(`/rfp/${rfpId}/proposals`);
  return r.data;
}
export async function compareRfp(rfpId) {
  const r = await API.get(`/rfp/${rfpId}/compare`);
  return r.data;
}
export async function chatAI(messages) {
  const r = await API.post('/rfp/chat', { messages });
  return r.data;
}
export async function createProposal(rfpId, vendorId, proposalText) {
  const r = await API.post('/rfp/proposal/create', { rfpId, vendorId, proposalText });
  return r.data;
}

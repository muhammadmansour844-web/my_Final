import React, { useState } from 'react';
import { FiChevronDown, FiLoader } from 'react-icons/fi';
import { FaMotorcycle, FaCar, FaTruck } from 'react-icons/fa';

const API = 'http://localhost:3000/api/users/register';

const AddDriver = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    entity_name: '', // License
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [vehicleType, setVehicleType] = useState('motorcycle');
  const [status, setStatus] = useState('active');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      setError('Name, Email and Password are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          account_type: 'delivery_admin',
          is_active: status === 'active' ? 1 : 0
        })
      });

      if (res.ok) {
        alert('Driver added successfully!');
        onBack();
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to add driver');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#fff', padding: '2rem', borderRadius: '12px 12px 0 0', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {onBack && (
            <button onClick={onBack} style={{ background: 'none', border: '1px solid #e5e7eb', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', color: '#374151', fontSize: '0.85rem' }}>
              ← Back
            </button>
          )}
          <h1 style={{ fontSize: '2rem', fontWeight: '500', color: '#111827', margin: 0 }}>Add New Driver</h1>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem 2rem', fontSize: '0.9rem', fontWeight: 500 }}>
          {error}
        </div>
      )}

      {/* Form Body */}
      <div style={{ backgroundColor: '#f3f4f6', padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Column 1 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FormField label="FULL NAME" name="name" value={formData.name} onChange={handleChange} placeholder="Enter full name" type="text" />
          <FormField label="EMAIL" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email address" type="email" />
          <FormField label="PASSWORD" name="password" value={formData.password} onChange={handleChange} placeholder="Create password" type="password" />
          <FormField label="PHONE" name="phone" value={formData.phone} onChange={handleChange} placeholder="Enter phone number" type="text" />
        </div>

        {/* Column 2 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <FormField label="LICENSE / ID #" name="entity_name" value={formData.entity_name} onChange={handleChange} placeholder="Enter license number" type="text" />
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={labelStyle}>VEHICLE TYPE</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <VehicleToggle icon={<FaMotorcycle size={20} />} active={vehicleType === 'motorcycle'} onClick={() => setVehicleType('motorcycle')} />
              <VehicleToggle icon={<FaCar size={18} />} active={vehicleType === 'car'} onClick={() => setVehicleType('car')} />
              <VehicleToggle icon={<FaTruck size={18} />} active={vehicleType === 'truck'} onClick={() => setVehicleType('truck')} />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={labelStyle}>STATUS</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <StatusToggle label="ACTIVE" active={status === 'active'} onClick={() => setStatus('active')} />
              <StatusToggle label="INACTIVE" active={status === 'inactive'} onClick={() => setStatus('inactive')} />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ backgroundColor: '#fff', padding: '1.5rem 2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e5e7eb', borderRadius: '0 0 12px 12px' }}>
        <button onClick={onBack} disabled={loading} style={{ padding: '0.75rem 1.5rem', borderRadius: '8px', border: '1px solid #e5e7eb', backgroundColor: '#fff', color: '#374151', fontWeight: '600', fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer' }}>
          CANCEL
        </button>
        <button onClick={handleSave} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0.75rem 1.5rem', borderRadius: '8px', border: 'none', backgroundColor: '#064e3b', color: '#fff', fontWeight: '600', fontSize: '0.85rem', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading && <FiLoader className="animate-spin" />}
          SAVE DRIVER
        </button>
      </div>
    </div>
  );
};

const labelStyle = { fontSize: '0.75rem', fontWeight: '700', color: '#4b5563', letterSpacing: '0.5px', textTransform: 'uppercase' };

const FormField = ({ label, name, value, onChange, placeholder, type }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
    <label style={labelStyle}>{label}</label>
    <input 
      name={name}
      value={value}
      onChange={onChange}
      type={type} 
      placeholder={placeholder} 
      style={{ padding: '0.75rem 1rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', color: '#374151', outline: 'none', backgroundColor: '#fff' }} 
    />
  </div>
);

const VehicleToggle = ({ icon, active, onClick }) => (
  <button type="button" onClick={onClick} style={{ flex: 1, height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#86efac' : '#fff', color: active ? '#14532d' : '#4b5563', border: active ? 'none' : '1px solid #e5e7eb', borderRadius: '6px', cursor: 'pointer' }}>
    {icon}
  </button>
);

const StatusToggle = ({ label, active, onClick }) => (
  <button type="button" onClick={onClick} style={{ flex: 1, padding: '0.6rem 0', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: active ? '#86efac' : '#fff', color: active ? '#14532d' : '#4b5563', border: active ? 'none' : '1px solid #e5e7eb', borderRadius: '20px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.5px' }}>
    {label}
  </button>
);

export default AddDriver;

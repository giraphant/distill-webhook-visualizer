import React, { useState, useEffect } from 'react';

interface ConstantCard {
  id: string;
  name: string;
  value: number;
  unit: string | null;
  description: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

interface ConstantCardModalProps {
  show: boolean;
  onClose: () => void;
  onSave: (constant: Partial<ConstantCard>) => void;
  editingConstant: ConstantCard | null;
}

export default function ConstantCardModal({ show, onClose, onSave, editingConstant }: ConstantCardModalProps) {
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [unit, setUnit] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    if (editingConstant) {
      setName(editingConstant.name);
      setValue(String(editingConstant.value));
      setUnit(editingConstant.unit || '');
      setDescription(editingConstant.description || '');
      setColor(editingConstant.color);
    } else {
      setName('');
      setValue('');
      setUnit('');
      setDescription('');
      setColor('#3b82f6');
    }
  }, [editingConstant, show]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !value.trim()) {
      alert('Name and value are required');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      alert('Value must be a number');
      return;
    }

    onSave({
      name: name.trim(),
      value: numValue,
      unit: unit.trim() || null,
      description: description.trim() || null,
      color: color
    });
  };

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h2>{editingConstant ? 'Edit Constant Card' : 'New Constant Card'}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="const-name" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Name *
            </label>
            <input
              id="const-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Target APR, Risk-Free Rate"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="const-value" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Value *
            </label>
            <input
              id="const-value"
              type="number"
              step="any"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 10.5"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="const-unit" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Unit
            </label>
            <input
              id="const-unit"
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. %, $, ETH"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label htmlFor="const-desc" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Description
            </label>
            <textarea
              id="const-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional description..."
              rows={3}
              style={{
                width: '100%',
                padding: '8px',
                borderRadius: '6px',
                border: '1px solid var(--border)',
                fontFamily: 'inherit',
                resize: 'vertical',
                background: 'var(--background)',
                color: 'var(--foreground)'
              }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label htmlFor="const-color" style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Color
            </label>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                id="const-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                style={{ width: '60px', height: '40px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              />
              <span style={{ color: 'var(--muted-foreground)', fontSize: '14px' }}>{color}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {editingConstant ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

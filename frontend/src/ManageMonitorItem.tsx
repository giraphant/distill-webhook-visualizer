import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Trash2, Pencil } from 'lucide-react';

interface MonitorSummary {
  monitor_id: string;
  monitor_name: string | null;
  url: string;
  unit: string | null;
  latest_value: number | null;
}

interface ManageMonitorItemProps {
  monitor: MonitorSummary;
  customName: string;
  formula: string;
  tags: string[];
  isHidden: boolean;
  formatValue: (value: number | null, unit: string | null) => string;
  onToggleHide: () => void;
  onDelete: () => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onUpdateName: (name: string) => void;
  onUpdateFormula: (formula: string) => void;
}

export default function ManageMonitorItem({
  monitor,
  customName,
  formula,
  tags,
  isHidden,
  formatValue,
  onToggleHide,
  onDelete,
  onAddTag,
  onRemoveTag,
  onUpdateName,
  onUpdateFormula,
}: ManageMonitorItemProps) {
  const [newTag, setNewTag] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(customName);
  const [editingFormula, setEditingFormula] = useState(false);
  const [formulaInput, setFormulaInput] = useState(formula);

  useEffect(() => {
    setNameInput(customName);
  }, [customName]);

  useEffect(() => {
    setFormulaInput(formula);
  }, [formula]);

  const handleAddTag = () => {
    if (newTag.trim()) {
      onAddTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleSaveName = () => {
    onUpdateName(nameInput);
    setEditingName(false);
  };

  const handleSaveFormula = () => {
    onUpdateFormula(formulaInput);
    setEditingFormula(false);
  };

  const displayName = customName || monitor.monitor_name || monitor.monitor_id;

  return (
    <div className={`manage-item ${isHidden ? 'hidden' : ''}`}>
      <div className="manage-item-header">
        <div style={{ flex: 1 }}>
          {editingName ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveName();
                  }
                }}
                placeholder="Enter custom name"
                className="tag-input"
                style={{ width: '200px' }}
                autoFocus
              />
              <button className="btn-icon" onClick={handleSaveName} title="Save">
                ✓
              </button>
              <button className="btn-icon" onClick={() => { setEditingName(false); setNameInput(customName); }} title="Cancel">
                ✕
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <strong>{displayName}</strong>
              <button
                className="btn-icon"
                onClick={() => setEditingName(true)}
                title="Edit name"
                style={{ fontSize: '12px', padding: '2px 6px' }}
              >
                <Pencil size={12} />
              </button>
            </div>
          )}
          <div style={{ fontSize: '12px', color: 'var(--muted-foreground)', marginTop: '4px' }}>
            {formatValue(monitor.latest_value, monitor.unit)}
          </div>
          {!customName && monitor.monitor_name && (
            <div style={{ fontSize: '11px', color: 'var(--muted-foreground)', marginTop: '2px' }}>
              Original: {monitor.monitor_name}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            className="btn-icon"
            onClick={onToggleHide}
            title={isHidden ? 'Show' : 'Hide'}
          >
            {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
          <button
            className="btn-icon btn-danger"
            onClick={onDelete}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="manage-item-tags">
        {tags.map(tag => (
          <span key={tag} className="manage-tag">
            {tag}
            <button
              onClick={() => onRemoveTag(tag)}
              style={{ marginLeft: '4px', cursor: 'pointer', background: 'none', border: 'none', color: 'inherit' }}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          placeholder="Add tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleAddTag();
            }
          }}
          className="tag-input"
        />
      </div>

      <div className="manage-item-formula" style={{ marginTop: '8px', fontSize: '12px' }}>
        {editingFormula ? (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>Formula:</span>
            <input
              type="text"
              value={formulaInput}
              onChange={(e) => setFormulaInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSaveFormula();
                }
              }}
              placeholder="e.g. x * 365"
              className="tag-input"
              style={{ width: '150px' }}
              autoFocus
            />
            <button className="btn-icon" onClick={handleSaveFormula} title="Save">
              ✓
            </button>
            <button className="btn-icon" onClick={() => { setEditingFormula(false); setFormulaInput(formula); }} title="Cancel">
              ✕
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: 'var(--muted-foreground)' }}>
              Formula: {formula || 'none'}
            </span>
            <button
              className="btn-icon"
              onClick={() => setEditingFormula(true)}
              title="Edit formula"
              style={{ fontSize: '12px', padding: '2px 6px' }}
            >
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
import React, { useState } from 'react';
import { X, Calendar, AlignLeft, Paperclip, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export default function TaskModal({ task, onClose, onUpdate }) {
  const [text, setText] = useState(task.text);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');
  const [attachments, setAttachments] = useState(task.attachments || []);

  const handleSave = () => {
    let finalSubtasks = [...subtasks];
    // Automatically add any subtask they typed but forgot to press 'Add' on
    if (newSubtask.trim()) {
      finalSubtasks.push({ id: Date.now().toString(), text: newSubtask.trim(), completed: false });
    }
    
    onUpdate({
      ...task,
      text,
      description,
      dueDate,
      subtasks: finalSubtasks,
      attachments
    });
    onClose();
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!newSubtask.trim()) return;
    setSubtasks([...subtasks, { id: Date.now().toString(), text: newSubtask.trim(), completed: false }]);
    setNewSubtask('');
  };

  const toggleSubtask = (id) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const updateSubtaskText = (id, newText) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, text: newText } : s));
  };

  const removeSubtask = (id) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleFileAttach = (e) => {
    // Simulated file attachment for MVP (just saves file name)
    const file = e.target.files[0];
    if (file) {
      setAttachments([...attachments, { id: Date.now().toString(), name: file.name }]);
    }
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={headerStyle}>
          <input 
            type="text" 
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={{...titleInputStyle, border: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}
            placeholder="Task title"
          />
          <button onClick={onClose} style={closeButtonStyle}><X size={24} /></button>
        </div>

        <div style={contentLayout}>
          <div style={mainColumn}>
            {/* Description */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}><AlignLeft size={18} /> Description</div>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a more detailed description..."
                style={textareaStyle}
                rows={4}
              />
            </div>

            {/* Subtasks */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}><CheckSquare size={18} /> Subtasks</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                {subtasks.map(sub => (
                  <div key={sub.id} style={subtaskStyle}>
                    <input 
                      type="checkbox" 
                      checked={sub.completed}
                      onChange={() => toggleSubtask(sub.id)}
                      style={{ cursor: 'pointer' }}
                    />
                    <input 
                      type="text"
                      value={sub.text}
                      onChange={(e) => updateSubtaskText(sub.id, e.target.value)}
                      style={{ 
                        flex: 1, 
                        background: 'transparent', 
                        border: 'none', 
                        color: 'inherit', 
                        outline: 'none',
                        textDecoration: sub.completed ? 'line-through' : 'none', 
                        opacity: sub.completed ? 0.6 : 1,
                        fontSize: '0.875rem'
                      }}
                    />
                    <button onClick={() => removeSubtask(sub.id)} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddSubtask} style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="text" 
                  value={newSubtask}
                  onChange={(e) => setNewSubtask(e.target.value)}
                  placeholder="Add an item"
                  style={inputStyle}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem' }}>Add</button>
              </form>
            </div>

            {/* Attachments */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}><Paperclip size={18} /> Attachments</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                {attachments.map(att => (
                  <div key={att.id} style={attachmentStyle}>
                    {att.name}
                  </div>
                ))}
              </div>
              <label className="btn btn-secondary" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                <input type="file" style={{ display: 'none' }} onChange={handleFileAttach} />
                Attach File
              </label>
            </div>
          </div>

          <div style={sideColumn}>
            {/* Due Date */}
            <div style={sectionStyle}>
              <div style={sectionHeaderStyle}><Calendar size={18} /> Due Date</div>
              <DatePicker 
                selected={dueDate ? new Date(dueDate) : null}
                onChange={(date) => setDueDate(date ? date.toISOString() : '')}
                customInput={<input style={{...inputStyle, width: '100%'}} />}
                dateFormat="MMMM d, yyyy"
                isClearable
                placeholderText="Select a due date"
              />
            </div>

            <div style={{ marginTop: 'auto' }}>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleSave}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Styles
const overlayStyle = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000,
  padding: '2rem'
};

const modalStyle = {
  backgroundColor: 'var(--color-bg-card)',
  borderRadius: 'var(--radius-lg)',
  width: '100%',
  maxWidth: '800px',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  boxShadow: 'var(--shadow-lg)',
  overflow: 'hidden'
};

const headerStyle = {
  padding: '1.5rem 2rem',
  borderBottom: '1px solid var(--color-border)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '1rem'
};

const titleInputStyle = {
  fontSize: '1.5rem',
  fontWeight: 700,
  color: 'var(--color-text-primary)',
  background: 'transparent',
  border: '1px solid transparent',
  padding: '0.5rem',
  flex: 1,
  outline: 'none',
  borderRadius: 'var(--radius-sm)',
  transition: 'border-color 0.2s'
};

const closeButtonStyle = {
  color: 'var(--color-text-muted)',
  background: 'none',
  border: 'none',
  cursor: 'pointer'
};

const contentLayout = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden'
};

const mainColumn = {
  flex: 1,
  padding: '2rem',
  overflowY: 'auto',
  borderRight: '1px solid var(--color-border)'
};

const sideColumn = {
  width: '250px',
  padding: '2rem',
  backgroundColor: 'var(--color-bg-elevated)',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.5rem'
};

const sectionStyle = {
  marginBottom: '2rem'
};

const sectionHeaderStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  fontSize: '1.1rem',
  fontWeight: 600,
  marginBottom: '1rem',
  color: 'var(--color-text-primary)'
};

const textareaStyle = {
  width: '100%',
  backgroundColor: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-md)',
  padding: '1rem',
  color: 'var(--color-text-primary)',
  resize: 'vertical',
  outline: 'none'
};

const inputStyle = {
  flex: 1,
  backgroundColor: 'var(--color-bg-secondary)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-sm)',
  padding: '0.75rem 1rem',
  color: 'var(--color-text-primary)',
  outline: 'none'
};

const subtaskStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem',
  backgroundColor: 'var(--color-bg-secondary)',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)'
};

const attachmentStyle = {
  padding: '0.5rem 1rem',
  backgroundColor: 'var(--color-bg-secondary)',
  borderRadius: 'var(--radius-full)',
  fontSize: '0.875rem',
  color: 'var(--color-text-secondary)',
  border: '1px solid var(--color-border)'
};

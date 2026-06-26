import React, { useState } from 'react';
import { Plus, MoreHorizontal } from 'lucide-react';

export default function ProjectBoard({ project, tasks, onUpdateTask, onAddTask, onOpenTask }) {
  const [newTaskText, setNewTaskText] = useState('');
  const [addingToCol, setAddingToCol] = useState(null);

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];

  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    const task = tasks.find(t => t.id === taskId);
    if (task && task.status !== columnId) {
      onUpdateTask({ ...task, status: columnId, completed: columnId === 'done' });
    }
  };

  const handleQuickAdd = (e, columnId) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask({
      id: Date.now().toString(),
      text: newTaskText.trim(),
      projectId: project.id,
      status: columnId,
      completed: columnId === 'done',
      createdAt: new Date().toISOString()
    });
    setNewTaskText('');
    setAddingToCol(null);
  };

  return (
    <div style={boardContainerStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: project.color || 'var(--color-accent)' }}></div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{project.name}</h1>
        </div>
      </header>

      <div style={columnsContainerStyle}>
        {columns.map(col => {
          const colTasks = tasks.filter(t => (t.status || 'todo') === col.id);
          
          return (
            <div 
              key={col.id} 
              style={columnStyle}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              <div style={columnHeaderStyle}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{col.title} <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>{colTasks.length}</span></h3>
                <button style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)' }}><MoreHorizontal size={18} /></button>
              </div>

              <div style={taskContainerStyle}>
                {colTasks.map(task => (
                  <div 
                    key={task.id} 
                    style={taskCardStyle}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onOpenTask(task)}
                  >
                    <div style={{ fontWeight: 500, marginBottom: '0.5rem' }}>{task.text}</div>
                    {task.dueDate && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    {task.subtasks?.length > 0 && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {addingToCol === col.id ? (
                <form onSubmit={(e) => handleQuickAdd(e, col.id)} style={{ padding: '0.5rem' }}>
                  <input
                    type="text"
                    autoFocus
                    value={newTaskText}
                    onChange={e => setNewTaskText(e.target.value)}
                    placeholder="What needs to be done?"
                    style={inputStyle}
                    onBlur={() => setAddingToCol(null)}
                  />
                </form>
              ) : (
                <button 
                  style={addCardBtnStyle} 
                  onClick={() => { setAddingToCol(col.id); setNewTaskText(''); }}
                >
                  <Plus size={16} /> Add a card
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const boardContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
  width: '100%',
  overflow: 'hidden'
};

const headerStyle = {
  paddingBottom: '2rem',
  marginBottom: '1rem'
};

const columnsContainerStyle = {
  display: 'flex',
  gap: '1.5rem',
  flex: 1,
  overflowX: 'auto',
  paddingBottom: '1rem'
};

const columnStyle = {
  width: '320px',
  minWidth: '320px',
  backgroundColor: 'var(--color-bg-card)',
  borderRadius: 'var(--radius-md)',
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '100%',
  border: '1px solid var(--color-border)'
};

const columnHeaderStyle = {
  padding: '1rem 1.25rem',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid var(--color-border)'
};

const taskContainerStyle = {
  padding: '1rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.75rem',
  overflowY: 'auto',
  flex: 1
};

const taskCardStyle = {
  backgroundColor: 'var(--color-bg-elevated)',
  padding: '1rem',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--color-border)',
  cursor: 'grab',
  transition: 'border-color 0.2s, transform 0.2s'
};

const addCardBtnStyle = {
  padding: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  color: 'var(--color-text-secondary)',
  backgroundColor: 'transparent',
  border: 'none',
  borderTop: '1px solid var(--color-border)',
  cursor: 'pointer',
  fontWeight: 500
};

const inputStyle = {
  width: '100%',
  padding: '0.75rem',
  backgroundColor: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-accent)',
  borderRadius: 'var(--radius-sm)',
  color: 'white',
  outline: 'none'
};

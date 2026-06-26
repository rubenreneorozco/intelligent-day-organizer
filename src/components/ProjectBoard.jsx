import React, { useState } from 'react';
import { Plus, MoreHorizontal, Trash2, CornerDownRight, ChevronDown, ChevronRight, CheckCircle2, Circle } from 'lucide-react';

export default function ProjectBoard({ project, tasks, onUpdateTask, onAddTask, onOpenTask, onDeleteTask, onDeleteProject, onUpdateProject }) {
  const [newTaskText, setNewTaskText] = useState('');
  const [addingToCol, setAddingToCol] = useState(null);
  const [expandedTasks, setExpandedTasks] = useState(new Set());

  const columns = [
    { id: 'todo', title: 'To Do' },
    { id: 'in-progress', title: 'In Progress' },
    { id: 'done', title: 'Done' }
  ];
  
  const projectColors = ['#E63946', '#3A86FF', '#06D6A0', '#FFD166', '#8338EC'];

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

  const toggleExpand = (e, taskId) => {
    e.stopPropagation();
    const next = new Set(expandedTasks);
    if (next.has(taskId)) {
      next.delete(taskId);
    } else {
      next.add(taskId);
    }
    setExpandedTasks(next);
  };

  const toggleSubtask = (e, task, subtaskId) => {
    e.stopPropagation();
    const updatedSubtasks = task.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
    onUpdateTask({ ...task, subtasks: updatedSubtasks });
  };

  return (
    <div style={boardContainerStyle}>
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: 'var(--color-bg-elevated)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-full)' }}>
              {projectColors.map(color => (
                <div 
                  key={color}
                  onClick={() => onUpdateProject({ ...project, color })}
                  style={{
                    width: project.color === color ? '16px' : '10px', 
                    height: project.color === color ? '16px' : '10px', 
                    borderRadius: '50%', 
                    backgroundColor: color, 
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: project.color === color ? 1 : 0.5
                  }}
                  title="Change Color"
                />
              ))}
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>{project.name}</h1>
          </div>
          <button 
            className="btn btn-secondary" 
            style={{ color: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this project and all its tasks?')) {
                onDeleteProject(project.id);
              }
            }}
          >
            <Trash2 size={18} style={{ marginRight: '0.5rem' }} /> Delete Project
          </button>
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
                {colTasks.map(task => {
                  const isExpanded = expandedTasks.has(task.id);
                  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
                  
                  return (
                  <div 
                    key={task.id} 
                    style={taskCardStyle}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => onOpenTask(task)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontWeight: 500, marginBottom: '0.5rem', flex: 1 }}>{task.text}</div>
                      <button 
                        style={deleteTaskBtnStyle}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteTask(task.id);
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    {task.dueDate && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600 }}>
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </div>
                    )}
                    
                    {hasSubtasks && (
                      <div 
                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.5rem', cursor: 'pointer' }}
                        onClick={(e) => toggleExpand(e, task.id)}
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        {task.subtasks.filter(s => s.completed).length}/{task.subtasks.length} subtasks
                      </div>
                    )}

                    {isExpanded && hasSubtasks && (
                      <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                        {task.subtasks.map(sub => (
                          <div 
                            key={sub.id} 
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: sub.completed ? 'var(--color-text-muted)' : 'var(--color-text-primary)' }}
                            onClick={(e) => toggleSubtask(e, task, sub.id)}
                          >
                            <CornerDownRight size={14} color="var(--color-text-muted)" />
                            {sub.completed ? <CheckCircle2 size={14} color="var(--color-accent)" /> : <Circle size={14} color="var(--color-text-muted)" />}
                            <span style={{ textDecoration: sub.completed ? 'line-through' : 'none', padding: '0.25rem 0' }}>{sub.text}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )})}
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

const deleteTaskBtnStyle = {
  background: 'none',
  border: 'none',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  padding: '0.25rem',
  marginLeft: '0.5rem',
  borderRadius: '4px',
  display: 'flex'
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
  color: 'var(--color-text-primary)',
  outline: 'none'
};

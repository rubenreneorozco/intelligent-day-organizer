import React, { useState } from 'react';
import { Plus, CheckCircle2, Trash2, CalendarDays, Sparkles } from 'lucide-react';
import { generateAgentInsights } from '../services/agentService';
import { isToday, isPast, parseISO } from 'date-fns';

export default function MyDay({ tasks, onUpdateTask, onAddTask, onDeleteTask, onOpenTask }) {
  const [newTaskText, setNewTaskText] = useState('');
  const [agentResponse, setAgentResponse] = useState(null);
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask({
      id: Date.now().toString(),
      text: newTaskText.trim(),
      status: 'todo',
      completed: false,
      projectId: null // Belongs to My Day only
    });
    setNewTaskText('');
  };

  const askAgentToOrganize = async () => {
    setIsAgentLoading(true);
    try {
      const response = await generateAgentInsights(tasks);
      setAgentResponse(response);
    } catch (error) {
      console.error(error);
      setAgentResponse("Sorry, I ran into an issue connecting to my intelligence systems. Please make sure your Gemini API key is configured.");
    } finally {
      setIsAgentLoading(false);
    }
  };

  // Agent automatically pulls in project tasks if they are due today or overdue
  const isDueTodayOrPast = (task) => {
    if (!task.dueDate) return false;
    const date = parseISO(task.dueDate);
    return isToday(date) || isPast(date);
  };

  const myDayTasks = tasks.filter(t => !t.projectId || isDueTodayOrPast(t));
  const activeTasks = myDayTasks.filter(t => !t.completed);
  const completedTasks = myDayTasks.filter(t => t.completed);

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <main style={{ flex: 1, padding: '2rem 4rem', overflowY: 'auto' }}>
        <header className="app-header">
          <div>
            <h1 className="app-title">My Day</h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
              Focus on what matters today.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-muted)' }}>
            <CalendarDays size={20} />
            <span style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
          </div>
        </header>

        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
          <form onSubmit={handleAddTask} className="task-input-container">
            <input 
              type="text" 
              className="task-input" 
              placeholder="What needs to get done today?" 
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>
              <Plus size={20} /> Add
            </button>
          </form>

          {activeTasks.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Tasks ({activeTasks.length})
              </h2>
              <div className="task-list">
                {activeTasks.map(task => (
                  <div key={task.id} className="task-item" onClick={() => onOpenTask(task)}>
                    <div 
                      className="task-checkbox"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTask({ ...task, completed: true, status: 'done' });
                      }}
                    ></div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <span className="task-text">{task.text}</span>
                      {task.projectId && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-accent)' }}>Pulled from Project • Due Soon</span>
                      )}
                    </div>
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => onDeleteTask(task.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {completedTasks.length > 0 && (
            <div>
              <h2 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Completed ({completedTasks.length})
              </h2>
              <div className="task-list">
                {completedTasks.map(task => (
                  <div key={task.id} className="task-item completed" onClick={() => onOpenTask(task)}>
                    <div 
                      className="task-checkbox" 
                      style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateTask({ ...task, completed: false, status: 'todo' });
                      }}
                    >
                      <CheckCircle2 size={16} color="white" style={{ position: 'absolute' }} />
                    </div>
                    <span className="task-text">{task.text}</span>
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => onDeleteTask(task.id)}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Intelligence Sidebar */}
      <aside className="agent-sidebar">
        <div className="agent-header">
          <Sparkles className="agent-icon" size={24} />
          <h2 className="agent-title">Intelligence</h2>
        </div>
        
        <div className="agent-content">
          <div className="agent-message">
            Hi, I'm your Token. intelligence agent. I automatically pull in tasks from your projects that are due soon, and I can structure your day efficiently.
          </div>
          
          {agentResponse && (
            <div className="agent-message highlight">
              <div style={{ whiteSpace: 'pre-wrap' }}>{agentResponse}</div>
            </div>
          )}
        </div>
        
        <div className="agent-footer">
          <button 
            className="btn btn-primary" 
            style={{ width: '100%' }}
            onClick={askAgentToOrganize}
            disabled={isAgentLoading}
          >
            {isAgentLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="loading-spinner"></span> Analyzing...
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} />
                Organize My Day
              </div>
            )}
          </button>
        </div>
      </aside>
    </div>
  );
}

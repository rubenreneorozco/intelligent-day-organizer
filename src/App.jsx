import { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Circle, Trash2, CalendarDays, Sparkles } from 'lucide-react';
import { generateAgentInsights } from './services/agentService';
import './index.css';

function App() {
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('dayOrganizer_tasks');
    return saved ? JSON.parse(saved) : [
      { id: '1', text: 'Email Martha and Erika', completed: false, category: 'Communication', estimatedMinutes: 15 },
      { id: '2', text: 'Nebraska Project - 2.5 hours', completed: false, category: 'Deep Work', estimatedMinutes: 150 },
      { id: '3', text: 'Family time (e.g., walk, play, gym, shower)', completed: true, category: 'Personal', estimatedMinutes: 60 }
    ];
  });
  const [newTaskText, setNewTaskText] = useState('');
  const [agentResponse, setAgentResponse] = useState(null);
  const [isAgentLoading, setIsAgentLoading] = useState(false);

  useEffect(() => {
    localStorage.setItem('dayOrganizer_tasks', JSON.stringify(tasks));
  }, [tasks]);

  const handleAddTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    
    const newTask = {
      id: Date.now().toString(),
      text: newTaskText.trim(),
      completed: false,
      category: 'Uncategorized',
      estimatedMinutes: null
    };
    
    setTasks([newTask, ...tasks]);
    setNewTaskText('');
  };

  const toggleTask = (id) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id) => {
    setTasks(tasks.filter(t => t.id !== id));
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

  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="app-container">
      {/* Main Task List Area */}
      <main className="main-content">
        <header className="app-header">
          <div>
            <h1 className="app-title">
              Token<span className="app-title-dot">.</span>
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', marginTop: '0.5rem', fontWeight: 500 }}>
              Intelligent Day Organizer
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
              placeholder="What needs to get done?" 
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 2rem' }}>
              <Plus size={20} />
              Add Task
            </button>
          </form>

          {activeTasks.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Active Tasks ({activeTasks.length})
              </h2>
              <div className="task-list">
                {activeTasks.map(task => (
                  <div key={task.id} className="task-item" onClick={() => toggleTask(task.id)}>
                    <div className="task-checkbox"></div>
                    <span className="task-text">{task.text}</span>
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => deleteTask(task.id)}>
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
                  <div key={task.id} className="task-item completed" onClick={() => toggleTask(task.id)}>
                    <div className="task-checkbox" style={{ background: 'var(--color-accent)', borderColor: 'var(--color-accent)' }}>
                      <CheckCircle2 size={16} color="white" style={{ position: 'absolute' }} />
                    </div>
                    <span className="task-text">{task.text}</span>
                    <div className="task-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="btn-icon" onClick={() => deleteTask(task.id)}>
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
            Hi, I'm your Token. intelligence agent. I can analyze your tasks to help you structure your day efficiently.
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

export default App;

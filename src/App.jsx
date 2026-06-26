import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Plus, FolderKanban, CalendarDays } from 'lucide-react';
import MyDay from './components/MyDay';
import ProjectBoard from './components/ProjectBoard';
import TaskModal from './components/TaskModal';
import CalendarView from './components/CalendarView';
import './index.css';

function App() {
  // State
  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('dayOrganizer_tasks');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('dayOrganizer_projects');
    return saved ? JSON.parse(saved) : [
      { id: 'proj-1', name: 'Nebraska Implementation', color: '#E63946' },
      { id: 'proj-2', name: 'Token. Dashboard V2', color: '#3A86FF' }
    ];
  });

  const [currentView, setCurrentView] = useState('my-day'); // 'my-day' | 'calendar' | projectId
  const [activeTask, setActiveTask] = useState(null);
  
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#E63946');

  // Persist
  useEffect(() => {
    localStorage.setItem('dayOrganizer_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('dayOrganizer_projects', JSON.stringify(projects));
  }, [projects]);

  // Handlers
  const handleAddTask = (newTask) => {
    setTasks([newTask, ...tasks]);
  };

  const handleUpdateTask = (updatedTask) => {
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (activeTask && activeTask.id === updatedTask.id) {
      setActiveTask(updatedTask);
    }
  };

  const handleDeleteTask = (taskId) => {
    setTasks(tasks.filter(t => t.id !== taskId));
    if (activeTask && activeTask.id === taskId) {
      setActiveTask(null);
    }
  };

  const handleAddProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    const newProj = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      color: newProjectColor
    };
    setProjects([...projects, newProj]);
    setNewProjectName('');
    setNewProjectColor('#E63946');
    setIsAddingProject(false);
    setCurrentView(newProj.id);
  };

  const handleUpdateProject = (updatedProject) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const handleDeleteProject = (projectId) => {
    // Delete the project
    setProjects(projects.filter(p => p.id !== projectId));
    // Also delete all tasks associated with this project
    setTasks(tasks.filter(t => t.projectId !== projectId));
    // Go back to My Day view
    setCurrentView('my-day');
  };

  return (
    <div className="app-container">
      {/* App Sidebar */}
      <nav style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Token<span style={{ color: 'var(--color-accent)' }}>.</span></h1>
        </div>

        <div style={sidebarNavStyle}>
          <div 
            style={currentView === 'my-day' ? activeNavItemStyle : navItemStyle}
            onClick={() => setCurrentView('my-day')}
          >
            <LayoutDashboard size={20} /> My Day
          </div>
          
          <div 
            style={currentView === 'calendar' ? activeNavItemStyle : navItemStyle}
            onClick={() => setCurrentView('calendar')}
          >
            <CalendarDays size={20} /> Calendar
          </div>

          <div style={sidebarSectionTitle}>Projects</div>
          
          {projects.map(p => (
            <div 
              key={p.id}
              style={currentView === p.id ? activeNavItemStyle : navItemStyle}
              onClick={() => setCurrentView(p.id)}
            >
              <FolderKanban size={18} style={{ color: p.color }} /> {p.name}
            </div>
          ))}

          {isAddingProject ? (
            <form onSubmit={handleAddProject} style={{ padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input 
                autoFocus
                type="text" 
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                placeholder="Project name..."
                style={navInputStyle}
              />
              <div style={{ display: 'flex', gap: '0.5rem', padding: '0.25rem 0' }}>
                {['#E63946', '#3A86FF', '#06D6A0', '#FFD166', '#8338EC'].map(color => (
                  <div 
                    key={color}
                    onClick={() => setNewProjectColor(color)}
                    style={{
                      width: '20px', height: '20px', borderRadius: '50%', backgroundColor: color, cursor: 'pointer',
                      border: newProjectColor === color ? '2px solid white' : '2px solid transparent'
                    }}
                  />
                ))}
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', flex: 1, fontSize: '0.75rem' }}>Save</button>
                <button type="button" onClick={() => setIsAddingProject(false)} style={{ padding: '0.25rem 0.5rem', flex: 1, fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'white', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          ) : (
            <button style={addProjectBtnStyle} onClick={() => setIsAddingProject(true)}>
              <Plus size={18} /> New Project
            </button>
          )}
        </div>
      </nav>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {currentView === 'my-day' ? (
          <MyDay 
            tasks={tasks}
            onUpdateTask={handleUpdateTask}
            onAddTask={handleAddTask}
            onDeleteTask={handleDeleteTask}
            onOpenTask={setActiveTask}
          />
        ) : currentView === 'calendar' ? (
          <CalendarView 
            tasks={tasks}
            projects={projects}
            onOpenTask={setActiveTask}
          />
        ) : (
          <div style={{ flex: 1, padding: '2rem 4rem', overflow: 'hidden' }}>
            <ProjectBoard 
              project={projects.find(p => p.id === currentView)}
              tasks={tasks.filter(t => t.projectId === currentView)}
              onUpdateTask={handleUpdateTask}
              onAddTask={handleAddTask}
              onOpenTask={setActiveTask}
              onDeleteTask={handleDeleteTask}
              onDeleteProject={handleDeleteProject}
              onUpdateProject={handleUpdateProject}
            />
          </div>
        )}
      </div>

      {/* Modals */}
      {activeTask && (
        <TaskModal 
          task={activeTask}
          onClose={() => setActiveTask(null)}
          onUpdate={handleUpdateTask}
        />
      )}
    </div>
  );
}

export default App;

// Styles for sidebar
const sidebarStyle = {
  width: '260px',
  backgroundColor: 'var(--color-bg-card)',
  borderRight: '1px solid var(--color-border)',
  display: 'flex',
  flexDirection: 'column'
};

const sidebarHeaderStyle = {
  padding: '1.5rem',
  borderBottom: '1px solid var(--color-border)'
};

const sidebarNavStyle = {
  padding: '1rem 0',
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  overflowY: 'auto'
};

const navItemStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.75rem 1.5rem',
  color: 'var(--color-text-secondary)',
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
  fontWeight: 500,
  fontSize: '0.9375rem'
};

const activeNavItemStyle = {
  ...navItemStyle,
  color: 'var(--color-text-primary)',
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRight: '3px solid var(--color-accent)'
};

const sidebarSectionTitle = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--color-text-muted)',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  padding: '1.5rem 1.5rem 0.5rem 1.5rem'
};

const addProjectBtnStyle = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  padding: '0.75rem 1.5rem',
  color: 'var(--color-text-muted)',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  width: '100%',
  textAlign: 'left',
  fontWeight: 500
};

const navInputStyle = {
  width: '100%',
  backgroundColor: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-accent)',
  borderRadius: '4px',
  padding: '0.5rem',
  color: 'white',
  outline: 'none',
  fontSize: '0.875rem'
};

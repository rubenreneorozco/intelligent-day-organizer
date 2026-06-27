import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Calendar, Plus, FolderKanban, CalendarDays, LogOut } from 'lucide-react';
import MyDay from './components/MyDay';
import ProjectBoard from './components/ProjectBoard';
import TaskModal from './components/TaskModal';
import CalendarView from './components/CalendarView';
import Auth from './components/Auth';
import { supabase } from './lib/supabase';
import './index.css';

function App() {
  // Session & Data State
  const [session, setSession] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [currentView, setCurrentView] = useState('my-day'); // 'my-day' | 'calendar' | projectId
  const [activeTask, setActiveTask] = useState(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#E63946');
  const [draggedProjIdx, setDraggedProjIdx] = useState(null);

  // 1. Auth Init
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 2. Fetch Data on Session
  useEffect(() => {
    if (session) {
      fetchData();
    } else {
      setTasks([]);
      setProjects([]);
      setLoading(false);
    }
  }, [session]);

  const fetchData = async () => {
    setLoading(true);
    const [projRes, taskRes] = await Promise.all([
      supabase.from('projects').select('*').order('order_index', { ascending: true }),
      supabase.from('tasks').select('*').order('order_index', { ascending: true })
    ]);

    if (projRes.data) setProjects(projRes.data);
    
    // Map DB columns to our frontend camelCase state
    if (taskRes.data) {
      setTasks(taskRes.data.map(t => ({
        id: t.id,
        projectId: t.project_id,
        text: t.text,
        description: t.description,
        status: t.status,
        completed: t.completed,
        dueDate: t.due_date,
        subtasks: t.subtasks,
        attachments: t.attachments,
        orderIndex: t.order_index,
        createdAt: t.created_at
      })));
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // Handlers
  const handleAddTask = async (newTask) => {
    // Optimistic UI
    const finalTask = { ...newTask, orderIndex: tasks.length };
    setTasks([...tasks, finalTask]);
    
    // DB
    await supabase.from('tasks').insert({
      id: finalTask.id,
      user_id: session.user.id,
      project_id: finalTask.projectId,
      text: finalTask.text,
      status: finalTask.status,
      completed: finalTask.completed,
      due_date: finalTask.dueDate || null,
      subtasks: finalTask.subtasks || [],
      attachments: finalTask.attachments || [],
      order_index: finalTask.orderIndex
    });
  };

  const handleUpdateTask = async (updatedTask) => {
    // Optimistic UI
    setTasks(tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
    if (activeTask && activeTask.id === updatedTask.id) {
      setActiveTask(updatedTask);
    }

    // DB
    await supabase.from('tasks').update({
      text: updatedTask.text,
      description: updatedTask.description,
      status: updatedTask.status,
      completed: updatedTask.completed,
      due_date: updatedTask.dueDate || null,
      subtasks: updatedTask.subtasks || [],
      attachments: updatedTask.attachments || []
    }).eq('id', updatedTask.id);
  };

  const handleDeleteTask = async (taskId) => {
    // Optimistic
    setTasks(tasks.filter(t => t.id !== taskId));
    if (activeTask && activeTask.id === taskId) {
      setActiveTask(null);
    }

    // DB
    await supabase.from('tasks').delete().eq('id', taskId);
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    const newProj = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      color: newProjectColor,
      order_index: projects.length
    };

    // Optimistic
    setProjects([...projects, newProj]);
    setNewProjectName('');
    setNewProjectColor('#E63946');
    setIsAddingProject(false);
    setCurrentView(newProj.id);

    // DB
    await supabase.from('projects').insert({
      id: newProj.id,
      user_id: session.user.id,
      name: newProj.name,
      color: newProj.color,
      order_index: newProj.order_index
    });
  };

  const handleUpdateProject = async (updatedProject) => {
    // Optimistic
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    
    // DB
    await supabase.from('projects').update({ color: updatedProject.color }).eq('id', updatedProject.id);
  };

  const handleDeleteProject = async (projectId) => {
    // Optimistic
    setProjects(projects.filter(p => p.id !== projectId));
    setTasks(tasks.filter(t => t.projectId !== projectId));
    setCurrentView('my-day');

    // DB (Cascade will handle tasks in DB if configured, but safe to delete directly if not)
    await supabase.from('projects').delete().eq('id', projectId);
  };

  const handleReorderProjects = async (dragIndex, dropIndex) => {
    if (dragIndex === dropIndex) return;
    const newProjects = [...projects];
    const [draggedItem] = newProjects.splice(dragIndex, 1);
    newProjects.splice(dropIndex, 0, draggedItem);
    
    const reordered = newProjects.map((p, i) => ({ ...p, order_index: i }));
    setProjects(reordered);

    // Bulk update Supabase
    await supabase.from('projects').upsert(reordered.map(p => ({
      id: p.id,
      user_id: session.user.id,
      name: p.name,
      color: p.color,
      order_index: p.order_index
    })));
  };

  const handleReorderTasks = async (reorderedTasks) => {
    // reorderedTasks is the new subset array (e.g. active tasks from MyDay)
    const updatedTasks = reorderedTasks.map((t, i) => ({ ...t, orderIndex: i }));
    
    // Merge back into main tasks array
    const newTasks = tasks.map(t => {
      const found = updatedTasks.find(ut => ut.id === t.id);
      return found ? found : t;
    });
    
    // Sort all tasks by orderIndex
    newTasks.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    setTasks(newTasks);

    // Bulk update Supabase for ONLY the changed tasks
    await supabase.from('tasks').upsert(updatedTasks.map(t => ({
      id: t.id,
      user_id: session.user.id,
      project_id: t.projectId,
      text: t.text,
      status: t.status,
      completed: t.completed,
      due_date: t.dueDate || null,
      subtasks: t.subtasks || [],
      attachments: t.attachments || [],
      order_index: t.orderIndex
    })));
  };

  // Drag and drop handlers for projects sidebar
  const handleDragStartProj = (e, idx) => {
    setDraggedProjIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOverProj = (e) => {
    e.preventDefault();
  };

  const handleDropProj = (e, dropIdx) => {
    e.preventDefault();
    if (draggedProjIdx !== null) {
      handleReorderProjects(draggedProjIdx, dropIdx);
    }
    setDraggedProjIdx(null);
  };

  if (!session) {
    return <Auth />;
  }

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: 'var(--color-bg-main)', color: 'var(--color-text-primary)' }}>Loading your workspace...</div>;
  }

  return (
    <div className="app-container">
      {/* App Sidebar */}
      <nav style={sidebarStyle}>
        <div style={sidebarHeaderStyle}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Token<span style={{ color: 'var(--color-accent)' }}>.</span></span>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }} title="Logout">
              <LogOut size={16} />
            </button>
          </h1>
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
          
          {projects.map((p, idx) => (
            <div 
              key={p.id}
              draggable
              onDragStart={(e) => handleDragStartProj(e, idx)}
              onDragOver={handleDragOverProj}
              onDrop={(e) => handleDropProj(e, idx)}
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
                <button type="button" onClick={() => setIsAddingProject(false)} style={{ padding: '0.25rem 0.5rem', flex: 1, fontSize: '0.75rem', background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
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
            onReorderTasks={handleReorderTasks}
          />
        ) : currentView === 'calendar' ? (
          <CalendarView 
            tasks={tasks}
            projects={projects}
            onOpenTask={setActiveTask}
            onAddTask={handleAddTask}
          />
        ) : (
          <div className="main-content">
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
  padding: '2.5rem 2rem 2rem',
  borderBottom: '1px solid var(--color-border)',
  backgroundColor: '#0A0A0F',
  color: '#FFFFFF'
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
  color: 'var(--color-text-primary)',
  outline: 'none',
  fontSize: '0.875rem'
};

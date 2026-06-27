import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  parseISO 
} from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

export default function CalendarView({ tasks, projects, onOpenTask, onAddTask }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [addingTaskForDate, setAddingTaskForDate] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const getTasksForDay = (day) => {
    return tasks.filter(task => {
      if (!task.dueDate) return false;
      return isSameDay(parseISO(task.dueDate), day);
    });
  };

  const getProjectColor = (projectId) => {
    const proj = projects.find(p => p.id === projectId);
    return proj ? proj.color : 'var(--color-accent)';
  };

  const handleQuickAdd = (day) => {
    if (!newTaskText.trim()) {
      setAddingTaskForDate(null);
      return;
    }
    
    onAddTask({
      id: Date.now().toString(),
      text: newTaskText.trim(),
      projectId: null,
      status: 'todo',
      completed: false,
      dueDate: day.toISOString(),
      createdAt: new Date().toISOString()
    });
    setNewTaskText('');
    setAddingTaskForDate(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '2rem 4rem' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CalendarIcon size={32} color="var(--color-accent)" /> 
            Global Calendar
          </h1>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button style={navBtnStyle} onClick={prevMonth}><ChevronLeft size={24} /></button>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, minWidth: '180px', textAlign: 'center' }}>
            {format(currentDate, dateFormat)}
          </h2>
          <button style={navBtnStyle} onClick={nextMonth}><ChevronRight size={24} /></button>
        </div>
      </header>

      <div style={calendarGridStyle}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(dayName => (
          <div key={dayName} style={dayNameStyle}>{dayName}</div>
        ))}
        
        {days.map(day => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isAdding = addingTaskForDate === day.toISOString();

          return (
            <div 
              key={day.toString()} 
              style={{
                ...dayCellStyle,
                opacity: isCurrentMonth ? 1 : 0.4,
                backgroundColor: isToday ? 'rgba(230, 57, 70, 0.05)' : 'var(--color-bg-card)',
                border: isToday ? '1px solid var(--color-accent)' : '1px solid var(--color-border)'
              }}
              onClick={() => {
                setAddingTaskForDate(day.toISOString());
                setNewTaskText('');
              }}
            >
              <div style={dateNumberStyle(isToday)}>{format(day, 'd')}</div>
              
              <div style={dayTasksContainerStyle}>
                {dayTasks.map(task => (
                  <div 
                    key={task.id}
                    style={{...calendarTaskStyle, borderLeftColor: getProjectColor(task.projectId)}}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTask(task);
                    }}
                  >
                    <div style={{ 
                      textDecoration: task.completed ? 'line-through' : 'none', 
                      opacity: task.completed ? 0.6 : 1,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {task.text}
                    </div>
                  </div>
                ))}

                {isAdding && (
                  <div style={{ marginTop: '0.25rem' }} onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      autoFocus
                      value={newTaskText}
                      onChange={e => setNewTaskText(e.target.value)}
                      placeholder="Add task..."
                      onBlur={() => handleQuickAdd(day)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleQuickAdd(day);
                        } else if (e.key === 'Escape') {
                          setAddingTaskForDate(null);
                        }
                      }}
                      style={{
                        width: '100%', padding: '0.25rem 0.5rem', fontSize: '0.75rem',
                        border: '1px solid var(--color-accent)', borderRadius: '4px', outline: 'none',
                        backgroundColor: 'var(--color-bg-elevated)', color: 'var(--color-text-primary)'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const navBtnStyle = {
  background: 'var(--color-bg-elevated)',
  border: '1px solid var(--color-border)',
  color: 'var(--color-text-primary)',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  cursor: 'pointer'
};

const calendarGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(7, 1fr)',
  gridAutoRows: 'minmax(120px, 1fr)',
  gap: '0.5rem',
  flex: 1,
  overflowY: 'auto',
  paddingBottom: '2rem'
};

const dayNameStyle = {
  textAlign: 'right',
  padding: '0.5rem',
  fontWeight: 600,
  color: 'var(--color-text-muted)',
  fontSize: '0.875rem'
};

const dayCellStyle = {
  borderRadius: 'var(--radius-md)',
  padding: '0.5rem',
  display: 'flex',
  flexDirection: 'column',
  transition: 'border-color 0.2s',
  cursor: 'pointer'
};

const dateNumberStyle = (isToday) => ({
  alignSelf: 'flex-end',
  fontWeight: isToday ? 800 : 500,
  color: isToday ? 'var(--color-accent)' : 'var(--color-text-secondary)',
  marginBottom: '0.5rem',
  fontSize: '0.875rem',
  width: '24px',
  height: '24px',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  borderRadius: '50%',
  backgroundColor: isToday ? 'var(--color-accent)' : 'transparent',
  color: isToday ? 'white' : 'var(--color-text-secondary)'
});

const dayTasksContainerStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.25rem',
  flex: 1,
  overflowY: 'auto'
};

const calendarTaskStyle = {
  backgroundColor: 'var(--color-bg-elevated)',
  fontSize: '0.75rem',
  padding: '0.4rem 0.5rem',
  borderRadius: '4px',
  borderLeft: '3px solid',
  cursor: 'pointer',
  fontWeight: 500,
  transition: 'opacity 0.2s, transform 0.1s',
};

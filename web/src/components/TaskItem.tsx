import React from 'react';
import { Task } from '../types';
import { CheckCircle2, Circle, Clock, Trash2, Edit3 } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleComplete, onEdit, onDelete }) => {
  const isCompleted = task.status === 'COMPLETED';

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '0.75rem',
        opacity: isCompleted ? 0.75 : 1
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.85rem', flex: 1 }}>
        <button
          onClick={() => onToggleComplete(task)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginTop: '2px',
            color: isCompleted ? 'var(--accent-emerald)' : 'var(--text-dim)'
          }}
          title={isCompleted ? 'Mark as Pending' : 'Mark as Completed'}
        >
          {isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
        </button>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.25rem' }}>
            <h4 style={{
              fontSize: '1rem',
              fontWeight: 600,
              textDecoration: isCompleted ? 'line-through' : 'none',
              color: isCompleted ? 'var(--text-muted)' : 'var(--text-main)'
            }}>
              {task.name}
            </h4>
            <span className={`badge badge-${task.priority}`}>{task.priority}</span>
            <span className={`badge badge-${task.status}`}>{task.status.replace('_', ' ')}</span>
          </div>

          {task.description && (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              {task.description}
            </p>
          )}

          {task.dueDate && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              <Clock size={12} />
              <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button onClick={() => onEdit(task)} className="btn btn-secondary btn-sm" title="Edit Task">
          <Edit3 size={14} />
        </button>
        <button onClick={() => onDelete(task.id)} className="btn btn-danger btn-sm" title="Delete Task">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};

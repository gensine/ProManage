import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Project, Task, ProjectStatus, TaskPriority, TaskStatus } from '../types';
import { TaskItem } from '../components/TaskItem';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { ArrowLeft, Edit3, Trash2, Plus, Search, Calendar, CheckSquare, AlertTriangle } from 'lucide-react';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('ALL');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('ALL');

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Edit Project Modal State
  const [isEditProjectOpen, setIsEditProjectOpen] = useState(false);
  const [projName, setProjName] = useState('');
  const [projDescription, setProjDescription] = useState('');
  const [projStatus, setProjStatus] = useState<ProjectStatus>('NOT_STARTED');
  const [projStartDate, setProjStartDate] = useState('');
  const [projEndDate, setProjEndDate] = useState('');

  // Delete Project Confirm Dialog State
  const [isDeleteProjectOpen, setIsDeleteProjectOpen] = useState(false);

  // Task Modal State (Create / Edit)
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('PENDING');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskFormError, setTaskFormError] = useState<string | null>(null);
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  const fetchProjectAndTasks = async () => {
    if (!id) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const projRes = await apiClient.get<Project>(`/projects/${id}`);
      setProject(projRes.data);

      // Populate edit project form defaults
      setProjName(projRes.data.name);
      setProjDescription(projRes.data.description || '');
      setProjStatus(projRes.data.status);
      setProjStartDate(projRes.data.startDate || '');
      setProjEndDate(projRes.data.endDate || '');

      let tasksUrl = `/tasks?projectId=${id}&search=${encodeURIComponent(taskSearch)}`;
      if (taskStatusFilter !== 'ALL') tasksUrl += `&status=${taskStatusFilter}`;
      if (taskPriorityFilter !== 'ALL') tasksUrl += `&priority=${taskPriorityFilter}`;

      const tasksRes = await apiClient.get<Task[]>(tasksUrl);
      setTasks(tasksRes.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setErrorMsg('Project not found or you do not have permission to view it');
      } else {
        setErrorMsg(err.response?.data?.error?.message || 'Failed to load project details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectAndTasks();
  }, [id, taskSearch, taskStatusFilter, taskPriorityFilter]);

  // Project Actions
  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    if (projStartDate && projEndDate && projEndDate < projStartDate) {
      setErrorMsg('End date must be greater than or equal to start date');
      return;
    }
    try {
      const res = await apiClient.put<Project>(`/projects/${id}`, {
        name: projName.trim(),
        description: projDescription.trim() || undefined,
        status: projStatus,
        startDate: projStartDate || undefined,
        endDate: projEndDate || undefined,
      });
      setProject(res.data);
      setIsEditProjectOpen(false);
      setToastMsg({ message: 'Project updated successfully!', type: 'success' });
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async () => {
    if (!id) return;
    try {
      await apiClient.delete(`/projects/${id}`);
      navigate('/projects');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to delete project');
      setIsDeleteProjectOpen(false);
    }
  };

  // Task Actions
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskName('');
    setTaskDescription('');
    setTaskPriority('MEDIUM');
    setTaskStatus('PENDING');
    setTaskDueDate('');
    setTaskFormError(null);
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (t: Task) => {
    setEditingTask(t);
    setTaskName(t.name);
    setTaskDescription(t.description || '');
    setTaskPriority(t.priority);
    setTaskStatus(t.status);
    setTaskDueDate(t.dueDate || '');
    setTaskFormError(null);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setTaskFormError(null);

    if (!taskName.trim()) {
      setTaskFormError('Task name is required');
      return;
    }

    setIsTaskSubmitting(true);
    try {
      if (editingTask) {
        // Update task
        await apiClient.put(`/tasks/${editingTask.id}`, {
          name: taskName.trim(),
          description: taskDescription.trim() || undefined,
          priority: taskPriority,
          status: taskStatus,
          dueDate: taskDueDate || undefined,
        });
        setToastMsg({ message: 'Task updated!', type: 'success' });
      } else {
        // Create task
        await apiClient.post('/tasks', {
          projectId: id,
          name: taskName.trim(),
          description: taskDescription.trim() || undefined,
          priority: taskPriority,
          status: taskStatus,
          dueDate: taskDueDate || undefined,
        });
        setToastMsg({ message: 'Task created!', type: 'success' });
      }

      setIsTaskModalOpen(false);
      fetchProjectAndTasks();
    } catch (err: any) {
      setTaskFormError(err.response?.data?.error?.message || 'Failed to save task');
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const handleToggleTaskComplete = async (t: Task) => {
    const newStatus: TaskStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await apiClient.put(`/tasks/${t.id}`, { status: newStatus });
      fetchProjectAndTasks();
    } catch (err: any) {
      setToastMsg({ message: 'Failed to update task status', type: 'error' });
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await apiClient.delete(`/tasks/${taskId}`);
      setToastMsg({ message: 'Task deleted', type: 'success' });
      fetchProjectAndTasks();
    } catch (err: any) {
      setToastMsg({ message: 'Failed to delete task', type: 'error' });
    }
  };

  if (isLoading && !project) {
    return (
      <div className="container page-container" style={{ padding: '4rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="container page-container">
        {errorMsg && <Toast message={errorMsg} onClose={() => setErrorMsg(null)} />}
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <AlertTriangle size={48} color="var(--accent-amber)" style={{ margin: '0 auto 1rem' }} />
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Project Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            This project might have been deleted or does not belong to your account.
          </p>
          <Link to="/projects" className="btn btn-primary">
            <ArrowLeft size={16} />
            <span>Back to Projects</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-container">
      {toastMsg && <Toast message={toastMsg.message} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
      {errorMsg && <Toast message={errorMsg} onClose={() => setErrorMsg(null)} />}

      {/* Back button */}
      <Link to="/projects" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
        <ArrowLeft size={16} />
        <span>Back to Projects</span>
      </Link>

      {/* Project Header Banner */}
      <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
              <h1 className="page-title" style={{ fontSize: '2rem' }}>{project.name}</h1>
              <span className={`badge badge-${project.status}`}>{project.status.replace('_', ' ')}</span>
            </div>
            {project.description && (
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '750px', lineHeight: '1.6' }}>
                {project.description}
              </p>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button onClick={() => setIsEditProjectOpen(true)} className="btn btn-secondary btn-sm">
              <Edit3 size={16} />
              <span>Edit Project</span>
            </button>
            <button onClick={() => setIsDeleteProjectOpen(true)} className="btn btn-danger btn-sm">
              <Trash2 size={16} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Calendar size={16} />
            <span>Dates: {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'N/A'} → {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'N/A'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <CheckSquare size={16} />
            <span>Tasks: {tasks.length}</span>
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Tasks</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Project task items, deadlines, and priorities</p>
        </div>

        <button onClick={handleOpenCreateTask} className="btn btn-primary">
          <Plus size={18} />
          <span>Add Task</span>
        </button>
      </div>

      {/* Task Filters */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search tasks..."
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
        </div>

        <select className="input-field" value={taskStatusFilter} onChange={(e) => setTaskStatusFilter(e.target.value)} style={{ width: '160px' }}>
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
        </select>

        <select className="input-field" value={taskPriorityFilter} onChange={(e) => setTaskPriorityFilter(e.target.value)} style={{ width: '160px' }}>
          <option value="ALL">All Priorities</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Task List */}
      {tasks.length === 0 ? (
        <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
          <CheckSquare size={48} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No tasks found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {taskSearch || taskStatusFilter !== 'ALL' || taskPriorityFilter !== 'ALL'
              ? 'No tasks matched your search or filters.'
              : 'Add tasks to organize your project workflow.'}
          </p>
          <button onClick={handleOpenCreateTask} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Task</span>
          </button>
        </div>
      ) : (
        <div>
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggleComplete={handleToggleTaskComplete}
              onEdit={handleOpenEditTask}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      {/* Edit Project Modal */}
      <Modal isOpen={isEditProjectOpen} onClose={() => setIsEditProjectOpen(false)} title="Edit Project Details">
        <form onSubmit={handleUpdateProject}>
          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input type="text" className="input-field" value={projName} onChange={(e) => setProjName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input-field" rows={3} value={projDescription} onChange={(e) => setProjDescription(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="input-field" value={projStatus} onChange={(e) => setProjStatus(e.target.value as ProjectStatus)}>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="input-field" value={projStartDate} onChange={(e) => setProjStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="input-field" value={projEndDate} onChange={(e) => setProjEndDate(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsEditProjectOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Changes</button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal isOpen={isDeleteProjectOpen} onClose={() => setIsDeleteProjectOpen(false)} title="Confirm Project Deletion">
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
          Are you sure you want to delete <strong>{project.name}</strong>? This action will permanently remove the project and all of its associated tasks.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button onClick={() => setIsDeleteProjectOpen(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleDeleteProject} className="btn btn-danger">Delete Project</button>
        </div>
      </Modal>

      {/* Create/Edit Task Modal */}
      <Modal isOpen={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} title={editingTask ? 'Edit Task' : 'Add New Task'}>
        <form onSubmit={handleSaveTask}>
          {taskFormError && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {taskFormError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Task Name *</label>
            <input type="text" className="input-field" placeholder="e.g., Setup auth middleware" value={taskName} onChange={(e) => setTaskName(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input-field" rows={2} placeholder="Optional details..." value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Priority</label>
              <select className="input-field" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="input-field" value={taskStatus} onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Due Date</label>
            <input type="date" className="input-field" value={taskDueDate} onChange={(e) => setTaskDueDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsTaskModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isTaskSubmitting}>
              {isTaskSubmitting ? <div className="spinner" /> : editingTask ? 'Save Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

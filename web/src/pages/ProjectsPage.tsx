import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../api/client';
import { Project, ProjectStatus } from '../types';
import { ProjectCard } from '../components/ProjectCard';
import { Modal } from '../components/Modal';
import { Toast } from '../components/Toast';
import { Plus, Search, Filter, FolderKanban, X } from 'lucide-react';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('NOT_STARTED');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('create')) {
      setIsModalOpen(true);
      searchParams.delete('create');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const fetchProjects = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      let url = `/projects?search=${encodeURIComponent(searchQuery)}`;
      if (statusFilter !== 'ALL') {
        url += `&status=${statusFilter}`;
      }
      const res = await apiClient.get<Project[]>(url);
      setProjects(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProjects();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, statusFilter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name.trim()) {
      setFormError('Project name is required');
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setFormError('End date must be greater than or equal to start date');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post('/projects', {
        name: name.trim(),
        description: description.trim() || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      setIsModalOpen(false);
      setName('');
      setDescription('');
      setStatus('NOT_STARTED');
      setStartDate('');
      setEndDate('');
      fetchProjects();
    } catch (err: any) {
      setFormError(err.response?.data?.error?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container page-container">
      {errorMsg && <Toast message={errorMsg} onClose={() => setErrorMsg(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">Manage and track your active project workspace</p>
        </div>

        <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
          <Plus size={18} />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Search projects by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ paddingLeft: '2.5rem' }}
          />
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={18} color="var(--text-dim)" />
          <select
            className="input-field"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NOT_STARTED">Not Started</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      {/* Project Grid */}
      {isLoading ? (
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Fetching projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center' }}>
          <FolderKanban size={56} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>No projects found</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try changing your search terms or filter selection.'
              : 'Create your first project to get started.'}
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn btn-primary">
            <Plus size={16} />
            <span>Create Project</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject}>
          {formError && (
            <div style={{ padding: '0.75rem', borderRadius: 'var(--radius-sm)', background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g., E-Commerce Redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="input-field"
              placeholder="Overview of goals and deliverables..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select className="input-field" value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="date" className="input-field" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="date" className="input-field" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? <div className="spinner" /> : 'Create Project'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

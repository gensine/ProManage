import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../api/client';
import { DashboardStats, Project } from '../types';
import { StatCard } from '../components/StatCard';
import { ProjectCard } from '../components/ProjectCard';
import { FolderKanban, CheckSquare, Clock, PlayCircle, Plus, RefreshCw } from 'lucide-react';
import { Toast } from '../components/Toast';

export const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [statsRes, projectsRes] = await Promise.all([
        apiClient.get<DashboardStats>('/dashboard'),
        apiClient.get<Project[]>('/projects?limit=3&sortBy=createdAt&order=desc')
      ]);
      setStats(statsRes.data);
      setRecentProjects(projectsRes.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load dashboard metrics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="container page-container">
      {errorMsg && <Toast message={errorMsg} onClose={() => setErrorMsg(null)} />}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Track your project stats, active tasks, and team productivity</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary btn-sm" title="Refresh">
            <RefreshCw size={16} className={isLoading ? 'spinner' : ''} />
            <span>Refresh</span>
          </button>
          <Link to="/projects?create=1" className="btn btn-primary btn-sm">
            <Plus size={16} />
            <span>New Project</span>
          </Link>
        </div>
      </div>

      {/* 5 Stat Cards */}
      {stats && (
        <div className="stats-grid">
          <StatCard
            label="Total Projects"
            value={stats.totalProjects}
            icon={<FolderKanban size={24} />}
            color="#6366f1"
            bgColor="rgba(99, 102, 241, 0.15)"
          />
          <StatCard
            label="Total Tasks"
            value={stats.totalTasks}
            icon={<CheckSquare size={24} />}
            color="#38bdf8"
            bgColor="rgba(56, 189, 248, 0.15)"
          />
          <StatCard
            label="Completed Tasks"
            value={stats.completedTasks}
            icon={<CheckSquare size={24} />}
            color="#10b981"
            bgColor="rgba(16, 185, 129, 0.15)"
          />
          <StatCard
            label="Pending Tasks"
            value={stats.pendingTasks}
            icon={<Clock size={24} />}
            color="#f59e0b"
            bgColor="rgba(245, 158, 11, 0.15)"
          />
          <StatCard
            label="Projects In Progress"
            value={stats.projectsInProgress}
            icon={<PlayCircle size={24} />}
            color="#a855f7"
            bgColor="rgba(168, 85, 247, 0.15)"
          />
        </div>
      )}

      {/* Recent Projects Section */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>Recent Projects</h2>
          <Link to="/projects" style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem' }}>
            View All Projects →
          </Link>
        </div>

        {isLoading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading projects...</p>
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
            <FolderKanban size={48} color="var(--text-dim)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }}>No projects created yet</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>
              Create your first project to start tracking tasks, setting deadlines, and monitoring progress.
            </p>
            <Link to="/projects?create=1" className="btn btn-primary">
              <Plus size={16} />
              <span>Create Project</span>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {recentProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

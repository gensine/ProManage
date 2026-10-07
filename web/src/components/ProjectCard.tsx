import React from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { Calendar, ArrowRight } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  const statusLabels: Record<string, string> = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  };

  return (
    <div className="glass-panel animate-fade-in" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <span className={`badge badge-${project.status}`}>
            {statusLabels[project.status]}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            {new Date(project.createdAt).toLocaleDateString()}
          </span>
        </div>

        <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
          {project.name}
        </h3>

        <p style={{
          fontSize: '0.875rem',
          color: 'var(--text-muted)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: '1.5',
          marginBottom: '1rem'
        }}>
          {project.description || 'No description provided.'}
        </p>
      </div>

      <div style={{
        paddingTop: '1rem',
        borderTop: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          <Calendar size={14} />
          <span>
            {project.startDate ? new Date(project.startDate).toLocaleDateString() : 'TBD'}
            {' → '}
            {project.endDate ? new Date(project.endDate).toLocaleDateString() : 'TBD'}
          </span>
        </div>

        <Link to={`/projects/${project.id}`} className="btn btn-secondary btn-sm">
          <span>View Details</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { apiClient } from '../api/client';
import { DashboardStats, Project } from '../types';

export const DashboardScreen = ({ navigation }: any) => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setErrorMsg(null);
    try {
      const [statsRes, projectsRes] = await Promise.all([
        apiClient.get<DashboardStats>('/dashboard'),
        apiClient.get<Project[]>('/projects?limit=3&sortBy=createdAt&order=desc')
      ]);
      setStats(statsRes.data);
      setRecentProjects(projectsRes.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Network error, please check connection');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarText}>{user?.fullName?.charAt(0) || 'U'}</Text>
          </View>
          <View>
            <Text style={styles.greetingText}>{user?.fullName}</Text>
            <Text style={styles.subGreeting}>Workspace Dashboard</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
        }
      >
        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stat Cards Grid */}
            {stats && (
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { borderLeftColor: '#7c3aed' }]}>
                  <Text style={styles.statIcon}>📁</Text>
                  <Text style={styles.statValue}>{stats.totalProjects}</Text>
                  <Text style={styles.statLabel}>Total Projects</Text>
                </View>

                <View style={[styles.statCard, { borderLeftColor: '#06b6d4' }]}>
                  <Text style={styles.statIcon}>⚡</Text>
                  <Text style={styles.statValue}>{stats.totalTasks}</Text>
                  <Text style={styles.statLabel}>Total Tasks</Text>
                </View>

                <View style={[styles.statCard, { borderLeftColor: '#10b981' }]}>
                  <Text style={styles.statIcon}>✅</Text>
                  <Text style={styles.statValue}>{stats.completedTasks}</Text>
                  <Text style={styles.statLabel}>Completed</Text>
                </View>

                <View style={[styles.statCard, { borderLeftColor: '#f59e0b' }]}>
                  <Text style={styles.statIcon}>⏳</Text>
                  <Text style={styles.statValue}>{stats.pendingTasks}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
              </View>
            )}

            {/* Quick Action Navigation Banner */}
            <TouchableOpacity
              style={styles.projectsBanner}
              onPress={() => navigation.navigate('Projects')}
            >
              <View>
                <Text style={styles.bannerTitle}>Explore All Projects →</Text>
                <Text style={styles.bannerSubtitle}>Manage tasks, priorities, and deadlines</Text>
              </View>
              <Text style={{ fontSize: 24 }}>🚀</Text>
            </TouchableOpacity>

            {/* Recent Projects List */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>Recent Projects</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Projects')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>

            {recentProjects.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.projectItem}
                onPress={() => navigation.navigate('ProjectDetail', { projectId: p.id })}
              >
                <View style={styles.projectHeader}>
                  <Text style={styles.projectName}>{p.name}</Text>
                  <View style={[
                    styles.statusBadge,
                    p.status === 'COMPLETED' ? styles.badgeCompleted :
                    p.status === 'IN_PROGRESS' ? styles.badgeInProgress : styles.badgeNotStarted
                  ]}>
                    <Text style={styles.statusBadgeText}>{p.status.replace('_', ' ')}</Text>
                  </View>
                </View>

                {p.description ? (
                  <Text style={styles.projectDesc} numberOfLines={2}>
                    {p.description}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  topBar: {
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#141c2e',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#7c3aed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 18,
  },
  greetingText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
  },
  subGreeting: {
    fontSize: 12,
    color: '#94a3b8',
  },
  logoutButton: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.35)',
  },
  logoutText: {
    color: '#f43f5e',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 14,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#141c2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  projectsBanner: {
    backgroundColor: '#7c3aed',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  bannerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  bannerSubtitle: {
    color: '#e0e7ff',
    fontSize: 12,
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  seeAllText: {
    fontSize: 13,
    color: '#06b6d4',
    fontWeight: '700',
  },
  projectItem: {
    backgroundColor: '#141c2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  badgeInProgress: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  badgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  badgeNotStarted: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  projectDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
});

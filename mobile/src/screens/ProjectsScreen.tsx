import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { apiClient } from '../api/client';
import { Project } from '../types';

export const ProjectsScreen = ({ navigation }: any) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProjects = async () => {
    setErrorMsg(null);
    try {
      const res = await apiClient.get<Project[]>(`/projects?search=${encodeURIComponent(searchQuery)}`);
      setProjects(res.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to fetch projects');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [searchQuery]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProjects();
  };

  const handleCreateProject = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await apiClient.post('/projects', {
        name: name.trim(),
        description: description.trim() || undefined,
        status: 'NOT_STARTED',
      });
      setIsModalOpen(false);
      setName('');
      setDescription('');
      fetchProjects();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to create project');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderProjectCard = ({ item }: { item: Project }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('ProjectDetail', { projectId: item.id })}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Projects</Text>
        <TouchableOpacity style={styles.createButton} onPress={() => setIsModalOpen(true)}>
          <Text style={styles.createButtonText}>+ New Project</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search projects by name..."
          placeholderTextColor="#64748b"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {isLoading && !refreshing ? (
        <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(item) => item.id}
          renderItem={renderProjectCard}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No projects found. Tap "+ New Project" to create one.</Text>
          }
        />
      )}

      {/* Modal for Creating Project */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Project</Text>

            <Text style={styles.label}>PROJECT NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Mobile App Redesign"
              placeholderTextColor="#64748b"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, { height: 85 }]}
              placeholder="Overview of goals..."
              placeholderTextColor="#64748b"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateProject} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Project</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0f19',
  },
  topHeader: {
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#141c2e',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#141c2e',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#f8fafc',
    flex: 1,
  },
  badge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.4)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  cardDesc: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    marginHorizontal: 16,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#f43f5e',
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#141c2e',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 1,
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#0b0f19',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { apiClient } from '../api/client';
import { Project, Task, TaskPriority, TaskStatus } from '../types';

export const ProjectDetailScreen = ({ route, navigation }: any) => {
  const { projectId } = route.params;

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Task Modal State
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('MEDIUM');
  const [isTaskSubmitting, setIsTaskSubmitting] = useState(false);

  const fetchDetails = async () => {
    setErrorMsg(null);
    try {
      const [projRes, tasksRes] = await Promise.all([
        apiClient.get<Project>(`/projects/${projectId}`),
        apiClient.get<Task[]>(`/tasks?projectId=${projectId}`)
      ]);
      setProject(projRes.data);
      setTasks(tasksRes.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to load details');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [projectId]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDetails();
  };

  const handleCreateTask = async () => {
    if (!taskName.trim()) return;
    setIsTaskSubmitting(true);
    try {
      await apiClient.post('/tasks', {
        projectId,
        name: taskName.trim(),
        description: taskDescription.trim() || undefined,
        priority: taskPriority,
        status: 'PENDING',
      });
      setIsTaskModalOpen(false);
      setTaskName('');
      setTaskDescription('');
      fetchDetails();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error?.message || 'Failed to create task');
    } finally {
      setIsTaskSubmitting(false);
    }
  };

  const handleToggleTask = async (task: Task) => {
    const nextStatus: TaskStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await apiClient.put(`/tasks/${task.id}`, { status: nextStatus });
      fetchDetails();
    } catch (err: any) {
      setErrorMsg('Failed to update task status');
    }
  };

  const renderTaskItem = ({ item }: { item: Task }) => {
    const isCompleted = item.status === 'COMPLETED';
    return (
      <View style={[styles.taskCard, isCompleted && { opacity: 0.65 }]}>
        <TouchableOpacity style={styles.checkButton} onPress={() => handleToggleTask(item)}>
          <View style={[styles.checkbox, isCompleted && styles.checkboxDone]}>
            {isCompleted ? <Text style={styles.checkmark}>✓</Text> : null}
          </View>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={styles.taskHeader}>
            <Text style={[styles.taskName, isCompleted && styles.strikethrough]}>
              {item.name}
            </Text>
            <View style={[
              styles.priorityBadge,
              item.priority === 'HIGH' ? styles.priorityHigh :
              item.priority === 'MEDIUM' ? styles.priorityMed : styles.priorityLow
            ]}>
              <Text style={styles.priorityText}>{item.priority}</Text>
            </View>
          </View>
          {item.description ? (
            <Text style={styles.taskDesc}>{item.description}</Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back to Projects</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.addTaskButton} onPress={() => setIsTaskModalOpen(true)}>
          <Text style={styles.addTaskText}>+ Add Task</Text>
        </TouchableOpacity>
      </View>

      {project && (
        <View style={styles.banner}>
          <Text style={styles.projectTitle}>{project.name}</Text>
          {project.description ? (
            <Text style={styles.projectDesc}>{project.description}</Text>
          ) : null}
        </View>
      )}

      {errorMsg && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      {isLoading && !refreshing ? (
        <ActivityIndicator size="large" color="#7c3aed" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTaskItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#7c3aed" />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>No tasks created yet. Tap "+ Add Task" to start.</Text>
          }
        />
      )}

      {/* Task Creation Modal */}
      <Modal visible={isTaskModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Task</Text>

            <Text style={styles.label}>TASK NAME *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Setup Auth Interceptors"
              placeholderTextColor="#64748b"
              value={taskName}
              onChangeText={setTaskName}
            />

            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, { height: 75 }]}
              placeholder="Task details..."
              placeholderTextColor="#64748b"
              multiline
              value={taskDescription}
              onChangeText={setTaskDescription}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsTaskModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submitBtn} onPress={handleCreateTask} disabled={isTaskSubmitting}>
                {isTaskSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Create Task</Text>
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
  backText: {
    color: '#06b6d4',
    fontSize: 14,
    fontWeight: '700',
  },
  addTaskButton: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  addTaskText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  banner: {
    backgroundColor: '#141c2e',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  projectDesc: {
    fontSize: 14,
    color: '#94a3b8',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
  },
  taskCard: {
    backgroundColor: '#141c2e',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  checkButton: {
    marginRight: 14,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxDone: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f8fafc',
    flex: 1,
  },
  strikethrough: {
    textDecorationLine: 'line-through',
    color: '#64748b',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  priorityHigh: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.4)',
  },
  priorityMed: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  priorityLow: {
    backgroundColor: 'rgba(148, 163, 184, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.3)',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
  },
  taskDesc: {
    fontSize: 13,
    color: '#94a3b8',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    margin: 16,
    padding: 12,
    borderRadius: 10,
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
    fontSize: 18,
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
    marginTop: 22,
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});

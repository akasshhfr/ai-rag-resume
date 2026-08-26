import axios from 'axios';

const BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: BASE_URL,
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  register: (data: any) => client.post('/auth/register', data),
  login: (data: any) => client.post('/auth/login', data),
  getMe: () => client.get('/auth/me'),

  // Resumes
  uploadResume: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client.post('/resumes/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  listResumes: () => client.get('/resumes/'),
  getResume: (id: string) => client.get(`/resumes/${id}`),
  deleteResume: (id: string) => client.delete(`/resumes/${id}`),

  // Job Descriptions
  createJobDescription: (data: any) => client.post('/job-descriptions/', data),
  listJobDescriptions: () => client.get('/job-descriptions/'),
  getJobDescription: (id: string) => client.get(`/job-descriptions/${id}`),

  // Analysis
  runAnalysis: (data: any) => client.post('/analysis/run', data),
  getAnalysis: (id: string) => client.get(`/analysis/${id}`),
  listAnalyses: () => client.get('/analysis/'),
  deleteAnalysis: (id: string) => client.delete(`/analysis/${id}`),

  // Interview
  startInterview: (data: any) => client.post('/interview/start', data),
  submitAnswer: (sessionId: string, data: any) => client.post(`/interview/${sessionId}/answer`, data),
  getInterviewSummary: (sessionId: string) => client.get(`/interview/${sessionId}/summary`),
};

export default client;

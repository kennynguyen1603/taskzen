import http from '@/lib/http'

// Tìm kiếm dựa trên từ khóa và loại đối tượng
const search = async (query: string, type: 'all' | 'task' | 'project' | 'user' | 'conversation' = 'all') => {
  try {
    const params = new URLSearchParams();
    params.append('q', query);
    params.append('type', type);

    const response = await http.get<any>(`/search?${params.toString()}`);
    console.log("response", response.payload.result);
    return response.payload.result;
  } catch (error) {
    console.error('Error searching:', error);
    throw error;
  }
};

// Tìm kiếm người dùng theo email
const searchUsersByEmail = async (email: string) => {
  try {
    const params = new URLSearchParams();
    params.append('email', email);

    const response = await http.get<any>(`/user/search?${params.toString()}`);
    return response.payload.metadata.users;
  } catch (error) {
    console.error('Error searching users by email:', error);
    throw error;
  }
};

// Tìm kiếm người dùng theo tên
const searchUsersByName = async (name: string) => {
  try {
    const params = new URLSearchParams();
    params.append('name', name);

    return await http.get<any>(`/search/users?${params.toString()}`);
  } catch (error) {
    console.error('Error searching users by name:', error);
    throw error;
  }
};

// Tìm kiếm dự án
const searchProjects = async (query: string) => {
  try {
    const params = new URLSearchParams();
    params.append('q', query);

    return await http.get<any>(`/search/projects?${params.toString()}`);
  } catch (error) {
    console.error('Error searching projects:', error);
    throw error;
  }
};

// Tìm kiếm công việc
const searchTasks = async (query: string) => {
  try {
    const params = new URLSearchParams();
    params.append('q', query);

    return await http.get<any>(`/search/tasks?${params.toString()}`);
  } catch (error) {
    console.error('Error searching tasks:', error);
    throw error;
  }
};

export default {
  search,
  searchUsersByEmail,
  searchUsersByName,
  searchProjects,
  searchTasks
};

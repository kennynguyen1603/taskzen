import http from '@/lib/http'

// Simple cache for recent email searches
const emailSearchCache: Record<string, { timestamp: number; data: any }> = {}
const CACHE_EXPIRY_MS = 5 * 60 * 1000 // 5 minutes

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
    if (email.length < 3) {
      throw new Error('Search query must be at least 3 characters long');
    }

    const sanitizedEmail = email.trim().toLowerCase();

    // Client-side validation to prevent unnecessary API calls
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(sanitizedEmail)) {
      throw new Error('Please enter a valid email format');
    }

    // Prevent searching for common email domains without specific query
    const commonDomains = ['@gmail.com', '@yahoo.com', '@hotmail.com', '@outlook.com'];
    if (commonDomains.some(domain => sanitizedEmail === domain)) {
      throw new Error('Please enter a more specific search term');
    }

    // Check cache for recent searches
    if (emailSearchCache[sanitizedEmail]) {
      const cachedData = emailSearchCache[sanitizedEmail];
      const now = Date.now();

      // Use cache if it's still fresh
      if (now - cachedData.timestamp < CACHE_EXPIRY_MS) {
        console.log('Using cached email search results');
        return cachedData.data;
      }

      // Remove stale cache entry
      delete emailSearchCache[sanitizedEmail];
    }

    const params = new URLSearchParams();
    params.append('email', sanitizedEmail);

    const response = await http.get<any>(`/user/search?${params.toString()}`);

    // Cache the result
    emailSearchCache[sanitizedEmail] = {
      timestamp: Date.now(),
      data: response
    };

    // Cleanup old cache entries
    cleanupCache();

    return response;
  } catch (error) {
    console.error('Error searching users by email:', error);
    throw error;
  }
};

// Helper function to remove old cache entries
function cleanupCache() {
  const now = Date.now();
  Object.keys(emailSearchCache).forEach(key => {
    if (now - emailSearchCache[key].timestamp > CACHE_EXPIRY_MS) {
      delete emailSearchCache[key];
    }
  });

  // Limit cache size to 20 entries
  const entries = Object.entries(emailSearchCache);
  if (entries.length > 20) {
    // Sort by timestamp (oldest first)
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    // Remove oldest entries
    entries.slice(0, entries.length - 20).forEach(([key]) => {
      delete emailSearchCache[key];
    });
  }
}

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

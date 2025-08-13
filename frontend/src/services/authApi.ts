// Authentication API service
const getApiBaseUrl = () => {
  // Check if running in development
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return "http://localhost:5000/api/v1";
  }
  return "https://api.artechnology.pro/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

// Token management
export const getAuthToken = () => localStorage.getItem("auth_token");
export const setAuthToken = (token: string) =>
  localStorage.setItem("auth_token", token);
export const removeAuthToken = () => localStorage.removeItem("auth_token");

// Create authenticated fetch function
const authenticatedFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

// User types
export interface User {
  id: number;
  email: string;
  fullName: string;
  role: string;
  department: string;
  phone?: string;
  avatar?: string;
  status: "active" | "inactive";
  lastLogin?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  token: string;
  user: User;
  message?: string;
}

export interface Employee extends Omit<User, "id"> {
  id?: number;
  password?: string;
}

// Authentication API
export const authApi = {
  // Authentication
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Login failed");
    }

    const data = await response.json();
    if (data.data && data.data.token) {
      setAuthToken(data.data.token);
    }
    return data.data;
  },

  logout: async (): Promise<void> => {
    try {
      await authenticatedFetch(`${API_BASE_URL}/auth/logout`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      removeAuthToken();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/auth/profile`);
    if (!response.ok) {
      if (response.status === 401) {
        removeAuthToken();
      }
      throw new Error("Failed to get user info");
    }
    const data = await response.json();
    return data.data || data.user || data;
  },

  changePassword: async (
    oldPassword: string,
    newPassword: string
  ): Promise<any> => {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/auth/change-password`,
      {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to change password");
    }
    return response.json();
  },

  // Employee Management
  getEmployees: async (): Promise<User[]> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/employees`);
    if (!response.ok) throw new Error("Failed to fetch employees");
    const result = await response.json();
    console.log("API response:", result);
    return result.data?.employees || result.employees || result;
  },

  createEmployee: async (employee: Employee): Promise<User> => {
    const response = await authenticatedFetch(`${API_BASE_URL}/employees`, {
      method: "POST",
      body: JSON.stringify(employee),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to create employee");
    }
    const data = await response.json();
    return data.employee || data;
  },

  updateEmployee: async (
    id: number,
    employee: Partial<Employee>
  ): Promise<User> => {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/employees/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(employee),
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to update employee");
    }
    const data = await response.json();
    return data.employee || data;
  },

  deleteEmployee: async (id: number): Promise<void> => {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/employees/${id}`,
      {
        method: "DELETE",
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to delete employee");
    }
  },

  toggleEmployeeStatus: async (id: number): Promise<User> => {
    const response = await authenticatedFetch(
      `${API_BASE_URL}/employees/${id}/toggle-status`,
      {
        method: "PATCH",
      }
    );
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to toggle employee status");
    }
    const data = await response.json();
    return data.employee || data;
  },
};

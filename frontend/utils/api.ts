const API_BASE_URL = 'http://localhost:8080/api';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface LoginRequest {
  loginName: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  loginName: string;
  employeeName: string;
  employeeNo: string;
}

export interface User {
  id: number;
  loginName: string;
  employeeName: string;
  employeeNo: string;
  email: string;
  phone: string;
  active: boolean;
  createdAt: string;
}

export const api = {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getUsers(): Promise<ApiResponse<User[]>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },

  async createUser(user: Partial<User>): Promise<ApiResponse<User>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(user),
    });
    return response.json();
  },

  async updateUser(id: number, user: Partial<User>): Promise<ApiResponse<User>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(user),
    });
    return response.json();
  },

  async deleteUser(id: number): Promise<ApiResponse<void>> {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    return response.json();
  },
};

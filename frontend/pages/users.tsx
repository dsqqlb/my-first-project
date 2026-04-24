import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api, User } from '../utils/api';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    loginName: '',
    employeeName: '',
    employeeNo: '',
    email: '',
    phone: '',
    active: true
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/');
      return;
    }
    loadUsers();
  }, [router]);

  const loadUsers = async () => {
    try {
      const response = await api.getUsers();
      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('加载用户失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, formData);
      } else {
        await api.createUser(formData);
      }
      setShowForm(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('保存失败', error);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      loginName: user.loginName,
      employeeName: user.employeeName,
      employeeNo: user.employeeNo,
      email: user.email,
      phone: user.phone,
      active: user.active
    });
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个用户吗？')) {
      try {
        await api.deleteUser(id);
        loadUsers();
      } catch (error) {
        console.error('删除失败', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      loginName: '',
      employeeName: '',
      employeeNo: '',
      email: '',
      phone: '',
      active: true
    });
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px' }}>
      <div className="container">
        <div className="card">
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '30px'
          }}>
            <h1 style={{ 
              fontSize: '28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              用户管理
            </h1>
            <div>
              <button 
                onClick={() => router.push('/menu')} 
                className="btn btn-secondary"
                style={{ marginRight: '10px' }}
              >
                返回主菜单
              </button>
              <button 
                onClick={() => {
                  setEditingUser(null);
                  resetForm();
                  setShowForm(true);
                }} 
                className="btn btn-primary"
              >
                添加用户
              </button>
            </div>
          </div>

          {showForm && (
            <div style={{ 
              marginBottom: '30px', 
              padding: '20px', 
              background: '#f8f9fa', 
              borderRadius: '8px' 
            }}>
              <h3 style={{ marginBottom: '20px' }}>
                {editingUser ? '编辑用户' : '添加新用户'}
              </h3>
              <form onSubmit={handleSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>用户名</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.loginName}
                      onChange={(e) => setFormData({...formData, loginName: e.target.value})}
                      disabled={!!editingUser}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>员工姓名</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.employeeName}
                      onChange={(e) => setFormData({...formData, employeeName: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>员工编号</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.employeeNo}
                      onChange={(e) => setFormData({...formData, employeeNo: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>邮箱</label>
                    <input
                      type="email"
                      className="input"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>电话</label>
                    <input
                      type="text"
                      className="input"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px' }}>状态</label>
                    <select 
                      className="input"
                      value={formData.active ? 'true' : 'false'}
                      onChange={(e) => setFormData({...formData, active: e.target.value === 'true'})}
                    >
                      <option value="true">启用</option>
                      <option value="false">禁用</option>
                    </select>
                  </div>
                </div>
                <div style={{ marginTop: '20px' }}>
                  <button type="submit" className="btn btn-primary" style={{ marginRight: '10px' }}>
                    保存
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowForm(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                  >
                    取消
                  </button>
                </div>
              </form>
            </div>
          )}

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>用户名</th>
                <th>员工姓名</th>
                <th>员工编号</th>
                <th>邮箱</th>
                <th>电话</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.loginName}</td>
                  <td>{user.employeeName}</td>
                  <td>{user.employeeNo}</td>
                  <td>{user.email}</td>
                  <td>{user.phone}</td>
                  <td>
                    <span style={{ 
                      padding: '4px 12px', 
                      borderRadius: '12px',
                      background: user.active ? '#d4edda' : '#f8d7da',
                      color: user.active ? '#155724' : '#721c24',
                      fontSize: '12px'
                    }}>
                      {user.active ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td>
                    <button 
                      onClick={() => handleEdit(user)}
                      className="btn btn-secondary"
                      style={{ marginRight: '5px', padding: '6px 12px', fontSize: '14px' }}
                    >
                      编辑
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '14px' }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

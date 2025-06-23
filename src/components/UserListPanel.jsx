import React, { useState, useEffect } from 'react';
import { Search, User, Mail, Phone, Building, Calendar, MessageCircle } from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

const UserListPanel = () => {
  const { startConversationWithUser } = useChat();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [organization, setOrganization] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(20);

  // GraphQL Query cho getAllUserNotAdmin
  const GET_ALL_USER_NOT_ADMIN = `
    query getAllUserNotAdmin($keyword: String, $organization: String, $pageable: Pageable) {
      getAllUserNotAdmin(
        keyword: $keyword
        organization: $organization
        pageable: $pageable
      ) {
        totalCount
        edges {
          node {
            id
            username
            fullName
            email
            phone
            locked
            roles
            avatar
            organizationOrder
            organizationCode
            organizationName
            organizationId
            mainSign
            flashingSignature
            createDate
            simCa
            position
            birthDay
            gender
            positionName
            positionCode
            __typename
          }
          __typename
        }
        __typename
      }
    }
  `;

  // Fetch users từ admin-service
  const fetchUsers = async (page = 0, searchKeyword = '', orgFilter = '') => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

      const response = await fetch('http://localhost:4000/admin-service/graphql', {
        method: 'POST',
        headers: {
          'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
          'Connection': 'keep-alive',
          'authorization': `Bearer ${token}`,
          'content-type': 'application/json',
          'apollo-require-preflight': 'true',
        },
        body: JSON.stringify({
          operationName: 'getAllUserNotAdmin',
          variables: {
            keyword: searchKeyword,
            organization: orgFilter,
            pageable: {
              page: page,
              size: pageSize,
              sort: [{ property: 'createDate', direction: 'ASC' }]
            }
          },
          query: GET_ALL_USER_NOT_ADMIN
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.errors) {
        throw new Error(data.errors[0]?.message || 'GraphQL Error');
      }

      const userList = data.data?.getAllUserNotAdmin;
      setUsers(userList?.edges?.map(edge => edge.node) || []);
      setTotalCount(userList?.totalCount || 0);

    } catch (err) {
      setError(err.message);
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle tạo conversation khi click user
  const handleStartChat = async (user) => {
    try {
      await startConversationWithUser(user);
    } catch (error) {
      console.error('Error starting conversation:', error);
      alert('Không thể bắt đầu cuộc trò chuyện');
    }
  };

  // Handle search
  const handleSearch = () => {
    setCurrentPage(0);
    fetchUsers(0, keyword, organization);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchUsers(newPage, keyword, organization);
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Load users khi component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="flex flex-col h-full">
      {/* Header với search */}
      <div className="p-4 border-b bg-white">
        <div className="space-y-3">
          {/* Search keyword */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Tìm theo tên, email, username..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
          </div>

          {/* Organization filter và search button */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Lọc theo tổ chức..."
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center gap-1"
            >
              <Search className="w-4 h-4" />
              {loading ? 'Đang tìm...' : 'Tìm'}
            </button>
          </div>

          {/* Results count */}
          {totalCount > 0 && (
            <div className="text-sm text-gray-600">
              Tìm thấy <span className="font-semibold text-blue-600">{totalCount}</span> người dùng
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200">
          <p className="text-red-600 text-sm">
            <span className="font-medium">Lỗi:</span> {error}
          </p>
        </div>
      )}

      {/* User list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 text-sm">Đang tải...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 px-4">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không có người dùng</h3>
            <p className="mt-1 text-sm text-gray-500">
              {keyword || organization ? 'Không tìm thấy người dùng phù hợp.' : 'Chưa có người dùng nào.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleStartChat(user)}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {user.avatar ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={user.avatar}
                        alt={user.fullName}
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* User info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {user.fullName || 'Chưa cập nhật'}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          @{user.username}
                        </p>
                        {user.roles && (
                          <p className="text-xs text-blue-600 font-medium">
                            {user.roles}
                          </p>
                        )}
                      </div>
                      
                      {/* Status badge */}
                      <div className="flex flex-col items-end gap-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.locked 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.locked ? 'Bị khóa' : 'Hoạt động'}
                        </span>
                        
                        {/* Chat button */}
                        <button className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Contact info */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Mail className="w-3 h-3 mr-1" />
                        {user.email}
                      </div>
                      
                      {user.phone && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Phone className="w-3 h-3 mr-1" />
                          {user.phone}
                        </div>
                      )}
                      
                      {user.organizationName && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Building className="w-3 h-3 mr-1" />
                          {user.organizationName}
                          {user.positionName && ` - ${user.positionName}`}
                        </div>
                      )}
                      
                      {user.createDate && (
                        <div className="flex items-center text-xs text-gray-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          Tham gia: {formatDate(user.createDate)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-700">
              {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, totalCount)} của {totalCount}
            </div>
            
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 0}
                className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              
              {/* Page numbers - show max 3 pages */}
              {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                const pageNum = Math.max(0, Math.min(currentPage - 1 + i, totalPages - 1));
                return (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-2 py-1 border rounded text-xs font-medium ${
                      currentPage === pageNum
                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum + 1}
                  </button>
                );
              })}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
                className="px-2 py-1 border border-gray-300 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListPanel;
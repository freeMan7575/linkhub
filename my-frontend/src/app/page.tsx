"use client";

import { useState, useEffect, FormEvent } from "react";

// [설계도]
interface User {
  _id: string;
  name: string;
  channel: string;
  tags?: string[];
  job?: string;
  age?: number;
  imageUrl?: string;
}

export default function Home() {
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 5;

  // --- [상태 분리!] ---
  // [생성(Create)을 위한 state]
  const [name, setName] = useState('');
  const [channel, setChannel] = useState('');
  const [tags, setTags] = useState('');
  const [job, setJob] = useState('');
  const [age, setAge] = useState<number | ''>('');
  
  // [수정(Update)을 위한 state]
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:3001/api/users");
      const data = await response.json();
      setUsers(data);
    } catch (error) { console.error("목록 로딩 실패:", error); }
  };

  useEffect(() => { fetchUsers(); }, []);

  // [생성(Create) 로직]
  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const tagsArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    try {
      const response = await fetch("http://localhost:3001/api/users", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, channel, tags: tagsArray, job, age }),
      });

      if (response.ok) {
        await fetchUsers();
        setName(''); setChannel(''); setTags(''); setJob(''); setAge('');
        setCurrentPage(1); // 새 사용자 추가 후 1페이지로 이동
      } else {
        const errorText = await response.text();
        if (errorText.toLowerCase().includes("duplicate key")) {
          alert("이미 등록된 채널 주소입니다. 다른 주소를 입력해주세요.");
        } else {
          alert("사용자 추가에 실패했습니다.");
        }
      }
    } catch (error) { console.error("사용자 추가 중 오류:", error); }
  };

  // [삭제(Delete) 로직]
  const handleDelete = async (userId: string) => {
    if (!confirm("정말로 이 사용자를 삭제하시겠습니까?")) return;
    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, { method: 'DELETE' });
      if (response.ok) {
        fetchUsers();
      } else { alert("삭제에 실패했습니다."); }
    } catch (error) { console.error("삭제 중 오류:", error); }
  };

  // [수정(Update) 로직]
  const handleUpdateUser = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingUser) return;
    
    const tagsArray = Array.isArray(editingUser.tags) 
      ? editingUser.tags 
      : (editingUser.tags as unknown as string).split(',').map(t => t.trim());

    try {
      const response = await fetch(`http://localhost:3001/api/users/${editingUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...editingUser, tags: tagsArray }),
      });
      if (response.ok) {
        setEditingUser(null);
        fetchUsers();
      } else {
        alert("수정에 실패했습니다. 채널 주소가 중복될 수 있습니다.");
      }
    } catch (error) { console.error("수정 중 오류:", error); }
  };
  
  // 수정 모드 진입
  const handleEdit = (user: User) => {
    setEditingUser({ ...user });
  };
  
  // [페이지 계산]
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  return (
    <main className="flex min-h-screen flex-col items-center p-12 sm:p-24 bg-gray-50 dark:bg-black">
      {/* 사용자 추가 폼 */}
      <div className="w-full max-w-2xl mb-8">
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4">
          <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100">새 사용자 추가</h2>
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">이름 (이미지 검색어)</label>
            <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
          </div>
          <div>
            <label htmlFor="channel" className="block text-sm font-medium text-gray-700 dark:text-gray-300">채널 주소</label>
            <input type="url" id="channel" value={channel} onChange={(e) => setChannel(e.target.value)} required className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="https://..." />
          </div>
          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300">태그 (쉼표로 구분)</label>
            <input type="text" id="tags" value={tags} onChange={(e) => setTags(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" placeholder="예: 개발자, 여행" />
          </div>
          <div>
            <label htmlFor="job" className="block text-sm font-medium text-gray-700 dark:text-gray-300">직업</label>
            <input type="text" id="job" value={job} onChange={(e) => setJob(e.target.value)} list="job-options" className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
            <datalist id="job-options">
              <option value="개발자" /><option value="디자이너" /><option value="기획자" /><option value="마케터" /><option value="학생" />
            </datalist>
          </div>
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 dark:text-gray-300">나이</label>
            <input type="number" id="age" value={age} onChange={(e) => setAge(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 block w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm" />
          </div>
          <button type="submit" className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-md shadow-md">추가하기</button>
        </form>
      </div>

      {/* 사용자 목록 */}
      <h1 className="text-4xl font-bold mb-8 text-gray-800 dark:text-gray-100">사용자 목록</h1>
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {currentUsers.length === 0 ? (
          <p className="text-center text-gray-500">등록된 사용자가 없습니다.</p>
        ) : (
          <ul className="space-y-4">
            {currentUsers.map((user) => (
              <li key={user._id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                {editingUser && editingUser._id === user._id ? (
                  // [수정 모드 UI]
                  <form onSubmit={handleUpdateUser} className="space-y-3">
                    <input type="text" value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <input type="url" value={editingUser.channel} onChange={(e) => setEditingUser({ ...editingUser, channel: e.target.value })} required className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <input type="text" placeholder="태그 (쉼표로 구분)" value={Array.isArray(editingUser.tags) ? editingUser.tags.join(', ') : ''} onChange={(e) => setEditingUser({ ...editingUser, tags: e.target.value.split(',').map(t => t.trim()) })} className="w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600" />
                    <div className="flex gap-2 justify-end">
                      <button type="submit" className="bg-green-500 text-white text-sm py-1 px-3 rounded-md hover:bg-green-600">저장</button>
                      <button type="button" onClick={() => setEditingUser(null)} className="bg-gray-500 text-white text-sm py-1 px-3 rounded-md hover:bg-gray-600">취소</button>
                    </div>
                  </form>
                ) : (
                  // [일반 모드 UI]
                  <div className="flex justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        {user.imageUrl ? (
                            <img src={user.imageUrl} alt={user.name} className="w-12 h-12 rounded-full object-cover" />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-center text-xs text-gray-500">No Img</div>
                        )}
                        <div className="flex-1">
                            <p className="font-semibold text-lg text-gray-800 dark:text-gray-100">{user.name}</p>
                            <a href={user.channel} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline block truncate max-w-[150px] sm:max-w-xs">{user.channel}</a>
                            <div className="flex flex-wrap gap-1 mt-1">
                                {user.tags?.map((tag, index) => (
                                    <span key={index} className="px-2 py-0.5 bg-sky-100 text-sky-800 text-xs font-medium rounded-full">#{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(user)} className="bg-yellow-500 text-white text-sm py-1 px-3 rounded-md hover:bg-yellow-600">수정</button>
                      <button onClick={() => handleDelete(user._id)} className="bg-red-500 text-white text-sm py-1 px-3 rounded-md hover:bg-red-600">삭제</button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 페이지네이션 버튼 */}
      <div className="mt-8 flex justify-center items-center">
        {Array.from({ length: Math.ceil(users.length / usersPerPage) }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => paginate(i + 1)}
            className={`mx-1 px-4 py-2 rounded-md transition-colors ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-100 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </main>
  );
}
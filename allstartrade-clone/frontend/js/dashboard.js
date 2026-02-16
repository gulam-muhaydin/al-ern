
document.addEventListener('DOMContentLoaded', async () => {
    // Determine API Base URL
    const getApiUrl = (endpoint) => {
        if (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost') {
            if (window.location.port === '5500' || window.location.port === '5501') {
                return `http://localhost:3000${endpoint}`;
            }
        }
        return endpoint;
    };

    const token = localStorage.getItem('token');
    
    // 1. Auth Check
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Elements
    const welcomeName = document.getElementById('welcomeName');
    const headerUsername = document.getElementById('headerUsername');
    const userRole = document.getElementById('userRole');
    const joinDate = document.getElementById('joinDate');
    const userInfoHeader = document.getElementById('userInfoHeader');
    const adminSection = document.getElementById('adminSection');
    const usersTableBody = document.getElementById('usersTableBody');
    const refreshUsersBtn = document.getElementById('refreshUsers');
    const refreshDepositRequestsBtn = document.getElementById('refreshDepositRequests');
    const depositRequestsBody = document.getElementById('depositRequestsBody');
    let lastDepositRequests = [];
    const logoutBtn = document.getElementById('logoutBtn');
    const processedDepositRequestsKey = 'ast_processed_deposit_requests';
    const processedWithdrawRequestsKey = 'ast_processed_withdraw_requests';
    const refBonusStat = document.getElementById('refBonusStat');

    const getProcessedDepositRequestIds = () => {
        try {
            const raw = localStorage.getItem(processedDepositRequestsKey) || '[]';
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const markDepositRequestProcessed = (id) => {
        const ids = getProcessedDepositRequestIds();
        if (!ids.includes(id)) {
            ids.push(id);
            localStorage.setItem(processedDepositRequestsKey, JSON.stringify(ids));
        }
    };

    const getProcessedWithdrawRequestIds = () => {
        try {
            const raw = localStorage.getItem(processedWithdrawRequestsKey) || '[]';
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    };

    const markWithdrawRequestProcessed = (id) => {
        const ids = getProcessedWithdrawRequestIds();
        if (!ids.includes(id)) {
            ids.push(id);
            localStorage.setItem(processedWithdrawRequestsKey, JSON.stringify(ids));
        }
    };

    const activatePlanAndAddFirstProfit = (plan, requestId) => {
        if (!plan || !plan.id) return false;
        const existing = localStorage.getItem('ast_active_plan');
        if (existing) return false;

        const now = Date.now();
        const dailyProfit = Number(plan.dailyProfit || 0);
        const validityDays = Number(plan.validityDays || 0);
        const initialPayouts = validityDays > 0 ? 1 : 0;

        const currentBalance = Number(localStorage.getItem('ast_wallet_balance') || '0');
        const safeBalance = Number.isFinite(currentBalance) ? currentBalance : 0;
        localStorage.setItem('ast_wallet_balance', String(safeBalance + (initialPayouts ? dailyProfit : 0)));

        const activePlan = {
            ...plan,
            startedAt: now,
            lastPayoutAt: now,
            payoutsDone: initialPayouts,
        };
        localStorage.setItem('ast_active_plan', JSON.stringify(activePlan));
        localStorage.removeItem('ast_pending_plan');
        localStorage.removeItem('ast_last_deposit_request_id');
        if (requestId) markDepositRequestProcessed(requestId);
        return true;
    };

    const checkApprovedDepositRequests = async () => {
        try {
            const response = await fetch(getApiUrl('/api/deposit-requests'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return;
            const list = await response.json();
            const requests = Array.isArray(list) ? list : [];
            const processed = getProcessedDepositRequestIds();

            for (const r of requests) {
                if (!r || !r._id) continue;
                if (processed.includes(r._id)) continue;
                if ((r.status || 'pending') !== 'approved') continue;
                const activated = activatePlanAndAddFirstProfit(r.plan, r._id);
                if (activated) return;
                markDepositRequestProcessed(r._id);
            }
        } catch {
        }
    };

    const refundWithdraw = (amount) => {
        const currentBalance = Number(localStorage.getItem('ast_wallet_balance') || '0');
        const safeBalance = Number.isFinite(currentBalance) ? currentBalance : 0;
        localStorage.setItem('ast_wallet_balance', String(safeBalance + amount));
    };

    const checkWithdrawRequests = async () => {
        try {
            const response = await fetch(getApiUrl('/api/withdraw-requests'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return;
            const list = await response.json();
            const requests = Array.isArray(list) ? list : [];
            const processed = getProcessedWithdrawRequestIds();

            for (const r of requests) {
                if (!r || !r._id) continue;
                if (processed.includes(r._id)) continue;
                const status = r.status || 'pending';
                if (status === 'rejected') {
                    const amount = Number(r.amount || 0);
                    const safeAmount = Number.isFinite(amount) ? amount : 0;
                    if (safeAmount > 0 && (r.fromWallet || 'current') === 'current') {
                        refundWithdraw(safeAmount);
                    }
                    markWithdrawRequestProcessed(r._id);
                } else if (status === 'approved') {
                    markWithdrawRequestProcessed(r._id);
                }
            }
        } catch {
        }
    };

    const fetchReferralBonus = async () => {
        if (!refBonusStat) return;
        try {
            const response = await fetch(getApiUrl('/api/referral-bonus'), {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) return;
            const data = await response.json();
            const total = Number(data.totalBonus || 0);
            refBonusStat.textContent = `Rs${total.toFixed(2)}`;
        } catch {
        }
    };

    // 2. Fetch User Data
    try {
        const response = await fetch(getApiUrl('/api/user'), {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Invalid token');
        }

        const user = await response.json();

        // 3. Update UI
        welcomeName.textContent = user.name;
        headerUsername.textContent = user.name;
        userRole.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
        joinDate.textContent = new Date(user.createdAt).toLocaleDateString();
        userInfoHeader.style.display = 'flex';
        const refLinkInput = document.getElementById('refLink');
        if (refLinkInput && user._id) {
            const registerPath = window.location.pathname.includes('.html') ? 'register.html' : 'register';
            refLinkInput.value = `${window.location.origin}/${registerPath}?ref=${user._id}`;
        }

        // 4. Admin Logic
        if (user.role === 'admin') {
            adminSection.style.display = 'block';
            fetchUsers();
            fetchDepositRequests();
        }

        await checkApprovedDepositRequests();
        await checkWithdrawRequests();
        await fetchReferralBonus();
        const pollId = setInterval(async () => {
            const existing = localStorage.getItem('ast_active_plan');
            if (existing) {
                clearInterval(pollId);
                return;
            }
            await checkApprovedDepositRequests();
            await checkWithdrawRequests();
        }, 4000);

    } catch (error) {
        console.error('Auth Error:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    }

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        });
    }

    // Admin: Fetch Users
    async function fetchUsers() {
        try {
            const response = await fetch(getApiUrl('/api/users'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (response.ok) {
                const users = await response.json();
                renderUsers(users);
            }
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    }

    async function fetchDepositRequests() {
        if (!depositRequestsBody) return;
        try {
            const response = await fetch(getApiUrl('/api/deposit-requests'), {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const requests = await response.json();
                lastDepositRequests = Array.isArray(requests) ? requests : [];
                renderDepositRequests(requests);
            } else {
                depositRequestsBody.innerHTML = '';
            }
        } catch (error) {
            console.error('Failed to fetch deposit requests:', error);
        }
    }

    function renderDepositRequests(requests) {
        if (!depositRequestsBody) return;
        depositRequestsBody.innerHTML = '';

        (Array.isArray(requests) ? requests : []).forEach(r => {
            const tr = document.createElement('tr');
            tr.style.borderBottom = '1px solid #333';

            const userText = r.userName ? `${r.userName}\n${r.userEmail || ''}` : (r.userEmail || r.userId || '-');
            const proofBtn = r.proof && r.proof.dataUrl ? `<button class="action-btn" data-action="view-proof" data-id="${r._id}">View</button>` : '-';

            const statusColor = r.status === 'approved' ? '#22c55e' : (r.status === 'rejected' ? '#ef4444' : '#a3e635');
            const statusHtml = `<span style="color:${statusColor}; font-weight:900;">${r.status || 'pending'}</span>`;

            const approveDisabled = r.status === 'approved' ? 'disabled' : '';
            const rejectDisabled = r.status === 'rejected' ? 'disabled' : '';

            tr.innerHTML = `
                <td style="padding: 10px; white-space: pre-line;">${userText}</td>
                <td style="padding: 10px;">${r.planId || '-'}</td>
                <td style="padding: 10px;">${r.amount || '-'}</td>
                <td style="padding: 10px;">${r.method || '-'}</td>
                <td style="padding: 10px;">${r.transactionId || '-'}</td>
                <td style="padding: 10px;">${proofBtn === '-' ? '-' : `<button style="background:#111; border:1px solid rgba(255,255,255,0.2); color:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:800;" data-action="view-proof" data-id="${r._id}">View</button>`}</td>
                <td style="padding: 10px;">${statusHtml}</td>
                <td style="padding: 10px; display:flex; gap:8px; flex-wrap: wrap;">
                    <button style="background:#22c55e; border:none; color:#0b1a0b; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:900;" data-action="approve" data-id="${r._id}" ${approveDisabled}>Approve</button>
                    <button style="background:#ef4444; border:none; color:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:900;" data-action="reject" data-id="${r._id}" ${rejectDisabled}>Reject</button>
                </td>
            `;
            depositRequestsBody.appendChild(tr);
        });

        depositRequestsBody.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', handleDepositRequestAction);
        });
    }

    async function handleDepositRequestAction(e) {
        const action = e.target.dataset.action;
        const id = e.target.dataset.id;
        if (!action || !id) return;

        if (action === 'view-proof') {
            const req = lastDepositRequests.find(r => r && r._id === id);
            const dataUrl = req?.proof?.dataUrl;
            if (dataUrl) window.open(dataUrl, '_blank');
            return;
        }

        const status = action === 'approve' ? 'approved' : 'rejected';
        try {
            const response = await fetch(getApiUrl(`/api/deposit-requests?id=${encodeURIComponent(id)}`), {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ status })
            });
            if (response.ok) {
                fetchDepositRequests();
            }
        } catch (error) {
            console.error('Failed to update deposit request:', error);
        }
    }

    // Admin: Render Users
    function renderUsers(users) {
        usersTableBody.innerHTML = '';
        users.forEach(u => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td><span style="color:${u.role === 'admin' ? 'var(--lime)' : 'inherit'}">${u.role}</span></td>
                <td>${new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                    ${u.role !== 'admin' ? `<button class="action-btn delete-btn" data-id="${u._id}">Delete</button>` : '-'}
                </td>
            `;
            usersTableBody.appendChild(tr);
        });

        // Attach delete handlers
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDelete);
        });
    }

    // Admin: Delete User
    async function handleDelete(e) {
        if (!confirm('Are you sure you want to delete this user?')) return;

        const userId = e.target.dataset.id;
        try {
            const response = await fetch(getApiUrl(`/api/users?id=${userId}`), {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchUsers(); // Refresh list
            } else {
                alert('Failed to delete user');
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    }

    if (refreshUsersBtn) {
        refreshUsersBtn.addEventListener('click', fetchUsers);
    }

    if (refreshDepositRequestsBtn) {
        refreshDepositRequestsBtn.addEventListener('click', fetchDepositRequests);
    }
});

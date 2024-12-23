import { readData } from './background.js';
import crypto from './crypto.js';

class AccountManager {
    constructor() {
        this.accounts = [];
        this.initializeEventListeners();
        this.loadAccounts();
    }

    async loadAccounts() {
        try {
            const data = await readData();
            this.accounts = data.data;
            this.renderAccounts();
        } catch (error) {
            console.error('계정 로드 중 오류:', error);
            alert('데이터 파일을 읽을 수 없습니다.');
        }
    }

    async saveAccounts() {
        try {
            // 계정 데이터 암호화
            const encryptedAccounts = await Promise.all(
                this.accounts.map(async (account) => {
                    if (account.pwd) {
                        const { encrypted, iv } = await crypto.encrypt(account.pwd);
                        return {
                            ...account,
                            pwd: encrypted,
                            iv: iv
                        };
                    }
                    return account;
                })
            );

            const data = {
                data: encryptedAccounts,
                selectedProfile: 0
            };

            // 암호화된 데이터를 파일로 다운로드
            const jsonData = JSON.stringify(data, null, 2);
            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            alert('암호화된 data.json 파일이 다운로드되었습니다. 기존 파일을 교체해주세요.');
            await this.loadAccounts(); // 저장 후 다시 로드
        } catch (error) {
            console.error('계정 저장 중 오류:', error);
            alert('저장 중 오류가 발생했습니다.');
        }
    }

    renderAccounts() {
        const container = document.querySelector('.accounts-list');
        container.innerHTML = '';

        this.accounts.forEach((account, index) => {
            const accountElement = document.createElement('div');
            accountElement.className = 'account-item';
            accountElement.innerHTML = `
                <div class="account-info">
                    <strong>${account.id}</strong> (${this.getServiceName(account.url)})
                </div>
                <div class="account-actions">
                    <button class="btn secondary edit-account" data-index="${index}">수정</button>
                    <button class="btn danger delete-account" data-index="${index}">삭제</button>
                </div>
            `;
            container.appendChild(accountElement);
        });
    }

    getServiceName(url) {
        if (url.includes('google.com')) return 'Google';
        if (url.includes('naver.com')) return 'Naver';
        if (url.includes('coolenjoy.net')) return 'Coolenjoy';
        if (url.includes('inven.co.kr')) return 'Inven';
        if (url.includes('tcafe2a.com')) return 'TCafe';
        if (url.includes('dcinside.com')) return 'DCInside';
        return 'Unknown';
    }

    initializeEventListeners() {
        document.getElementById('addAccount').addEventListener('click', () => {
            document.querySelector('.account-form').classList.remove('hidden');
        });

        document.getElementById('accountForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            document.querySelector('.account-form').classList.add('hidden');
            document.getElementById('accountForm').reset();
        });

        document.querySelector('.accounts-list').addEventListener('click', (e) => {
            if (e.target.classList.contains('edit-account')) {
                const index = e.target.dataset.index;
                this.editAccount(index);
            } else if (e.target.classList.contains('delete-account')) {
                const index = e.target.dataset.index;
                this.deleteAccount(index);
            }
        });
    }

    async handleFormSubmit() {
        const form = document.getElementById('accountForm');
        const newAccount = {
            id: form.accountId.value,
            pwd: form.accountPwd.value,
            url: form.loginUrl.value,
            try: form.autoLogin.checked ? 1 : 0,
            loginUrl: form.loginUrl.value // 필요한 경우 별도의 loginUrl 입력 필드 추가
        };

        if (form.dataset.editIndex) {
            this.accounts[form.dataset.editIndex] = newAccount;
        } else {
            this.accounts.push(newAccount);
        }

        await this.saveAccounts();
        this.renderAccounts();
        form.reset();
        delete form.dataset.editIndex;
        document.querySelector('.account-form').classList.add('hidden');
    }

    editAccount(index) {
        const account = this.accounts[index];
        const form = document.getElementById('accountForm');
        
        form.accountId.value = account.id;
        form.accountPwd.value = account.pwd;
        form.loginUrl.value = account.url;
        form.autoLogin.checked = account.try === 1;
        
        form.dataset.editIndex = index;
        document.querySelector('.account-form').classList.remove('hidden');
    }

    async deleteAccount(index) {
        if (confirm('이 계정을 삭제하겠습니까?')) {
            this.accounts.splice(index, 1);
            await this.saveAccounts();
            this.renderAccounts();
        }
    }
}

// 페이지 로드 시 AccountManager 인스턴스 생성
document.addEventListener('DOMContentLoaded', () => {
    new AccountManager();
}); 
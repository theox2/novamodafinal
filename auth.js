/**
 * auth.js - Sistema de Autenticação (v5.0 - CORRIGIDO)
 * Login, Cadastro, Sessão
 */

class AuthSystem {
  constructor() {
    this.USERS_KEY = 'novamoda_users';
    this.SESSION_KEY = 'novamoda_user';
    this.API_BASE = window.location.origin + '/Novamoda/api';
    this.ADMIN_EMAILS = [
      'admin@novamoda.com',
      'nicollastheodoro97@gmail.com'
    ];
    this.init();
  }

  // ==========================================
  // VALIDAÇÕES
  // ==========================================
  
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validatePassword(password) {
    if (password.length < 6) {
      return { valid: false, message: 'Senha deve ter no mínimo 6 caracteres' };
    }
    return { valid: true };
  }

  isAdmin(email) {
    return this.ADMIN_EMAILS.includes(email.toLowerCase());
  }

  // ==========================================
  // CADASTRO (COM API PHP) - CORRIGIDO
  // ==========================================
  
  async signup(name, email, password, passwordConfirm) {
    name = name.trim();
    email = email.trim().toLowerCase();

    if (!name || name.length < 3) {
      return { success: false, message: 'Nome deve ter no mínimo 3 caracteres' };
    }

    if (!this.validateEmail(email)) {
      return { success: false, message: 'Email inválido' };
    }

    const passValidation = this.validatePassword(password);
    if (!passValidation.valid) {
      return { success: false, message: passValidation.message };
    }

    if (password !== passwordConfirm) {
      return { success: false, message: 'As senhas não conferem' };
    }

    try {
      const response = await fetch(`${this.API_BASE}/auth/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: name,
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (data.success) {
        this.setSession(data.user);
        this.trackEvent('user_signup', { email });
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Erro ao criar conta' };
      }

    } catch (error) {
      console.error('Erro no signup:', error);
      return { success: false, message: 'Erro de conexão com o servidor' };
    }
  }

  // ==========================================
  // LOGIN (COM API PHP) - CORRIGIDO
  // ==========================================
  
  async login(email, password) {
    email = email.trim().toLowerCase();

    if (!this.validateEmail(email) || !password) {
      return { success: false, message: 'Email ou senha inválidos' };
    }

    try {
      const response = await fetch(`${this.API_BASE}/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password
        })
      });

      const data = await response.json();

      if (data.success) {
        this.setSession(data.user);
        this.trackEvent('user_login', { email });
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message || 'Credenciais incorretas' };
      }

    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: 'Erro de conexão com o servidor' };
    }
  }

  // ==========================================
  // SESSÃO LOCAL
  // ==========================================
  
  getSession() {
    try {
      return JSON.parse(localStorage.getItem(this.SESSION_KEY) || 'null');
    } catch {
      return null;
    }
  }

  setSession(user) {
    const sessionData = {
      id: user.id,
      name: user.nome || user.name,
      email: user.email,
      isAdmin: user.isAdmin || this.isAdmin(user.email),
      loginAt: new Date().toISOString()
    };
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    this.updateUI();
  }

  clearSession() {
    localStorage.removeItem(this.SESSION_KEY);
    this.updateUI();
  }

  // ==========================================
  // LOGOUT
  // ==========================================
  
  logout() {
    const session = this.getSession();
    if (session) {
      this.trackEvent('user_logout', { email: session.email });
    }
    this.clearSession();
    this.showToast('Você foi desconectado', 'info');
  }

  // ==========================================
  // PROTEÇÃO DE PÁGINAS - DESATIVADA
  // ==========================================
  
  requireAuth(redirectToLogin = true) {
    return true;
  }

  requireAdmin(redirectToHome = true) {
    return true;
  }

  // ==========================================
  // UI - ATUALIZAR HEADER
  // ==========================================
  
  updateUI() {
    const session = this.getSession();
    
    document.querySelectorAll('.novamoda-user-area').forEach(el => el.remove());

    const userArea = document.createElement('div');
    userArea.className = 'novamoda-user-area';
    userArea.style.cssText = 'display:flex;align-items:center;gap:10px;';

    if (session) {
      const firstName = session.name.split(' ')[0];
      userArea.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;background:#111;padding:8px 12px;border-radius:8px;">
          <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#14d0d6,#0ea5e9);display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;">
            ${firstName[0].toUpperCase()}
          </div>
          <div>
            <div style="color:#fff;font-size:13px;font-weight:600;">Olá, ${this.escapeHtml(firstName)}</div>
            <div style="font-size:11px;color:#888;">${session.isAdmin ? '👑 Admin' : 'Cliente'}</div>
          </div>
        </div>
        ${session.isAdmin ? '<a href="admin.html" class="btn" style="padding:8px 12px;font-size:13px;margin-left:8px;">📊 Admin</a>' : ''}
        <button id="novamoda-logout" class="btn" style="background:#222;color:#aaa;padding:8px 12px;font-size:13px;border:none;border-radius:6px;cursor:pointer;">Sair</button>
      `;
    } else {
      userArea.innerHTML = '<a href="login.html" class="btn entrar-btn">Entrar</a>';
    }

    const rightArea = document.querySelector('.right-area');
    const entrarBtn = document.querySelector('.entrar-btn');
    
    if (entrarBtn) {
      entrarBtn.replaceWith(userArea);
    } else if (rightArea) {
      const icons = rightArea.querySelector('.icons');
      if (icons) {
        rightArea.insertBefore(userArea, icons);
      } else {
        rightArea.appendChild(userArea);
      }
    }

    const logoutBtn = document.getElementById('novamoda-logout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.logout();
        window.location.href = 'index.html';
      });
    }
  }

  // ==========================================
  // MANIPULAR FORMULÁRIOS - CORRIGIDO
  // ==========================================
  
  handleSignupForm(formElement) {
    if (!formElement) return;

    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameField = formElement.querySelector('[name="name"], #signupName, #name');
      const emailField = formElement.querySelector('[name="email"], #signupEmail, #email');
      const passField = formElement.querySelector('[name="password"], #signupPassword, #password');
      const confirmField = formElement.querySelector('[name="passwordConfirm"], #signupPasswordConfirm');

      const name = nameField?.value || '';
      const email = emailField?.value || '';
      const password = passField?.value || '';
      const passwordConfirm = confirmField?.value || '';

      const result = await this.signup(name, email, password, passwordConfirm);

      if (result.success) {
        this.showToast('✓ Conta criada com sucesso!', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1000);
      } else {
        this.showToast(result.message, 'error');
      }
    });
  }

  handleLoginForm(formElement) {
    if (!formElement) return;

    formElement.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailField = formElement.querySelector('[name="email"], #loginEmail, #email');
      const passField = formElement.querySelector('[name="password"], #loginPassword, #password');

      const email = emailField?.value || '';
      const password = passField?.value || '';

      const result = await this.login(email, password);

      if (result.success) {
        this.showToast('✓ Login realizado com sucesso!', 'success');
        
        setTimeout(() => {
          if (result.user && this.isAdmin(result.user.email)) {
            window.location.href = 'admin.html';
          } else {
            const urlParams = new URLSearchParams(window.location.search);
            const next = urlParams.get('next') || 'index.html';
            window.location.href = next;
          }
        }, 1000);
      } else {
        this.showToast(result.message, 'error');
      }
    });
  }

  // ==========================================
  // TOAST - CORRIGIDO
  // ==========================================
  
  showToast(message, type = 'info') {
    const colors = {
      success: '#14d0d6',
      error: '#ff3b30',
      info: '#0ea5e9'
    };

    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      bottom: 30px;
      right: 30px;
      background: ${colors[type]};
      color: ${type === 'error' ? '#fff' : '#000'};
      padding: 16px 24px;
      border-radius: 8px;
      font-weight: 600;
      box-shadow: 0 8px 20px rgba(0,0,0,0.3);
      z-index: 9999;
      animation: slideIn 0.3s ease;
      font-family: Arial, sans-serif;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ==========================================
  // TRACK EVENT
  // ==========================================
  
  trackEvent(eventName, data) {
    console.log(`📊 Event: ${eventName}`, data);
  }

  // ==========================================
  // SANITIZAÇÃO
  // ==========================================
  
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  
  init() {
    const signupForm = document.querySelector('#signupForm, form[name="signup"], form.signup');
    const loginForm = document.querySelector('#loginForm, form[name="login"], form.login');

    if (signupForm) this.handleSignupForm(signupForm);
    if (loginForm) this.handleLoginForm(loginForm);

    this.updateUI();

    window.NovamodaAuth = {
      requireAuth: (redirect) => this.requireAuth(redirect),
      requireAdmin: (redirect) => this.requireAdmin(redirect),
      getSession: () => this.getSession(),
      logout: () => this.logout(),
      isAdmin: (email) => this.isAdmin(email)
    };

    console.log('✅ Auth System v5.0 loaded (FIXED)');
  }
}

// CSS para animações
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(400px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(400px); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Inicializar
const auth = new AuthSystem();
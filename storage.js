/**
 * storage.js - Sistema de armazenamento COM BANCO DE DADOS
 * Remove COMPLETAMENTE o localStorage
 */

const API_BASE = window.location.origin + '/Novamoda/api';

class Storage {
  constructor() {
    this.user = null;
    this.cart = [];
    this.init();
  }

  // ==========================================
  // INICIALIZAÇÃO
  // ==========================================
  async init() {
    // Verificar se usuário está logado (session/cookie)
    const userSession = this.getCookie('novamoda_user');
    if (userSession) {
      this.user = JSON.parse(userSession);
    }
    
    // Carregar carrinho do servidor
    await this.loadCartFromServer();
    
    console.log('✅ Storage inicializado COM BANCO DE DADOS');
  }

  // ==========================================
  // COOKIES (substituem localStorage)
  // ==========================================
  setCookie(name, value, days = 7) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  }

  getCookie(name) {
    return document.cookie.split('; ').reduce((r, v) => {
      const parts = v.split('=');
      return parts[0] === name ? decodeURIComponent(parts[1]) : r;
    }, '');
  }

  deleteCookie(name) {
    this.setCookie(name, '', -1);
  }

  // ==========================================
  // USUÁRIO
  // ==========================================
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE}/auth/login.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        this.setCookie('novamoda_user', JSON.stringify(data.user));
        this.setCookie('novamoda_token', data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: 'Erro de conexão' };
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${API_BASE}/auth/register.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success) {
        this.user = data.user;
        this.setCookie('novamoda_user', JSON.stringify(data.user));
        this.setCookie('novamoda_token', data.token);
        return { success: true, user: data.user };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Erro no cadastro:', error);
      return { success: false, message: 'Erro de conexão' };
    }
  }

  logout() {
    this.user = null;
    this.cart = [];
    this.deleteCookie('novamoda_user');
    this.deleteCookie('novamoda_token');
    window.location.href = 'index.html';
  }

  getUser() {
    return this.user;
  }

  isLoggedIn() {
    return this.user !== null;
  }

  // ==========================================
  // CARRINHO - USA BANCO DE DADOS
  // ==========================================
  async loadCartFromServer() {
    if (!this.user) {
      this.cart = [];
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/carrinho/listar.php?usuario_id=${this.user.id}`);
      const data = await response.json();

      if (data.success && data.data.itens) {
        this.cart = data.data.itens.map(item => ({
          id: item.produto_id,
          name: item.nome_produto,
          price: parseFloat(item.preco_unitario),
          img: item.imagem_url || 'https://via.placeholder.com/400',
          qty: item.quantidade,
          size: item.tamanho,
          color: item.cor
        }));
      } else {
        this.cart = [];
      }
      
      this.updateCartCount();
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      this.cart = [];
    }
  }

  async addToCart(product, qty = 1) {
    if (!this.user) {
      alert('Faça login para adicionar produtos ao carrinho');
      window.location.href = 'login.html';
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/carrinho/adicionar.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: this.user.id,
          produto_id: product.id,
          quantidade: qty,
          tamanho: product.size || null,
          cor: product.color || null
        })
      });

      const data = await response.json();

      if (data.success) {
        await this.loadCartFromServer();
        this.showToast(`✓ ${product.name} adicionado ao carrinho!`, 'success');
        return true;
      } else {
        this.showToast(data.message, 'error');
        return false;
      }
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      this.showToast('Erro ao adicionar produto', 'error');
      return false;
    }
  }

  async updateCartQty(productId, delta) {
    const item = this.cart.find(i => i.id === productId);
    if (!item) return false;

    const newQty = item.qty + delta;
    if (newQty < 1) {
      return this.removeFromCart(productId);
    }

    try {
      const response = await fetch(`${API_BASE}/carrinho/atualizar.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: this.user.id,
          produto_id: productId,
          quantidade: newQty
        })
      });

      const data = await response.json();

      if (data.success) {
        await this.loadCartFromServer();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      return false;
    }
  }

  async removeFromCart(productId) {
    try {
      const response = await fetch(`${API_BASE}/carrinho/remover.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: this.user.id,
          produto_id: productId
        })
      });

      const data = await response.json();

      if (data.success) {
        await this.loadCartFromServer();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao remover do carrinho:', error);
      return false;
    }
  }

  async clearCart() {
    try {
      const response = await fetch(`${API_BASE}/carrinho/remover.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: this.user.id,
          limpar_tudo: true
        })
      });

      const data = await response.json();

      if (data.success) {
        this.cart = [];
        this.updateCartCount();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erro ao limpar carrinho:', error);
      return false;
    }
  }

  getCart() {
    return this.cart;
  }

  getCartTotal() {
    return this.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }

  updateCartCount() {
    const count = this.cart.reduce((sum, item) => sum + item.qty, 0);
    document.querySelectorAll('.cart-count').forEach(el => {
      el.textContent = count;
      el.style.display = count > 0 ? 'inline-block' : 'none';
    });
  }

  // ==========================================
  // PEDIDOS
  // ==========================================
  async saveOrder(orderData) {
    if (!this.user) {
      alert('Faça login para finalizar a compra');
      return null;
    }

    try {
      const response = await fetch(`${API_BASE}/pedidos/criar.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario_id: this.user.id,
          endereco: {
            cep: orderData.cep,
            estado: orderData.state,
            cidade: orderData.city,
            bairro: orderData.neighborhood,
            endereco: orderData.address,
            numero: orderData.number,
            complemento: orderData.complement
          },
          forma_pagamento: orderData.payment,
          itens: this.cart.map(item => ({
            produto_id: item.id,
            nome: item.name,
            quantidade: item.qty,
            tamanho: item.size,
            cor: item.color,
            preco: item.price
          })),
          subtotal: this.getCartTotal(),
          desconto: 0,
          frete: 0,
          total: this.getCartTotal(),
          observacoes: null
        })
      });

      const data = await response.json();

      if (data.success) {
        await this.clearCart();
        return data.pedido;
      } else {
        this.showToast(data.message, 'error');
        return null;
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      this.showToast('Erro ao processar pedido', 'error');
      return null;
    }
  }

  // ==========================================
  // TOAST NOTIFICATIONS
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
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}

// Inicializar storage globalmente
const storage = new Storage();
window.storage = storage;

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
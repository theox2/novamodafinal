/**
 * app.js - Funcionalidades Gerais do Site (v3.0 Otimizado)
 * Gerencia: Loader, Menus, Busca, Newsletter, Animações
 */

// ============================================
// LOADER
// ============================================
window.addEventListener("load", () => {
  const loader = document.getElementById("loader");
  if (loader) {
    setTimeout(() => {
      loader.classList.add("hidden");
      setTimeout(() => loader.style.display = 'none', 400);
    }, 300);
  }
});

// ============================================
// MENU MOBILE
// ============================================
class MobileMenu {
  constructor() {
    this.btn = document.getElementById('menuBtnMobile');
    this.menu = document.getElementById('mobileMenu');
    this.isOpen = false;
    this.init();
  }

  init() {
    if (!this.btn || !this.menu) return;

    this.btn.addEventListener('click', () => this.toggle());

    // Fechar ao clicar em links
    this.menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => this.close());
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
      if (this.isOpen && !this.menu.contains(e.target) && !this.btn.contains(e.target)) {
        this.close();
      }
    });

    // Fechar ao redimensionar
    window.addEventListener('resize', () => {
      if (window.innerWidth > 968) this.close();
    });
  }

  toggle() {
    this.isOpen ? this.close() : this.open();
  }

  open() {
    this.menu.style.display = 'flex';
    this.isOpen = true;
    document.body.style.overflow = 'hidden';
  }

  close() {
    this.menu.style.display = 'none';
    this.isOpen = false;
    document.body.style.overflow = '';
  }
}

// ============================================
// SUBMENU MOBILE
// ============================================
document.querySelectorAll('.mobile-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const sub = btn.nextElementSibling;
    if (sub) {
      const isOpen = sub.style.display === 'block';
      sub.style.display = isOpen ? 'none' : 'block';
      btn.textContent = btn.textContent.replace(isOpen ? '▴' : '▾', isOpen ? '▾' : '▴');
    }
  });
});

// ============================================
// MEGA MENU CATEGORIAS (DESKTOP)
// ============================================
class MegaMenu {
  constructor() {
    this.dropdown = document.getElementById('catDropdown');
    this.init();
  }

  init() {
    if (!this.dropdown) return;

    const toggle = this.dropdown.querySelector('.dropdown-toggle, .nav-link');
    
    toggle?.addEventListener('click', (e) => {
      e.preventDefault();
      this.dropdown.classList.toggle('show');
    });
    
    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
      if (!this.dropdown.contains(e.target)) {
        this.dropdown.classList.remove('show');
      }
    });
    
    // Fechar ao redimensionar
    window.addEventListener('resize', () => {
      this.dropdown.classList.remove('show');
    });
  }
}

// ============================================
// BUSCA COM DEBOUNCE
// ============================================
class Search {
  constructor() {
    this.headerInput = document.getElementById('headerSearch');
    this.mobileInput = document.getElementById('mobileSearch');
    this.resultsBox = document.getElementById('smartSearchResults');
    this.debounceTimer = null;
    this.init();
  }

  init() {
    // Busca header
    this.headerInput?.addEventListener('input', () => this.handleSearch());
    this.headerInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.doSearch(this.headerInput.value);
    });
    document.getElementById('searchBtn')?.addEventListener('click', () => {
      this.doSearch(this.headerInput.value);
    });

    // Busca mobile
    this.mobileInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.doSearch(this.mobileInput.value);
    });
    document.getElementById('mobileSearchBtn')?.addEventListener('click', () => {
      this.doSearch(this.mobileInput.value);
    });

    // Fechar resultados ao clicar fora
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrapper')) {
        this.hideResults();
      }
    });
  }

  handleSearch() {
    clearTimeout(this.debounceTimer);
    
    const query = this.headerInput.value.trim();
    
    if (query.length < 2) {
      this.hideResults();
      return;
    }
    
    // Debounce de 300ms
    this.debounceTimer = setTimeout(() => {
      this.showResults(query);
    }, 300);
  }

  showResults(query) {
    if (!this.resultsBox) return;

    const results = storage.searchProducts(query).slice(0, 6);
    
    if (results.length === 0) {
      this.resultsBox.innerHTML = '<div style="padding:12px;color:#888;text-align:center;">Nenhum resultado</div>';
    } else {
      this.resultsBox.innerHTML = results.map(p => `
        <div onclick="window.location.href='produto.html?id=${p.id}'" 
             style="cursor:pointer;padding:10px;border-bottom:1px solid #222;transition:background .2s;"
             onmouseover="this.style.background='#1a1a1a'"
             onmouseout="this.style.background='transparent'">
          <div style="display:flex;gap:10px;align-items:center;">
            <img src="${p.img}" style="width:40px;height:40px;border-radius:4px;object-fit:cover;">
            <div style="flex:1;">
              <div style="color:#fff;font-weight:600;font-size:13px;">${p.name}</div>
              <div style="color:#14d0d6;font-size:12px;">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
            </div>
          </div>
        </div>
      `).join('');
    }
    
    this.resultsBox.style.display = 'block';
  }

  hideResults() {
    if (this.resultsBox) {
      this.resultsBox.style.display = 'none';
    }
  }

  doSearch(query) {
    const q = query.trim();
    if (!q) return;
    window.location.href = `categorias.html?search=${encodeURIComponent(q)}`;
  }
}

// ============================================
// PRODUTOS NA HOME
// ============================================
function renderProdutos() {
  const grid = document.getElementById('produtosGrid');
  if (!grid) return;
  
  const products = storage.getProducts().slice(0, 6);
  
  if (products.length === 0) {
    grid.innerHTML = '<p style="text-align:center;color:#888;grid-column:1/-1;">Nenhum produto disponível</p>';
    return;
  }
  
  grid.innerHTML = products.map(p => {
    const isFav = storage.isFavorite(p.id);
    return `
      <article class="produto animate" onclick="window.location.href='produto.html?id=${p.id}'" style="cursor:pointer;">
        <div style="position:relative;">
          <img src="${p.img}" alt="${p.name}" loading="lazy" style="width:100%;height:260px;object-fit:cover;display:block;border-radius:12px 12px 0 0;">
          ${p.stock === 0 ? '<div style="position:absolute;top:10px;left:10px;background:#ff3b30;color:#fff;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;">ESGOTADO</div>' : ''}
          ${p.oldPrice ? '<div style="position:absolute;top:10px;left:10px;background:#14d0d6;color:#000;padding:4px 8px;border-radius:4px;font-size:11px;font-weight:700;">PROMOÇÃO</div>' : ''}
          <span class="produto-fav ${isFav ? 'active' : ''}" 
                data-fav="${p.id}"
                onclick="event.stopPropagation();storage.toggleFavorite(${p.id})"
                style="position:absolute;top:10px;right:10px;background:rgba(0,0,0,0.7);color:#fff;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:18px;transition:all .2s;border:2px solid transparent;"
                onmouseover="this.style.borderColor='#14d0d6'"
                onmouseout="this.style.borderColor='transparent'">
            ${isFav ? '❤' : '♡'}
          </span>
        </div>
        <div class="info" style="padding:16px;">
          <div style="font-weight:600;margin-bottom:8px;color:#fff;font-size:14px;">${p.name}</div>
          <div style="display:flex;align-items:center;gap:8px;">
            <p style="color:#14d0d6;font-weight:800;font-size:1.2rem;margin:0;">
              R$ ${p.price.toFixed(2).replace('.', ',')}
            </p>
            ${p.oldPrice ? `<span style="color:#666;text-decoration:line-through;font-size:0.9rem;">R$ ${p.oldPrice.toFixed(2).replace('.', ',')}</span>` : ''}
          </div>
        </div>
      </article>
    `;
  }).join('');
  
  // Trigger animação
  setTimeout(() => {
    document.querySelectorAll('.produto.animate').forEach(el => {
      el.classList.add('show');
    });
  }, 100);
}

// ============================================
// NEWSLETTER
// ============================================
class Newsletter {
  constructor() {
    this.form = document.getElementById('newsletterForm');
    this.init();
  }

  init() {
    if (!this.form) return;

    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const emailInput = document.getElementById('newsletterEmail');
      const email = emailInput?.value.trim();
      
      if (!email || !this.validateEmail(email)) {
        storage.showToast('Digite um email válido', 'error');
        return;
      }
      
      const subscribers = JSON.parse(localStorage.getItem('newsletter_subscribers') || '[]');
      
      if (subscribers.includes(email)) {
        storage.showToast('Este email já está cadastrado!', 'info');
      } else {
        subscribers.push(email);
        localStorage.setItem('newsletter_subscribers', JSON.stringify(subscribers));
        storage.showToast('✓ Inscrito com sucesso!', 'success');
        storage.trackEvent('newsletter_signup', { email });
      }
      
      this.form.reset();
    });
  }

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// ============================================
// HEADER SCROLL (HIDE/SHOW)
// ============================================
class HeaderScroll {
  constructor() {
    this.header = document.querySelector('.header');
    this.lastScroll = 0;
    this.init();
  }

  init() {
    if (!this.header) return;

    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  handleScroll() {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > this.lastScroll && currentScroll > 100) {
      // Scrolling down
      this.header.style.transform = 'translateY(-100%)';
    } else {
      // Scrolling up
      this.header.style.transform = 'translateY(0)';
    }
    
    this.lastScroll = currentScroll <= 0 ? 0 : currentScroll;
  }
}

// ============================================
// ANIMAÇÕES AO SCROLL
// ============================================
class ScrollAnimations {
  constructor() {
    this.init();
  }

  init() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show");
          // Desconecta após animar (performance)
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    // Observar elementos com .animate
    document.querySelectorAll(".animate, .cat-img").forEach(el => {
      observer.observe(el);
    });
  }
}

// ============================================
// INICIALIZAÇÃO
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  new MobileMenu();
  new MegaMenu();
  new Search();
  new Newsletter();
  new HeaderScroll();
  new ScrollAnimations();
  
  // Renderizar produtos na home
  if (document.getElementById('produtosGrid')) {
    renderProdutos();
  }

  // Log de inicialização
  console.log('%c🚀 NovaModa v3.0', 'color: #14d0d6; font-size: 20px; font-weight: bold;');
  console.log(`Storage: ${storage.getStorageSize()}`);
});

// Expor para debug no console
window.app = {
  storage,
  version: '3.0',
  clearData: () => storage.clearAllData(),
  exportData: () => storage.exportData()
};
// Expor para debug no console
window.app = {
  storage,
  version: '3.0',
  clearData: () => storage.clearAllData(),
  exportData: () => storage.exportData()
};

// Atalho global para admin (Ctrl+Shift+A)
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'A') {
    e.preventDefault();
    window.location.href = 'admin.html';
  }
});
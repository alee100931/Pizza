// js/cart.js
// Simple cart stored in localStorage under "cart"
(function () {
  const KEY = 'cart';

  function getCart() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; } 
    catch { return []; }
  }
  function saveCart(cart) { localStorage.setItem(KEY, JSON.stringify(cart)); }

  function findIndex(cart, id) { return cart.findIndex(i => i.id === id); }

  window.cartAdd = function (item) {
    const cart = getCart();
    const idx = findIndex(cart, item.id);
    if (idx >= 0) {
      cart[idx].qty = (cart[idx].qty || 1) + (item.qty || 1);
    } else {
      cart.push(Object.assign({ qty: 1 }, item));
    }
    saveCart(cart);
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
  };

  window.cartRemove = function (id) {
    const cart = getCart().filter(i => i.id !== id);
    saveCart(cart);
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
  };

  window.cartSetQty = function (id, qty) {
    const cart = getCart();
    const idx = findIndex(cart, id);
    if (idx >= 0) {
      cart[idx].qty = Math.max(0, Math.floor(qty));
      if (cart[idx].qty === 0) cart.splice(idx, 1);
      saveCart(cart);
      window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }));
    }
  };

  window.cartClear = function () { saveCart([]); window.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart: [] } })); };

  window.cartTotal = function () {
    return getCart().reduce((s, i) => s + (Number(i.price) || 0) * (i.qty || 1), 0);
  };

  window.getCartItems = getCart; // expose for checkout page

  window.renderCart = function (containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const cart = getCart();
    if (!cart.length) {
      container.innerHTML = '<p>Your cart is empty.</p>';
      return;
    }

    const rows = cart.map(item => {
      const subtotal = ((Number(item.price) || 0) * (item.qty || 1)).toFixed(2);
      return `
      <div class="cart-row" data-id="${item.id}">
        <div class="cart-info">
          ${item.image ? `<img src="${item.image}" class="cart-thumb" alt="">` : ''}
          <div class="cart-meta">
            <div class="cart-title">${item.title}</div>
            <div class="cart-price">$${Number(item.price).toFixed(2)}</div>
          </div>
        </div>
        <div class="cart-controls">
          <input type="number" class="cart-qty" min="0" value="${item.qty}" data-id="${item.id}">
          <div class="cart-sub">$${subtotal}</div>
          <button class="cart-remove" data-id="${item.id}">Remove</button>
        </div>
      </div>`;
    }).join('');

    const total = window.cartTotal().toFixed(2);
    container.innerHTML = `
      <div class="cart-rows">${rows}</div>
      <div class="cart-summary">
        <strong>Total: $${total}</strong>
        <div class="cart-actions">
          <button id="cart-clear">Clear</button>
          <button id="cart-checkout">Proceed to Checkout</button>
        </div>
      </div>
    `;

    container.querySelectorAll('.cart-qty').forEach(el => {
      el.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const qty = Number(e.target.value) || 0;
        window.cartSetQty(id, qty);
        renderCart(containerId);
      });
    });

    container.querySelectorAll('.cart-remove').forEach(el => {
      el.addEventListener('click', (e) => {
        window.cartRemove(e.target.dataset.id);
        renderCart(containerId);
      });
    });

    const clearBtn = container.querySelector('#cart-clear');
    if (clearBtn) clearBtn.addEventListener('click', () => { window.cartClear(); renderCart(containerId); });

    const checkoutBtn = container.querySelector('#cart-checkout');
    if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
      // Scroll to checkout form if present
      const form = document.getElementById('checkout-form');
      if (form) form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  window.attachAddToCartButtons = function (selector = '.add-to-cart') {
    document.querySelectorAll(selector).forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const el = e.currentTarget;
        const item = {
          id: el.dataset.id || el.getAttribute('data-id') || (el.dataset.title || Math.random().toString(36).slice(2)),
          title: el.dataset.title || el.getAttribute('data-title') || el.textContent.trim(),
          price: el.dataset.price || el.getAttribute('data-price') || '0',
          image: el.dataset.image || el.getAttribute('data-image') || '',
          qty: Number(el.dataset.qty) || 1
        };
        window.cartAdd(item);
        el.classList.add('added');
        setTimeout(() => el.classList.remove('added'), 700);
      });
    });
  };

  document.addEventListener('DOMContentLoaded', () => {
    window.attachAddToCartButtons();
    if (document.getElementById('cart-container')) renderCart('cart-container');
    function updateCount() {
      const countEls = document.querySelectorAll('[data-cart-count]');
      const count = getCart().reduce((s,i)=> s + (i.qty||0), 0);
      countEls.forEach(el => el.textContent = count);
    }
    updateCount();
    window.addEventListener('cart:updated', () => {
      updateCount();
      if (document.getElementById('cart-container')) renderCart('cart-container');
    });
  });

})();
/**
 * HyM Multiservices - Sistema de Carrito de Compras
 * Almacenamiento persistente en localStorage y finalización de pedido por WhatsApp
 */

(function () {
  const STORAGE_KEY = 'hym_cart';
  const WHATSAPP_PHONE = '18293488924';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    updateCartUI();
  }

  function addToCart(product, qty = 1) {
    const cart = getCart();
    const existingIndex = cart.findIndex(item => item.id == product.id);

    if (existingIndex > -1) {
      cart[existingIndex].quantity += qty;
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: parseFloat(product.price) || 0,
        regular_price: product.regular_price ? parseFloat(product.regular_price) : null,
        image_url: product.image_url || '/wp-content/uploads/woocommerce-placeholder.png',
        sku: product.sku || '',
        quantity: qty
      });
    }

    saveCart(cart);
    showCartToast(`✓ "${product.title}" agregado al carrito`);
    openCartDrawer();
  }

  function updateQuantity(productId, delta) {
    const cart = getCart();
    const item = cart.find(i => i.id == productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    saveCart(cart);
  }

  function removeFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(i => i.id != productId);
    saveCart(cart);
    showCartToast('Producto eliminado del carrito', 'info');
  }

  function clearCart() {
    if (confirm('¿Deseas vaciar todos los productos del carrito?')) {
      saveCart([]);
      showCartToast('Carrito vaciado', 'info');
    }
  }

  function getCartTotal() {
    const cart = getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function getCartCount() {
    const cart = getCart();
    return cart.reduce((count, item) => count + item.quantity, 0);
  }

  function checkoutWhatsApp() {
    const cart = getCart();
    if (cart.length === 0) {
      alert('Tu carrito está vacío.');
      return;
    }

    const customerNameInput = document.getElementById('hymCustomerName');
    const customerName = customerNameInput ? customerNameInput.value.trim() : '';

    let text = `🛒 *Nuevo Pedido - HyM Multiservices*\n`;
    if (customerName) {
      text += `👤 *Cliente:* ${customerName}\n`;
    }
    text += `📅 *Fecha:* ${new Date().toLocaleDateString()}\n`;
    text += `----------------------------------------\n`;

    cart.forEach((item, index) => {
      const itemTotal = (item.price * item.quantity).toLocaleString();
      text += `${index + 1}. *${item.title}*\n`;
      text += `   Cant: ${item.quantity} × RD$ ${item.price.toLocaleString()} = *RD$ ${itemTotal}*\n`;
      if (item.sku) text += `   SKU: ${item.sku}\n`;
    });

    text += `----------------------------------------\n`;
    text += `💰 *TOTAL A PAGAR:* RD$ ${getCartTotal().toLocaleString()}\n\n`;
    text += `¿Tienen disponibilidad de estos artículos para coordinar la entrega? Muchas gracias.`;


    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  // UI Drawer Rendering
  function injectCartStyles() {
    if (document.getElementById('hym-cart-styles')) return;
    const style = document.createElement('style');
    style.id = 'hym-cart-styles';
    style.textContent = `
      /* Header Cart Button Styling */
      .hym-header-cart-btn {
        display: inline-flex !important;
        align-items: center !important;
        gap: 8px !important;
        background: #0a4d8c !important;
        color: #ffffff !important;
        border: none !important;
        padding: 8px 18px !important;
        border-radius: 50px !important;
        font-family: 'Montserrat', sans-serif !important;
        font-weight: 700 !important;
        font-size: 0.85rem !important;
        cursor: pointer !important;
        transition: all 0.25s ease !important;
        box-shadow: 0 4px 10px rgba(10, 77, 140, 0.25) !important;
        text-decoration: none !important;
      }
      .hym-header-cart-btn:hover {
        background: #073866 !important;
        transform: translateY(-1px) !important;
        box-shadow: 0 6px 14px rgba(10, 77, 140, 0.35) !important;
      }
      .hym-cart-badge {
        background: #e53935 !important;
        color: #ffffff !important;
        font-size: 0.72rem !important;
        font-weight: 800 !important;
        padding: 2px 7px !important;
        border-radius: 50px !important;
        min-width: 18px !important;
        text-align: center !important;
      }

      /* Cart Drawer Backdrop & Panel */
      #hymCartBackdrop {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 999999;
        display: none;
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      #hymCartBackdrop.open {
        display: block;
        opacity: 1;
      }

      #hymCartDrawer {
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        max-width: 440px;
        background: #ffffff;
        box-shadow: -6px 0 24px rgba(0,0,0,0.2);
        z-index: 1000000;
        display: flex;
        flex-direction: column;
        transform: translateX(100%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        font-family: 'Noto Sans', sans-serif;
      }
      #hymCartDrawer.open {
        transform: translateX(0);
      }

      .hym-drawer-header {
        padding: 20px 24px;
        border-bottom: 1px solid #e2e8f0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #0a4d8c;
        color: #ffffff;
      }
      .hym-drawer-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 1.15rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .hym-drawer-close {
        background: rgba(255, 255, 255, 0.15);
        border: none;
        color: white;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .hym-drawer-close:hover {
        background: rgba(255, 255, 255, 0.3);
      }

      .hym-drawer-body {
        flex: 1;
        overflow-y: auto;
        padding: 20px;
      }

      .hym-cart-item {
        display: flex;
        gap: 14px;
        padding: 14px 0;
        border-bottom: 1px solid #f1f5f9;
        align-items: center;
      }
      .hym-cart-item-img {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
        object-fit: contain;
        flex-shrink: 0;
      }
      .hym-cart-item-info {
        flex: 1;
        min-width: 0;
      }
      .hym-cart-item-title {
        font-weight: 700;
        font-size: 0.9rem;
        color: #1e293b;
        margin-bottom: 4px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .hym-cart-item-price {
        font-size: 0.85rem;
        font-weight: 700;
        color: #0a4d8c;
      }
      .hym-cart-qty-ctrl {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 8px;
      }
      .hym-qty-btn {
        width: 26px;
        height: 26px;
        border-radius: 6px;
        border: 1px solid #cbd5e1;
        background: #f8fafc;
        font-weight: 700;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.85rem;
        color: #334155;
      }
      .hym-qty-btn:hover {
        background: #e2e8f0;
      }
      .hym-qty-val {
        font-weight: 700;
        font-size: 0.9rem;
        min-width: 24px;
        text-align: center;
      }
      .hym-cart-remove-btn {
        background: none;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        padding: 6px;
        font-size: 1rem;
        transition: color 0.2s;
      }
      .hym-cart-remove-btn:hover {
        color: #ef4444;
      }

      .hym-drawer-footer {
        padding: 20px 24px;
        border-top: 1px solid #e2e8f0;
        background: #fafbfc;
      }
      .hym-cart-subtotal-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        font-size: 0.9rem;
        color: #64748b;
      }
      .hym-cart-total-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 18px;
        font-family: 'Montserrat', sans-serif;
        font-size: 1.25rem;
        font-weight: 800;
        color: #0f172a;
      }
      .hym-btn-checkout {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        background: #25D366;
        color: white;
        border: none;
        padding: 14px;
        border-radius: 10px;
        font-family: 'Montserrat', sans-serif;
        font-size: 1rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(37, 211, 102, 0.3);
        transition: all 0.2s;
        text-decoration: none;
      }
      .hym-btn-checkout:hover {
        background: #1eb856;
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(37, 211, 102, 0.4);
      }
      .hym-btn-clear {
        display: block;
        width: 100%;
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 0.8rem;
        margin-top: 10px;
        cursor: pointer;
        text-align: center;
        text-decoration: underline;
      }
      .hym-btn-clear:hover {
        color: #ef4444;
      }

      .hym-empty-cart {
        text-align: center;
        padding: 60px 20px;
        color: #64748b;
      }
      .hym-empty-cart svg {
        width: 64px;
        height: 64px;
        fill: #cbd5e1;
        margin-bottom: 16px;
      }

      /* Cart Toast Notification */
      #hymCartToast {
        position: fixed;
        bottom: 24px;
        left: 24px;
        background: #0f172a;
        color: white;
        padding: 12px 20px;
        border-radius: 10px;
        box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        z-index: 10000000;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
        font-weight: 600;
        transform: translateY(100px);
        opacity: 0;
        transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        pointer-events: none;
      }
      #hymCartToast.show {
        transform: translateY(0);
        opacity: 1;
      }
    `;
    document.head.appendChild(style);
  }

  function injectCartDrawer() {
    if (document.getElementById('hymCartDrawer')) return;

    const backdrop = document.createElement('div');
    backdrop.id = 'hymCartBackdrop';
    backdrop.onclick = closeCartDrawer;
    document.body.appendChild(backdrop);

    const drawer = document.createElement('div');
    drawer.id = 'hymCartDrawer';
    drawer.innerHTML = `
      <div class="hym-drawer-header">
        <div class="hym-drawer-title">
          <svg style="width: 20px; height: 20px; fill: currentColor;" viewBox="0 0 576 512">
            <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
          </svg>
          Tu Carrito (<span id="hymDrawerCount">0</span>)
        </div>
        <button class="hym-drawer-close" onclick="window.hymCart.close()">&times;</button>
      </div>

      <div class="hym-drawer-body" id="hymCartItemsContainer">
        <!-- Rendered items -->
      </div>

      <div class="hym-drawer-footer" id="hymCartFooter">
        <div style="margin-bottom: 12px;">
          <input type="text" id="hymCustomerName" placeholder="Tu nombre para el pedido (opcional)" 
            style="width: 100%; padding: 9px 12px; border: 1px solid #cbd5e1; border-radius: 8px; font-size: 0.85rem; font-family: inherit;">
        </div>
        <div class="hym-cart-subtotal-row">
          <span>Artículos:</span>
          <span id="hymCartItemsQty">0</span>
        </div>
        <div class="hym-cart-total-row">
          <span>Total:</span>
          <span id="hymCartTotalPrice" style="color: #0a4d8c;">RD$ 0</span>
        </div>
        <button class="hym-btn-checkout" onclick="window.hymCart.checkoutWhatsApp()">
          <svg style="width: 20px; height: 20px; fill: currentColor;" viewBox="0 0 448 512">
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
          </svg>
          Pedir por WhatsApp
        </button>
        <button class="hym-btn-clear" onclick="window.hymCart.clear()">Vaciar carrito</button>
      </div>
    `;
    document.body.appendChild(drawer);

    const toast = document.createElement('div');
    toast.id = 'hymCartToast';
    document.body.appendChild(toast);
  }

  function openCartDrawer() {
    injectCartDrawer();
    document.getElementById('hymCartBackdrop').classList.add('open');
    document.getElementById('hymCartDrawer').classList.add('open');
    renderCartDrawerItems();
  }

  function closeCartDrawer() {
    const backdrop = document.getElementById('hymCartBackdrop');
    const drawer = document.getElementById('hymCartDrawer');
    if (backdrop) backdrop.classList.remove('open');
    if (drawer) drawer.classList.remove('open');
  }

  function renderCartDrawerItems() {
    const cart = getCart();
    const container = document.getElementById('hymCartItemsContainer');
    const footer = document.getElementById('hymCartFooter');
    const drawerCount = document.getElementById('hymDrawerCount');

    if (!container) return;

    drawerCount.textContent = getCartCount();

    if (cart.length === 0) {
      container.innerHTML = `
        <div class="hym-empty-cart">
          <svg viewBox="0 0 576 512">
            <path d="M0 24C0 10.7 10.7 0 24 0H69.5c22 0 41.5 12.8 50.6 32h411c26.3 0 45.5 25 38.6 50.4l-41 152.3c-8.5 31.4-37 53.3-69.5 53.3H170.7l5.4 28.5c2.2 11.3 12.1 19.5 23.6 19.5H488c13.3 0 24 10.7 24 24s-10.7 24-24 24H199.7c-34.6 0-64.3-24.6-70.7-58.5L77.4 54.5c-.7-3.8-4-6.5-7.9-6.5H24C10.7 48 0 37.3 0 24zM128 464a48 48 0 1 1 96 0 48 48 0 1 1 -96 0zm336-48a48 48 0 1 1 0 96 48 48 0 1 1 0-96z"/>
          </svg>
          <p style="font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 6px;">Tu carrito está vacío</p>
          <p style="font-size: 0.85rem; margin-bottom: 18px;">Agrega teléfonos o accesorios desde nuestro catálogo.</p>
          <a href="/shop" onclick="window.hymCart.close()" style="display: inline-block; background: #0a4d8c; color: white; padding: 10px 20px; border-radius: 8px; font-size: 0.85rem; font-weight: 700; text-decoration: none;">
            Ver Catálogo
          </a>
        </div>
      `;
      if (footer) footer.style.display = 'none';
      return;
    }

    if (footer) footer.style.display = 'block';

    container.innerHTML = cart.map(item => `
      <div class="hym-cart-item">
        <img src="${item.image_url}" class="hym-cart-item-img" alt="${escapeHtml(item.title)}" onerror="this.src='/wp-content/uploads/woocommerce-placeholder.png'">
        <div class="hym-cart-item-info">
          <div class="hym-cart-item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</div>
          <div class="hym-cart-item-price">RD$ ${Number(item.price).toLocaleString()}</div>
          <div class="hym-cart-qty-ctrl">
            <button class="hym-qty-btn" onclick="window.hymCart.updateQty(${item.id}, -1)">−</button>
            <span class="hym-qty-val">${item.quantity}</span>
            <button class="hym-qty-btn" onclick="window.hymCart.updateQty(${item.id}, 1)">+</button>
            <span style="font-size: 0.78rem; color: #64748b; margin-left: 8px;">
              = <strong>RD$ ${(item.price * item.quantity).toLocaleString()}</strong>
            </span>
          </div>
        </div>
        <button class="hym-cart-remove-btn" onclick="window.hymCart.remove(${item.id})" title="Eliminar">&times;</button>
      </div>
    `).join('');

    const itemsQty = document.getElementById('hymCartItemsQty');
    const totalPrice = document.getElementById('hymCartTotalPrice');
    if (itemsQty) itemsQty.textContent = `${getCartCount()} unid.`;
    if (totalPrice) totalPrice.textContent = `RD$ ${getCartTotal().toLocaleString()}`;
  }

  }

  function updateCartUI() {
    const count = getCartCount();
    // Update badge in header
    const badges = document.querySelectorAll('.hym-cart-badge, #hymCartBadge');
    badges.forEach(b => {
      b.textContent = count;
      b.style.display = count > 0 ? 'inline-block' : 'none';
    });

    renderCartDrawerItems();
  }

  function showCartToast(msg) {
    const toast = document.getElementById('hymCartToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Bind to header cart buttons
  function bindHeaderButtons() {
    const cartButtons = document.querySelectorAll('.ast-header-button-1, .ast-custom-button-link, a[href="#cart"], a[href="/cart/"]');
    cartButtons.forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        openCartDrawer();
      };
    });
  }

  // Public API
  window.hymCart = {
    add: addToCart,
    remove: removeFromCart,
    updateQty: updateQuantity,
    clear: clearCart,
    open: openCartDrawer,
    close: closeCartDrawer,
    checkoutWhatsApp: checkoutWhatsApp,
    getCart: getCart,
    getCount: getCartCount,
    getTotal: getCartTotal
  };

  document.addEventListener('DOMContentLoaded', () => {
    injectCartStyles();
    injectCartDrawer();
    bindHeaderButtons();
    updateCartUI();
  });
})();

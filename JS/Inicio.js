// ============ SUCURSALES (datos estáticos) ============
const sucursalesGrid = document.getElementById("sucursales-grid");
if (sucursalesGrid) {
  const sucursales = [
    { name: "GBC Centro", address: "Av. Juárez 245, Centro Histórico", phone: "(55) 1234-5678", hours: "24 horas" },
    { name: "GBC Polanco", address: "Av. Presidente Masaryk 122, Polanco", phone: "(55) 2345-6789", hours: "7:00 - 23:00" },
    { name: "GBC Sur", address: "Insurgentes Sur 1898, San Ángel", phone: "(55) 3456-7890", hours: "24 horas" },
    { name: "GBC Norte", address: "Av. Universidad 1000, Coyoacán", phone: "(55) 4567-8901", hours: "8:00 - 22:00" },
    { name: "GBC Reforma", address: "Paseo de la Reforma 350, Juárez", phone: "(55) 5678-9012", hours: "24 horas" },
    { name: "GBC Condesa", address: "Av. Tamaulipas 90, Condesa", phone: "(55) 6789-0123", hours: "7:00 - 23:00" },
    { name: "GBC Roma", address: "Álvaro Obregón 185, Roma Norte", phone: "(55) 7890-1234", hours: "8:00 - 22:00" },
    { name: "GBC Santa Fe", address: "Av. Vasco de Quiroga 3800, Santa Fe", phone: "(55) 8901-2345", hours: "24 horas" },
    { name: "GBC Satélite", address: "Cto. Centro Comercial 2251, Naucalpan", phone: "(55) 9012-3456", hours: "8:00 - 22:00" },
    { name: "GBC Interlomas", address: "Blvd. Interlomas 5, Huixquilucan", phone: "(55) 0123-4567", hours: "7:00 - 23:00" },
    { name: "GBC Pedregal", address: "Periférico Sur 4690, Pedregal", phone: "(55) 1357-2468", hours: "24 horas" },
    { name: "GBC Aeropuerto", address: "Terminal 2 AICM, Local 45", phone: "(55) 2468-1357", hours: "24 horas" },
  ];

  sucursalesGrid.innerHTML = sucursales.map(s => `
    <div class="card">
      <div class="icon-circle accent">📍</div>
      <h3>${s.name}</h3>
      <p class="desc">${s.address}</p>
      <div style="margin-top:14px;padding-top:14px;border-top:1px solid var(--border);display:flex;flex-direction:column;gap:6px">
        <div style="font-size:14px"><span class="text-accent">📞</span> ${s.phone}</div>
        <div style="font-size:14px"><span class="text-accent">⏰</span> ${s.hours}</div>
      </div>
    </div>
  `).join("");
}

// ============ AÑO DEL FOOTER ============
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// ============ MENÚ MÓVIL ============
function toggleMenu() {
  const menu = document.getElementById("mobile-menu");
  if (menu) menu.classList.toggle("open");
}

// ============ MENÚ DE USUARIO ============
function toggleUserMenu() {
  const dropdown = document.getElementById("user-dropdown");
  if (dropdown) dropdown.classList.toggle("open");
}

document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("user-dropdown");
  const btn = document.getElementById("user-menu-btn");
  if (dropdown && btn && !btn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove("open");
  }
});

// ============ TOAST NOTIFICATIONS ============
function showToast(message, type = "success") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const icons = { success: "✅", error: "❌", info: "ℹ️" };
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${icons[type] || "ℹ️"} ${message}</span>
    <button onclick="this.parentElement.remove()">✕</button>
  `;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ============ CARRITO DE COMPRAS ============
let cart = JSON.parse(localStorage.getItem("gbc_cart") || "[]");

function saveCart() {
  localStorage.setItem("gbc_cart", JSON.stringify(cart));
  updateCartUI();
}

function updateCartUI() {
  const badge = document.querySelector(".cart-badge");
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  if (badge) {
    badge.textContent = totalItems;
    badge.classList.toggle("show", totalItems > 0);
  }

  const countEl = document.getElementById("drawer-count");
  if (countEl) countEl.textContent = totalItems;

  const body = document.getElementById("drawer-body");
  const foot = document.getElementById("drawer-foot");
  if (!body || !foot) return;

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="drawer-empty">
        <div class="empty-cart-icon">🛒</div>
        <p>Tu carrito está vacío</p>
        <small>Agrega productos para comenzar</small>
      </div>
    `;
    foot.style.display = "none";
    return;
  }

  body.innerHTML = cart.map((item, i) => `
    <div class="drawer-item">
      <div class="drawer-item-img"><div class="rx-small">Rx</div></div>
      <div class="drawer-item-info">
        <strong>${item.name}</strong>
        <div class="drawer-item-price">$${item.price} × ${item.qty}</div>
      </div>
      <div class="drawer-item-actions">
        <button class="qty-btn" onclick="changeQty(${i}, -1)">−</button>
        <span class="qty-num">${item.qty}</span>
        <button class="qty-btn" onclick="changeQty(${i}, 1)">+</button>
        <button class="remove-btn" onclick="removeFromCart(${i})">🗑️</button>
      </div>
    </div>
  `).join("");

  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalEl = document.getElementById("drawer-total");
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  foot.style.display = "block";
}

function addToCart(name, price) {
  const existing = cart.find(item => item.name === name);
  if (existing) {
    existing.qty++;
  } else {
    cart.push({ name, price, qty: 1 });
  }
  saveCart();
  showToast(`${name} agregado al carrito`);

  const cartBtn = document.querySelector(".cart-btn");
  if (cartBtn) {
    cartBtn.classList.add("pulse-anim");
    setTimeout(() => cartBtn.classList.remove("pulse-anim"), 400);
  }
}

function removeFromCart(index) {
  showToast(`${cart[index].name} eliminado del carrito`, "info");
  cart.splice(index, 1);
  saveCart();
}

function changeQty(index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) return removeFromCart(index);
  saveCart();
}

function clearCart() {
  cart = [];
  saveCart();
  showToast("Carrito vaciado", "info");
}

async function checkout() {
  if (cart.length === 0) return;
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  try {
    const res = await fetch("/api/pedido", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: cart, total }),
    });
    const data = await res.json();
    if (data.success) {
      showToast(`¡Pedido #${data.pedidoId} confirmado! Total: $${total.toFixed(2)}`);
      cart = [];
      saveCart();
      closeDrawer();
    } else {
      showToast("Error al procesar el pedido", "error");
    }
  } catch {
    showToast("Error de conexión. Intenta de nuevo.", "error");
  }
}

// ============ DRAWER ============
function openDrawer() {
  document.getElementById("drawer")?.classList.add("open");
  document.getElementById("drawer-overlay")?.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeDrawer() {
  document.getElementById("drawer")?.classList.remove("open");
  document.getElementById("drawer-overlay")?.classList.remove("open");
  document.body.style.overflow = "";
}

// ============ CONTACTO FEEDBACK ============
(function () {
  const contacto = new URLSearchParams(window.location.search).get("contacto");
  if (contacto === "enviado") showToast("¡Mensaje enviado! Te responderemos pronto.");
  else if (contacto === "error") showToast("Error al enviar el mensaje.", "error");
})();

// ============ SCROLL ANIMATIONS ============
const observer = new IntersectionObserver(
  (entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("visible"); observer.unobserve(e.target); }
  }),
  { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
);
document.querySelectorAll(".fade-up, .card, .stat, .value").forEach((el) => observer.observe(el));

// ============ INICIALIZAR ============
updateCartUI();

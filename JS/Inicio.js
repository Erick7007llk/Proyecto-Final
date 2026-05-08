const ofertas = [
    { name: "Vitamina C 1000mg", desc: "Frasco con 60 tabletas", price: 189, old: 249, discount: "-25%", category: "Vitaminas" },
    { name: "Paracetamol 500mg", desc: "Caja con 20 tabletas", price: 45, old: 65, discount: "-30%", category: "Analgésicos" },
    { name: "Crema hidratante", desc: "Cuidado facial 200ml", price: 320, old: 450, discount: "-29%", category: "Dermocosmética" },
    { name: "Termómetro digital", desc: "Medición rápida", price: 199, old: 299, discount: "-33%", category: "Cuidado" },
    { name: "Multivitamínico", desc: "Energía diaria 30 cápsulas", price: 280, old: 380, discount: "-26%", category: "Vitaminas" },
    { name: "Alcohol gel 1L", desc: "Antibacterial 70°", price: 89, old: 125, discount: "-29%", category: "Higiene" },
  ];
  document.getElementById("ofertas-grid").innerHTML = ofertas.map(o => `
    <article class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <span class="cat-pill" style="color:rgba(17,48,95,.7)">${o.category}</span>
        <span class="discount-pill">${o.discount}</span>
      </div>
      <div class="offer-img"><div class="rx">Rx</div></div>
      <h3>${o.name}</h3>
      <p class="desc">${o.desc}</p>
      <div class="row">
        <div><span class="price price-accent">$${o.price}</span><span class="price-old">$${o.old}</span></div>
        <button class="btn btn-primary btn-sm" onclick="addToCart('${o.name.replace(/'/g,"\\'")}', ${o.price})">Comprar</button>
      </div>
    </article>
  `).join("");

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
  document.getElementById("sucursales-grid").innerHTML = sucursales.map(s => `
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

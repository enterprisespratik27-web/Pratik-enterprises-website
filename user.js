async function api(path, options = {}) {
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    credentials: "same-origin",
    ...options
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed");
  return data;
}

function setupUserLogin() {
  const form = document.querySelector("#userLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#userLoginMessage");
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    if (!name) {
      message.textContent = "Please enter your name.";
      return;
    }

    try {
      await api("/api/user/login", {
        method: "POST",
        body: JSON.stringify({ name })
      });
    } catch (error) {
      sessionStorage.setItem("pe_user_name", name);
    }
    window.location.href = "user.html";
  });
}

function productCard(product) {
  return `
    <article class="product-card">
      <div class="product-image-wrap">
        <img src="${product.image}" alt="${product.name}">
      </div>
      <div class="product-body">
        <h3>${product.name}</h3>
        <p>${product.details}</p>
        <a class="button secondary" target="_blank" rel="noopener" href="https://wa.me/918459360535?text=${encodeURIComponent(`Hello Pratik Enterprises, I would like information about ${product.name}.`)}">Contact Now</a>
      </div>
    </article>
  `;
}

async function setupUserPage() {
  const grid = document.querySelector("#userProductGrid");
  if (!grid) return;

  let loggedIn = Boolean(sessionStorage.getItem("pe_user_name"));
  try {
    const session = await api("/api/me");
    loggedIn = Boolean(session.user) || loggedIn;
  } catch {}

  if (!loggedIn) {
    window.location.href = "user-login.html";
    return;
  }

  let products = Array.isArray(window.pratikProducts) ? window.pratikProducts : [];
  try {
    const data = await api("/api/products");
    if (Array.isArray(data.products)) products = data.products;
  } catch {}

  grid.innerHTML = products.map(productCard).join("");
  setupChatbot(products);

  document.querySelector("#userLogout")?.addEventListener("click", async () => {
    sessionStorage.removeItem("pe_user_name");
    try {
      await api("/api/logout", { method: "POST" });
    } catch {}
    window.location.href = "user-login.html";
  });
}

function addMessage(text, from = "bot") {
  const messages = document.querySelector("#chatMessages");
  const bubble = document.createElement("div");
  bubble.className = `chat-bubble ${from}`;
  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

function botReply(message, products) {
  const text = message.toLowerCase();
  if (text.includes("price") || text.includes("rate")) {
    return "Prices depend on planter size, finish, and quantity. Please use Contact Now or WhatsApp for exact pricing.";
  }
  if (text.includes("catalogue") || text.includes("pdf")) {
    return "You can view or download the product catalogue from the Products page.";
  }
  if (text.includes("contact") || text.includes("whatsapp") || text.includes("phone")) {
    return "You can contact Pratik Enterprises on WhatsApp at +91 8459360535.";
  }
  if (text.includes("address") || text.includes("location")) {
    return "Our address is Parvati, Pune- 411009.";
  }
  if (text.includes("product") || text.includes("planter")) {
    return `We currently show ${products.length} FRP planter product options. You can click Contact Now on any product for details.`;
  }
  return "I can help with products, catalogue, pricing, contact number, and address.";
}

function setupChatbot(products) {
  addMessage("Hello, I can help with FRP planter product information.");
  const form = document.querySelector("#chatForm");
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = form.elements.message;
    const message = input.value.trim();
    if (!message) return;
    addMessage(message, "user");
    input.value = "";
    addMessage(botReply(message, products));
  });
}

setupUserLogin();
setupUserPage();

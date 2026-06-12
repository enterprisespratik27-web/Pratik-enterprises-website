async function api(path, options = {}) {
  try {
    const response = await fetch(path, {
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      credentials: "same-origin",
      ...options
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Request failed");
    return data;
  } catch (error) {
    if (window.location.protocol === "file:") {
      throw new Error("Open vendor login from http://localhost:3000/vendor-login.html after starting START_SERVER.bat.");
    }
    throw new Error("Backend is not running. Double-click START_SERVER.bat, keep the black window open, then refresh this page.");
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve) => {
    if (!file) {
      resolve("");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}

function setupVendorLogin() {
  const form = document.querySelector("#vendorLoginForm");
  if (!form) return;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#vendorLoginMessage");
    const formData = new FormData(form);
    try {
      await api("/api/vendor/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password")
        })
      });
      window.location.href = "vendor.html";
    } catch (error) {
      message.textContent = error.message;
    }
  });
}

async function loadVendorProducts() {
  const list = document.querySelector("#vendorProductList");
  if (!list) return;

  const { products } = await api("/api/products");
  list.innerHTML = "";
  products.forEach((product) => {
    const item = document.createElement("article");
    item.className = "vendor-item";
    item.innerHTML = `
      <img src="${product.image}" alt="${product.name}">
      <div>
        <h3>${product.name}</h3>
        <p>${product.details}</p>
        <button class="button ghost small-button" type="button">Delete</button>
      </div>
    `;
    item.querySelector("button").addEventListener("click", async () => {
      await api(`/api/vendor/products/${encodeURIComponent(product.id)}`, { method: "DELETE" });
      loadVendorProducts();
    });
    list.appendChild(item);
  });
}

function setupVendorDashboard() {
  const form = document.querySelector("#productForm");
  if (!form) return;

  loadVendorProducts().catch(() => {
    window.location.href = "vendor-login.html";
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.querySelector("#productFormMessage");
    const formData = new FormData(form);
    try {
      const imageFile = form.elements.image.files[0];
      await api("/api/vendor/products", {
        method: "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          details: formData.get("details"),
          imageName: imageFile?.name || "",
          imageData: await fileToDataUrl(imageFile)
        })
      });
      form.reset();
      message.textContent = "Product saved.";
      await loadVendorProducts();
    } catch (error) {
      message.textContent = error.message;
    }
  });

  document.querySelector("#vendorLogout")?.addEventListener("click", async () => {
    await api("/api/logout", { method: "POST" });
    window.location.href = "vendor-login.html";
  });
}

setupVendorLogin();
setupVendorDashboard();

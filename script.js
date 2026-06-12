const starterBusiness = {
  name: "Pratik Enterprises",
  phone: "918459360535",
  email: "enterprisespratik27@gmail.com",
  address: "Parvati, Pune- 411009"
};

const business = { ...starterBusiness };

const starterProducts = Array.isArray(window.pratikProducts) ? window.pratikProducts : [];

const starterAbout = {
  heroTitle: "Pratik Enterprises",
  heroText: "We focus on quality products, clear information, and quick customer response.",
  mainTitle: "Practical product support for business needs",
  mainText: "Pratik Enterprises gives customers a simple way to view product details, explore the catalogue, and send direct inquiries. You can add your company story, experience, product categories, and service areas here.",
  pointOneTitle: "Clear Information",
  pointOneText: "Product photos, details, and PDF catalogue in one place.",
  pointTwoTitle: "Easy Inquiry",
  pointTwoText: "Customers can ask about products directly through WhatsApp.",
  pointThreeTitle: "Reliable Service",
  pointThreeText: "Fast responses and practical product guidance."
};

function freshStarterProducts() {
  return starterProducts.map((product, index) => ({
    id: product.id || `product-${index + 1}`,
    name: product.name || `Product ${index + 1}`,
    details: product.details || "",
    image: product.image || "assets/product-placeholder.svg"
  }));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function readStoredJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || fallback;
  } catch {
    localStorage.removeItem(key);
    return fallback;
  }
}

let products = freshStarterProducts();
let aboutContent = readStoredJson("pratik-about", { ...starterAbout });

function saveAbout() {
  localStorage.setItem("pratik-about", JSON.stringify(aboutContent));
}

function cleanPhoneNumber(phoneNumber) {
  return String(phoneNumber).replace(/[^\d]/g, "");
}

function displayPhoneNumber(phoneNumber) {
  return phoneNumber === "919999999999" ? "+91 99999 99999" : `+${phoneNumber}`;
}

function contactUrl(productName = "") {
  const whatsappNumber = cleanPhoneNumber(business.phone);
  const message = productName
    ? `Hello ${business.name}, I would like information about ${productName}.`
    : `Hello ${business.name}, I would like information about your products.`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function updateBusinessLinks() {
  document.querySelectorAll("[data-business-name]").forEach((element) => {
    element.textContent = business.name;
  });

  document.querySelectorAll("[data-whatsapp]").forEach((link) => {
    link.href = contactUrl(link.dataset.product || "");
  });

  document.querySelectorAll("[data-whatsapp-number]").forEach((link) => {
    const whatsappNumber = cleanPhoneNumber(business.phone);
    link.href = `https://wa.me/${whatsappNumber}`;
    link.textContent = displayPhoneNumber(whatsappNumber);
  });

  document.querySelectorAll("[data-email]").forEach((link) => {
    link.href = `mailto:${business.email}`;
    link.textContent = business.email;
  });

  const address = document.querySelector("[data-address]");
  if (address) address.textContent = business.address;
}

function renderProducts() {
  const productGrid = document.querySelector("#productGrid");
  if (!productGrid) return;

  productGrid.innerHTML = "";
  products.forEach((product, index) => {
    const card = document.createElement("article");
    card.className = "product-card";
    card.innerHTML = `
      <div class="product-image-wrap">
        <button class="image-open" type="button" aria-label="Open full image of ${escapeHtml(product.name)}">
          <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}">
        </button>
      </div>
      <div class="product-body">
        <h3>${escapeHtml(product.name)}</h3>
        <p>${escapeHtml(product.details)}</p>
        <div class="product-tools">
          <a class="button secondary" target="_blank" rel="noopener" href="${contactUrl(product.name)}">Contact Now</a>
        </div>
      </div>
    `;

    const imageButton = card.querySelector(".image-open");

    imageButton.addEventListener("click", () => {
      openImageModal(products[index].image, products[index].name);
    });

    productGrid.appendChild(card);
  });
}

async function loadProductsFromBackend() {
  const productGrid = document.querySelector("#productGrid");
  if (!productGrid || window.location.protocol === "file:") return;

  try {
    const response = await fetch("/api/products");
    if (!response.ok) return;
    const data = await response.json();
    if (!Array.isArray(data.products)) return;
    products = data.products;
    renderProducts();
  } catch {}
}

function setupContactForm() {
  const form = document.querySelector("#contactForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const name = formData.get("name") || "Customer";
    const phone = formData.get("phone") || "";
    const message = formData.get("message") || "I would like product information.";
    const text = `Hello ${business.name}, my name is ${name}. Phone: ${phone}. ${message}`;
    const whatsappNumber = cleanPhoneNumber(business.phone);
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  });
}

function renderAbout() {
  document.querySelectorAll("[data-about-display]").forEach((element) => {
    const key = element.dataset.aboutDisplay;
    element.textContent = aboutContent[key] || starterAbout[key] || "";
  });

  const form = document.querySelector("#aboutForm");
  if (!form) return;

  Object.keys(starterAbout).forEach((key) => {
    const field = form.elements[key];
    if (field) field.value = aboutContent[key] || "";
  });
}

function setupAboutForm() {
  const form = document.querySelector("#aboutForm");
  const resetButton = document.querySelector("#resetAbout");
  const openButton = document.querySelector("#openAboutEditor");
  const closeButton = document.querySelector("#closeAboutEditor");
  const doneButton = document.querySelector("#saveAboutEditor");
  const modal = document.querySelector("#aboutEditorModal");
  if (!form) return;

  function openEditor() {
    if (!modal) return;
    renderAbout();
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeEditor() {
    if (!modal) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  form.addEventListener("input", (event) => {
    const field = event.target;
    if (!field.name) return;

    aboutContent[field.name] = field.value;
    saveAbout();
    renderAbout();
  });

  if (resetButton) {
    resetButton.addEventListener("click", () => {
      aboutContent = { ...starterAbout };
      localStorage.removeItem("pratik-about");
      renderAbout();
    });
  }

  if (openButton) openButton.addEventListener("click", openEditor);
  if (closeButton) closeButton.addEventListener("click", closeEditor);
  if (doneButton) doneButton.addEventListener("click", closeEditor);
  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) closeEditor();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeEditor();
  });

  renderAbout();
}

function setupImageModal() {
  if (document.querySelector("#imageModal")) return;

  const modal = document.createElement("div");
  modal.id = "imageModal";
  modal.className = "image-modal";
  modal.innerHTML = `
    <button class="modal-close" type="button" aria-label="Close image">X</button>
    <img alt="">
  `;

  const closeButton = modal.querySelector(".modal-close");
  closeButton.addEventListener("click", closeImageModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeImageModal();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeImageModal();
  });

  document.body.appendChild(modal);
}

function openImageModal(src, alt) {
  const modal = document.querySelector("#imageModal");
  if (!modal) return;

  const image = modal.querySelector("img");
  image.src = src;
  image.alt = alt;
  modal.classList.add("open");
}

function closeImageModal() {
  const modal = document.querySelector("#imageModal");
  if (!modal) return;

  modal.classList.remove("open");
}

updateBusinessLinks();
setupImageModal();
renderProducts();
loadProductsFromBackend();
setupContactForm();
setupAboutForm();

// --- Elements ---
const modal = document.getElementById("itemModal");
const closeModal = document.getElementById("closeModal");
const modalImg = document.getElementById("modalImg");
const modalName = document.getElementById("modalName");
const modalPrice = document.getElementById("modalPrice");
const modalDesc = document.getElementById("modalDesc");
const modalAddCart = document.getElementById("modalAddCart");
const cartCountEl = document.getElementById("cartCount");

// customization blocks & controls
const blockDrinkCommon = document.getElementById("blockDrinkCommon");
const blockMatchaExtra = document.getElementById("blockMatchaExtra");
const blockTeaExtra = document.getElementById("blockTeaExtra");
const blockProtein = document.getElementById("blockProtein");
const blockMeals = document.getElementById("blockMeals");
const blockDesserts = document.getElementById("blockDesserts");
const blockSpecials = document.getElementById("blockSpecials");

const milkSelect = document.getElementById("milkSelect");
const sugarOptions = document.getElementsByName("sugar");
const sizeOptions = document.getElementsByName("size");
const addonsCheckboxes = document.querySelectorAll(".addons input[type='checkbox']");

const qtyInput = document.getElementById("qtyInput");
const qtyPlus = document.getElementById("qtyPlus");
const qtyMinus = document.getElementById("qtyMinus");
const calculatedPriceEl = document.getElementById("calculatedPrice");

// protein specific
const proteinScoops = document.getElementsByName("proteinScoops");

// tea specific
const teaTypeRadios = document.getElementsByName("teaType");
const teaLemonRadios = document.getElementsByName("teaLemon");

// matcha specific
const matchaStrengthRadios = document.getElementsByName("matchaStrength");

// meals specific
const mealsSpicyRadios = blockMeals ? blockMeals.querySelectorAll("input[name='spicy']") : [];
const mealsAddonsCheckboxes = blockMeals ? blockMeals.querySelectorAll("input[type='checkbox']") : [];

// desserts specific
const dessertTempRadios = document.getElementsByName("dessertTemp");
const dessertAddonsCheckboxes = blockDesserts ? blockDesserts.querySelectorAll("input[type='checkbox']") : [];

// specials specific
const specialsAddonsCheckboxes = blockSpecials ? blockSpecials.querySelectorAll("input[type='checkbox']") : [];
const plumSizeRadios = document.getElementsByName("plumSize");

// Cart (persistent)
let cart = JSON.parse(localStorage.getItem("cart")) || [];
updateCartCount();

let selectedItem = null; // the item currently shown in modal

// helpers
function parsePrice(text) {
  if (!text) return 0;
  const num = text.replace(/[^\d.-]/g, "");
  return Number(num) || 0;
}
function formatPrice(n) { return `₹${Math.round(n)}`; }

// ---------- opening modal ----------
document.querySelectorAll(".item-card").forEach(card => {
  card.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-cart")) return;

    const name = card.querySelector("h3")?.textContent.trim() || '';
    const desc = card.querySelector(".desc")?.textContent.trim() || '';
    const img = card.querySelector("img")?.src || '';
    const basePrice = parsePrice(card.querySelector(".price")?.textContent);

    selectedItem = { name, desc, img, basePrice };

    modalImg.src = img;
    modalName.textContent = name;
    modalPrice.textContent = `Base: ${formatPrice(basePrice)}`;
    modalDesc.textContent = desc;

    // reset controls
    resetAllControls();

    // detect category
    const category = card.closest(".grid")?.previousElementSibling?.id || "";

    // hide all blocks first
    [blockDrinkCommon, blockMatchaExtra, blockTeaExtra, blockProtein, blockMeals, blockDesserts, blockSpecials].forEach(b => {
      if (b) b.style.display = "none";
    });

    // show relevant blocks
    if (category === "coffee") blockDrinkCommon.style.display = "block";
    else if (category === "matcha") { blockDrinkCommon.style.display = "block"; blockMatchaExtra.style.display = "block"; }
    else if (category === "tea") { blockDrinkCommon.style.display = "block"; blockTeaExtra.style.display = "block"; }
    else if (category === "protein") blockProtein.style.display = "block";
    else if (category === "meals") blockMeals.style.display = "block";
    else if (category === "desserts") blockDesserts.style.display = "block";
    else if (category === "special") blockSpecials.style.display = "block";

    computeAndShowTotal();
    openModal();
  });
});

// Add-to-cart from card (quick add with defaults)
document.querySelectorAll(".item-card .add-cart").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    const card = btn.closest(".item-card");
    const name = card.querySelector("h3")?.innerText.trim() || '';
    const desc = card.querySelector(".desc")?.innerText.trim() || '';
    const img = card.querySelector("img")?.src || '';
    const basePrice = parsePrice(card.querySelector(".price")?.innerText);

    const item = {
      name, desc, img, basePrice,
      milkType: "Whole Milk",
      sugarLevel: "No Sugar",
      size: "Small",
      addons: [],
      qty: 1,
      totalPrice: basePrice
    };
    addToCart(item);
  });
});

// modal open/close
function openModal() { modal.setAttribute("aria-hidden", "false"); }
function closeModalFunc() { modal.setAttribute("aria-hidden", "true"); }
closeModal.addEventListener("click", closeModalFunc);
window.addEventListener("click", (e) => { if (e.target === modal) closeModalFunc(); });
window.addEventListener("keydown", (e) => { if (e.key === "Escape") closeModalFunc(); });

// reset controls defaults
function resetAllControls() {
  if (milkSelect) milkSelect.selectedIndex = 0;
  Array.from(sugarOptions || []).forEach(r => r.checked = r.value === "No Sugar");
  Array.from(sizeOptions || []).forEach(r => r.checked = r.value === "Small");
  Array.from(addonsCheckboxes || []).forEach(cb => cb.checked = false);
  Array.from(proteinScoops || []).forEach(r => r.checked = r.value === "0");
  Array.from(teaTypeRadios || []).forEach(r => r.checked = r.value === "Milk Tea");
  Array.from(teaLemonRadios || []).forEach(r => r.checked = r.value === "No");
  Array.from(matchaStrengthRadios || []).forEach(r => r.checked = r.value === "Light");
  Array.from(mealsSpicyRadios || []).forEach(r => r.checked = r.value === "Mild");
  Array.from(mealsAddonsCheckboxes || []).forEach(cb => cb.checked = false);
  Array.from(dessertTempRadios || []).forEach(r => r.checked = r.value === "Cold");
  Array.from(dessertAddonsCheckboxes || []).forEach(cb => cb.checked = false);
  Array.from(specialsAddonsCheckboxes || []).forEach(cb => cb.checked = false);
  Array.from(plumSizeRadios || []).forEach(r => r.checked = r.value === "Small");
  if (qtyInput) qtyInput.value = 1;
}

// quantity controls
qtyPlus.addEventListener("click", () => { qtyInput.value = Number(qtyInput.value || 1) + 1; computeAndShowTotal(); });
qtyMinus.addEventListener("click", () => { qtyInput.value = Math.max(1, Number(qtyInput.value || 1) - 1); computeAndShowTotal(); });
qtyInput.addEventListener("change", () => { if (!qtyInput.value || qtyInput.value < 1) qtyInput.value = 1; computeAndShowTotal(); });

// compute total safely
function computeAndShowTotal() {
  if (!selectedItem) return;
  const base = Number(selectedItem.basePrice) || 0;
  let extras = 0;

  // Drink common
  if (blockDrinkCommon && blockDrinkCommon.style.display !== "none") {
    let milkAdd = Number(milkSelect?.selectedOptions[0]?.dataset?.add || 0) || 0;
    const teaType = Array.from(teaTypeRadios || []).find(r => r.checked)?.value || "Milk Tea";
    if (teaType === "Black Tea") milkAdd = 0;

    let sizeAdd = 0;
    Array.from(sizeOptions || []).forEach(r => { if (r.checked) sizeAdd = Number(r.dataset.add || 0) || 0; });
    extras += milkAdd + sizeAdd;

    Array.from(addonsCheckboxes || []).forEach(cb => { if (cb.checked) extras += Number(cb.dataset.add || 0) || 0; });
  }

  // Protein
  if (blockProtein && blockProtein.style.display !== "none") {
    const scoops = Number(Array.from(proteinScoops || []).find(r => r.checked)?.value || 0);
    extras += scoops * 40;
  }

  // Meals
  if (blockMeals && blockMeals.style.display !== "none") {
    Array.from(mealsAddonsCheckboxes || []).forEach(cb => { if (cb.checked) extras += Number(cb.dataset.add || 0) || 0; });
  }

  // Desserts
  if (blockDesserts && blockDesserts.style.display !== "none") {
    Array.from(dessertAddonsCheckboxes || []).forEach(cb => { if (cb.checked) extras += Number(cb.dataset.add || 0) || 0; });
  }

  // Specials
  if (blockSpecials && blockSpecials.style.display !== "none") {
    Array.from(specialsAddonsCheckboxes || []).forEach(cb => { if (cb.checked) extras += Number(cb.dataset.add || 0) || 0; });
  }

  const qty = Number(qtyInput.value || 1);
  const total = Math.round((base + extras) * qty);
  calculatedPriceEl.textContent = formatPrice(total);
  modalPrice.textContent = `Base: ${formatPrice(base)} • Extras: ${formatPrice(extras)} • Qty: ${qty}`;
}

// add to cart from modal
modalAddCart.addEventListener("click", () => {
  if (!selectedItem) return;

  const item = {
    name: selectedItem.name || '',
    desc: selectedItem.desc || '',
    img: selectedItem.img || '',
    basePrice: Number(selectedItem.basePrice) || 0,
    qty: Number(qtyInput.value || 1),
    addons: []
  };

  if (blockDrinkCommon && blockDrinkCommon.style.display !== "none") {
    item.milkType = milkSelect?.value || "Whole Milk";
    item.sugarLevel = Array.from(sugarOptions || []).find(r => r.checked)?.value || "No Sugar";
    item.size = Array.from(sizeOptions || []).find(r => r.checked)?.value || "Small";
    Array.from(addonsCheckboxes || []).forEach(cb => { if (cb.checked) item.addons.push(cb.value || ''); });
    if (Array.from(teaTypeRadios || []).find(r => r.checked)?.value === "Black Tea") delete item.milkType;
  }

  if (blockMatchaExtra && blockMatchaExtra.style.display !== "none") {
    item.matchaStrength = Array.from(matchaStrengthRadios || []).find(r => r.checked)?.value || "Light";
  }

  if (blockTeaExtra && blockTeaExtra.style.display !== "none") {
    item.teaType = Array.from(teaTypeRadios || []).find(r => r.checked)?.value || "Milk Tea";
    item.teaLemon = Array.from(teaLemonRadios || []).find(r => r.checked)?.value || "No";
  }

  if (blockProtein && blockProtein.style.display !== "none") {
    const scoops = Number(Array.from(proteinScoops || []).find(r => r.checked)?.value || 0);
    if (scoops > 0) item.addons.push(`${scoops} extra scoop(s)`);
    item.extraProteinScoops = scoops;
  }

  if (blockMeals && blockMeals.style.display !== "none") {
    Array.from(mealsAddonsCheckboxes || []).forEach(cb => { if (cb.checked) item.addons.push(cb.value || ''); });
    item.spicy = Array.from(mealsSpicyRadios || []).find(r => r.checked)?.value || "Mild";
  }

  if (blockDesserts && blockDesserts.style.display !== "none") {
    item.dessertTemp = Array.from(dessertTempRadios || []).find(r => r.checked)?.value || "Cold";
    Array.from(dessertAddonsCheckboxes || []).forEach(cb => { if (cb.checked) item.addons.push(cb.value || ''); });
  }

  if (blockSpecials && blockSpecials.style.display !== "none") {
    Array.from(specialsAddonsCheckboxes || []).forEach(cb => { if (cb.checked) item.addons.push(cb.value || ''); });
    item.plumSize = Array.from(plumSizeRadios || []).find(r => r.checked)?.value || "Small";
  }

  // Compute total safely
  let extras = 0;
  if (item.milkType) extras += Number(milkSelect?.selectedOptions[0]?.dataset?.add || 0) || 0;
  extras += Number(Array.from(sizeOptions || []).find(r => r.checked)?.dataset.add || 0) || 0;
  Array.from(addonsCheckboxes || []).forEach(cb => { if (cb.checked) extras += Number(cb.dataset.add || 0) || 0; });
  if (item.extraProteinScoops) extras += item.extraProteinScoops * 40;
  Array.from(mealsAddonsCheckboxes || []).forEach(cb => { if (cb.checked) extras += Number(cb.dataset.add || 0) || 0; });
  Array.from(dessertAddonsCheckboxes || []).forEach(cb => { if (cb.checked) extras += Number(cb.dataset.add || 0) || 0; });
  Array.from(specialsAddonsCheckboxes || []).forEach(cb => { if (cb.checked) extras += Number(cb.dataset.add || 0) || 0; });

  item.totalPrice = Math.round((Number(item.basePrice) || 0 + extras) * item.qty);

  // unique key
  const keyParts = [
    item.name, item.milkType || '', item.sugarLevel || '', item.size || '',
    item.matchaStrength || '', item.teaType || '', item.teaLemon || '',
    item.extraProteinScoops || 0, (item.addons || []).slice().sort().join(','), 
    item.spicy || '', item.dessertTemp || '', item.plumSize || ''
  ];
  item.key = keyParts.join('|');

  addToCart(item);
  closeModalFunc();
});

// addToCart logic
function addToCart(item) {
  const idx = cart.findIndex(ci => ci.key === item.key);
  if (idx > -1) {
    cart[idx].qty = (cart[idx].qty || 0) + (item.qty || 1);
    cart[idx].totalPrice = (cart[idx].totalPrice || 0) + item.totalPrice;
  } else cart.push(item);

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  showToast(`${item.name} added to cart`);
}

function updateCartCount() {
  cartCountEl.textContent = cart.reduce((acc, i) => acc + (i.qty || 0), 0);
}

function showToast(message) {
  const el = document.createElement("div");
  el.textContent = message;
  el.style.position = "fixed";
  el.style.bottom = "22px";
  el.style.right = "22px";
  el.style.background = "#333";
  el.style.color = "#fff";
  el.style.padding = "10px 14px";
  el.style.borderRadius = "8px";
  el.style.zIndex = 9999;
  el.style.opacity = "0";
  el.style.transition = "opacity .18s ease, transform .18s ease";
  document.body.appendChild(el);
  requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateY(-4px)"; });
  setTimeout(()=> { el.style.opacity = "0"; el.style.transform = "translateY(0px)"; }, 1200);
  setTimeout(()=> el.remove(), 1600);
}

// quick cart summary
document.getElementById("cartIcon").addEventListener("click", () => {
  if (cart.length === 0) { showToast("Cart is empty"); return; }
  let totalAmount = cart.reduce((s,i)=>s+(i.totalPrice||0),0);
  let text = cart.map(i=>`${i.name} x${i.qty} — ${formatPrice(i.totalPrice)}`).join("\n");
  alert(`Cart items:\n\n${text}\n\nTotal: ${formatPrice(totalAmount)}`);
});

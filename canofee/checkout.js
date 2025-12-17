/* checkout.js
 - Full checkout rewrite with:
   - Item customization display
   - Delivery scheduler
   - Coupon codes
   - Order review modal
   - Payment modal simulation
   - Animations for qty/price/total
*/

// --------- Element refs ----------
const cartItemsContainer = document.getElementById('cartItems');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const deliveryChargeEl = document.getElementById('deliveryCharge');
const grandTotalEl = document.getElementById('grandTotal');
const couponInput = document.getElementById('couponInput');
const applyCouponBtn = document.getElementById('applyCoupon');
const couponMsg = document.getElementById('couponMsg');
const reviewBtn = document.getElementById('reviewOrder');
const reviewModal = document.getElementById('reviewModal');
const closeReview = document.getElementById('closeReview');
const reviewContent = document.getElementById('reviewContent');
const confirmCheck = document.getElementById('confirmCheck');
const proceedPaymentBtn = document.getElementById('proceedPayment');
const paymentModal = document.getElementById('paymentModal');
const closePayment = document.getElementById('closePayment');
const paymentMsg = document.getElementById('paymentMsg');
const thanksModal = document.getElementById('thanksModal');
const orderRef = document.getElementById('orderRef');
const closeThanks = document.getElementById('closeThanks');
const scheduleBox = document.getElementById('scheduleBox');
const schedDate = document.getElementById('schedDate');
const schedSlot = document.getElementById('schedSlot');
const tipButtons = document.querySelectorAll('.tip-btn');
const customTipInput = document.getElementById('customTip');
const couponMsgArea = couponMsg;

// constants
const DELIVERY_BASE = 20;
const TAX_RATE = 0.05;

// coupons
const COUPONS = {
  "CANOFEE10": { type: 'percent', value: 10, msg: '10% off' },
  "FIRST50": { type: 'flat', value: 50, msg: '₹50 off' },
  "FREESHIP": { type: 'freeship', value: 20, msg: 'Free delivery' }
};

// load cart robustly (handles structures from menu.js or older checkout)
let rawCart = JSON.parse(localStorage.getItem('cart')) || [];
// Normalize items to consistent shape: {name,image,qty,unitPrice,customizations,uniqueKey}
let cart = rawCart.map(normalizeItem);

// coupon & tip state
let appliedCoupon = null;
let tipAmount = 0;
let deliveryCharge = DELIVERY_BASE;

// utility: normalize incoming item shapes
function normalizeItem(it){
  // possible fields: qty / quantity ; basePrice / price ; totalPrice ; addons, milkType, etc
  const qty = ('qty' in it) ? Number(it.qty || 1) : (('quantity' in it) ? Number(it.quantity || 1) : 1);
  const unitPrice = (it.basePrice || it.price || it.unitPrice || it.totalPrice) ? Number(it.basePrice || it.price || it.unitPrice || it.totalPrice) : 0;
  // prefer basePrice where available; if only totalPrice available, approximate unit price
  let computedUnit = unitPrice;
  if (!it.basePrice && it.totalPrice && qty>0) computedUnit = Number(it.totalPrice) / qty;
  // customizations container
  const customs = {};
  ['milkType','sugarLevel','size','addons','matchaStrength','teaType','teaLemon','extraProteinScoops','spicy','dessertTemp','plumSize','desc'].forEach(k=>{
    if (k in it && it[k] !== undefined) customs[k] = it[k];
  });
  // if addons stored as array
  if (Array.isArray(it.addons) && it.addons.length) customs.addons = it.addons.slice();
  return {
    name: it.name || it.itemName || 'Item',
    image: it.img || it.image || 'images/placeholder.png',
    qty: qty,
    unitPrice: Number(computedUnit || 0),
    totalPrice: Number(it.totalPrice || (computedUnit * qty) || 0),
    customs,
    raw: it
  };
}

// format price
function fmt(n){ return `₹${Number(n || 0).toFixed(2)}`; }

// ---------- render ----------
function renderCart(){
  cartItemsContainer.innerHTML = '';
  if (!cart.length){
    cartItemsContainer.innerHTML = `<div class="cart-card"><div class="item-main"><div class="item-name">Your cart is empty</div><div class="item-desc">Add items from menu to see them here.</div></div></div>`;
    updateSummary();
    return;
  }

  cart.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'cart-card';
    card.dataset.index = idx;

    const img = document.createElement('img'); img.src = item.image;

    const main = document.createElement('div'); main.className = 'item-main';
    const title = document.createElement('div'); title.className='item-name'; title.textContent = item.name;
    const desc = document.createElement('div'); desc.className='item-desc'; desc.textContent = item.raw.desc || '';
    const price = document.createElement('div'); price.className='item-price'; price.textContent = fmt(item.unitPrice);

    // customization summary
    const customs = document.createElement('div'); customs.className='item-customs';
    customs.innerHTML = renderCustoms(item.customs);

    // quantity & actions
    const row = document.createElement('div'); row.className='item-row';
    const qtyControls = document.createElement('div'); qtyControls.className='qty-controls';
    const minus = document.createElement('button'); minus.className='qty-btn'; minus.innerText='−';
    const qtyDisplay = document.createElement('div'); qtyDisplay.className='qty-display'; qtyDisplay.innerText=item.qty;
    const plus = document.createElement('button'); plus.className='qty-btn'; plus.innerText='+';

    minus.addEventListener('click', ()=> changeQty(idx, -1, card, price, qtyDisplay));
    plus.addEventListener('click', ()=> changeQty(idx, 1, card, price, qtyDisplay));

    const remove = document.createElement('button'); remove.className='remove-btn'; remove.innerText='Remove';
    remove.addEventListener('click', ()=> removeItem(idx, card));

    qtyControls.appendChild(minus); qtyControls.appendChild(qtyDisplay); qtyControls.appendChild(plus);
    row.appendChild(qtyControls);
    row.appendChild(remove);

    main.appendChild(title); if (desc.textContent) main.appendChild(desc);
    main.appendChild(price); main.appendChild(customs); main.appendChild(row);

    card.appendChild(img); card.appendChild(main);

    cartItemsContainer.appendChild(card);
  });

  updateSummary();
}

function renderCustoms(c){
  if (!c || Object.keys(c).length===0) return '';
  const parts=[];
  if (c.size) parts.push(`Size: ${c.size}`);
  if (c.milkType) parts.push(`Milk: ${c.milkType}`);
  if (c.sugarLevel) parts.push(`Sugar: ${c.sugarLevel}`);
  if (c.addons && Array.isArray(c.addons) && c.addons.length) parts.push(`Add-ons: ${c.addons.join(', ')}`);
  if (c.matchaStrength) parts.push(`Matcha: ${c.matchaStrength}`);
  if (c.teaType) parts.push(`Tea: ${c.teaType}`);
  if (c.spicy) parts.push(`Spicy: ${c.spicy}`);
  if (c.dessertTemp) parts.push(`Temp: ${c.dessertTemp}`);
  return parts.join(' • ');
}

// ---------- qty, remove logic with animations ----------
function changeQty(index, delta, cardEl, priceEl, qtyDisplay){
  const it = cart[index];
  it.qty = Math.max(1, it.qty + delta);
  // animate card (zoom)
  cardEl.classList.add('zoom');
  // fade price
  priceEl.style.opacity = 0.4;
  setTimeout(()=> priceEl.style.opacity = 1, 180);

  // quick bump on qty display
  qtyDisplay.innerText = it.qty;
  setTimeout(()=> cardEl.classList.remove('zoom'), 220);

  // update item total if totalPrice stored
  if (it.totalPrice && it.unitPrice) it.totalPrice = it.unitPrice * it.qty;
  // persist to localStorage in a best-effort form (so other pages can read)
  persistCart();
  updateSummary(true);
}

function removeItem(index, cardEl){
  // slide out
  cardEl.style.transition = 'transform .28s ease, opacity .28s ease';
  cardEl.style.transform = 'translateX(-25px)';
  cardEl.style.opacity = '0';
  setTimeout(()=> {
    cart.splice(index,1);
    persistCart();
    renderCart();
  }, 300);
}

// --------- persistence ----------
function persistCart(){
  // we write a simple normalized array so other pages can still parse
  const out = cart.map(i => ({name:i.name, qty:i.qty, price:i.unitPrice, image:i.image, custom:i.customs}));
  localStorage.setItem('cart', JSON.stringify(out));
}

// ---------- summary / calculations ----------
let lastGrand = 0;
function updateSummary(animate=false){
  let subtotal = cart.reduce((s,i)=> s + (i.unitPrice * i.qty), 0);
  let tax = subtotal * TAX_RATE;
  let grand = subtotal + tax + deliveryCharge + Number(tipAmount || 0);

  // apply coupons
  if (appliedCoupon){
    if (appliedCoupon.type === 'percent'){
      grand = grand - (grand * (appliedCoupon.value/100));
    } else if (appliedCoupon.type === 'flat'){
      grand = Math.max(0, grand - appliedCoupon.value);
    } else if (appliedCoupon.type === 'freeship'){
      // already considered by setting deliveryCharge to 0
    }
  }

  subtotalEl.textContent = fmt(subtotal);
  taxEl.textContent = fmt(tax);
  deliveryChargeEl.textContent = fmt(deliveryCharge);
  grandTotalEl.textContent = fmt(grand);

  // highlight when changed
  if (animate || lastGrand !== 0 && Math.abs(lastGrand - grand) > 0.01){
    grandTotalEl.classList.add('highlight');
    setTimeout(()=> grandTotalEl.classList.remove('highlight'), 600);
  }
  lastGrand = grand;
}

// ---------- coupon handling ----------
applyCouponBtn.addEventListener('click', ()=> {
  const code = (couponInput.value || '').trim().toUpperCase();
  if (!code) return showCouponMsg('Enter a coupon code', 'warning');

  if (!(code in COUPONS)){
    shake(couponInput);
    return showCouponMsg('Invalid code', 'error');
  }

  appliedCoupon = COUPONS[code];
  // special handling for freeship
  if (appliedCoupon.type === 'freeship') {
    deliveryCharge = 0;
  }

  // apply percent/flat by state only (calc happens in updateSummary)
  showCouponMsg(`Applied: ${appliedCoupon.msg}`, 'success');
  updateSummary(true);
});

// show coupon messages
function showCouponMsg(text, type){
  couponMsgArea.textContent = text;
  couponMsgArea.style.color = (type==='error') ? '#b23b3b' : (type==='success') ? 'green' : '#9b7f67';
  // small highlight
  couponMsgArea.animate([{opacity:0},{opacity:1}],{duration:240});
}

function shake(el){
  el.animate([{transform:'translateX(0)'},{transform:'translateX(-8px)'},{transform:'translateX(8px)'},{transform:'translateX(0)'}],{duration:300});
}

// --------- delivery options toggle ----------
document.querySelectorAll('input[name="deliverOpt"]').forEach(r=>{
  r.addEventListener('change', (e)=>{
    if (e.target.value === 'schedule') scheduleBox.classList.remove('hidden');
    else scheduleBox.classList.add('hidden');
  });
});

// tip buttons
tipButtons.forEach(b=>{
  b.addEventListener('click', ()=>{
    tipButtons.forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    const val = b.dataset.tip;
    if (val === 'custom'){ customTipInput.classList.remove('hidden'); customTipInput.focus(); tipAmount = 0; }
    else { customTipInput.classList.add('hidden'); tipAmount = Number(val); updateSummary(true); }
  });
});
customTipInput.addEventListener('change', ()=> { tipAmount = Math.max(0, Number(customTipInput.value||0)); updateSummary(true); });

// ---------- Review modal flow ----------
reviewBtn.addEventListener('click', ()=> {
  if (!cart.length) return alert('Your cart is empty.');
  // fill review content
  reviewContent.innerHTML = renderReview();
  reviewModal.classList.remove('hidden');
  proceedPaymentBtn.disabled = true;
  confirmCheck.checked = false;
});

closeReview.addEventListener('click', ()=> reviewModal.classList.add('hidden'));
confirmCheck.addEventListener('change', ()=> proceedPaymentBtn.disabled = !confirmCheck.checked);
document.getElementById('editOrder').addEventListener('click', ()=> reviewModal.classList.add('hidden'));

proceedPaymentBtn.addEventListener('click', () => {

  // Save order data before redirecting
  const orderDetails = {
    cart: cart,
    subtotal: subtotalEl.textContent,
    tax: taxEl.textContent,
    delivery: deliveryChargeEl.textContent,
    total: grandTotalEl.textContent,
    customer: {
      name: document.getElementById('custName').value,
      phone: document.getElementById('custPhone').value,
      address: document.getElementById('custAddress').value,
    },
    deliveryTime:
      document.querySelector('input[name="deliverOpt"]:checked').value === 'now'
        ? "Deliver Now"
        : `${schedDate.value} – ${schedSlot.value}`,
    tip: tipAmount
  };

  localStorage.setItem("orderDetails", JSON.stringify(orderDetails));

  // Go to payment page
  window.location.href = "payment.html";
});


// payment modal controls
closePayment.addEventListener('click', ()=> paymentModal.classList.add('hidden'));
document.querySelectorAll('.pay-option').forEach(btn=>{
  btn.addEventListener('click', async (e)=>{
    const method = btn.dataset.method;
    paymentMsg.textContent = `Processing ${method}...`;
    // simulate payment flow
    await new Promise(r=> setTimeout(r, 800));
    if (method === 'cod'){
      paymentMsg.textContent = 'Order placed with Cash on Delivery';
      onPaymentSuccess(method);
    } else {
      paymentMsg.textContent = 'Payment successful';
      onPaymentSuccess(method);
    }
  });
});

// on success: show thank you
function onPaymentSuccess(method){
  paymentModal.classList.add('hidden');
  // generate simple order id
  const oid = 'CNF' + Math.floor(Math.random()*900000 + 100000);
  orderRef.textContent = `Order ${oid} placed via ${method.toUpperCase()}. We'll deliver shortly.`;
  thanksModal.classList.remove('hidden');

  // clear cart (for demo)
  cart = [];
  persistCart();
  renderCart();
}
closeThanks.addEventListener('click', ()=> thanksModal.classList.add('hidden'));

// ---------- render review content ----------
function renderReview(){
  const lines = [];
  const subtotal = cart.reduce((s,i)=> s + (i.unitPrice * i.qty), 0);
  lines.push(`<strong>Items (${cart.length}):</strong><div>`);
  cart.forEach(i=>{
    lines.push(`<div style="margin:8px 0;padding:6px;border-radius:8px;background:#fffdfb;border:1px solid #f2e6dc">
      <div style="font-weight:700">${escapeHtml(i.name)} x ${i.qty} — ${fmt(i.unitPrice * i.qty)}</div>
      <div style="color:#8f7a65;font-size:13px;margin-top:6px">${escapeHtml(renderCustoms(i.customs) || '')}</div>
    </div>`);
  });
  lines.push(`</div>`);
  lines.push(`<div style="margin-top:8px"><strong>Subtotal:</strong> ${fmt(subtotal)}</div>`);
  lines.push(`<div><strong>Tax (5%):</strong> ${fmt(subtotal * TAX_RATE)}</div>`);
  lines.push(`<div><strong>Delivery:</strong> ${fmt(deliveryCharge)}</div>`);
  if (appliedCoupon) lines.push(`<div><strong>Coupon:</strong> ${appliedCoupon.msg}</div>`);
  if (tipAmount) lines.push(`<div><strong>Tip:</strong> ${fmt(tipAmount)}</div>`);
  // delivery time
  const deliverNow = document.querySelector('input[name="deliverOpt"]:checked').value === 'now';
  if (deliverNow) lines.push(`<div><strong>Delivery:</strong> As soon as possible</div>`);
  else lines.push(`<div><strong>Scheduled:</strong> ${schedDate.value || 'No date'} • ${schedSlot.value}</div>`);
  // show total computed from updateSummary logic
  const totalCalc = computeGrandLocal();
  lines.push(`<hr><div style="font-size:18px"><strong>Total:</strong> ${fmt(totalCalc)}</div>`);
  return lines.join('');
}

// compute grand total local copy
function computeGrandLocal(){
  const subtotal = cart.reduce((s,i)=> s + (i.unitPrice * i.qty), 0);
  const tax = subtotal * TAX_RATE;
  let grand = subtotal + tax + deliveryCharge + Number(tipAmount || 0);
  if (appliedCoupon){
    if (appliedCoupon.type === 'percent') grand = grand - (grand * (appliedCoupon.value/100));
    if (appliedCoupon.type === 'flat') grand = Math.max(0, grand - appliedCoupon.value);
  }
  return grand;
}

// ---------- helpers ----------
function escapeHtml(unsafe){ return (unsafe||'').toString().replace(/[&<"']/g, function(m){ return {'&':'&amp;','<':'&lt;','"':'&quot;',"'":'&#39;'}[m]; });}

// initial run
renderCart();
updateSummary();

// handle continue shopping (if you have menu page)
document.getElementById('continueShopping').addEventListener('click', ()=> {
  // adjust to your site; we'll go to menu.html if it exists
  window.location.href = 'menu.html';
});

// small keyboard accessibility: escape modals
window.addEventListener('keydown', (e)=>{
  if (e.key === 'Escape'){
    [reviewModal, paymentModal, thanksModal].forEach(m => m.classList.add('hidden'));
  }
});

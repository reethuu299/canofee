// ================================
// PAYMENT.JS – FINAL FIXED VERSION
// ================================

const order = JSON.parse(localStorage.getItem("orderDetails") || "null");

const orderList = document.getElementById("orderList");
const itemCountEl = document.getElementById("itemCount");

let subtotal = 0;
const DELIVERY_FEE = 30;

// -------------------------------
// LOAD ORDER SUMMARY
// -------------------------------
if (!order || !order.cart || order.cart.length === 0) {
  orderList.innerHTML = "<p class='muted'>No order found</p>";
  document.getElementById("p_total").textContent = "₹0";
} else {

  document.getElementById("custName").textContent = order.customer?.name || "";
  document.getElementById("custPhone").textContent = order.customer?.phone || "";
  document.getElementById("custAddress").textContent = order.customer?.address || "";

  let totalItems = 0;
  orderList.innerHTML = "";

  order.cart.forEach(item => {
    const price = Number(item.unitPrice ?? item.price ?? 0);
    const qty = Number(item.qty ?? 1);

    const itemTotal = price * qty;
    subtotal += itemTotal;
    totalItems += qty;

    orderList.innerHTML += `
      <div class="order-item">
        <span>${item.name} × ${qty}</span>
        <strong>₹${itemTotal.toFixed(2)}</strong>
      </div>
    `;
  });

  const tax = +(subtotal * 0.05).toFixed(2);
  const total = +(subtotal + tax + DELIVERY_FEE).toFixed(2);

  itemCountEl.textContent = `${totalItems} item${totalItems > 1 ? "s" : ""}`;

  document.getElementById("p_subtotal").textContent = `₹${subtotal.toFixed(2)}`;
  document.getElementById("p_tax").textContent = `₹${tax.toFixed(2)}`;
  document.getElementById("p_delivery").textContent = `₹${DELIVERY_FEE}`;
  document.getElementById("p_total").textContent = `₹${total.toFixed(2)}`;
}

// -------------------------------
// PAYMENT BUTTONS
// -------------------------------
document.querySelectorAll(".pay-card").forEach(btn => {
  btn.addEventListener("click", () => {
    const method = btn.dataset.method;

    if (method === "upi") {
      document.getElementById("upiBox")?.classList.remove("hidden");
      startPayment(method);
    }

    if (method === "razorpay") {
      startPayment(method);
    }

    if (method === "cod") {
      finalizePayment("COD");
    }
  });
});

// -------------------------------
// PAYMENT FLOW (SIMULATED)
// -------------------------------
function startPayment(method) {
  const msg = document.getElementById("payMsg");
  msg.textContent = "Processing payment...";

  setTimeout(() => {
    finalizePayment(method.toUpperCase());
  }, 1200);
}

// -------------------------------
// FINALIZE & REDIRECT
// -------------------------------
function finalizePayment(method) {
  const totalText = document.getElementById("p_total").textContent.replace("₹", "");

  const orderId = "CNF" + Math.floor(Math.random() * 900000 + 100000);

  localStorage.setItem("lastOrder", JSON.stringify({
    orderId,
    method,
    amount: Number(totalText)
  }));

  localStorage.removeItem("cart");
  localStorage.removeItem("orderDetails");

  window.location.href = "thankyou.html";
}

// -------------------------------
// UPI HELPERS
// -------------------------------
document.getElementById("copyUpi")?.addEventListener("click", () => {
  navigator.clipboard.writeText("canofee@ybl");
  alert("UPI ID copied");
});

document.getElementById("openUpi")?.addEventListener("click", () => {
  location.href = "upi://pay?pa=canofee@ybl&cu=INR";
});

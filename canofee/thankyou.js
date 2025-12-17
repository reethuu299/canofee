// thankyou.js
// Reads data passed from payment.js

const data = JSON.parse(localStorage.getItem('lastOrder') || '{}');

document.getElementById('orderId').textContent =
  data.orderId || 'CNF' + Math.floor(Math.random()*900000 + 100000);

document.getElementById('paymentMode').textContent =
  (data.method || 'COD').toUpperCase();

document.getElementById('orderAmount').textContent =
  '₹' + Number(data.amount || 0).toFixed(2);

// safety cleanup
setTimeout(() => {
  localStorage.removeItem('lastOrder');
}, 2000);

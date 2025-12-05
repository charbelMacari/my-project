// -------------------------------
// Cart functionality
// -------------------------------
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Render the cart in the page
function renderCart() {
  const cartBody = document.getElementById('cart-body');
  const totalEl = document.getElementById('total');

  if (!cartBody || !totalEl) return; // exit if cart section doesn't exist

  cartBody.innerHTML = '';
  let total = 0;

  cart.forEach((item, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${item.name}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td><button class="btn" onclick="removeItem(${index})">Remove</button></td>
    `;
    cartBody.appendChild(row);
    total += item.price;
  });

  totalEl.textContent = `Total: $${total.toFixed(2)}`;
  // Update localStorage
  localStorage.setItem('cart', JSON.stringify(cart));
}

// Add item to cart
function addToCart(name, price) {
  cart.push({ name, price });
  renderCart();
  alert(`${name} has been added to your cart! ☕`);
}

// Remove a specific item from cart
function removeItem(index) {
  const removed = cart.splice(index, 1); // remove 1 item at given index
  renderCart();
  alert(`${removed[0].name} has been removed from your cart.`);
}

// Clear all items
function clearCart() {
  cart = [];
  renderCart();
  alert("Your cart has been cleared!");
}

// Checkout
function checkout() {
  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  alert(`Thank you for your order! ☕ Total: $${total.toFixed(2)}`);
  clearCart();
}

// -------------------------------
// AI Drink Recommendation
// -------------------------------
const drinks = [
  "Try our Vanilla Cold Brew — it’s smooth and refreshing!",
  "Feeling cozy? A Caramel Latte would be perfect.",
  "Need a pick-me-up? Go for a Double Espresso shot!",
  "Chocolate lovers can’t miss our Mocha — rich and satisfying!"
];

function showSuggestion() {
  const suggestionEl = document.getElementById('suggestion');
  if (!suggestionEl) return;
  const random = drinks[Math.floor(Math.random() * drinks.length)];
  suggestionEl.textContent = random;
}

// Show AI suggestion on page load
showSuggestion();

// Render cart when page loads (in case items were stored in localStorage)
document.addEventListener('DOMContentLoaded', renderCart);

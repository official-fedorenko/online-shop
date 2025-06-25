// filepath: online-shop/online-shop/js/products.js

const productListElement = document.getElementById("product-list");

async function fetchProducts() {
  try {
    const response = await fetch("data/products.json");
    const data = await response.json();
    displayProducts(data.products);
  } catch (error) {
    console.error("Error fetching products:", error);
  }
}

function displayProducts(products) {
  productListElement.innerHTML = "";
  products.forEach((product) => {
    const productTile = document.createElement("div");
    productTile.className = "product-tile";
    productTile.innerHTML = `
            <img src="${product.image}" alt="${product.name}" />
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p>Price: $${product.price}</p>
        `;
    productListElement.appendChild(productTile);
  });
}

document.addEventListener("DOMContentLoaded", fetchProducts);

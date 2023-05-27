// Import required dependencies
import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import marketplaceAbi from "../contract/marketplace.abi.json";
import erc20Abi from "../contract/erc20.abi.json";

// Initialize variables
let web3;
let kit;
let marketplaceContract;
let cUSDContract;
let products = [];

// Connect to Celo Extension Wallet
async function connectCeloWallet() {
  if (window.celo) {
    try {
      await window.celo.enable();
      web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      // Set the default account and initialize contracts
      const accounts = await web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];
      marketplaceContract = new web3.eth.Contract(marketplaceAbi, "0x178134c92EC973F34dD0dd762284b852B211CFC8");
      cUSDContract = new web3.eth.Contract(erc20Abi, "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1");

      // Load products
      await getProducts();
    } catch (error) {
      console.error("Failed to connect to Celo Extension Wallet:", error);
    }
  } else {
    console.error("Celo Extension Wallet is not installed.");
  }
}

// Fetch products from the marketplace contract
async function getProducts() {
  try {
    const productIds = await marketplaceContract.methods.getProductIds().call();
    const productPromises = productIds.map((productId) => getProductDetails(productId));
    products = await Promise.all(productPromises);
    renderProducts();
  } catch (error) {
    console.error("Failed to fetch products:", error);
  }
}

// Fetch details of a single product from the marketplace contract
async function getProductDetails(productId) {
  try {
    const product = await marketplaceContract.methods.getProduct(productId).call();
    return {
      id: productId,
      owner: product[0],
      name: product[1],
      image: product[2],
      description: product[3],
      price: web3.utils.fromWei(product[4], "ether"),
      sold: product[5],
    };
  } catch (error) {
    console.error("Failed to fetch product details:", error);
    return null;
  }
}

// Render the products on the webpage
function renderProducts() {
  const marketplaceElement = document.getElementById("marketplace");
  marketplaceElement.innerHTML = "";

  products.forEach((product) => {
    if (product) {
      const productElement = createProductElement(product);
      marketplaceElement.appendChild(productElement);
    }
  });
}

// Create an HTML element for a single product
function createProductElement(product) {
  const productElement = document.createElement("div");
  productElement.className = "product";

  const imageElement = document.createElement("img");
  imageElement.src = product.image;
  imageElement.alt = product.name;
  productElement.appendChild(imageElement);

  const nameElement = document.createElement("h3");
  nameElement.textContent = product.name;
  productElement.appendChild(nameElement);

  const descriptionElement = document.createElement("p");
  descriptionElement.textContent = product.description;
  productElement.appendChild(descriptionElement);

  const priceElement = document.createElement("p");
  priceElement.textContent = `Price: ${product.price} cUSD`;
  productElement.appendChild(priceElement);

  const buyButton = document.createElement("button");
  buyButton.textContent = "Buy";
  buyButton.addEventListener("click", () => buyProduct(product));
  productElement.appendChild(buyButton);

  return productElement;
}

// Buy a product
async function buyProduct(product) {
  try {
    const priceInWei = web3.utils.toWei(product.price, "ether");
    await cUSDContract.methods.approve(marketplaceContract.options.address, priceInWei).send({ from: kit.defaultAccount });
    await marketplaceContract.methods.buyProduct(product.id).send({ from: kit.defaultAccount });
    console.log(`Successfully bought product ${product.name}.`);
    // Refresh products after the purchase
    await getProducts();
  } catch (error) {
    console.error("Failed to buy product:", error);
  }
}

// Wait for the page to load and connect to Celo Extension Wallet
window.addEventListener("load", async () => {
  await connectCeloWallet();
});

(function () {
  "use strict";

  const config = window.STORE_CONFIG;
  const products = window.PRODUCTS;
  const money = new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    maximumFractionDigits: 0
  });

  const elements = {
    productGrid: document.querySelector("#product-grid"),
    categoryList: document.querySelector("#category-list"),
    search: document.querySelector("#product-search"),
    catalogCount: document.querySelector("#catalog-count"),
    emptyResults: document.querySelector("#empty-results"),
    cartDialog: document.querySelector("#cart-dialog"),
    cartItems: document.querySelector("#cart-items"),
    cartEmpty: document.querySelector("#cart-empty"),
    cartSummary: document.querySelector("#cart-summary"),
    cartSubtotal: document.querySelector("#cart-subtotal"),
    cartCount: document.querySelector("#cart-count"),
    dialogCount: document.querySelector("#dialog-count"),
    cartSavings: document.querySelector("#cart-savings"),
    orderForm: document.querySelector("#order-form"),
    formStatus: document.querySelector("#form-status"),
    toast: document.querySelector("#toast")
  };

  let activeCategory = "all";
  let cart = window.CircuitCart.read(products);
  let toastTimer;

  function saveCart() {
    if (!window.CircuitCart.write(cart)) {
      showToast("Cart could not be saved. Enable cookies for this site.");
    }
  }

  function formatPrice(price) {
    return money.format(price);
  }

  function getVariant(product, index) {
    return product.variants[index] || product.variants[0];
  }

  function discountInfo(variant) {
    const price = Number(variant.price);
    const compareAtPrice = Number(variant.compareAtPrice);
    const discounted = Number.isFinite(compareAtPrice) && compareAtPrice > price;
    return {
      discounted: discounted,
      compareAtPrice: discounted ? compareAtPrice : price,
      percent: discounted ? Math.round((compareAtPrice - price) / compareAtPrice * 100) : 0,
      savings: discounted ? compareAtPrice - price : 0
    };
  }

  function availableStock(productId, variantIndex) {
    const product = products.find(function (entry) { return entry.id === productId; });
    return product ? getVariant(product, variantIndex).stock : 0;
  }

  function categories() {
    return Array.from(new Set(products.map(function (product) { return product.category; })));
  }

  function renderCategories() {
    const offersButton = document.createElement("button");
    offersButton.className = "category-button";
    offersButton.type = "button";
    offersButton.dataset.category = "offers";
    offersButton.setAttribute("aria-pressed", "false");
    offersButton.textContent = "Offers";
    elements.categoryList.append(offersButton);

    categories().forEach(function (category) {
      const button = document.createElement("button");
      button.className = "category-button";
      button.type = "button";
      button.dataset.category = category;
      button.setAttribute("aria-pressed", "false");
      button.textContent = category;
      elements.categoryList.append(button);
    });
  }

  function productCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";
    card.dataset.productId = product.id;

    const galleryImages = Array.isArray(product.images) && product.images.length
      ? product.images.map(function (image) {
        return typeof image === "string" ? { src: image, alt: product.imageAlt } : image;
      })
      : [{ src: product.image, alt: product.imageAlt }];
    const imageWrap = document.createElement("div");
    imageWrap.className = "product-image-wrap";
    const productSoldOut = product.variants.every(function (variant) { return variant.stock < 1; });
    if (productSoldOut) imageWrap.classList.add("sold-out-product");
    const image = document.createElement("img");
    image.className = "product-image";
    image.src = galleryImages[0].src;
    image.alt = galleryImages[0].alt || product.name;
    image.loading = "lazy";
    image.width = 900;
    image.height = 675;
    image.addEventListener("error", function () {
      imageWrap.classList.add("image-failed");
      image.removeAttribute("src");
      image.alt = "Product photo unavailable";
    });

    const badge = document.createElement("span");
    badge.className = "product-badge";
    badge.textContent = productSoldOut ? "SOLD OUT" : product.badge;
    if (productSoldOut) badge.classList.add("sold-out-badge");
    imageWrap.append(image, badge);
    if (galleryImages.length > 1) {
      let activeImageIndex = 0;
      const previousImage = document.createElement("button");
      previousImage.className = "gallery-button gallery-button-previous";
      previousImage.type = "button";
      previousImage.setAttribute("aria-label", "Previous image for " + product.name);
      previousImage.textContent = "<";
      const imageCount = document.createElement("span");
      imageCount.className = "gallery-count";
      imageCount.setAttribute("aria-live", "polite");
      const nextImage = document.createElement("button");
      nextImage.className = "gallery-button gallery-button-next";
      nextImage.type = "button";
      nextImage.setAttribute("aria-label", "Next image for " + product.name);
      nextImage.textContent = ">";
      function showGalleryImage(index) {
        activeImageIndex = (index + galleryImages.length) % galleryImages.length;
        const activeImage = galleryImages[activeImageIndex];
        imageWrap.classList.remove("image-failed");
        image.src = activeImage.src;
        image.alt = activeImage.alt || product.name + " image " + (activeImageIndex + 1);
        imageCount.textContent = (activeImageIndex + 1) + " / " + galleryImages.length;
      }
      previousImage.addEventListener("click", function () { showGalleryImage(activeImageIndex - 1); });
      nextImage.addEventListener("click", function () { showGalleryImage(activeImageIndex + 1); });
      showGalleryImage(0);
      imageWrap.append(previousImage, imageCount, nextImage);
    }

    const details = document.createElement("div");
    details.className = "product-details";
    const topLine = document.createElement("div");
    topLine.className = "product-meta";
    const category = document.createElement("span");
    category.textContent = product.category;
    const variantCount = document.createElement("span");
    variantCount.textContent = product.variants.length > 1 ? product.variants.length + " options" : "1 option";
    topLine.append(category, variantCount);

    const title = document.createElement("h3");
    title.textContent = product.name;
    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description;

    const specifications = Array.isArray(product.specifications)
      ? product.specifications.filter(function (specification) { return specification.label && specification.value; })
      : [];
    if (specifications.length) {
      const specificationDetails = document.createElement("details");
      specificationDetails.className = "product-specifications";
      const summary = document.createElement("summary");
      summary.textContent = "Specifications";
      const table = document.createElement("table");
      const body = document.createElement("tbody");
      specifications.forEach(function (specification) {
        const row = document.createElement("tr");
        const label = document.createElement("th");
        label.scope = "row";
        label.textContent = specification.label;
        const value = document.createElement("td");
        value.textContent = specification.value;
        row.append(label, value);
        body.append(row);
      });
      table.append(body);
      specificationDetails.append(summary, table);
      details.append(topLine, title, description, specificationDetails);
    } else {
      details.append(topLine, title, description);
    }

    const variantLabel = document.createElement("label");
    variantLabel.className = "variant-control";
    const variantText = document.createElement("span");
    variantText.textContent = "Option";
    const select = document.createElement("select");
    select.setAttribute("aria-label", product.name + " option");
    product.variants.forEach(function (variant, index) {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = variant.label + (variant.stock < 1 ? " · Out of stock" : "");
      option.disabled = variant.stock < 1;
      select.append(option);
    });
    const firstOffer = product.variants.findIndex(function (variant) {
      return variant.stock > 0 && discountInfo(variant).discounted;
    });
    const firstAvailable = product.variants.findIndex(function (variant) { return variant.stock > 0; });
    select.value = String(firstOffer >= 0 ? firstOffer : firstAvailable < 0 ? 0 : firstAvailable);
    variantLabel.append(variantText, select);

    const bottom = document.createElement("div");
    bottom.className = "product-buy-row";
    const priceStack = document.createElement("div");
    priceStack.className = "product-price-stack";
    const price = document.createElement("strong");
    price.className = "product-price";
    const comparePrice = document.createElement("del");
    comparePrice.className = "product-compare-price";
    const discountLabel = document.createElement("span");
    discountLabel.className = "discount-label";
    priceStack.append(price, comparePrice, discountLabel);
    const stock = document.createElement("span");
    stock.className = "stock-label";
    const add = document.createElement("button");
    add.className = "add-button";
    add.type = "button";
    add.textContent = "Add to cart";

    function updateSelection() {
      const variant = getVariant(product, Number(select.value));
      const discount = discountInfo(variant);
      price.textContent = formatPrice(variant.price);
      comparePrice.textContent = formatPrice(discount.compareAtPrice);
      comparePrice.hidden = !discount.discounted;
      discountLabel.textContent = discount.discounted ? "SAVE " + discount.percent + "%" : "";
      discountLabel.hidden = !discount.discounted;
      stock.textContent = variant.stock > 0 ? "In stock" : "Out of stock";
      stock.classList.toggle("sold-out", variant.stock < 1);
      add.disabled = variant.stock < 1;
      add.textContent = variant.stock > 0 ? "Add to cart" : "Unavailable";
    }

    select.addEventListener("change", updateSelection);
    add.addEventListener("click", function () {
      addToCart(product, Number(select.value));
    });
    updateSelection();
    bottom.append(priceStack, stock, add);
    details.append(variantLabel, bottom);
    card.append(imageWrap, details);
    return card;
  }

  function renderProducts() {
    const query = elements.search.value.trim().toLocaleLowerCase();
    const visibleProducts = products.filter(function (product) {
      const matchesCategory = activeCategory === "all" || (activeCategory === "offers"
        ? product.variants.some(function (variant) { return discountInfo(variant).discounted; })
        : product.category === activeCategory);
      const searchable = [product.name, product.category, product.description, product.badge].join(" ").toLocaleLowerCase();
      return matchesCategory && searchable.includes(query);
    });

    elements.productGrid.replaceChildren.apply(elements.productGrid, visibleProducts.map(productCard));
    elements.catalogCount.textContent = visibleProducts.length + (visibleProducts.length === 1 ? " part" : " parts");
    elements.emptyResults.hidden = visibleProducts.length > 0;
  }

  function addToCart(product, variantIndex) {
    const result = window.CircuitCart.add(products, cart, product.id, variantIndex);
    if (result.status === "unavailable") {
      showToast("That option is at its available quantity.");
      return;
    }
    cart = result.items;
    renderCart();
    showToast(result.status === "added" ? product.name + " added to cart" : "Cart could not be saved. Enable cookies for this site.");
  }

  function cartLines() {
    return cart.map(function (item) {
      const product = products.find(function (entry) { return entry.id === item.productId; });
      const variant = getVariant(product, item.variantIndex);
      const discount = discountInfo(variant);
      return {
        item: item,
        product: product,
        variant: variant,
        lineTotal: variant.price * item.quantity,
        regularTotal: discount.compareAtPrice * item.quantity,
        savings: discount.savings * item.quantity,
        discounted: discount.discounted
      };
    });
  }

  function changeQuantity(productId, variantIndex, change) {
    const item = cart.find(function (entry) {
      return entry.productId === productId && entry.variantIndex === variantIndex;
    });
    if (!item) return;
    const nextQuantity = item.quantity + change;
    if (nextQuantity < 1) {
      cart = cart.filter(function (entry) { return entry !== item; });
    } else {
      item.quantity = Math.min(nextQuantity, availableStock(productId, variantIndex));
    }
    saveCart();
    renderCart();
  }

  function removeFromCart(productId, variantIndex) {
    cart = cart.filter(function (item) {
      return item.productId !== productId || item.variantIndex !== variantIndex;
    });
    saveCart();
    renderCart();
  }

  function createCartLine(line) {
    const row = document.createElement("article");
    row.className = "cart-line";
    const info = document.createElement("div");
    info.className = "cart-line-info";
    const title = document.createElement("h3");
    title.textContent = line.product.name;
    const option = document.createElement("p");
    option.textContent = line.variant.label;
    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = "Remove";
    remove.addEventListener("click", function () {
      removeFromCart(line.product.id, line.item.variantIndex);
    });
    info.append(title, option, remove);

    const controls = document.createElement("div");
    controls.className = "quantity-controls";
    const decrease = document.createElement("button");
    decrease.type = "button";
    decrease.textContent = "−";
    decrease.setAttribute("aria-label", "Decrease " + line.product.name + " quantity");
    decrease.addEventListener("click", function () {
      changeQuantity(line.product.id, line.item.variantIndex, -1);
    });
    const quantity = document.createElement("span");
    quantity.textContent = String(line.item.quantity);
    quantity.setAttribute("aria-label", "Quantity " + line.item.quantity);
    const increase = document.createElement("button");
    increase.type = "button";
    increase.textContent = "+";
    increase.disabled = line.item.quantity >= line.variant.stock;
    increase.setAttribute("aria-label", "Increase " + line.product.name + " quantity");
    increase.addEventListener("click", function () {
      changeQuantity(line.product.id, line.item.variantIndex, 1);
    });
    controls.append(decrease, quantity, increase);

    const linePrice = document.createElement("div");
    linePrice.className = "cart-line-price";
    const compareTotal = document.createElement("del");
    compareTotal.className = "cart-line-compare";
    compareTotal.textContent = formatPrice(line.regularTotal);
    compareTotal.hidden = !line.discounted;
    const lineTotal = document.createElement("strong");
    lineTotal.className = "cart-line-total";
    lineTotal.textContent = formatPrice(line.lineTotal);
    linePrice.append(compareTotal, lineTotal);
    row.append(info, controls, linePrice);
    return row;
  }

  function renderCart() {
    const lines = cartLines();
    const totalQuantity = cart.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    const subtotal = lines.reduce(function (sum, line) { return sum + line.lineTotal; }, 0);
    const savings = lines.reduce(function (sum, line) { return sum + line.savings; }, 0);
    elements.cartCount.textContent = String(totalQuantity);
    elements.cartCount.setAttribute("aria-label", totalQuantity + (totalQuantity === 1 ? " item in cart" : " items in cart"));
    elements.dialogCount.textContent = "(" + totalQuantity + ")";
    elements.cartItems.replaceChildren.apply(elements.cartItems, lines.map(createCartLine));
    elements.cartEmpty.hidden = lines.length > 0;
    elements.cartSummary.hidden = lines.length === 0;
    elements.orderForm.hidden = lines.length === 0;
    elements.cartSubtotal.textContent = formatPrice(subtotal);
    elements.cartSavings.textContent = "You save " + formatPrice(savings);
    elements.cartSavings.hidden = savings === 0;
    elements.formStatus.textContent = "";
  }

  function showToast(message) {
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      elements.toast.classList.remove("visible");
    }, 2400);
  }

  function openCart() {
    elements.cartDialog.showModal();
  }

  function makeOrderMessage(formData) {
    const lines = cartLines();
    const subtotal = lines.reduce(function (sum, line) { return sum + line.lineTotal; }, 0);
    const savings = lines.reduce(function (sum, line) { return sum + line.savings; }, 0);
    const items = lines.map(function (line) {
      let itemText = "- " + line.product.name + " / " + line.variant.label + " x " + line.item.quantity + " = " + formatPrice(line.lineTotal);
      if (line.discounted) itemText += " (was " + formatPrice(line.regularTotal) + ", save " + formatPrice(line.savings) + ")";
      return itemText;
    });
    return [
      "Hello " + config.brandName + ", I would like to place an order:",
      "",
      ...items,
      "",
      "Estimated subtotal: " + formatPrice(subtotal),
      ...(savings > 0 ? ["Total savings: " + formatPrice(savings)] : []),
      "",
      "Name: " + formData.get("customerName").trim(),
      "Phone: " + formData.get("customerPhone").trim(),
      "Delivery address: " + formData.get("customerAddress").trim(),
      "",
      "Please confirm availability, delivery charges, and payment details."
    ].join("\n");
  }

  function handleOrderSubmit(event) {
    event.preventDefault();
    if (cart.length === 0) return;
    const number = config.whatsappNumber.replace(/\D/g, "");
    if (!/^\d{10,15}$/.test(number) || /X/i.test(config.whatsappNumber)) {
      elements.formStatus.textContent = "Set a valid WhatsApp number in products.js before using order handoff.";
      return;
    }
    const formData = new FormData(elements.orderForm);
    const url = "https://wa.me/" + number + "?text=" + encodeURIComponent(makeOrderMessage(formData));
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleCategoryClick(event) {
    const button = event.target.closest(".category-button");
    if (!button) return;
    activeCategory = button.dataset.category;
    elements.categoryList.querySelectorAll(".category-button").forEach(function (categoryButton) {
      const selected = categoryButton === button;
      categoryButton.classList.toggle("selected", selected);
      categoryButton.setAttribute("aria-pressed", String(selected));
    });
    renderProducts();
  }

  function renderAnnouncement() {
    const highestDiscount = products.reduce(function (highest, product) {
      return product.variants.reduce(function (productHighest, variant) {
        return Math.max(productHighest, discountInfo(variant).percent);
      }, highest);
    }, 0);
    const announcement = document.querySelector("#announcement-copy");
    if (highestDiscount > 0) announcement.textContent = "Selected parts: save up to " + highestDiscount + "%";
  }

  document.querySelector("#open-cart").addEventListener("click", openCart);
  document.querySelector("#close-cart").addEventListener("click", function () { elements.cartDialog.close(); });
  elements.cartDialog.addEventListener("click", function (event) {
    if (event.target === elements.cartDialog) elements.cartDialog.close();
  });
  elements.categoryList.addEventListener("click", handleCategoryClick);
  elements.search.addEventListener("input", renderProducts);
  elements.search.addEventListener("keydown", function (event) {
    if (event.key === "Escape") {
      event.preventDefault();
      elements.search.value = "";
      renderProducts();
    }
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      event.preventDefault();
      elements.search.focus();
    }
  });
  elements.orderForm.addEventListener("submit", handleOrderSubmit);
  document.querySelector("#current-year").textContent = String(new Date().getFullYear());

  renderCategories();
  renderAnnouncement();
  renderProducts();
  renderCart();
})();
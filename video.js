(function () {
  "use strict";

  const videos = Array.isArray(window.LEARNING_VIDEOS) ? window.LEARNING_VIDEOS : [];
  const products = Array.isArray(window.PRODUCTS) ? window.PRODUCTS : [];
  const config = window.STORE_CONFIG || { locale: "en-IN", currency: "INR" };
  const elements = {
    detail: document.querySelector("#lesson-content"),
    notFound: document.querySelector("#video-not-found"),
    title: document.querySelector("#video-title"),
    description: document.querySelector("#video-description"),
    player: document.querySelector("#video-player"),
    recommendationList: document.querySelector("#recommendation-list"),
    recommendationEmpty: document.querySelector("#recommendation-empty")
  };
  const money = new Intl.NumberFormat(config.locale, {
    style: "currency",
    currency: config.currency,
    maximumFractionDigits: 0
  });
  let cart = window.CircuitCart.read(products);

  function updateProductCard(product, select, price, button) {
    const variantIndex = Number(select.value);
    const variant = product.variants[variantIndex];
    const cartItem = cart.find(function (item) {
      return item.productId === product.id && item.variantIndex === variantIndex;
    });
    const outOfStock = !variant || variant.stock < 1;
    const atLimit = cartItem && cartItem.quantity >= variant.stock;
    price.textContent = variant ? money.format(variant.price) : "";
    button.disabled = outOfStock || Boolean(atLimit);
    button.textContent = outOfStock ? "Unavailable" : atLimit ? "Stock limit reached" : "Add to cart";
  }

  function recommendationCard(product) {
    const card = document.createElement("article");
    card.className = "recommended-product";
    const image = document.createElement("img");
    image.loading = "lazy";
    image.alt = product.imageAlt || product.name;
    const firstImage = Array.isArray(product.images) && product.images.length ? product.images[0] : product.image;
    image.src = typeof firstImage === "string" ? firstImage : firstImage.src;
    image.addEventListener("error", function () { image.classList.add("image-failed"); image.removeAttribute("src"); }, { once: true });

    const content = document.createElement("div");
    content.className = "recommended-product-content";
    const category = document.createElement("p");
    category.className = "recommended-product-category";
    category.textContent = product.category;
    const title = document.createElement("h3");
    title.textContent = product.name;
    const description = document.createElement("p");
    description.className = "recommended-product-description";
    description.textContent = product.description;
    const variantLabel = document.createElement("label");
    variantLabel.className = "recommendation-variant";
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
    const firstAvailable = product.variants.findIndex(function (variant) { return variant.stock > 0; });
    select.value = String(firstAvailable < 0 ? 0 : firstAvailable);
    variantLabel.append(variantText, select);
    const purchaseRow = document.createElement("div");
    purchaseRow.className = "recommendation-purchase-row";
    const price = document.createElement("strong");
    price.className = "recommended-product-price";
    const button = document.createElement("button");
    button.className = "recommendation-add-button";
    button.type = "button";
    const status = document.createElement("p");
    status.className = "recommendation-add-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    purchaseRow.append(price, button);
    content.append(category, title, description, variantLabel, purchaseRow, status);
    card.append(image, content);

    select.addEventListener("change", function () {
      status.textContent = "";
      updateProductCard(product, select, price, button);
    });
    button.addEventListener("click", function () {
      const result = window.CircuitCart.add(products, cart, product.id, Number(select.value));
      cart = result.items;
      if (result.status === "unavailable") {
        status.textContent = "That option is no longer available.";
      } else if (result.status === "storage-error") {
        status.textContent = "Could not save your cart. Enable cookies for this site.";
      } else {
        status.textContent = "Added to your cart.";
      }
      updateProductCard(product, select, price, button);
      if (result.status !== "added") status.textContent = result.status === "storage-error"
        ? "Could not save your cart. Enable cookies for this site."
        : "That option is no longer available.";
    });
    updateProductCard(product, select, price, button);
    return card;
  }

  function showVideo(video) {
    elements.title.textContent = video.title;
    elements.description.textContent = video.description;
    elements.player.src = "https://www.youtube-nocookie.com/embed/" + video.youtubeId + "?rel=0";
    const suggestedProducts = (video.productIds || []).map(function (productId) {
      return products.find(function (product) { return product.id === productId; });
    }).filter(Boolean);
    elements.recommendationList.replaceChildren.apply(elements.recommendationList, suggestedProducts.map(recommendationCard));
    elements.recommendationEmpty.hidden = suggestedProducts.length > 0;
    elements.detail.hidden = false;
    document.title = video.title + " | TheTechTinker Supply";
  }

  const requestedId = new URL(window.location.href).searchParams.get("id");
  const selectedVideo = videos.find(function (video) {
    return video.id === requestedId && /^[A-Za-z0-9_-]{11}$/.test(video.youtubeId || "");
  });
  if (selectedVideo) showVideo(selectedVideo);
  else elements.notFound.hidden = false;
})();

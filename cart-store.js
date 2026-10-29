(function () {
  "use strict";

  const storageKey = "circuit-dept-cart-v1";
  const cartCookieMaxAge = 60 * 60 * 24 * 30;

  function readCartCookie() {
    const cookiePrefix = storageKey + "=";
    const cookie = document.cookie.split(";").map(function (entry) { return entry.trim(); })
      .find(function (entry) { return entry.indexOf(cookiePrefix) === 0; });
    return cookie ? decodeURIComponent(cookie.slice(cookiePrefix.length)) : null;
  }

  function write(items) {
    const serialized = JSON.stringify(items);
    const value = encodeURIComponent(serialized);
    const secure = location.protocol === "https:" ? "; Secure" : "";
    document.cookie = storageKey + "=" + value + "; Max-Age=" + cartCookieMaxAge + "; Path=/; SameSite=Lax" + secure;
    if (readCartCookie() !== serialized) return false;
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      return true;
    }
    return true;
  }

  function read(products) {
    try {
      const cookieValue = readCartCookie();
      const legacyValue = cookieValue === null ? localStorage.getItem(storageKey) : null;
      const saved = JSON.parse(cookieValue === null ? legacyValue || "[]" : cookieValue);
      if (!Array.isArray(saved)) return [];
      const normalized = saved.filter(function (item) {
        return products.some(function (product) {
          return product.id === item.productId && product.variants[item.variantIndex];
        });
      }).map(function (item) {
        const product = products.find(function (entry) { return entry.id === item.productId; });
        const variant = product.variants[item.variantIndex];
        return {
          productId: product.id,
          variantIndex: item.variantIndex,
          quantity: Math.min(Math.max(1, Number(item.quantity) || 1), variant.stock)
        };
      }).filter(function (item) {
        return item.quantity > 0;
      });
      if (cookieValue === null && legacyValue !== null) write(normalized);
      return normalized;
    } catch (error) {
      return [];
    }
  }

  function add(products, currentItems, productId, variantIndex) {
    const product = products.find(function (entry) { return entry.id === productId; });
    const variant = product && product.variants[variantIndex];
    if (!product || !variant || variant.stock < 1) return { status: "unavailable", items: currentItems };
    const items = currentItems.map(function (item) {
      return { productId: item.productId, variantIndex: item.variantIndex, quantity: item.quantity };
    });
    const item = items.find(function (entry) { return entry.productId === productId && entry.variantIndex === variantIndex; });
    if (item && item.quantity >= variant.stock) return { status: "unavailable", items: currentItems };
    if (item) item.quantity += 1;
    else items.push({ productId: productId, variantIndex: variantIndex, quantity: 1 });
    return { status: write(items) ? "added" : "storage-error", items: items };
  }

  window.CircuitCart = { read: read, write: write, add: add };
})();
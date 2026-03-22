export const analytics = {
  track(event, data = {}) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', event, data);
    }
    console.log('Analytics Event:', event, data);
  },

  viewProduct(product) {
    this.track('view_item', {
      currency: 'USD',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
      }]
    });
  },

  addToCart(product, quantity = 1) {
    this.track('add_to_cart', {
      currency: 'USD',
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: product.price,
        quantity,
      }]
    });
  },

  removeFromCart(product, quantity = 1) {
    this.track('remove_from_cart', {
      currency: 'USD',
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity,
      }]
    });
  },

  addToWishlist(product) {
    this.track('add_to_wishlist', {
      currency: 'USD',
      value: product.price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
      }]
    });
  },

  beginCheckout(cart, total) {
    this.track('begin_checkout', {
      currency: 'USD',
      value: total,
      items: cart.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.qty,
      }))
    });
  },

  purchase(orderId, cart, total) {
    this.track('purchase', {
      transaction_id: orderId,
      currency: 'USD',
      value: total,
      items: cart.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.qty,
      }))
    });
  },

  search(query) {
    this.track('search', {
      search_term: query,
    });
  },
};

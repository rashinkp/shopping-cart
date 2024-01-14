  function addToCart(productId){
    $.ajax({
      url: '/add-to-cart/' + productId,
      method: 'get',
      success: function (response) {
          console.log('Server Response:', response);
          if (response.status) {
              let count = $('#cart-count').html()
              count = parseInt(count) + 1
              $('#cart-count').html(count)
          } else {
              // Error adding product to cart
              alert('Error adding product to cart. Please try again.');
          }
      },
      error: function (error) {
          // Log AJAX request failure
          // console.error('AJAX Request Failed:', error);
          alert('Error adding product to cart. Please try again.');
      }
  });
    }

    function changeQuantity(cartId, productId, userId, count, productPrise) {
      let quantityElement = document.getElementById(productId);
      let quantity = parseInt(quantityElement.innerHTML);
      count = parseInt(count);
    
      $.ajax({
        url: '/change-product-quantity',
        data: {
          user: userId,
          cart: cartId,
          product: productId,
          count: count,
          quantity: quantity
        },
        method: 'post',
        success: (response) => {
          if (response.removeProduct) {
            alert('Product removed from cart');
            location.reload();
          } else {
            quantityElement.innerHTML = quantity + count;
            updateTotal(response.total); // Update total amount
            // You may also update individual item price if needed
            // document.getElementById('item-total-' + productId).innerHTML = 'Rs.' + (quantity + count) * productPrise;
          }
        }
      });
    }
    
    function updateTotal(total) {
      document.getElementById('total').innerHTML = 'Total: Rs.' + total; // Update total amount
    }
    
    
    function removeItem(productId, cartItemId) {
      $.ajax({
        url: '/remove-product',
        data: {
          product: productId,
          cartItem: cartItemId
        },
        method: 'post',
        success: (response) => {
          if (response.removeProduct) {
            alert('Product removed from cart');
            location.reload();
          } else {
            console.log('Product removal unsuccessful:', response);
          }
        }
      });
    }
    
    function updateTotal(total) {
      document.getElementById('total').innerHTML = total; // Update total amount
    }
    

var express = require('express');
var productHelper = require("../helpers/product-helpers");
var router = express.Router();
const userHelper = require('../helpers/user-helpers');
const userHelpers = require('../helpers/user-helpers');
const verifyLogin = (req, res, next) => {
  if (req.session.user && req.session.user.loggedIn) {
    next();
  } else {
    res.redirect('/login');
  }
}

/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelper.getAllProducts().then((products) => {
    res.render("user/view-products", { products, user, cartCount });
  });
});

router.get('/login', (req, res) => {
  if (req.session.user && req.session.user.loggedIn) {
    res.redirect('/');
  } else {
    res.render('user/login', { 'loginErr': req.session.userLoginErr });
    req.session.userLoginErr = false;
  }
});


router.get('/signup', (req, res) => {
    res.render('user/signup');
});

router.post('/signup', async (req, res) => {
  userHelper.doSignup(req.body)
      .then((response) => {
          if (response.status) {
              req.session.user = response.user;
              req.session.user.loggedIn = true;
              console.log('User in session after signup:', req.session.user);
              res.redirect('/'); // Redirect to personal details after successful signup
          } else {
              console.error("Error during signup:", response.message);
              res.status(500).send('Failed to sign up');
          }
      })
      .catch((error) => {
          console.error("Error during signup:", error);
          res.status(500).send('Failed to sign up');
      });
});


router.get('/personal-details',verifyLogin,async(req,res)=>{
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  res.render('user/personal-details',{cartCount})
})

router.get('/products',async(req,res)=>{
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  productHelper.getAllProducts().then((products) => {
    res.render('user/products',{products,cartCount})
  });
})



router.post('/login',(req,res)=>{
  
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){

      
      req.session.user = response.user
      req.session.user.loggedIn = true
      res.redirect('/')

    }else{
      req.session.userLoginErr = 'invalid username or password'
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  req.session.user = null
  res.redirect('/')
})


router.get('/cart', verifyLogin, async (req, res) => {
  let products = await userHelpers.getCartProducts(req.session.user._id);
  let total;
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  if (products.length > 0) {
    total = await userHelpers.getTotalAmount(req.session.user._id);
  }

  products = products.map((product, index) => ({ ...product, index: index + 1 }));

  res.render('user/cart', { products, user: req.session.user, total,cartCount });
});



// users.js
router.get('/add-to-cart/:id',verifyLogin, async (req, res) => {
  try {
      let productId = req.params.id;
      let userId = req.session.user._id;

      // Call the addToCart function from userHelpers
      await userHelpers.addToCart(productId, userId);
      res.redirect('/');
  } catch (error) {
      console.error('Error in /add-to-cart/:id route:', error);
      res.status(500).json({ status: false, error: 'Internal Server Error' });
  }
});

router.post('/change-product-quantity', (req, res, next) => {
  userHelpers.changeProductQuantity(req.body).then(async (response) => {
    response.total = await userHelpers.getTotalAmount(req.body.user);
    res.json(response);
  });
});

router.post('/remove-product', async (req, res, next) => {
  const { product, cartItem } = req.body;
  const response = await userHelpers.removeProduct(product, cartItem);
  res.json(response);
});

router.get('/place-order',verifyLogin,async(req,res)=>{
  let total = await userHelpers.getTotalAmount(req.session.user._id)
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  res.render('user/place-order',{user:req.session.user,total,cartCount});
})
router.post('/place-order', async (req, res) => {
  try {
    let products = await userHelpers.getCartProductList(req.body.userId);
    let totalPrice = await userHelpers.getTotalAmount(req.session.user._id);

    userHelpers.placeOrder(req.body, products, totalPrice)
      .then((orderId) => {
        if (req.body.paymentMethod == 'COD') {
          res.json({ codSuccess: true });
        } else if (req.body.paymentMethod == 'Online') {
          userHelpers.generateRazorpay(orderId, totalPrice)
            .then((response) => {
              // console.log('order id:', orderId);
              // console.log('total price', totalPrice);
              res.json(response);
            })
            .catch((error) => {
              // console.error('Error in generateRazorpay:', error);
              res.status(500).json({ error: 'Internal Server Error' });
            });
        }
      })
      .catch((error) => {
        console.error('Error in placeOrder:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      });
  } catch (error) {
    console.error('Error in /place-order route:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});


router.get('/order-success',verifyLogin,(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})


router.get('/orders', verifyLogin, async (req, res) => {
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }

  try {
    let orders = await userHelpers.getUserOrder(req.session.user._id);

    // Create an array to store promises for fetching product details
    let productDetailPromises = [];

    // Fetch product details for each order
    orders.forEach((order) => {
      order.products.forEach((product) => {
        const promise = userHelpers.getProductDetails(product.item);
        productDetailPromises.push(promise);
      });
    });

    // Wait for all product detail promises to resolve
    let productDetails = await Promise.all(productDetailPromises);

    // Assign product details to corresponding products in each order
    let productIndex = 0;
    orders.forEach((order) => {
      order.products.forEach((product) => {
        product.productDetails = productDetails[productIndex];
        productIndex++;
      });
    });

    console.log('ordered items:', orders);
    res.render('user/orders', { user: req.session.user, orders, cartCount });
  } catch (error) {
    console.error('Error in /orders route:', error);
    res.status(500).send('Internal Server Error');
  }
});




// router.get('/view-ordered-products',async(req,res)=>{
//   let products = await userHelpers.getOrderedProdcuts(req.params.id)
//   res.render('user/view-ordered-products',{user:req.session.user,products})
// })
//add this to go to specific products


router.post('/verify-payment',(req,res)=>{
  // console.log(req.body)
  userHelpers.verifyPayment(req.body).then(()=>{
    userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    });
  }).catch((err)=>{
    console.log(err);
    res.json({status:false,errMsg:'Error'})
  })

})
router.get('/about',async(req,res)=>{
  let cartCount = null;
  if (req.session.user) {
    cartCount = await userHelpers.getCartCount(req.session.user._id);
  }
  res.render('user/about',{cartCount})
})

router.get('/the-product/:id', async (req, res) => {
  try {
      // Retrieve the product details based on the ID
      const productId = req.params.id;
      const product = await productHelper.getProductDetails(productId);

      let cartCount = null;
      if (req.session.user) {
        cartCount = await userHelpers.getCartCount(req.session.user._id);
      }
      res.render('user/the-product', { product,cartCount });
  } catch (error) {
      console.error('Error in /the-product route:', error);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/view-order-details',verifyLogin,async(req,res)=>{
  let orderId = req.params.id;
  res.render('user/view-order-details')
})

module.exports = router;

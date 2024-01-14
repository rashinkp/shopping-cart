var express = require("express");
// const {render} = require('../app')
var router = express.Router();
var productHelper = require("../helpers/product-helpers");
const path = require('path');
const productHelpers = require("../helpers/product-helpers");
const adminHelper = require("../helpers/admin-helpers");
const adminHelpers = require("../helpers/admin-helpers");
/* GET users listing. */
const checkAdminLogin = (req, res, next) => {
  if (adminHelpers.checkAdminLogin(req)) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};


router.get("/",checkAdminLogin, function (req, res, next) {
  productHelper.getAllProducts().then((products)=>{
    res.render("admin/view-products", { admin: true, products });
  })
});
//adding code 


router.get('/login', (req, res) => {
  if (req.session.admin && req.session.admin.loggedIn) {
    res.redirect('/admin');
  } else {
    res.render('admin/login', { 'loginErr': req.session.adminLoginErr });
    req.session.adminLoginErr = false;
  }
});

router.post('/login', async (req, res) => {
  adminHelper.doLoginAdmin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.admin.loggedIn = true;
      res.redirect('/admin');
    } else {
      req.session.adminLoginErr = 'Invalid username or password';
      res.redirect('/admin/login');
    }
  });
});

router.get('/signup', (req, res) => {
  res.render('admin/signup');
});

router.post('/signup', (req, res) => {
  adminHelper.doSignupAdmin(req.body).then((response) => {
    if (response.status) {
      req.session.admin = response.admin;
      req.session.admin.loggedIn = true;
      res.redirect('/admin');
    } else {
      console.error("Error during admin signup:", response.message);
      res.status(500).send('Failed to sign up');
    }
  }).catch((error) => {
    console.error("Error during admin signup:", error);
    res.status(500).send('Failed to sign up');
  });
});

router.get('/logout', (req, res) => {
  req.session.admin = null;
  res.redirect('/admin/login');
});



//adding code




router.get("/add-product", (req, res) => {
  res.render("admin/add-product",{admin:true});
});

router.post("/add-product", async (req, res) => {
  try {
    const id = await new Promise((resolve, reject) => {
      productHelper.addProduct(req.body, (id) => {
        resolve(id);
      });
    });

    if (id) {
      let image = req.files.image;
      let imagePath = path.join(__dirname, '../public/product-images/', id + '.jpg');

      await new Promise((resolve, reject) => {
        image.mv(imagePath, (err, done) => {
          if (!err) {
            resolve();
          } else {
            console.log(err);
            reject(err);
          }
        });
      });

      res.render("admin/add-product");
    } else {
      console.log("Error adding product");
      res.render("admin/add-product", { error: "Failed to add product" });
    }
  } catch (error) {
    console.log(error);
    res.render("admin/add-product", { error: "Failed to upload image" });
  }
});

router.get('/delete-product/:id',(req,res)=>{
  let productId = req.params.id 
  console.log(productId)
  productHelpers.deleteProduct(productId).then((response)=>{
    res.redirect('/admin/')
  })
})

router.get('/edit-product/:id',async(req,res)=>{
  let product = await productHelpers.getProductDetails(req.params.id)
  res.render('admin/edit-product',{product})
})

router.post('/edit-product/:id',(req,res)=>{
  let id = req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{

    res.redirect('/admin')

    if(req.files.image){  
      let image = req.files.image
      image.mv('./public/product-images/'+id+'.jpg');  
    }
  })
})

module.exports = router;

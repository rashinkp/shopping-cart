const db = require('../config/connection');
const collection = require('../config/collection');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { response } = require('../app');
const Razorpay = require('razorpay');
var instance = new Razorpay({
  key_id:'rzp_test_v8bIpqXoTHrCgb',
  key_secret:'2GfQWRg6KZXrxPIdzwcTHVjX'
});
const doSignup = async (userData) => {
  try {
      userData.password = await bcrypt.hash(userData.password, 10);
      const response = await db.get().collection(collection.USER_COLLECTION).insertOne(userData);

      if (response.acknowledged) {
          const user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: new ObjectId(response.insertedId) });
          return { status: true, user: user }; // Return the entire user object
      } else {
          console.error("Failed to insert user data. No document inserted.");
          return { status: false, message: "Failed to insert user data" };
      }
  } catch (error) {
      console.error("Error in doSignup:", error);
      return { status: false, message: error.message };
  }
};






const doLogin = async (userData) => {
    try {
        let response = {};
        let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email });

        if (user) {
            const status = await bcrypt.compare(userData.password, user.password);
            if (status) {
                response.user = user;
                response.status = true;
                return response;
            } else {
                return { status: false };
            }
        } else {
            return { status: false };
        }
    } catch (error) {
        console.error("Error in doLogin:", error);
        return { status: false, message: error.message };
    }
};


const getProductDetails = async (productId) => {
  try {
      const product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(productId) });
      return product;
  } catch (error) {
      console.error("Error in getProductDetails:", error);
      throw error;
  }
};



module.exports = {
    doSignup,
    doLogin,
    getProductDetails,
    addToCart: (productId, userId) => {
        let proObj = {
            item:new ObjectId(productId),
            quantity:1
        }
        return new Promise(async (resolve, reject) => {
            let  userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user:new ObjectId(userId) });
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item ==productId)
                if(proExist != -1){
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:new ObjectId(userId),'products.item':new ObjectId(productId)},
                    {
                        $inc:{'products.$.quantity':1}
                    }).then(()=>{
                        resolve()
                    })
                }else{
                    db.get().collection(collection.CART_COLLECTION)
                    .updateOne({user:new ObjectId(userId)},{
                        $push:{products:proObj}

                }
               ).then((response)=>{
                resolve()
               })
                }
               
            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [proObj]
                };
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve();
                });
            }
        });
    },
    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: new ObjectId(userId) }
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
                            localField: 'products.item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity',
                            product: { $arrayElemAt: ['$product', 0] }
                        }
                    }
                ]).toArray();
                resolve(cartItems);
            } catch (error) {
                console.error('Error in getCartProducts:', error);
                reject(error);
            }
        });
    },
    
    getCartCount : (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
            if(cart){
                count = cart.products.length
            }
            resolve(count)
        })
    },
    changeProductQuantity : (details)=>{
        details.count = parseInt(details.count);
        details.quantity = parseInt(details.quantity);

        return new Promise((resolve,reject)=>{
            if(details.count == -1 && details.quantity ==1){
                db.get().collection(collection.CART_COLLECTION)
                .updateOne({_id:new ObjectId(details.cart)},
                {
                    $pull:{products:{item:new ObjectId(details.product)}}
                })
                .then((response)=>{
                    resolve({removeProduct:true})
                })
            }else{
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({_id:new ObjectId(details.cart),'products.item':new ObjectId(details.product)},
                    {
                        $inc:{'products.$.quantity':details.count}
                    }).then((response)=>{
                        resolve({status:true})
                    })
            }
            
        })
    },
    removeProduct: async (productId, cartItemId) => {
        try {
          const response = await db.get().collection(collection.CART_COLLECTION)
            .updateOne(
              { _id: new ObjectId(cartItemId) },
              { $pull: { products: { item: new ObjectId(productId) } } }
            );
      
          if (response.modifiedCount > 0) {
            return { removeProduct: true };
          } else {
            console.log('Product removal unsuccessful:', response);
            return { removeProduct: false };
          }
        } catch (error) {
          console.error('Error in removeProduct:', error);
          return { removeProduct: false };
        }
      },
      getTotalAmount: async (userId) => {
        return new Promise(async (resolve, reject) => {
          try {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
              {
                $match: { user: new ObjectId(userId) }
              },
              {
                $unwind: '$products'
              },
              {
                $lookup: {
                  from: collection.PRODUCT_COLLECTION,
                  localField: 'products.item',
                  foreignField: '_id',
                  as: 'product'
                }
              },
              {
                $project: {
                  item: '$products.item',
                  quantity: '$products.quantity',
                  product: { $arrayElemAt: ['$product', 0] }
                }
              },
              {
                $group: {
                  _id: null,
                  total: {
                    $sum: {
                      $multiply: [
                        { $toDouble: '$quantity' },
                        { $toDouble: '$product.prise' }
                      ]
                    }
                  }
                }
              }
            ]).toArray();
      
            // Check if total[0] exists before accessing properties
            if (total && total.length > 0 && total[0].total !== undefined) {
              resolve(total[0].total);
            } else {
              resolve(0); // Return 0 if total is undefined or empty
            }
          } catch (error) {
            console.error('Error in getTotalAmount:', error);
            reject(error);
          }
        });
      },
      
      placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
           console.log(order, products, total);
          let status = order.paymentMethod === 'COD' ? 'Placed' : 'Pending';
          let orderObj = {
            deliveryDetails: {
              mobile: order.mobile,
              place:order.place,
              state:order.state,
              district:order.district,
              pincode: order.pincode,
              address: order.address,
            },
            userId: new ObjectId(order.userId),
            paymentMethod: order.paymentMethod,
            products: products,
            status: status,
            totalAmount: total,
            date: new Date(),
          };
          
          db.get()
            .collection(collection.ORDER_COLLECTION)
            .insertOne(orderObj)
            .then((response) => {
              if (response && response.insertedId) {
                resolve(response.insertedId); // Resolve with the insertedId
              } else {
                console.error('Unexpected response structure:', response);
                reject('Unexpected response structure');
              }
            })
            .catch((error) => {
              console.error('Error in placeOrder:', error);
              reject(error);
            });
        });
      },      
      
      getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {

            try {
                let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
                if (cart && cart.products) {
                    resolve(cart.products);
                } else {
                    resolve([]);
                }
            } catch (error) {
                console.error('Error in getCartProductList:', error);
                reject(error);
            }
        });
    },
    
      getUserOrder:(userId)=>{
        return new Promise(async(resolve,reject)=>{
          let orders=await db.get().collection(collection.ORDER_COLLECTION)
          .find({userId:new ObjectId(userId)}).toArray()
          resolve(orders)
        })
      },
      getOrderedProdcuts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
          let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
            {
                $match: { user: new ObjectId(orderId) }
            },
            {
                $unwind: '$products'
            },
            {
                $lookup: {
                    from: collection.PRODUCT_COLLECTION,
                    localField: 'products.item',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $project: {
                  item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
                }
            }
        ]).toArray();
        resolve(orderItems);
        })
      },
      generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
          console.log('orderId:', orderId); // Add this line to log the orderId
          var options = {
            amount: total * 100,
            currency: "INR",
            receipt: orderId
          };
          instance.orders.create(options, function (err, order) {
            if (err) {
              console.log(err);
              reject(err);
            } else {
              console.log('*****order:', order);
              resolve(order);
            }
          });
        });
      },
      verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
          const crypto = require('crypto');
          let hmac = crypto.createHmac('sha256','2GfQWRg6KZXrxPIdzwcTHVjX');
          hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
          hmac = hmac.digest('hex')
          if(hmac==details['payment[razorpay_signature]']){
            resolve()
          }else{
            reject()
          }
        })
      },
      changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
          db.get().collection(collection.ORDER_COLLECTION)
          .upadteOne({_id:new ObjectId(orderId)},
          {
            $set:{status:'Placed'}
          }
          ).then(()=>{
            resolve()
          })

        })
      },
      
    
};

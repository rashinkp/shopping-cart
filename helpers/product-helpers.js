var db = require('../config/connection');
var collection = require('../config/collection');
const { response } = require('express');
const { ObjectId } = require('mongodb');
var objectId = require('mongodb').ObjectId
module.exports = {
  addProduct: (product, callback) => {
    db.get().collection('product').insertOne(product, (err, data) => {
      if (err) {
        console.error(err);
        callback(null); // Handle the error, for example, pass null to indicate an error
      } else {
        callback(data.insertedId); // Use insertedId to get the _id of the inserted document
      }
    });
  },
  getAllProducts:()=>{
    return new Promise(async(resolve,reject)=>{
        let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
        resolve(products)
    })
  },deleteProduct: (productId) => {
    return new Promise((resolve, reject) => {
      db.get()
        .collection(collection.PRODUCT_COLLECTION)
        .deleteOne({ _id: new objectId(productId) }) // Use new objectId()
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  },getProductDetails: (productId) => {
    return new Promise(async (resolve, reject) => {
        try {
            const product = await db
                .get()
                .collection(collection.PRODUCT_COLLECTION)
                .findOne({ _id: new ObjectId(productId) });

            resolve(product);
        } catch (error) {
            console.error('Error in getProductDetails:', error);
            reject(error);
        }
    });
},updateProduct:(productId,productDetails)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.PRODUCT_COLLECTION)
      .updateOne({_id: new objectId(productId)},{
        $set:{
          name:productDetails.name,
          category:productDetails.category,
          description:productDetails.description,
          prise:productDetails.prise

        }
      }).then((response)=>{
        resolve()
      })

    })
  }
};

const db = require('../config/connection');
const collection = require('../config/collection');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const { response } = require('../app');

const doLoginAdmin = async (adminData) => {
    try {
        let response = {};
        let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email });
  
        if (admin) {
            const status = await bcrypt.compare(adminData.password, admin.password);
            if (status) {
                response.admin = admin;
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
  
  
  const doSignupAdmin = async (adminData) => {
    try {
        adminData.password = await bcrypt.hash(adminData.password, 10);
        const response = await db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData);
        

        if (response.acknowledged) {
            const admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ _id: new ObjectId(response.insertedId) });
            return { status: true, admin: admin };
        } else {
            console.error("Failed to insert admin data. No document inserted.");
            return { status: false, message: "Failed to insert admin data" };
        }
    } catch (error) {
        console.error("Error in doSignup:", error);
        return { status: false, message: error.message };
    }
};

  const checkAdminLogin = (req) => {
    return req.session.admin && req.session.admin.loggedIn;
  };

module.exports={
    doLoginAdmin,
    doSignupAdmin,
    checkAdminLogin
};
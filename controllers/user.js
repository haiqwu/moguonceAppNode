const User = require('../models/user');
const mongoose = require('mongoose');
const { errorHandler } = require('../helpers/dbErrorHandler');

exports.userById = (req, res, next, id) => {
    User.findById(id).exec((err, user) => {
        if (err | !user) {
            return res.status(400).json({
                error: 'User not found'
            });
        }
        req.profile = user;
        next();
    });
};

exports.read = (req, res) => {
    req.profile.hashed_password = undefined;
    req.profile.salt = undefined;
    return res.json(req.profile);
};

exports.update = (req, res) => {
    User.findOneAndUpdate(
        { _id: req.profile._id }, // find document by _id
        { $set: req.body }, // req.body contains updated info
        { new: true }, // default is false, if true, return the newly updated document
        (err, user) => {
            if (err) {
                return res.status(400).json({
                    error: 'You are not authorized to perform this action'
                });
            }
            user.hashed_password = undefined;
            user.salt = undefined;
            res.json(user);
        }
    );
};

exports.purchaseHistory = async (req, res) => {
    try {
        const historyPopulatedUser = await User.findById(req.profile._id).populate("history");
        return res.json(historyPopulatedUser.history);
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            error: 'error in loading user history',
        });
    }
    


    // Order.find({ user: req.profile._id })
    //     .populate('user', '_id name')
    //     .sort('-createdAt')
    //     .exec((err, orders) => {
    //         if (err) {
    //             return res.status(400).json({
    //                 error: errorHandler(err)
    //             });
    //         }
    //         res.json(orders);
    //     });
};

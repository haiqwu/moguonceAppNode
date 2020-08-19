const formidable = require('formidable');
const _ = require('lodash');
const fs = require('fs');
const Product = require('../models/product');
const { errorHandler } = require('../helpers/dbErrorHandler');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema;

exports.productById = (req, res, next, id) => {
    Product
        .findById(id)
        .populate('category')
        .exec((err, product) => {
            if (err || !product) {
                return res.status(400).json({
                    error: 'Product not found'
                });
            }
            req.product = product;
            next();
        });
};

exports.productsByIds = (req, res) => {
    console.log('in productsByIds');
    const idsArray = req.body.ids;
    Product.find({
        '_id': { $in: idsArray }
    },
    (err, products) => {
        if (err) {
            console.log(err);
            return res.status(400).json({
                error: 'Product not found'
            });
        }
        return res.json(products);
    })
    .select('-photo -__v')
    .populate('category');
};

exports.read = (req, res) => {
    req.product.photo = undefined;
    return res.json(req.product);
};

exports.create = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            });
        }
        // check for all fields
        const { name, description, price, category, quantity } = fields;
        if (!name || !description || !price || !category || !quantity) {
            return res.status(400).json({
                error: 'name, description, price, category, and quantity are required'
            });
        }

        let product = new Product(fields);
        
        if (files.photo) {
            // 1000000 is 1 Mb
            if (files.photo.size > 1000000) {
                return res.status(400).json({
                    error: 'Image should be less than 1Mb in size'
                });
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }

        product.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(result);
        });
    });
};

exports.remove = (req, res) => {
    let product = req.product;
    product.remove((err, deletedProduct) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json({
            message: 'Product deleted successfully'
        });
    });
};

exports.update = (req, res) => {
    let form = new formidable.IncomingForm();
    form.keepExtensions = true;
    form.parse(req, (err, fields, files) => {
        if (err) {
            return res.status(400).json({
                error: 'Image could not be uploaded'
            });
        }
        // check for all fields
        const { name, description, price, category, quantity } = fields;
        if (!name || !description || !price || !category || !quantity) {
            return res.status(400).json({
                error: 'name, description, price, category, and quantity are required'
            });
        }

        let product = req.product;
        /**
         * Lodash extend method, aka assignIn method:
         * Iterates over 2nd arg's(or more args) own (as well as prototype chain) properties 
         *  to the destination object(1st arg)
         *  (If more than one source object provided, it will be apply from left to right, and 
         *   subsequent sources overwrite assignments of previous source)
         */
        product = _.extend(product, fields);
        
        if (files.photo) {
            // 1000000 is 1 Mb
            if (files.photo.size > 1000000) {
                return res.status(400).json({
                    error: 'Image should be less than 1Mb in size'
                });
            }
            product.photo.data = fs.readFileSync(files.photo.path);
            product.photo.contentType = files.photo.type;
        }

        product.save((err, result) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            res.json(result);
        });
    });
};

/**
 * list by sell / new arrival :
 * - by sell, e.g. /products?sortBy=sold&order=desc&limit=4
 * - by arrival, e.g. /products?sortBy=createdAt&order=desc&limit=4
 * - if no params are sent, then all products are returned
 * 
 */
exports.list = (req, res) => {
    let order = req.query.order ? req.query.order : 'asc'; // asc as default order
    let sortBy = req.query.sortBy ? req.query.sortBy : '_id'; // _id as default
    let limit = req.query.limit ? parseInt(req.query.limit) : 6; // limit 6 as default
    
    Product.find()
        .select('-photo') // not include photo column
        .populate('category') // enrich 
        .sort([[sortBy, order]])
        .limit(limit)
        .exec((err, products) => {
            if (err) {
                return res.status(400).json({
                    error: 'Product not found'
                });
            }
            res.json(products);
        });
};

/**
 * It will find the products based on the req product category
 * other products that has the same category, will be returned
 * 
 */
exports.listRelated = (req, res) => {
    let limit = req.query.limit ? parseInt(req.query.limit) : 6;

    Product.find({
        _id: { $ne: req.product }, // $ne: not equal [same as below
        // _id: { $ne: req.product._id }
        category: req.product.category // matches product's category
    })
        .limit(limit)
        .populate('category', '_id name') // only select '_id' and 'name' column of the populated table
        .exec((err, products) => {
            if (err) {
                return res.status(400).json({
                    error: 'Product not found'
                });
            }
            res.json(products);
        }); 
};

/**
 * db.collection.distinct(field, query, options);
 * Finds distinct values from a collection(e.g. Product) of specified field,
 *  return as an array
 * 
 */
exports.listCategories = (req, res) => {
    Product.distinct('category', {}, (err, categories) => {
        if (err) {
            return res.status(400).json({
                error: 'Categories not found'
            });
        }
        res.json(categories);
    });
};

/**
 * list products by search
 * we will implement product search in react frontend
 * we will show categories in checkbox and price range in radio buttons
 * as the user clicks on those checkbox and radio buttons
 * we will make api request and show the products to users based on what he wants
 */
exports.listBySearch = (req, res) => {
    let order = req.body.order ? req.body.order : "desc";
    let sortBy = req.body.sortBy ? req.body.sortBy : "_id";
    let limit = req.body.limit ? parseInt(req.body.limit) : 100;
    let skip = parseInt(req.body.skip);
    let findArgs = {};
    
    // console.log(order, sortBy, limit, skip, req.body.filters);
    // console.log("findArgs", findArgs);
    
    for (let key in req.body.filters) {
        if (req.body.filters[key].length > 0) {
            if (key === "price") {
                // gte -  greater than price [0-10]
                // lte - less than
                findArgs[key] = {
                    $gte: req.body.filters[key][0],
                    $lte: req.body.filters[key][1]
                };
            } else {
                // categories info add into the findArgs
                findArgs[key] = req.body.filters[key];
            }
        }
    }
    
    Product.find(findArgs)
        .select("-photo")
        .populate("category")
        .sort([[sortBy, order]])
        .skip(skip) // skipping the given number of documents
        .limit(limit) // selected number of documents
        .exec((err, data) => {
            if (err) {
                return res.status(400).json({
                    error: "Products not found"
                });
            }
            res.json({
                size: data.length,
                data
            });
        });
};

exports.photo = (req, res, next) => {
    if (req.product.photo.data) {
        res.set('Content-Type', req.product.photo.contentType);
        return res.send(req.product.photo.data);
    }
    next();
};

exports.listSearch = (req, res) => {
    // create query object to hold search value and category value
    const query = {};
    // assign search value to query.name
    if (req.query.search) {
        query.name = { $regex: req.query.search, $options: 'i' } // 'i': ignore case
        // assign category value to query.category 
        if (req.query.category && req.query.category != 'All') {
            query.category = req.query.category;
        }
        // find the product based on query object with 2 properties:
        // search and category
        Product.find(query, (err, products) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err),
                });
            }
            res.json(products);
        }).select('-photo');
    }
};

exports.decreaseQty = (req, res, next) => {
    let bulkOps = req.body.order.products.map((item) => {
        return {
            updateOne: {
                filter: { _id: item._id },
                update: { $inc: { quantity: -item.count, sold: +item.count } }
            }
        };
    });
    Product.bulkWrite(bulkOps, {}, (error, products) => {
        if (error) {
            return res.status(400).json({
                error: 'could not update product'
            });
        }
        next();
    });
};









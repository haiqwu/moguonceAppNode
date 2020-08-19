const express = require('express');
const router = express.Router();
const { create, productById, productsByIds, read, remove, update, list, listRelated, 
    listCategories, listBySearch, photo, listSearch } = require('../controllers/product');
const { requireSignin, isAuth, isAdmin } = require('../controllers/auth');
const { userById } = require('../controllers/user');

router.get('/product/:productId', read);
router.post('/product/create/:userId', requireSignin, isAuth, isAdmin, create);
router.delete('/product/:productId/:userId', requireSignin, isAuth, isAdmin, remove);
router.put('/product/:productId/:userId', requireSignin, isAuth, isAdmin, update);
router.get('/products', list);
router.get('/products/search', listSearch); // the search bar functionality
router.get('/products/related/:productId', listRelated);
router.get('/products/categories', listCategories);
router.post('/products/by/search', listBySearch);
router.get('/product/photo/:productId', photo);
router.post('/products/by/ids', productsByIds); // my

router.param('userId', userById); // if request param is :userId, then call function userById
router.param('productId', productById);

module.exports = router;

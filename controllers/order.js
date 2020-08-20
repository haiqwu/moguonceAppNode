const { Order, CartItem } = require('../models/order');
const { errorHandler } = require('../helpers/dbErrorHandler');
const DBCounters = require('../models/dbcounters');
const User = require('../models/user');
const { sendOrderRecieveEmailToContact, sendOrderConfirmationEmailToBuyer } = require('../services/emailService');

exports.orderById = (req, res, next, id) => {
    Order.findById(id)
        .populate('products.product', 'name price')
        .exec((err, order) => {
            if (err || !order) {
                return res.status(400).json({
                    error: errorHandler(err)
                });
            }
            req.order = order;
            next();
        });
};

const getNextSequenceValueForOrder = async () => {
    try {
        const result = await DBCounters.findOneAndUpdate(
            { _id: 'orderid' }, // conditions
            {
                    $inc: { sequence_value: 1 }
            }, // update
            { new: true }, // options
        );
        return result.sequence_value;
    } catch (err) {
        throw new Error('Error in generating sequence order id'); 
    }
};

exports.create = async (req, res) => {
    console.log('CREATE ORDER:', req.body);
    const orderObj = req.body.order;
    orderObj.user = req.profile; // enrich fill
    
    const id = await getNextSequenceValueForOrder();
    const ORDER_ID_PREFILL_CHAR = 'MOGU';

    const order = new Order({
        _id: ORDER_ID_PREFILL_CHAR + id,
        products: orderObj.products,
        user: orderObj.user,
        tax_fee: +orderObj.taxFee,
        shipping_fee: +orderObj.shippingFee,
        required_total_pay: +orderObj.requiredTotalPay,
        actual_total_pay: +orderObj.actualTotalPay,
        actual_pay_currency_code: orderObj.actualCurrencyCode,
        paypal_order_id: orderObj.paypalOrderId,
        shipping: {
            full_name: orderObj.shippingFullName,
            street_address: orderObj.shippingStreetAddress,
            city: orderObj.shippingCity,
            state: orderObj.shippingState,
            postal_code: orderObj.shippingPostalCode,
            country_code: orderObj.shippingCountryCode,
            // shipping_method
        },
        paypal_payer_info: {
            paypal_payer_id: orderObj.paypalPayerId,
            email: orderObj.paypalPayerEmail,
            last_name: orderObj.paypalPayerLastName,
            first_name: orderObj.paypalPayerFirstName,
            phone: orderObj.paypalPayerPhone,
        },
    });

    order.save((error, data) => {
        if (error) {
            return res.status(400).json({
                error: errorHandler(error)
            })
        }
        // if no error:
        const orderData = data;
        // Next, store the id to user history
        User.findOneAndUpdate(
            { _id: req.profile._id }, 
            { $push: { history: ORDER_ID_PREFILL_CHAR + id } }, 
            { new: true, useFindAndModify: false }, 
            (error, data) => {
                if (error) {
                    console.log('Could not update user purchase history, fail..... ');
                    console.log(error);
                    return res.status(400).json({
                        error: 'Could not update user purchase history',
                    });
                }
                console.log('Done successfully');
                // we are done with no error here...
                // before send the order info to client
                // send emails out 
                sendOrderRecieveEmailToContact(order);
                sendOrderConfirmationEmailToBuyer(order);

                //done.
                res.json(orderData);
            }
        );
    });
};

exports.listOrders = (req, res) => {
    Order.find() // all orders
    .populate('user', '_id first_name last_name')
    .sort('-createdAt')
    .exec((err, orders) => {
        if (err) {
            return res.status(400).json({
                error: errorHandler(err)
            });
        }
        res.json(orders);
    })
};

exports.getStatusValues = (req, res) => {
    res.json(Order.schema.path('status').enumValues);
};

exports.updateOrderStatus = (req, res) => {
    Order.update(
        { _id: req.body.orderId },
        { $set: { status: req.body.status } },
        (err, order) => {
            if (err) {
                return res.status(400).json({
                    error: errorHandler(err),
                });
            }
            res.json(order);
        }
    );
};

    


// require on top
const moment = require('moment');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendOrderRecieveEmailToContact = (order) => {
    console.log(order);
    // send email alert to admin (contact)
    const emailData = {
        to: 'contact@onemogu.com',
        from: 'no-reply@onemogu.com',
        subject: `A new order is received # ${order._id}`,
        html: `
        <h1>Hello Admin, someone just made a purchase in your store</h1>
        <h1> Order ID # ${order._id} </h1>
        <h2>Customer name: ${order.user.fullname}</h2>
        <p>Customer user id: ${order.user._id}</p>
      
        <h2>User's purchase history: user had ${order.user.history.length} purchases before </h2>
        <p> ${order.user.history} </p>
        <h2>User's email: ${order.user.email}</h2>
      
        <h2>Order status: ${order.status}</h2>
        <h2>Product details:</h2>
        <hr />
        ${order.products
            .map(p => {
                return `
                    <div>
                        <h3>Product Name: ${p.name}</h3>
                        <h3>Product Price:$ ${p.price}</h3>
                        <h3>Buying Quantity: ${p.count}</h3>
                    </div>
                `;
            }).join('--------------------')}
        <h2> Order tax fee $ ${order.tax_fee} </h2>
        <h2> Order shipping fee $ ${order.shipping_fee} </h2>
        
        <h2>Total order cost(with tax and shipment fee):$ ${order.required_total_pay}<h2>
        <h2>Total payment received :${order.actual_pay_currency_code} ${order.actual_total_pay}<h2>
        <p>Login to your dashboard</p> to see the order in detail.</p>
    `
    };
    sgMail
        .send(emailData)
        .then(sent => console.log('SENT >>>', sent))
        .catch(err => console.log('ERR >>>', err));
};

/**
 * 
 * SendGrid does not work for sending to yahoo mail, thus
 * a change of new: Postmark or Mailchimp  needed to be done
 * TODO: Postmark or Mailchimp
 * TODO: add email validation when register an account 
 * 
 * 
 */
exports.sendOrderConfirmationEmailToBuyer = (order) => {
    // email to buyer
    // console.log('emailing to',order.user.email);
    // const emailData2 = {
    //     to: order.user.email,
    //     from: 'no-reply@onemogu.com',
    //     subject: `onemogu - Order Confirmation # ${order._id} `,
    //     html: `
    //     <h1>Hey ${order.user.first_name}, Thank you for shopping with us!</h1>
    //     <h2> Your order has been placed successfully. 
    //         We will notify you once the order is being shipped. </h2>
        
    //     <h2>Order ID: ${order._id}</h2>
    //     <h2> Placed at ${ moment(order.createdAt).format('MMMM Do YYYY, h:mm:ss a') }</h2>
    //     <h2>Order status: ${order.status}</h2>
    //     <h2>Order details:</h2>
    //     <hr />
    //     ${order.products
    //         .map(p => {
    //             return `
    //                 <div>
    //                     <h3>  ${p.name} * ${p.count}</h3>
    //                     <p> Each: $ ${p.price}</p>
    //                     <h3> Subtotal: $ ${p.price * p.count} </h3>
    //                 </div>
    //             `;
    //         })
    //         .join('--------------------')}
    //     <h3> Tax : $ ${order.tax_fee}</h3>
    //     <h3>Shipping: $ ${order.shipping_fee} </h3>
    //     <h2>Grand total ${order.required_total_pay}<h2>
    //     <hr />
    //     <h3> We will ship them to <h3>
    //     <br />

    //     <div>${order.shipping.full_name}</div>
    //     <span>${order.shipping.street_address}</span>
    //     <div>${order.shipping.city} , ${order.shipping.state}</div>
    //     <span>${order.shipping.postal_code} , ${order.shipping.country_code}</span>

    //     <p>Thank your for shopping with us.</p>
    // `
    // };
    // sgMail
    //     .send(emailData2)
    //     .then(sent => console.log('SENT 2 >>>', sent))
    //     .catch(err => console.log('ERR 2 >>>', err));
};





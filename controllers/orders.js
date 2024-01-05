const Order = require('../models/order/order');
const OrderDetail = require('../models/order/orderDetail');
const Product = require('../models/product');
const mongoose = require('mongoose');
const ExpressError = require('../utils/ExpressError');
const Customer = require('../models/customer');
const Employee = require('../models/employee');
//Can query CustomerName, EmployeeName, orderDate (inside that day) , orderBeforeDate, orderAfterDate and status. Priority: orderDate > orderBeforeDate > orderAfterDate
//For name, use regex to check if it contains the name (lowercase both sides)
//For date, only one of them can be used at a time (orderDate or orderBeforeDate or orderAfterDate)
//Accepted date format: DD/MM/YYYY
//For status, use exact match
function isValidDate(dateString) {
    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
    return regex.test(dateString);
}
//Post order processor. Update latest order on customer, totalValue bought of customer.
//Also update statistic later.
const postOrderProcessor = async (order) => {
    const customer = await Customer.findById(order.customerId);
    if (!customer) {
        console.log("Customer not found");
        return;
    }
    if (!customer.latestOrderDate) {
        //To DD/MM/YYYY
        customer.latestOrderDate = order.orderDate.toLocaleDateString('en-GB');
    }
    else {
        //Compare date
        const latestOrderDate = new Date(customer.latestOrderDate);
        if (order.orderDate > latestOrderDate) {
            customer.latestOrderDate = order.orderDate.toLocaleDateString('en-GB');
        }
    }
    if (customer.totalValueBought === undefined) {
        customer.totalValueBought = 0;
    }
    customer.totalValueBought += order.total;
    console.log("Updated customer: ", customer);
    await customer.save();
}

async function ConvertOrderQuery(query) {
    const filter = {};
    if (query.customerName) {
        //Find customer whose name contains the query
        filter.customerId = { $in: await Customer.find({ name: { $regex: query.customerName, $options: 'i' } }).select('_id') };
    }
    if (query.employeeName) {
        //Find employee whose name contains the query
        filter.employeeId = { $in: await Employee.find({ name: { $regex: query.employeeName, $options: 'i' } }).select('_id') };
    }
    //Data send will be in DD/MM/YYYY 
    //Date type check to ensure it's in DD/MM/YYYY format
    if (query.orderAfterDate || query.orderBeforeDate || query.orderDate) {
        if (!isValidDate(query.orderAfterDate) && query.orderAfterDate) {
            throw new ExpressError('Invalid orderAfterDate format. Accepted format: DD/MM/YYYY', 400);
        }
        if (!isValidDate(query.orderBeforeDate) && query.orderBeforeDate) {
            throw new ExpressError('Invalid orderBeforeDate format. Accepted format: DD/MM/YYYY', 400);
        }
        if (!isValidDate(query.orderDate) && query.orderDate) {
            throw new ExpressError('Invalid orderDate format. Accepted format: DD/MM/YYYY', 400);
        }

    }
    if (query.orderAfterDate) {
        const date = query.orderAfterDate;
        const [day, month, year] = date.split('/');
        filter.orderDate = { $gte: new Date(year, month - 1, day) };
    }
    if (query.orderBeforeDate) {
        const date = query.orderBeforeDate;
        const [day, month, year] = date.split('/');
        filter.orderDate = { $lt: new Date(year, month - 1, day) };
    }
    if (query.orderDate) {
        const date = query.orderDate;
        const [day, month, year] = date.split('/');
        filter.orderDate = { $gte: new Date(year, month - 1, day), $lt: new Date(year, month - 1, day + 1) };
    }
    if (query.status) {
        filter.status = query.status;
    }
    return filter;
}

module.exports.getOrders = async (req, res, next) => {
    const limit = req.query.limit;
    const startIndex = req.query.startIndex;
    let filter = {};
    let results = {};
    results = { ...req.results }
    try {
        filter = await ConvertOrderQuery(req.query);
        results.results = await Order
            .find(filter)
            .limit(limit)
            .skip(startIndex)
            .populate('customerId', 'name phoneNumber')
            .populate('employeeId', 'name')
            //Populate orderDetails product in side each productId
            .populate('orderDetails', 'productId quantity sellPrice')
            //Populate product inside each orderDetails, sellPrice and images
            .populate({
                path: 'orderDetails',
                populate: {
                    path: 'productId',
                    select: 'productName sellPrice images'
                }
            })
            .exec();


        res.status(200).json({ ...results });
    } catch (error) {
        next(error);
    }
}

//Get order detail 
module.exports.getOrderDetail = async (req, res, next) => {
    try {
        const { id, detailId } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        const orderDetail = await OrderDetail.findById(detailId);
        if (!orderDetail) {
            return res.status(404).json({ error: 'Order detail not found' });
        }
        res.status(200).json({ orderDetail, success: true });
    } catch (error) {
        next(error);
    }
}
//if status is delivered, update product quantity
module.exports.addOrder = async (req, res, next) => {
    const orderDetails = req.body.orderDetails;
    let additionalMSG = '';
    if (req.body.customerId === undefined) {
        req.body.customerId = null;
    }
    const order = new Order({
        customerId: req.body.customerId,
        employeeId: req.body.employeeId,
        orderDate: Date.now(),
        status: 'Pending',
        orderDetails: [],
        total: 0
    });

    //Check for duplicate product id. If found, return error
    const duplicateProduct = orderDetails.some((orderDetail, index) => {
        return orderDetails.some((orderDetail2, index2) => {
            return index !== index2 && orderDetail.productId === orderDetail2.productId;
        });
    });
    if (duplicateProduct) {
        return res.status(400).json({ error: 'Duplicate product id' });
    }

    //Check if customer exists. Cusoemr id can be null
    const customer = await Customer.findById(order.customerId);
    if (!customer && order.customerId !== null) {
        return res.status(400).json({ error: 'Customer with id ' + order.customerId + ' not found' });
    }
    //Check if employee exists. 
    const employee = await Employee.findById(order.employeeId);
    if (!employee) {
        return res.status(400).json({ error: 'Employee with id ' + order.employeeId + ' not found' });
    }


    try {
        //Save order details
        for (const orderDetail of orderDetails) {
            const product = await Product.findById(orderDetail.productId);
            if (!product) {
                return res.status(400).json({ error: 'Product with id ' + orderDetail.productId + ' not found' });
            }
            //Check if quantity is valid
            if (orderDetail.quantity > product.quantity) {
                return res.status(400).json({ error: 'Invalid quantity. Not enough quantity for product ' + product.productName });
            }
            const newOrderDetail = new OrderDetail({
                productId: orderDetail.productId,
                //Parse to int
                quantity: parseInt(orderDetail.quantity),
                //Parse to double
                sellPrice: parseFloat(product.sellPrice),
                orderId: order._id
            });

            await product.save();
            await newOrderDetail.save();
            order.orderDetails.push(newOrderDetail._id);
        }
        await order.save();

        res.status(200).json({ msg: 'Order added', order: order });
    } catch (error) {
        next(error);
    }
}

module.exports.getOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order)
            return res.status(404).json({ error: 'Order not found', success: false });
        res.status(200).json({ order, success: true });
    }
    catch (error) {
        error.statusCode = 400;
        //Fail to cast id
        if (error.kind === 'ObjectId') {
            error.message = 'Invalid order id';
        }
        next(error);
    }
}
//Generally used to udpate status of order. Can also be used to update customer id, employee id , order date and order details.
//If status is updated to delivered, update product quantity
//If order is already delivered, cannot be updated
//If status is cancelled, cannot be updated
module.exports.updateOrder = async (req, res, next) => {

    try {
        const { id } = req.params;
        let additionalMSG = '';
        if (!id || id === undefined) {
            return res.status(400).json({ error: 'Order id not provided' });
        }
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        if (order.status === 'Delivered') {
            return res.status(400).json({ error: 'Order is already delivered. Cannot be updated' });
        }
        if (order.status === 'Cancelled') {
            return res.status(400).json({ error: 'Order is cancelled. Cannot be updated. Try deleting it instead' });
        }
        //Go through each update value and update it
        for (const key in req.body) {
            //If order details are updated, ignore it. Handle it separately
            if (key === 'newOrderDetails' || key === 'deleteOrderDetails' || key === 'deleteProductFromOrderDetails') {
                continue;
            }
            //Handle date conversion (DD/MM/YYYY)
            if (key === 'orderDate') {
                {
                    const date = req.body[key];
                    const [day, month, year] = date.split('/');
                    req.body[key] = new Date(year, month - 1, day);
                    //Remove time zone offset
                    req.body[key] = new Date(req.body[key].getTime() - req.body[key].getTimezoneOffset() * 60 * 1000);
                }
            }
            //Handle status update. Ignore, handle it to update product quantity later
            if (key === 'status') {
                continue;
            }
            //Handle customer id. If customer id is invalid and not null or not found, throw error

            if (key === 'customerId') {
                const customer = await Customer.findById(req.body[key]);
                if (!customer && req.body[key] !== null) {
                    return res.status(400).json({ error: 'Invalid customer id' });
                }
                else if (req.body[key] === null) {
                    req.body[key] = undefined;
                }
                continue;

            }
            //Handle employee id. If employee id is invalid, throw error
            if (key === 'employeeId') {
                const employee = await Employee.findById(req.body[key]);
                if (!employee) {
                    return res.status(400).json({ error: 'Invalid employee id' });
                }
                continue;
            }
            order[key] = req.body[key];
        }

        //Handle deleteOrderDetails and deleteProductFromOrderDetails
        if (req.body.deleteOrderDetails) {
            const deleteOrderDetails = [...req.body.deleteOrderDetails];
            for (const orderDetailIdObject of deleteOrderDetails) {
                const orderDetailId = orderDetailIdObject.orderDetailId;
                console.log("Deleting order detail with id: ", orderDetailId);
                const orderDetail = await OrderDetail.findById(orderDetailId);
                if (!orderDetail) {
                    return res.status(400).json({ error: 'Order detail not found' });
                }
                //Remove order detail from order
                order.orderDetails = order.orderDetails.filter((orderDetailId) => {
                    return orderDetailId.toString() !== orderDetail._id.toString();
                });
                //Remove order detail from database
                await OrderDetail.findByIdAndDelete(orderDetailId);
            }
        }
        //Use current order's order details. Find any details that has productId in deleteProductsFromOrder. If found, delete it. If not, return error
        if (req.body.deleteProductsFromOrder) {
            const productIdsToDelete = [...req.body.deleteProductsFromOrder];
            const orderDetailIds = [...order.orderDetails];
            const orderDetails = await OrderDetail.find({ _id: { $in: orderDetailIds } });

            // Use Promise.all for asynchronous operations
            const deletedProductOrderDetails = await Promise.all(productIdsToDelete.map(async (productIdObject) => {
                // Find order detail id that has productId
                const orderDetailId = orderDetails.find(async (orderDetailId) => {
                    const detail = await OrderDetail.findById(orderDetailId);
                    return detail.productId === productIdObject.productId;
                });

                // If not found, return null
                return orderDetailId || null;
            }));

            // Filter out null values (not found)
            const validDeletedProductOrderDetails = deletedProductOrderDetails.filter(id => id !== null);

            // Handle each found order detail
            for (const orderDetailId of validDeletedProductOrderDetails) {
                const orderDetail = await OrderDetail.findById(orderDetailId);

                // Remove order detail from order
                order.orderDetails = order.orderDetails.filter((detailId) => {
                    return detailId !== orderDetailId;
                });

                // Remove order detail from database
                await OrderDetail.findByIdAndDelete(orderDetailId);
            }

            await order.save();
        }


        // Handle order details to add
        // Order detail cannot have the same product id.
        // If duplicate, overwrite old quantity with new quantity

        if (req.body.newOrderDetails) {
            const newOrderDetails = [...req.body.newOrderDetails];
            for (const orderDetail of newOrderDetails) {
                // Check if product exists -> if not, ignore it. If it does, add it to order details
                const product = await Product.findById(orderDetail.productId);
                if (!product) {
                    console.log("Product with id: ", orderDetail.productId, " not found. Ignored");
                    additionalMSG += "Product with id: " + orderDetail.productId + " not found. Ignored\n";
                    continue;
                }
                // Check if any order details in the current order have the same product id.
                // If found, overwrite old quantity with new quantity
                const duplicateProductOrderDetailId = await Promise.all(order.orderDetails.map(async (orderDetailId) => {
                    const detail = await OrderDetail.findById(orderDetailId);
                    const productId = detail.productId.toString();
                    return productId === orderDetail.productId ? orderDetailId : null;
                }));

                // Filter out null values (not found) and use the first one (if any)
                const firstDuplicateProductId = duplicateProductOrderDetailId.filter(id => id !== null)[0];

                // Check if quantity is valid
                if (orderDetail.quantity > product.quantity) {
                    return res.status(400).json({ error: 'Invalid quantity. Not enough quantity for product ' + product.productName });
                }

                // If duplicate, overwrite old quantity with new quantity
                if (firstDuplicateProductId) {
                    console.log("Duplicate found. Overwriting old quantity with new quantity");
                    additionalMSG += "Duplicate found for product with id: " + orderDetail.productId + ". Overwriting old quantity with new quantity\n";
                    const duplicateOrderDetail = await OrderDetail.findById(firstDuplicateProductId);
                    duplicateOrderDetail.quantity = orderDetail.quantity;
                    await duplicateOrderDetail.save();

                } else {
                    // If not a duplicate, create a new order detail
                    const product = await Product.findById(orderDetail.productId);
                    console.log("No duplicate found. Creating new order detail for product: ", product.productName);
                    additionalMSG += "No duplicate found. Creating new order detail for product: " + product.productName + "\n";
                    const newOrderDetail = new OrderDetail({
                        productId: orderDetail.productId,
                        quantity: orderDetail.quantity,
                        sellPrice: product.sellPrice,
                        orderId: order._id
                    });
                    order.orderDetails.push(newOrderDetail._id); // Add the new order detail to the order
                    await newOrderDetail.save(); // Save the new order detail
                    await order.save(); // Save the changes to the order
                }
            }
        }

        //Handle status update and product quantity update
        if (req.body.status) {
            if (order.status === req.body.status) {
                //Ignore duplicate status
                console.log("Duplicate status");
            }
            else if (req.body.status === 'Cancelled') {
                order.status = req.body.status;
                console.log("Status updated");
            }
            //If status is delivered, update product quantity and its sold
            //Go through order details and update product quantity in current order
            //Also add current order to customer's latest order and total value bought
            else if (req.body.status === 'Delivered') {
                const orderDetails = [...order.orderDetails];
                for (const orderDetailId of orderDetails) {
                    const orderDetail = await OrderDetail.findById(orderDetailId);
                    const product = await Product.findById(orderDetail.productId);

                    //If product is not found, throw error
                    if (!product) {
                        console.log("Product with id: ", orderDetailId.productId, " not found");
                        //If not found, ignore. The only case this can happen is when product is deleted
                        //Also remove the order detail from order
                        order.orderDetails = order.orderDetails.filter((orderDetailId) => {
                            return orderDetailId !== orderDetail._id;
                        });
                        continue;
                    }
                    //If dont have enough quantity, throw error
                    if (product.quantity < orderDetailId.quantity) {
                        return res.status(400).json({ error: 'Not enough quantity for product ' + product.name });
                    }

                    product.quantity = Math.max(0, parseInt(product.quantity) - parseInt(orderDetail.quantity));
                    console.log("Reduced quantity of product: ", product.productName, " from ", product.quantity + orderDetail.quantity, " to ", product.quantity);
                    additionalMSG += "Reduced quantity of product: " + product.productName + " from " + (product.quantity + orderDetail.quantity) + " to " + product.quantity + "\n";
                    if (product.sold === undefined) {
                        product.sold = 0;
                    }
                    product.sold += orderDetail.quantity;
                    console.log("Increased sold of product: ", product.productName, " from ", product.sold - orderDetail.quantity, " to ", product.sold);
                    await product.save();
                    //Update customer's latest order date and total value bought



                }

                order.status = req.body.status;
                console.log("Status updated");
            }

        }

        await order.save();
        if (order.status === 'Delivered') {
            await postOrderProcessor(order);
        }
        res.status(200).json({ msg: 'Order updated', order: order, additionalMSG: additionalMSG });
    } catch (error) {
        next(error);
    }
}

module.exports.deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const order = await Order.findById(id);
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        await Order.findByIdAndDelete(id);
        res.json({ msg: 'Order deleted' });
    } catch (e) {
        next(error);
    }
}
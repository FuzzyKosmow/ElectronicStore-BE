const Product = require("../models/product");
const Order = require("../models/order/order");
const Customer = require("../models/customer");
const mongoose = require('mongoose');

//Date data will be in format DD/MM/YYYY
//Convert to valid date

const convertToDate = (date) => {
    const dateParts = date.split('/');
    return new Date(`${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`);
}
//Return total customer, total products and total sale has been made (Deliverred)

module.exports.getStatistic = async (req, res, next) => {
    try {
        const totalCustomer = await Customer.countDocuments({});
        const totalProduct = await Product.countDocuments({});
        const totalSale = await Order.countDocuments({ status: 'Delivered' });
        const totalProfit = await Order.aggregate([
            {
                $match: {
                    status: 'Delivered'
                }
            },
            {
                $group: {
                    _id: null,
                    totalProfit: {
                        $sum: '$profit'
                    }
                }
            }
        ]);
        return res.status(200).json({
            totalCustomer: totalCustomer,
            totalProduct: totalProduct,
            totalSale: totalSale,
            totalProfit: totalProfit[0].totalProfit
        });
    } catch (error) {
        console.log("Get statistic error: ", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}


//Get top 10 most sold product. Default sort by descending
module.exports.getMostSoldProduct = async (req, res, next) => {
    try {
        let limitParam = req.query.limit;
        let sortParam = req.query.sort;
        if (!limitParam || limitParam < 1) {
            console.log("Get most sold product error: Invalid limit param.Setting default limit to 10");
            limitParam = 10;
        }
        if (!sortParam) {
            console.log("Get most sold product error: Invalid sort param.Setting default sort to -1");
            sortParam = -1;
        }
        if (sortParam === 'asc' || sortParam === '1') {
            sortParam = 1;
        }
        else if (sortParam === 'desc' || sortParam === '-1') {
            sortParam = -1;
        }
        else {
            console.log("Get most sold product error: Invalid sort param.Setting default sort to -1");
            sortParam = -1;
        }
        const products = await Product.find({}).sort({ sold: sortParam }).limit(limitParam);
        return res.status(200).json(products);
    } catch (error) {
        console.log("Get most sold product error: ", error);
        return res.status(500).json({ error: "Internal server error" });
    }
}
//Get profit between two dates. If two days are the same, return profit of that day
//Assign profit for each day
//Go through order

module.exports.getProfit = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "Invalid date" });
        }

        const start = convertToDate(startDate);
        const end = convertToDate(endDate);

        if (start > end) {
            return res.status(400).json({ error: "Start date must be before end date" });
        }

        // Get all orders between two dates. Sort by order date ascending
        const orders = await Order.find({
            orderDate: {
                $gte: start,
                $lte: end
            }
        }).sort({ orderDate: 1 });
        const dailyProfitMap = new Map();
        // Go through order and calculate profit for each day
        for (const order of orders) {
            const orderDate = new Date(order.orderDate.toDateString()); // Remove time part
            const orderDateString = orderDate.toISOString().split('T')[0]; // Get date string
            const dailyProfit = dailyProfitMap.get(orderDateString) || 0;
            dailyProfitMap.set(orderDateString, dailyProfit + order.profit);
        }

        // Convert map to array for response
        const dailyProfits = Array.from(dailyProfitMap.entries()).map(([date, profit]) => ({
            date: date,
            profit: profit
        }));


        return res.status(200).json({ dailyProfits: dailyProfits });


    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

// Get number of customer order between two dates
module.exports.getCustomerOrder = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "Invalid date" });
        }
        const start = convertToDate(startDate);
        const end = convertToDate(endDate);
        if (start > end) {
            return res.status(400).json({ error: "Start date must be before end date" });
        }

        // Get all orders between two dates
        const orders = await Order.find({
            orderDate: {
                $gte: start,
                $lte: end,
            },
        });

        // Create a map to store daily customer order
        const dailyCustomerOrderMap = new Map();

        // Calculate daily unique customer order breakdown
        for (const order of orders) {
            const orderDate = new Date(order.orderDate.toDateString()); // Remove time part
            const orderDateString = orderDate.toISOString().split('T')[0]; // Get date string
            const uniqueCustomers = dailyCustomerOrderMap.get(orderDateString) || new Set();
            uniqueCustomers.add(order.customerId); // Assuming customerId is a unique identifier for customers
            dailyCustomerOrderMap.set(orderDateString, uniqueCustomers);
        }

        // Convert map to array for response
        const dailyCustomerOrders = Array.from(dailyCustomerOrderMap.entries()).map(([date, uniqueCustomers]) => ({
            date: date,
            customerOrder: uniqueCustomers.size
        }));

        return res.status(200).json({ dailyCustomerOrders: dailyCustomerOrders });


    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};


//Get number of product sold between two dates
module.exports.getProductSold = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        if (!startDate || !endDate) {
            return res.status(400).json({ error: "Invalid date" });
        }
        const start = convertToDate(startDate);
        const end = convertToDate(endDate);
        if (start > end) {
            return res.status(400).json({ error: "Start date must be before end date" });
        }
        console.log("Start date: ", start);
        console.log("End date: ", end);
        // Get all orders between two dates
        const orders = await Order.find({
            orderDate: {
                $gte: start,
                $lte: end,
            },
        });

        // Create a map to store daily product sold
        const dailyProductSoldMap = new Map();

        // Calculate daily product sold breakdown
        for (const order of orders) {
            const orderDate = new Date(order.orderDate.toDateString()); // Remove time part
            const orderDateString = orderDate.toISOString().split('T')[0]; // Get date string
            const orderDetails = order.orderDetails;
            for (const orderDetailId of orderDetails) {
                const orderDetail = await mongoose.model('OrderDetail').findById(orderDetailId);
                //If undefined, ignore
                if (!orderDetail) {
                    console.log("Order detail not found. Ignoring");
                    continue;
                }
                const product = await mongoose.model('Product').findById(orderDetail.productId);
                if (!product) {
                    console.log("Product not found. Ignoring");
                    continue;
                }
                const dailyProductSold = dailyProductSoldMap.get(orderDateString) || 0;
                dailyProductSoldMap.set(orderDateString, dailyProductSold + orderDetail.quantity);
            }
        }

        // Convert map to array for response
        const dailyProductSolds = Array.from(dailyProductSoldMap.entries()).map(([date, productSold]) => ({
            date: date,
            productSold: productSold
        }));

        return res.status(200).json({ dailyProductSolds: dailyProductSolds });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

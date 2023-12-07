
const defaultPage = 1;
const defaultLimit = 30;
//Assign limit and page to req.query.limit and req.query.page based on provided query. If not provided, will use default value
//Assign startIndex and endIndex to req.query.startIndex and req.query.endIndex based on limit and page.
//Middlewares after this can use req.query.startIndex and req.query.endIndex to implement pagination
//Will also assign req.results.next and req.results.previous to the next and previous page based on limit and page
//To use, write a wrapper function that calls this function, then pass in paramters along with countDocuments() function of the model
//This function do not modify any filter.
//This function will return bad request if page or limit is invalid. Ommitting page or limit will use default value.
const ValidatePagination = async (req, res, next, countDocuments) => {
    let page = parseInt(req.query.page);
    let limit = parseInt(req.query.limit);
    const totalDocuments = await countDocuments().exec();
    if (page < 1) {
        return res.status(400).json({ error: 'Invalid page number, should start with 1' });
    }
    if (limit < 1) {
        return res.status(400).json({ error: 'Invalid limit, should be positive number' });
    }
    if (isNaN(page)) {
        page = defaultPage;
    }
    if (isNaN(limit)) {
        limit = defaultLimit;
    }
    req.query.page = page;
    req.query.limit = limit;
    req.query.startIndex = (page - 1) * limit;
    req.query.endIndex = page * limit;
    req.results = {};
    if (req.query.endIndex < totalDocuments) {
        req.results.next = {
            page: page + 1,
            limit: limit
        }
    }
    else
        req.results.next = null;
    if (req.query.startIndex > 0) {
        req.results.previous = {
            page: page - 1,
            limit: limit
        }
    }
    else
        req.results.previous = null;
    next();
}
module.exports = ValidatePagination;
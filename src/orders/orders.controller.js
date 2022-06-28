const path = require("path");
const orders = require(path.resolve("src/data/orders-data"));
const nextId = require("../utils/nextId");

// - MIDDLEWARE FUNCTIONS - //

// validator to check if all necessary properties are included in the body
function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      } else {
        next({
          status: 400,
          message: `Must include a ${propertyName}.`,
        });
      }
    };
  };

// validator to check if specified dish id exists
function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find((order) => order.id === orderId);
    if (foundOrder) {
      res.locals.order = foundOrder;
      return next();
    } else {
      next({
        status: 404,
        message: `Order does not exist: ${orderId}`,
      });
    };
  };

// validator to check if 'id' property matches the ":orderId" parameter
// * note * - still validates even if 'id' property is not present  
function idMatchesRouteParam(req, res, next) {
  const id = req.body.data.id; 
  const { orderId } = req.params;
  if (!id || id === orderId) {
    next();
  } else {
    next({
      status: 400,
      message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
    });
  };
};

// validator for 'status' property
function statusIsValid(req, res, next) {
  const { data: { status } = {} } = req.body;
  if (
    status === "pending" ||
    status === "preparing" ||
    status === "out-for-delivery"
  ) {
    next();
  } else if (status === "delivered") {
    next({
      status: 400,
      message: `A delivered order cannot be changed.`,
    });
  } else {
    next({
      status: 400,
      message: `Order must have a status of pending, preparing, out-for-delivery, delivered.`,
    });
  };
};

// validator to check that the 'dishes' property is an array with contents
function dishesIsAnArrayWithContents(req, res, next) {
  const { data: { dishes } = {} } = req.body;
  if (
    Array.isArray(dishes) &&
    dishes.length > 0
  ) {
    next();
  } else {
    next({
      status: 400,
      message: `Order must include at least one dish.`,
    });
  };
};

// validator to check that all 'dishes' contain a valid 'quantity' property
function dishesHaveQuantityProperty(req, res, next) {
    const { data: { dishes } = {} } = req.body
    const index = dishes.findIndex((dish) => !dish.quantity);
    if (index == (-1)) {
      next();
    } else {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0.`,
      });
    };
};

// validator to check that all 'quantity' property values are integers greater than zero
function dishQuantitiesAreValid(req, res, next) {
    const { data: { dishes } = {} } = req.body
    const index = dishes.findIndex((dish) => dish.quantity <= 0 || typeof(dish.quantity) !== "number");
    if (index == (-1)) {
      next();
    } else {
      next({
        status: 400,
        message: `Dish ${index} must have a quantity that is an integer greater than 0.`,
      });
    };
};


// - HTTP METHOD HANDLERS - //

// create-order handler
function create(req, res, next) {
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
    const newOrderId = nextId();
    const newOrder = {
        id: newOrderId,
        deliverTo,
        mobileNumber,
        status,
        dishes,
    };
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
  };

// read-order handler
function read(req, res) {
    res.json({data: res.locals.order});
  };

// update-order handler
function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } = {} } = req.body;
  
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    
    res.json({ data: order });
  };

// delete-order handler
  function destroy(req, res, next) {
    const order = res.locals.order;
    const { orderId } = req.params;
    const index = orders.findIndex((order) => order.id === orderId);
    if (index > -1 && order.status === "pending") {
      orders.splice(index, 1);
      res.sendStatus(204);
    } else {
      next({
      status: 400,
      message: `An order cannot be deleted unless it is pending.`,
      });
    };
  };

// list-all-orders handler
function list(req, res) {
    const { orderId } = req.params;
    res.json({ data: orders.filter(orderId ? order => order.id == orderId : () => true) });
  };


// - EXPORT - //

module.exports = {
    create: [
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("dishes"),
        dishesIsAnArrayWithContents,
        dishesHaveQuantityProperty,
        dishQuantitiesAreValid,
        create
    ],
    read: [orderExists, read],
    update: [
        orderExists,
        bodyDataHas("deliverTo"),
        bodyDataHas("mobileNumber"),
        bodyDataHas("status"),
        bodyDataHas("dishes"),
        idMatchesRouteParam,
        statusIsValid,
        dishesIsAnArrayWithContents,
        dishesHaveQuantityProperty,
        dishQuantitiesAreValid,
        update
    ],
    delete: [orderExists, destroy],
    list,
};

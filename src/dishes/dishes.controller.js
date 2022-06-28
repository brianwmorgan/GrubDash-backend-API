const path = require("path");
const dishes = require(path.resolve("src/data/dishes-data"));
const nextId = require("../utils/nextId");


// - MIDDLEWARE VALIDATORS - //

// validator to check if all necessary properties are included in the body
function bodyDataHas(propertyName) {
    return function (req, res, next) {
      const { data = {} } = req.body;
      if (data[propertyName]) {
        return next();
      } else {
        next({
          status: 400,
          message: `Must include a ${propertyName}.`
        });
      };
    };
  };

// validator to check if specified dish id exists
function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) => dish.id === dishId);
    if (foundDish) {
      res.locals.dish = foundDish;
      return next();
    } else {
      next({
        status: 404,
        message: `Dish does not exist: ${dishId}.`,
      });
    };
  };

// validator to check if 'id' property matches the ":dishId" parameter
function idMatchesRouteParam(req, res, next) {
  const id = req.body.data.id; 
  const { dishId } = req.params;
  if (!id || id === dishId) {
    next();
  } else {
    next({
      status: 400,
      message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}.`
    });
  };
};

// validator to check if price is an integer greater than zero
function priceMeetsCriteria(req, res, next) {
  const { data: { name, description, price, image_url } = {} } = req.body;
  if (typeof price === "number" && price > 0) {
    next();
  } else {
    next({
      status: 400,
      message: `Dish price must be an integer greater than zero.`
    });
  };
};


// - HTTP METHOD HANDLERS - //

// create-dish handler
function create(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    const newDishId = nextId();
    const newDish = {
        id: newDishId,
        name,
        description,
        price,
        image_url,
    };
    dishes.push(newDish);
    res.status(201).json({ data: newDish });
  };

// read-dish handler
function read(req, res) {
    res.json({data: res.locals.dish});
  };

// update-dish handler
function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } = {} } = req.body;
  
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    
    res.json({ data: dish });
  };

// list-all-dishes handler
function list(req, res) {
    const { dishId } = req.params;
    res.json({ data: dishes.filter(dishId ? dish => dish.id == dishId : () => true) });
  };


// - EXPORT - //

module.exports = {
    create: [
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        priceMeetsCriteria,
        create
    ],
    read: [dishExists, read],
    update: [
        dishExists,
        bodyDataHas("name"),
        bodyDataHas("description"),
        bodyDataHas("price"),
        bodyDataHas("image_url"),
        idMatchesRouteParam,
        priceMeetsCriteria,
        update
    ],
    list,
};

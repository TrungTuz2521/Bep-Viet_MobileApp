var DataTypes = require("sequelize").DataTypes;
var _category = require("./category");
var _ingredient = require("./ingredient");
var _ingredient_substitute = require("./ingredient_substitute");
var _recipe = require("./recipe");
var _recipe_category = require("./recipe_category");
var _recipe_ingredient = require("./recipe_ingredient");
var _saved_recipe = require("./saved_recipe");
var _step = require("./step");
var _system_config = require("./system_config");
var _user = require("./user");
var _user_activity_history = require("./user_activity_history");
var _user_allergy = require("./user_allergy");
var _user_favorite_category = require("./user_favorite_category");

function initModels(sequelize) {
  var category = _category(sequelize, DataTypes);
  var ingredient = _ingredient(sequelize, DataTypes);
  var ingredient_substitute = _ingredient_substitute(sequelize, DataTypes);
  var recipe = _recipe(sequelize, DataTypes);
  var recipe_category = _recipe_category(sequelize, DataTypes);
  var recipe_ingredient = _recipe_ingredient(sequelize, DataTypes);
  var saved_recipe = _saved_recipe(sequelize, DataTypes);
  var step = _step(sequelize, DataTypes);
  var system_config = _system_config(sequelize, DataTypes);
  var user = _user(sequelize, DataTypes);
  var user_activity_history = _user_activity_history(sequelize, DataTypes);
  var user_allergy = _user_allergy(sequelize, DataTypes);
  var user_favorite_category = _user_favorite_category(sequelize, DataTypes);

  category.belongsToMany(recipe, { as: 'recipe_id_recipes', through: recipe_category, foreignKey: "category_id", otherKey: "recipe_id" });
  category.belongsToMany(user, { as: 'user_id_user_user_favorite_categories', through: user_favorite_category, foreignKey: "category_id", otherKey: "user_id" });
  ingredient.belongsToMany(ingredient, { as: 'substitute_ingredient_id_ingredients', through: ingredient_substitute, foreignKey: "ingredient_id", otherKey: "substitute_ingredient_id" });
  ingredient.belongsToMany(ingredient, { as: 'ingredient_id_ingredients', through: ingredient_substitute, foreignKey: "substitute_ingredient_id", otherKey: "ingredient_id" });
  ingredient.belongsToMany(user, { as: 'user_id_user_user_allergies', through: user_allergy, foreignKey: "ingredient_id", otherKey: "user_id" });
  recipe.belongsToMany(category, { as: 'category_id_categories', through: recipe_category, foreignKey: "recipe_id", otherKey: "category_id" });
  recipe.belongsToMany(user, { as: 'user_id_users', through: saved_recipe, foreignKey: "recipe_id", otherKey: "user_id" });
  user.belongsToMany(category, { as: 'category_id_category_user_favorite_categories', through: user_favorite_category, foreignKey: "user_id", otherKey: "category_id" });
  user.belongsToMany(ingredient, { as: 'ingredient_id_ingredient_user_allergies', through: user_allergy, foreignKey: "user_id", otherKey: "ingredient_id" });
  user.belongsToMany(recipe, { as: 'recipe_id_recipe_saved_recipes', through: saved_recipe, foreignKey: "user_id", otherKey: "recipe_id" });
  category.belongsTo(category, { as: "parent_category", foreignKey: "parent_category_id"});
  category.hasMany(category, { as: "categories", foreignKey: "parent_category_id"});
  recipe_category.belongsTo(category, { as: "category", foreignKey: "category_id"});
  category.hasMany(recipe_category, { as: "recipe_categories", foreignKey: "category_id"});
  user_favorite_category.belongsTo(category, { as: "category", foreignKey: "category_id"});
  category.hasMany(user_favorite_category, { as: "user_favorite_categories", foreignKey: "category_id"});
  ingredient.belongsTo(ingredient, { as: "parent", foreignKey: "parent_id"});
  ingredient.hasMany(ingredient, { as: "ingredients", foreignKey: "parent_id"});
  ingredient_substitute.belongsTo(ingredient, { as: "ingredient", foreignKey: "ingredient_id"});
  ingredient.hasMany(ingredient_substitute, { as: "ingredient_substitutes", foreignKey: "ingredient_id"});
  ingredient_substitute.belongsTo(ingredient, { as: "substitute_ingredient", foreignKey: "substitute_ingredient_id"});
  ingredient.hasMany(ingredient_substitute, { as: "substitute_ingredient_ingredient_substitutes", foreignKey: "substitute_ingredient_id"});
  recipe_ingredient.belongsTo(ingredient, { as: "ingredient", foreignKey: "ingredient_id"});
  ingredient.hasMany(recipe_ingredient, { as: "recipe_ingredients", foreignKey: "ingredient_id"});
  user_allergy.belongsTo(ingredient, { as: "ingredient", foreignKey: "ingredient_id"});
  ingredient.hasMany(user_allergy, { as: "user_allergies", foreignKey: "ingredient_id"});
  recipe_category.belongsTo(recipe, { as: "recipe", foreignKey: "recipe_id"});
  recipe.hasMany(recipe_category, { as: "recipe_categories", foreignKey: "recipe_id"});
  recipe_ingredient.belongsTo(recipe, { as: "recipe", foreignKey: "recipe_id"});
  recipe.hasMany(recipe_ingredient, { as: "recipe_ingredients", foreignKey: "recipe_id"});
  saved_recipe.belongsTo(recipe, { as: "recipe", foreignKey: "recipe_id"});
  recipe.hasMany(saved_recipe, { as: "saved_recipes", foreignKey: "recipe_id"});
  step.belongsTo(recipe, { as: "recipe", foreignKey: "recipe_id"});
  recipe.hasMany(step, { as: "steps", foreignKey: "recipe_id"});
  user_activity_history.belongsTo(recipe, { as: "recipe", foreignKey: "recipe_id"});
  recipe.hasMany(user_activity_history, { as: "user_activity_histories", foreignKey: "recipe_id"});
  recipe.belongsTo(user, { as: "owner_user", foreignKey: "owner_user_id"});
  user.hasMany(recipe, { as: "recipes", foreignKey: "owner_user_id"});
  saved_recipe.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasMany(saved_recipe, { as: "saved_recipes", foreignKey: "user_id"});
  user_activity_history.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasMany(user_activity_history, { as: "user_activity_histories", foreignKey: "user_id"});
  user_allergy.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasMany(user_allergy, { as: "user_allergies", foreignKey: "user_id"});
  user_favorite_category.belongsTo(user, { as: "user", foreignKey: "user_id"});
  user.hasMany(user_favorite_category, { as: "user_favorite_categories", foreignKey: "user_id"});

  return {
    category,
    ingredient,
    ingredient_substitute,
    recipe,
    recipe_category,
    recipe_ingredient,
    saved_recipe,
    step,
    system_config,
    user,
    user_activity_history,
    user_allergy,
    user_favorite_category,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;

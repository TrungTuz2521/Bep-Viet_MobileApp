const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('recipe_ingredient', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    recipe_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'recipe',
        key: 'id'
      }
    },
    ingredient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'ingredient',
        key: 'id'
      }
    },
    group_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    quantity: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    is_optional: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
      defaultValue: false
    },
    note: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'recipe_ingredient',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "idx_recipe_ingredient_lookup",
        fields: [
          { name: "ingredient_id" },
          { name: "recipe_id" },
        ]
      },
      {
        name: "recipe_ingredient_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('recipe_category', {
    recipe_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'recipe',
        key: 'id'
      }
    },
    category_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'category',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'recipe_category',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "recipe_category_pkey",
        unique: true,
        fields: [
          { name: "recipe_id" },
          { name: "category_id" },
        ]
      },
    ]
  });
};

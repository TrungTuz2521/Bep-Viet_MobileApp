const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('ingredient_substitute', {
    ingredient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'ingredient',
        key: 'id'
      }
    },
    substitute_ingredient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'ingredient',
        key: 'id'
      }
    },
    ratio: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 1.00
    }
  }, {
    sequelize,
    tableName: 'ingredient_substitute',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "ingredient_substitute_pkey",
        unique: true,
        fields: [
          { name: "ingredient_id" },
          { name: "substitute_ingredient_id" },
        ]
      },
    ]
  });
};

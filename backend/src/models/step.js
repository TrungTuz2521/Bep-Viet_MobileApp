const Sequelize = require('sequelize');
module.exports = function(sequelize, DataTypes) {
  return sequelize.define('step', {
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
      },
      unique: "uq_recipe_step_order"
    },
    step_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: "uq_recipe_step_order"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    duration_seconds: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'step',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "step_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "uq_recipe_step_order",
        unique: true,
        fields: [
          { name: "recipe_id" },
          { name: "step_order" },
        ]
      },
    ]
  });
};

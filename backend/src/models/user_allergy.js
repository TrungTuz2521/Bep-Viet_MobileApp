const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('user_allergy', {
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    ingredient_id: {
      type: DataTypes.UUID,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'ingredient',
        key: 'id'
      }
    }
  }, {
    sequelize,
    tableName: 'user_allergy',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: "idx_user_allergy_lookup",
        fields: [
          { name: "user_id" },
          { name: "ingredient_id" },
        ]
      },
      {
        name: "user_allergy_pkey",
        unique: true,
        fields: [
          { name: "user_id" },
          { name: "ingredient_id" },
        ]
      },
    ]
  });
};

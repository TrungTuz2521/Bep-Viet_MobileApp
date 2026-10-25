const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('user_activity_history', {
    id: {
      autoIncrement: true,
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    recipe_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'recipe',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM("view", "cook_completed", "cooking_step_view"),
      allowNull: false
    }
  }, {
    sequelize,
    tableName: 'user_activity_history',
    schema: 'public',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: "idx_user_activity_history",
        fields: [
          { name: "user_id" },
          { name: "created_at", order: "DESC" },
        ]
      },
      {
        name: "user_activity_history_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

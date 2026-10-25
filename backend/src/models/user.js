const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('user', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: "user_email_key"
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    avatar_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: true,
      defaultValue: "user"
    },
    status: {
      type: DataTypes.ENUM("active", "suspended"),
      allowNull: true,
      defaultValue: "active"
    },
    preferred_diet_type: {
      type: DataTypes.ENUM("omnivore", "vegetarian", "vegan", "keto", "pescatarian"),
      allowNull: true,
      defaultValue: "omnivore"
    },
    preferred_tastes: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    // Khẩu vị theo mức: { spicy, salty, sweet, oily } — xem services/tasteFilterService.js
    taste_preferences: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'user',
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: "idx_user_deleted_at",
        fields: [
          { name: "deleted_at" },
        ]
      },
      {
        name: "user_email_key",
        unique: true,
        fields: [
          { name: "email" },
        ]
      },
      {
        name: "user_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
};

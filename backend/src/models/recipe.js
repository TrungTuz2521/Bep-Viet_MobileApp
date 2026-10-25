const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('recipe', {
    id: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    slug: {
      type: DataTypes.STRING(280),
      allowNull: false,
      unique: "recipe_slug_key"
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    servings: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1
    },
    prep_time_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    cook_time_minutes: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    difficulty: {
      type: DataTypes.ENUM("easy", "medium", "hard"),
      allowNull: true,
      defaultValue: "medium"
    },
    diet_type: {
      type: DataTypes.ENUM("omnivore", "vegetarian", "vegan", "keto", "pescatarian"),
      allowNull: true,
      defaultValue: "omnivore"
    },
    owner_user_id: {
      type: DataTypes.UUID,
      allowNull: true,
      references: {
        model: 'user',
        key: 'id'
      }
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM("draft", "published", "archived"),
      allowNull: true,
      defaultValue: "published"
    },
    visibility: {
      type: DataTypes.ENUM("public", "private"),
      allowNull: true,
      defaultValue: "public"
    },
    view_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    save_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    cook_count: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0
    },
    popularity_score: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0.00
    },
    calories: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    protein_grams: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    },
    carbs_grams: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    },
    fat_grams: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'recipe',
    freezeTableName: true,
    schema: 'public',
    timestamps: true,
    paranoid: true,
    underscored: true,
    indexes: [
      {
        name: "idx_recipe_deleted_at",
        fields: [
          { name: "deleted_at" },
        ]
      },
      {
        name: "idx_recipe_popularity",
        fields: [
          { name: "popularity_score", order: "DESC" },
        ]
      },
      {
        name: "recipe_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
      {
        name: "recipe_slug_key",
        unique: true,
        fields: [
          { name: "slug" },
        ]
      },
    ]
  });
};

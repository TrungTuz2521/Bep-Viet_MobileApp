const Sequelize = require('sequelize');
module.exports = function (sequelize, DataTypes) {
  return sequelize.define('system_config', {
    key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      primaryKey: true
    },
    value: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    sequelize,
    tableName: 'system_config',
    schema: 'public',
    timestamps: true,
    createdAt: false,
    updatedAt: 'updated_at',
    indexes: [
      {
        name: "system_config_pkey",
        unique: true,
        fields: [
          { name: "key" },
        ]
      },
    ]
  });
};

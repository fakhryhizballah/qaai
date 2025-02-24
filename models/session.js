'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Session.init({
    nowa: DataTypes.STRING,
    message: DataTypes.STRING,
    status: DataTypes.INTEGER,
    feedback_message: DataTypes.STRING,
    feedback_status: DataTypes.INTEGER,
    feedback_function: DataTypes.STRING,
    feedback_data: DataTypes.TEXT


  }, {
    sequelize,
    modelName: 'Session',
  });
  return Session;
};
'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sessions', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nowa: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.INTEGER
      },
      feedback_message: {
        type: Sequelize.STRING
      },
      feedback_function: {
        type: Sequelize.STRING
      },
      feedback_status: {
        type: Sequelize.INTEGER
      },
      feedback_data: {
        type: Sequelize.TEXT
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Sessions');
  }
};
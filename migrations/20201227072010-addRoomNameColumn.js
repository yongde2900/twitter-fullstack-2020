'use strict';

module.exports = {
  up: (queryInterface, Sequelize) => {
    return queryInterface.addColumn('Chats', 'roomName', {
    type: Sequelize.STRING
    },{})
  },

  down: (queryInterface, Sequelize) => {
    return queryInterface.removeColumn('Chats', 'roomName', {})
  }
};

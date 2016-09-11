var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

const CHANGE_EVENT = 'change';

var _commandHistory = [];

var CommandHistoryStore = assign({}, EventEmitter.prototype, {
  getAll: function() {
    return _commandHistory;
  },

  getCommandHistoryLength: function() {
    return _commandHistory.length;
  },

  /**
   * Returns a single command from the history
   * If offset is 0, it will return the last command.
   * If offset is 1, it will return the second to last command.
   * etc.
   *
   * @param {integer} offset  An offset from the last command in history
   * @return {object} Command A command object
   */
  getCommand: function(offset) {
    var len = _commandHistory.length;
    var command = _commandHistory.slice(len-offset-1, len-offset)[0];
    return command;
  },

  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

AppDispatcher.register(function(action) {
  switch(action.actionType) {
    case 'add-to-command-history':
      var timestamp = new Date().toString();
      var id = (timestamp + ' ' + Math.floor(Math.random() * 999999)).toString(36);
      _commandHistory.push({ id: id, command: action.input, timestamp: timestamp });
      CommandHistoryStore.emitChange();
      break;
  }
});

module.exports = CommandHistoryStore;

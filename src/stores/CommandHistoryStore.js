var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

const CHANGE_EVENT = 'change';

var _commandHistory = {};

var CommandHistoryStore = assign({}, EventEmitter.prototype, {
  getAll: function() {
    return _commandHistory;
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
      _commandHistory[id] = { command: action.input, timestamp: timestamp };
      CommandHistoryStore.emitChange();
      break;
  }
});

module.exports = CommandHistoryStore;

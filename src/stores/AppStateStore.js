var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');
var CommandHistoryStore = require('./CommandHistoryStore');

const CHANGE_EVENT = 'change';
const DEFAULT_WHOAMI = '[tal@ater ~] $';

var _appState = {
  sudo: undefined,
  whoami: DEFAULT_WHOAMI,
  commandHistoryOffset: -1
};

var AppStateStore = assign({}, EventEmitter.prototype, {
  getWhoAmI: function() {
    return _appState.whoami;
  },
  getSudo: function() {
    return _appState.sudo;
  },
  getCommandHistoryOffset: function() {
    return _appState.commandHistoryOffset;
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
    case 'set-sudo':
      _appState.sudo = {command: action.command, args: action.args};
      _appState.whoami = action.whoami;
      AppStateStore.emitChange();
      break;
    case 'clear-sudo':
      _appState.sudo = undefined;
      _appState.whoami = DEFAULT_WHOAMI;
      AppStateStore.emitChange();
      break;
    case 'move-command-history-offset':
      var offset = _appState.commandHistoryOffset + action.offsetChange;
      var commandHistoryLength = CommandHistoryStore.getCommandHistoryLength();
      if (offset >= commandHistoryLength || offset < -1) {
        return;
      }
      _appState.commandHistoryOffset = offset;
      AppStateStore.emitChange();
      break;
    case 'reset-command-history-offset':
      _appState.commandHistoryOffset = -1;
      AppStateStore.emitChange();
      break;
  }
});

module.exports = AppStateStore;

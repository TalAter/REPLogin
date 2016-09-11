var AppDispatcher = require('../dispatcher/AppDispatcher');

var REPLActions = {
  addToOutputBuffer: function(output) {
    AppDispatcher.dispatch({
      actionType: 'add-to-output-buffer',
      output: output
    });
  },
  addToCommandHistory: function(input) {
    AppDispatcher.dispatch({
      actionType: 'add-to-command-history',
      input: input
    });
  },
  goBackInCommandHistory: function() {
    AppDispatcher.dispatch({
      actionType: 'move-command-history-offset',
      offsetChange: 1
    });
  },
  goForwardInCommandHistory: function() {
    AppDispatcher.dispatch({
      actionType: 'move-command-history-offset',
      offsetChange: -1
    });
  },
  resetCommandHistoryOffset: function() {
    AppDispatcher.dispatch({
      actionType: 'reset-command-history-offset'
    });
  },
  setSudo: function(command, args) {
    AppDispatcher.dispatch({
      actionType: 'set-sudo',
      command: command,
      args: args,
      whoami: '[sudo] password for tal:'
    });
  },
  clearSudo: function() {
    AppDispatcher.dispatch({
      actionType: 'clear-sudo'
    });
  }
};

module.exports = REPLActions;

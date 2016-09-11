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

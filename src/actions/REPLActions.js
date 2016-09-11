var AppDispatcher = require('../dispatcher/AppDispatcher');

var REPLActions = {
  addToOutputBuffer: function(output) {
    AppDispatcher.dispatch({
      actionType: 'add-to-output-buffer',
      output: output
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

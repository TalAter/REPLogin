var REPLcommands = require('./repl.commands.react.js');
var OutputBufferStore = require('./stores/OutputBufferStore.js');
var AppStateStore = require('./stores/AppStateStore.js');
require('./stores/CommandHistoryStore.js');
var REPLActions =  require('./actions/REPLActions.js');

/*************************/
/* REPL's Little Helpers */
/*************************/

// Places cursor on the text input.
var focusOnInput = () => {
  document.getElementById('repl-text-input').focus();
};

var getREPLstate = function() {
  return {
    outputBuffer: OutputBufferStore.getAll(),
    whoami: AppStateStore.getWhoAmI(),
    sudo: AppStateStore.getSudo()
  }
};

/********************/
/* React components */
/********************/

var REPL = React.createClass({

  getInitialState: function() {
    return getREPLstate();
  },

  // Reads a command that was just submitted and passes it to EVALUATE
  READ: function(event) {
    event.preventDefault();
    var input = document.getElementById('repl-text-input').value.toLowerCase();
    if (!this.state.sudo) {
      REPLActions.addToCommandHistory(input);
    }
    this.EVALUATE(input);
  },

  // Evaluate a command and passes it and its result to PRINT, then loops
  EVALUATE: function(input) {
    // Are we doing a password check right now?
    if (this.state.sudo) {
      if (input === '12345') {
        let PERMISSION_GRANTED = true;
        this.runCommand(this.state.sudo.command, this.state.sudo.args.concat(PERMISSION_GRANTED));
      } else {
        this.PRINT('sudo: incorrect password');
      }
      REPLActions.clearSudo();
      this.LOOP();
      return;
    }

    // Output the input as one does from time to time
    this.PRINT(
      this.state.whoami+' ' + input
    );

    let command, args;
    // Destructuring and rest for the win!
    [command, ...args] = input.split(' ');
    // Check if command exists
    this.runCommand(command, args);
    this.LOOP();
  },

  // Prints output from a command
  PRINT: function(output) {
    REPLActions.addToOutputBuffer(output);
  },

  // Clears and focuses input again
  LOOP: function() {
    document.getElementById('repl-text-input').value='';
    focusOnInput();
  },

  // Make sure a command exists, then run it with its arguments
  runCommand: function(command, args) {
    if (REPLcommands[command]) {
      this.PRINT(
        REPLcommands[command].apply(this, args)
      );
    } else {
      this.PRINT('command not found: '+command);
    }
  },

  componentDidMount: function() {
    focusOnInput();
    OutputBufferStore.addChangeListener(this._onChange);
    AppStateStore.addChangeListener(this._onChange);
  },

  componentWillUnmount: function() {
    OutputBufferStore.removeChangeListener(this._onChange);
    AppStateStore.removeChangeListener(this._onChange);
  },

  render: function() {
    var outputLines = this.state.outputBuffer.map(
      (line) => ( <div key={line.key}>{line.text}</div> )
    );
    return (
      <div className="repl-container">
        <div className="repl-output">
          {outputLines}
        </div>
        <div className="repl-input">
          <span className="whoami">{this.state.whoami}</span>
          <form onSubmit={this.READ}>
            <input onBlur={focusOnInput} id="repl-text-input"></input>
          </form>
        </div>
      </div>
    );
  },

  _onChange: function() {
    this.setState(getREPLstate());
  }

});


/***************/
/* VROOM VROOM */
/***************/

ReactDOM.render(
  <REPL />,
  document.getElementById('repl')
);

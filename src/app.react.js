var REPLcommands = require('./repl.commands.react.js');

/*************************/
/* REPL's Little Helpers */
/*************************/

// Places cursor on the text input.
var focusOnInput = () => {
  document.getElementById('repl-text-input').focus();
};


/********************/
/* React components */
/********************/

var REPL = React.createClass({

  getInitialState: function() {
    return {
      outputBuffer: [
        {key: 0, text: 'Welcome to REPLogin'},
        {key: 1, text: 'Last login: Thu Sep 8 06:05:15 2016 from 46.120.5.205 (not really)'},
        {key: 2, text: '-bash: warning: This is not bash'},
        {key: 3, text: 'For a list of available commands, try typing help'}
      ],
      whoami: '[tal@ater ~] $'
    };
  },

  // Reads a command that was just submitted and passes it to EVALUATE
  READ: function(event) {
    event.preventDefault();
    var input = document.getElementById('repl-text-input').value.toLowerCase();
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
      let newState = this.state;
      newState.sudo = undefined;
      newState.whoami = '[tal@ater ~] $';
      this.setState(newState);
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
    let newState = this.state;
    newState.outputBuffer.push({key: newState.outputBuffer.length+1, text: output});
    this.setState(newState);
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

  componentDidMount: focusOnInput,

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
  }

});


/***************/
/* VROOM VROOM */
/***************/

ReactDOM.render(
  <REPL />,
  document.getElementById('repl')
);

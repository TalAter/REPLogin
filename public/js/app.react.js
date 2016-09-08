/*************************/
/* REPL's Little Helpers */
/*************************/

// Places cursor on the text input.
var focusOnInput = () => {
  document.getElementById('repl-text-input').focus();
};


/*****************/
/* REPL commands */
/*****************/

var REPLcommands = {
  "help": function() {
    return (
      <div>
        <br />
        <p><strong>Welcome to REPLogin.</strong></p>
        <p>Here are some commands you can try:</p>
        <p><em>ls</em>     List directory contents</p>
        <p><em>cd</em>     Change the current working directory.</p>
      </div>
    )
  },
  "cd": function(destination) {
    if (destination === '.') {
      return (<div>There and back again.</div>);
    } else {
      return (<div>None shall pass!</div>);
    }
  },
  "ls": function() {
    return (
      <div>
        <div>drwx------  7 tal  tal   4096 Sep 7  17:08 .</div>
        <div>drwxr-xr-x. 3 root root  4096 Sep 8   2016 ..</div>
        <div>-rwxrwxr-x  1 tal  tal    304 Sep 8   2016 <em>login</em></div>
      </div>
    )
  },
  "login": function() {
    return REPLcommands["./login"]();
  },
  "./login": function() {
  }
};


/********************/
/* React components */
/********************/

var REPL = React.createClass({
  // Reads a command that was just submitted and passes it to EVALUATE
  READ: function(event) {
    event.preventDefault();
    var input = document.getElementById('repl-text-input').value;
    this.EVALUATE(input);
  },
  // Evaluate a command and passes it and its result to PRINT, then loops
  EVALUATE: function(input) {
    this.PRINT(this.state.whoami+' $ ' + input);
    var command, args;
    // Destructuring and rest for the win!
    [command, ...args] = input.split(' ');
    if (REPLcommands[command]) {
      this.PRINT(
        REPLcommands[command].apply(this, args)
      );
    } else {
      this.PRINT('command not found: '+command);
    }
    this.LOOP();
  },
  // Prints output from a command
  PRINT: function(output) {
    var newState = this.state;
    newState.outputBuffer.push({key: newState.outputBuffer.length+1, text: output});
    this.setState(newState);
  },
  // Clears and focuses input again
  LOOP: function() {
    document.getElementById('repl-text-input').value='';
    focusOnInput();
  },
  getInitialState: function() {
    return {
      outputBuffer: [
        {key: 0, text: 'Welcome to REPLogin'},
        {key: 1, text: 'Last login: Thu Sep 8 06:05:15 2016 from 46.120.5.205 (not really)'},
        {key: 2, text: '-bash: warning: This is not bash'},
        {key: 3, text: 'For a list of available commands, try typing help'}
      ],
      whoami: '[tal@ater ~]'
    };
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
          <span className="whoami">{this.state.whoami} $</span>
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

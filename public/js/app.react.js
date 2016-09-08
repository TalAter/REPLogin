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
        <p><em>pwd</em>    Print name of current/working directory.</p>
        <p><em>cat</em>    Show the contents of a file.</p>
        <p><em>sudo</em>   Execute a command as another user.</p>
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
        <div>drwxr-xr-x. 3 root root  4096 Sep 8  12:29 ..</div>
        <div>-rwxrwxr-x  1 root root   304 Sep 8  13:22 <em>passwords</em></div>
      </div>
    )
  },
  "ll": function() {
    return REPLcommands["ls"]();
  },
  "pwd": function() {
    return (
      <div>/Users/tal</div>
    )
  },
  "./passwords": function() {
    return REPLcommands["passwords"]();
  },
  "passwords": function() {
    return (
      <div>
        <div>command not found: passwords</div>
        <div>Try using <strong>cat</strong> to view the contents of this file.</div>
      </div>
    )
  },
  "cat": function(filename, permission) {
    if (!filename) {
      return (<div>cat: Requires a filename as its first argument</div>);
    }
    if (filename !== 'passwords') {
      return (<div>cat: {filename}: No such file or directory</div>);
    }
    if (permission) {
      return (
        <div><img src="https://cdn.meme.am/instances/53376060.jpg" /></div>
      );
    } else {
      return (
        <div>
          <div>cat: {filename}: Permission denied</div>
          <div>Have you tried <strong>sudo cat {filename}</strong>?</div>
        </div>
      );
    }
  },
  "sudo": function(command, ...args) {
    let newState = this.state;
    newState.whoami = '[sudo] password for tal:';
    // save the command we are trying to sudo for later
    newState.sudo = {command: command, args: args};
    this.setState(newState);
  }
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
        if (REPLcommands[this.state.sudo.command]) {
          this.PRINT(REPLcommands[this.state.sudo.command].apply(this, this.state.sudo.args.concat(PERMISSION_GRANTED)));
        } else {
          this.PRINT('command not found: '+this.state.sudo.command);          
        }
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
    let newState = this.state;
    newState.outputBuffer.push({key: newState.outputBuffer.length+1, text: output});
    this.setState(newState);
  },

  // Clears and focuses input again
  LOOP: function() {
    document.getElementById('repl-text-input').value='';
    focusOnInput();
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

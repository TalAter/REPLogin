"use strict";

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

/*************************/
/* REPL's Little Helpers */
/*************************/

// Places cursor on the text input.
var focusOnInput = function focusOnInput() {
  document.getElementById('repl-text-input').focus();
};

/*****************/
/* REPL commands */
/*****************/

var REPLcommands = {
  "help": function help() {
    return React.createElement(
      "div",
      null,
      React.createElement("br", null),
      React.createElement(
        "p",
        null,
        React.createElement(
          "strong",
          null,
          "Welcome to REPLogin."
        )
      ),
      React.createElement(
        "p",
        null,
        "Here are some commands you can try:"
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "ls"
        ),
        "     List directory contents"
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "cd"
        ),
        "     Change the current working directory."
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "pwd"
        ),
        "    Print name of current/working directory."
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "cat"
        ),
        "    Show the contents of a file."
      ),
      React.createElement(
        "p",
        null,
        React.createElement(
          "em",
          null,
          "sudo"
        ),
        "   Execute a command as another user."
      )
    );
  },
  "cd": function cd(destination) {
    if (destination === '.') {
      return React.createElement(
        "div",
        null,
        "There and back again."
      );
    } else {
      return React.createElement(
        "div",
        null,
        "None shall pass!"
      );
    }
  },
  "ls": function ls() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        null,
        "drwx------  7 tal  tal   4096 Sep 7  17:08 ."
      ),
      React.createElement(
        "div",
        null,
        "drwxr-xr-x  3 root root  4096 Sep 8  12:29 .."
      ),
      React.createElement(
        "div",
        null,
        "-rw-------  1 root root   304 Sep 8  13:22 ",
        React.createElement(
          "em",
          null,
          "passwords"
        )
      )
    );
  },
  "ll": function ll() {
    return REPLcommands["ls"]();
  },
  "pwd": function pwd() {
    return React.createElement(
      "div",
      null,
      "/Users/tal"
    );
  },
  "./passwords": function passwords() {
    return REPLcommands["passwords"]();
  },
  "passwords": function passwords() {
    return React.createElement(
      "div",
      null,
      React.createElement(
        "div",
        null,
        "command not found: passwords"
      ),
      React.createElement(
        "div",
        null,
        "Try using ",
        React.createElement(
          "strong",
          null,
          "cat"
        ),
        " to view the contents of this file."
      )
    );
  },
  "cat": function cat(filename, permission) {
    if (!filename) {
      return React.createElement(
        "div",
        null,
        "cat: Requires a filename as its first argument"
      );
    }
    if (filename !== 'passwords') {
      return React.createElement(
        "div",
        null,
        "cat: ",
        filename,
        ": No such file or directory"
      );
    }
    if (permission) {
      return React.createElement(
        "div",
        null,
        React.createElement("img", { src: "https://cdn.meme.am/instances/53376060.jpg" }),
        React.createElement(
          "div",
          null,
          React.createElement(
            "a",
            { href: "/requirements.html" },
            "How did we do?"
          )
        )
      );
    } else {
      return React.createElement(
        "div",
        null,
        React.createElement(
          "div",
          null,
          "cat: ",
          filename,
          ": Permission denied"
        ),
        React.createElement(
          "div",
          null,
          "Have you tried ",
          React.createElement(
            "strong",
            null,
            "sudo cat ",
            filename
          ),
          "?"
        )
      );
    }
  },
  "sudo": function sudo(command) {
    for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    var newState = this.state;
    newState.whoami = '[sudo] password for tal:';
    // save the command we are trying to sudo for later
    newState.sudo = { command: command, args: args };
    this.setState(newState);
    return React.createElement(
      "div",
      null,
      "You need to be \"logged in\" as root."
    );
  }
};

/********************/
/* React components */
/********************/

var REPL = React.createClass({
  displayName: "REPL",


  getInitialState: function getInitialState() {
    return {
      outputBuffer: [{ key: 0, text: 'Welcome to REPLogin' }, { key: 1, text: 'Last login: Thu Sep 8 06:05:15 2016 from 46.120.5.205 (not really)' }, { key: 2, text: '-bash: warning: This is not bash' }, { key: 3, text: 'For a list of available commands, try typing help' }],
      whoami: '[tal@ater ~] $'
    };
  },

  // Reads a command that was just submitted and passes it to EVALUATE
  READ: function READ(event) {
    event.preventDefault();
    var input = document.getElementById('repl-text-input').value.toLowerCase();
    this.EVALUATE(input);
  },

  // Evaluate a command and passes it and its result to PRINT, then loops
  EVALUATE: function EVALUATE(input) {
    // Are we doing a password check right now?
    if (this.state.sudo) {
      if (input === '12345') {
        var PERMISSION_GRANTED = true;
        this.runCommand(this.state.sudo.command, this.state.sudo.args.concat(PERMISSION_GRANTED));
      } else {
        this.PRINT('sudo: incorrect password');
      }
      var newState = this.state;
      newState.sudo = undefined;
      newState.whoami = '[tal@ater ~] $';
      this.setState(newState);
      this.LOOP();
      return;
    }

    // Output the input as one does from time to time
    this.PRINT(this.state.whoami + ' ' + input);

    var command = void 0,
        args = void 0;
    // Destructuring and rest for the win!

    // Check if command exists
    var _input$split = input.split(' ');

    var _input$split2 = _toArray(_input$split);

    command = _input$split2[0];
    args = _input$split2.slice(1);
    this.runCommand(command, args);
    this.LOOP();
  },

  // Prints output from a command
  PRINT: function PRINT(output) {
    var newState = this.state;
    newState.outputBuffer.push({ key: newState.outputBuffer.length + 1, text: output });
    this.setState(newState);
  },

  // Clears and focuses input again
  LOOP: function LOOP() {
    document.getElementById('repl-text-input').value = '';
    focusOnInput();
  },

  // Make sure a command exists, then run it with its arguments
  runCommand: function runCommand(command, args) {
    if (REPLcommands[command]) {
      this.PRINT(REPLcommands[command].apply(this, args));
    } else {
      this.PRINT('command not found: ' + command);
    }
  },

  componentDidMount: focusOnInput,

  render: function render() {
    var outputLines = this.state.outputBuffer.map(function (line) {
      return React.createElement(
        "div",
        { key: line.key },
        line.text
      );
    });
    return React.createElement(
      "div",
      { className: "repl-container" },
      React.createElement(
        "div",
        { className: "repl-output" },
        outputLines
      ),
      React.createElement(
        "div",
        { className: "repl-input" },
        React.createElement(
          "span",
          { className: "whoami" },
          this.state.whoami
        ),
        React.createElement(
          "form",
          { onSubmit: this.READ },
          React.createElement("input", { onBlur: focusOnInput, id: "repl-text-input" })
        )
      )
    );
  }

});

/***************/
/* VROOM VROOM */
/***************/

ReactDOM.render(React.createElement(REPL, null), document.getElementById('repl'));
//# sourceMappingURL=app.js.map

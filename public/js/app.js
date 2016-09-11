(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.REPLogin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

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

var REPLcommands = require('./repl.commands.react.js');

/********************/
/* React components */
/********************/

var REPL = React.createClass({
  displayName: 'REPL',


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
        'div',
        { key: line.key },
        line.text
      );
    });
    return React.createElement(
      'div',
      { className: 'repl-container' },
      React.createElement(
        'div',
        { className: 'repl-output' },
        outputLines
      ),
      React.createElement(
        'div',
        { className: 'repl-input' },
        React.createElement(
          'span',
          { className: 'whoami' },
          this.state.whoami
        ),
        React.createElement(
          'form',
          { onSubmit: this.READ },
          React.createElement('input', { onBlur: focusOnInput, id: 'repl-text-input' })
        )
      )
    );
  }

});

/***************/
/* VROOM VROOM */
/***************/

ReactDOM.render(React.createElement(REPL, null), document.getElementById('repl'));

},{"./repl.commands.react.js":2}],2:[function(require,module,exports){
"use strict";

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

module.exports = REPLcommands;

},{}]},{},[1])(1)
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLnJlYWN0LmpzIiwic3JjL3JlcGwuY29tbWFuZHMucmVhY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsSUFBSSxlQUFlLFNBQWYsWUFBZSxHQUFNO0FBQ3ZCLFdBQVMsY0FBVCxDQUF3QixpQkFBeEIsRUFBMkMsS0FBM0M7QUFDRCxDQUZEOztBQUtBO0FBQ0E7QUFDQTs7QUFFQSxJQUFJLGVBQWUsUUFBUSwwQkFBUixDQUFuQjs7QUFHQTtBQUNBO0FBQ0E7O0FBRUEsSUFBSSxPQUFPLE1BQU0sV0FBTixDQUFrQjtBQUFBOzs7QUFFM0IsbUJBQWlCLDJCQUFXO0FBQzFCLFdBQU87QUFDTCxvQkFBYyxDQUNaLEVBQUMsS0FBSyxDQUFOLEVBQVMsTUFBTSxxQkFBZixFQURZLEVBRVosRUFBQyxLQUFLLENBQU4sRUFBUyxNQUFNLG9FQUFmLEVBRlksRUFHWixFQUFDLEtBQUssQ0FBTixFQUFTLE1BQU0sa0NBQWYsRUFIWSxFQUlaLEVBQUMsS0FBSyxDQUFOLEVBQVMsTUFBTSxtREFBZixFQUpZLENBRFQ7QUFPTCxjQUFRO0FBUEgsS0FBUDtBQVNELEdBWjBCOztBQWMzQjtBQUNBLFFBQU0sY0FBUyxLQUFULEVBQWdCO0FBQ3BCLFVBQU0sY0FBTjtBQUNBLFFBQUksUUFBUSxTQUFTLGNBQVQsQ0FBd0IsaUJBQXhCLEVBQTJDLEtBQTNDLENBQWlELFdBQWpELEVBQVo7QUFDQSxTQUFLLFFBQUwsQ0FBYyxLQUFkO0FBQ0QsR0FuQjBCOztBQXFCM0I7QUFDQSxZQUFVLGtCQUFTLEtBQVQsRUFBZ0I7QUFDeEI7QUFDQSxRQUFJLEtBQUssS0FBTCxDQUFXLElBQWYsRUFBcUI7QUFDbkIsVUFBSSxVQUFVLE9BQWQsRUFBdUI7QUFDckIsWUFBSSxxQkFBcUIsSUFBekI7QUFDQSxhQUFLLFVBQUwsQ0FBZ0IsS0FBSyxL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LEtBREY7QUFNRCxHQWpEZ0I7QUFrRGpCLFNBQU8sYUFBUyxRQUFULEVBQW1CLFVBQW5CLEVBQStCO0FBQ3BDLFFBQUksQ0FBQyxRQUFMLEVBQWU7QUFDYixhQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUEsT0FBUjtBQUNEO0FBQ0QsUUFBSSxhQUFhLFdBQWpCLEVBQThCO0FBQzVCLGFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBVyxnQkFBWDtBQUFBO0FBQUEsT0FBUjtBQUNEO0FBQ0QsUUFBSSxVQUFKLEVBQWdCO0FBQ2QsYUFDRTtBQUFBO0FBQUE7QUFDRSxxQ0FBSyxLQUFJLDRDQUFULEdBREY7QUFFRTtBQUFBO0FBQUE7QUFBSztBQUFBO0FBQUEsY0FBRyxNQUFLLG9CQUFSO0FBQUE7QUFBQTtBQUFMO0FBRkYsT0FERjtBQU1ELEtBUEQsTUFPTztBQUNMLGFBQ0U7QUFBQTtBQUFBO0FBQ0U7QUFBQTtBQUFBO0FBQUE7QUFBVyxrQkFBWDtBQUFBO0FBQUEsU0FERjtBQUVFO0FBQUE7QUFBQTtBQUFBO0FBQW9CO0FBQUE7QUFBQTtBQUFBO0FBQWtCO0FBQWxCLFdBQXBCO0FBQUE7QUFBQTtBQUZGLE9BREY7QUFNRDtBQUNGLEdBeEVnQjtBQXlFakIsVUFBUSxjQUFTLE9BQVQsRUFBMkI7QUFBQSxzQ0FBTixJQUFNO0FBQU4sVUFBTTtBQUFBOztBQUNqQyxRQUFJLFdBQVcsS0FBSyxLQUFwQjtBQUNBLGFBQVMsTUFBVCxHQUFrQiwwQkFBbEI7QUFDQTtBQUNBLGFBQVMsSUFBVCxHQUFnQixFQUFDLFNBQVMsT0FBVixFQUFtQixNQUFNLElBQXpCLEVBQWhCO0FBQ0EsU0FBSyxRQUFMLENBQWMsUUFBZDtBQUNBLFdBQ0U7QUFBQTtBQUFBO0FBQUE7QUFBQSxLQURGO0FBS0Q7QUFwRmdCLENBQW5COztBQXVGQSxPQUFPLE9BQVAsR0FBaUIsWUFBakIiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyoqKioqKioqKioqKioqKioqKioqKioqKiovXG4vKiBSRVBMJ3MgTGl0dGxlIEhlbHBlcnMgKi9cbi8qKioqKioqKioqKioqKioqKioqKioqKioqL1xuXG4vLyBQbGFjZXMgY3Vyc29yIG9uIHRoZSB0ZXh0IGlucHV0LlxudmFyIGZvY3VzT25JbnB1dCA9ICgpID0+IHtcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcGwtdGV4dC1pbnB1dCcpLmZvY3VzKCk7XG59O1xuXG5cbi8qKioqKioqKioqKioqKioqKi9cbi8qIFJFUEwgY29tbWFuZHMgKi9cbi8qKioqKioqKioqKioqKioqKi9cblxudmFyIFJFUExjb21tYW5kcyA9IHJlcXVpcmUoJy4vcmVwbC5jb21tYW5kcy5yZWFjdC5qcycpO1xuXG5cbi8qKioqKioqKioqKioqKioqKioqKi9cbi8qIFJlYWN0IGNvbXBvbmVudHMgKi9cbi8qKioqKioqKioqKioqKioqKioqKi9cblxudmFyIFJFUEwgPSBSZWFjdC5jcmVhdGVDbGFzcyh7XG5cbiAgZ2V0SW5pdGlhbFN0YXRlOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgb3V0cHV0QnVmZmVyOiBbXG4gICAgICAgIHtrZXk6IDAsIHRleHQ6ICdXZWxjb21lIHRvIFJFUExvZ2luJ30sXG4gICAgICAgIHtrZXk6IDEsIHRleHQ6ICdMYXN0IGxvZ2luOiBUaHUgU2VwIDggMDY6MDU6MTUgMjAxNiBmcm9tIDQ2LjEyMC41LjIwNSAobm90IHJlYWxseSknfSxcbiAgICAgICAge2tleTogMiwgdGV4dDogJy1iYXNoOiB3YXJuaW5nOiBUaGlzIGlzIG5vdCBiYXNoJ30sXG4gICAgICAgIHtrZXk6IDMsIHRleHQ6ICdGb3IgYSBsaXN0IG9mIGF2YWlsYWJsZSBjb21tYW5kcywgdHJ5IHR5cGluZyBoZWxwJ31cbiAgICAgIF0sXG4gICAgICB3aG9hbWk6ICdbdGFsQGF0ZXIgfl0gJCdcbiAgICB9O1xuICB9LFxuXG4gIC8vIFJlYWRzIGEgY29tbWFuZCB0aGF0IHdhcyBqdXN0IHN1Ym1pdHRlZCBhbmQgcGFzc2VzIGl0IHRvIEVWQUxVQVRFXG4gIFJFQUQ6IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVwbC10ZXh0LWlucHV0JykudmFsdWUudG9Mb3dlckNhc2UoKTtcbiAgICB0aGlzLkVWQUxVQVRFKGlucHV0KTtcbiAgfSxcblxuICAvLyBFdmFsdWF0ZSBhIGNvbW1hbmQgYW5kIHBhc3NlcyBpdCBhbmQgaXRzIHJlc3VsdCB0byBQUklOVCwgdGhlbiBsb29wc1xuICBFVkFMVUFURTogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAvLyBBcmUgd2UgZG9pbmcgYSBwYXNzd29yZCBjaGVjayByaWdodCBub3c/XG4gICAgaWYgKHRoaXMuc3RhdGUuc3Vkbykge1xuICAgICAgaWYgKGlucHV0ID09PSAnMTIzNDUnKSB7XG4gICAgICAgIGxldCBQRVJNSVNTSU9OX0dSQU5URUQgPSB0cnVlO1xuICAgICAgICB0aGlzLnJ1bkNvbW1hbmQodGhpcy5zdGF0ZS5zdWRvLmNvbW1hbmQsIHRoaXMuc3RhdGUuc3Vkby5hcmdzLmNvbmNhdChQRVJNSVNTSU9OX0dSQU5URUQpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMuUFJJTlQoJ3N1ZG86IGluY29ycmVjdCBwYXNzd29yZCcpO1xuICAgICAgfVxuICAgICAgbGV0IG5ld1N0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICAgIG5ld1N0YXRlLnN1ZG8gPSB1bmRlZmluZWQ7XG4gICAgICBuZXdTdGF0ZS53aG9hbWkgPSAnW3RhbEBhdGVyIH5dICQnO1xuICAgICAgdGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XG4gICAgICB0aGlzLkxPT1AoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBPdXRwdXQgdGhlIGlucHV0IGFzIG9uZSBkb2VzIGZyb20gdGltZSB0byB0aW1lXG4gICAgdGhpcy5QUklOVChcbiAgICAgIHRoaXMuc3RhdGUud2hvYW1pKycgJyArIGlucHV0XG4gICAgKTtcblxuICAgIGxldCBjb21tYW5kLCBhcmdzO1xuICAgIC8vIERlc3RydWN0dXJpbmcgYW5kIHJlc3QgZm9yIHRoZSB3aW4hXG4gICAgW2NvbW1hbmQsIC4uLmFyZ3NdID0gaW5wdXQuc3BsaXQoJyAnKTtcbiAgICAvLyBDaGVjayBpZiBjb21tYW5kIGV4aXN0c1xuICAgIHRoaXMucnVuQ29tbWFuZChjb21tYW5kLCBhcmdzKTtcbiAgICB0aGlzLkxPT1AoKTtcbiAgfSxcblxuICAvLyBQcmludHMgb3V0cHV0IGZyb20gYSBjb21tYW5kXG4gIFBSSU5UOiBmdW5jdGlvbihvdXRwdXQpIHtcbiAgICBsZXQgbmV3U3RhdGUgPSB0aGlzLnN0YXRlO1xuICAgIG5ld1N0YXRlLm91dHB1dEJ1ZmZlci5wdXNoKHtrZXk6IG5ld1N0YXRlLm91dHB1dEJ1ZmZlci5sZW5ndGgrMSwgdGV4dDogb3V0cHV0fSk7XG4gICAgdGhpcy5zZXRTdGF0ZShuZXdTdGF0ZSk7XG4gIH0sXG5cbiAgLy8gQ2xlYXJzIGFuZCBmb2N1c2VzIGlucHV0IGFnYWluXG4gIExPT1A6IGZ1bmN0aW9uKCkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXBsLXRleHQtaW5wdXQnKS52YWx1ZT0nJztcbiAgICBmb2N1c09uSW5wdXQoKTtcbiAgfSxcblxuICAvLyBNYWtlIHN1cmUgYSBjb21tYW5kIGV4aXN0cywgdGhlbiBydW4gaXQgd2l0aCBpdHMgYXJndW1lbnRzXG4gIHJ1bkNvbW1hbmQ6IGZ1bmN0aW9uKGNvbW1hbmQsIGFyZ3MpIHtcbiAgICBpZiAoUkVQTGNvbW1hbmRzW2NvbW1hbmRdKSB7XG4gICAgICB0aGlzLlBSSU5UKFxuICAgICAgICBSRVBMY29tbWFuZHNbY29tbWFuZF0uYXBwbHkodGhpcywgYXJncylcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuUFJJTlQoJ2NvbW1hbmQgbm90IGZvdW5kOiAnK2NvbW1hbmQpO1xuICAgIH1cbiAgfSxcblxuICBjb21wb25lbnREaWRNb3VudDogZm9jdXNPbklucHV0LFxuXG4gIHJlbmRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIG91dHB1dExpbmVzID0gdGhpcy5zdGF0ZS5vdXRwdXRCdWZmZXIubWFwKFxuICAgICAgKGxpbmUpID0+ICggPGRpdiBrZXk9e2xpbmUua2V5fT57bGluZS50ZXh0fTwvZGl2PiApXG4gICAgKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZXBsLWNvbnRhaW5lclwiPlxuICAgICAgICA8ZGl2IGNsYXNzTmFtZT1cInJlcGwtb3V0cHV0XCI+XG4gICAgICAgICAge291dHB1dExpbmVzfVxuICAgICAgICA8L2Rpdj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZXBsLWlucHV0XCI+XG4gICAgICAgICAgPHNwYW4gY2xhc3NOYW1lPVwid2hvYW1pXCI+e3RoaXMuc3RhdGUud2hvYW1pfTwvc3Bhbj5cbiAgICAgICAgICA8Zm9ybSBvblN1Ym1pdD17dGhpcy5SRUFEfT5cbiAgICAgICAgICAgIDxpbnB1dCBvbkJsdXI9e2ZvY3VzT25JbnB1dH0gaWQ9XCJyZXBsLXRleHQtaW5wdXRcIj48L2lucHV0PlxuICAgICAgICAgIDwvZm9ybT5cbiAgICAgICAgPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG5cbn0pO1xuXG5cbi8qKioqKioqKioqKioqKiovXG4vKiBWUk9PTSBWUk9PTSAqL1xuLyoqKioqKioqKioqKioqKi9cblxuUmVhY3RET00ucmVuZGVyKFxuICA8UkVQTCAvPixcbiAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcGwnKVxuKTtcbiIsInZhciBSRVBMY29tbWFuZHMgPSB7XG4gIFwiaGVscFwiOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGJyIC8+XG4gICAgICAgIDxwPjxzdHJvbmc+V2VsY29tZSB0byBSRVBMb2dpbi48L3N0cm9uZz48L3A+XG4gICAgICAgIDxwPkhlcmUgYXJlIHNvbWUgY29tbWFuZHMgeW91IGNhbiB0cnk6PC9wPlxuICAgICAgICA8cD48ZW0+bHM8L2VtPiAgICAgTGlzdCBkaXJlY3RvcnkgY29udGVudHM8L3A+XG4gICAgICAgIDxwPjxlbT5jZDwvZW0+ICAgICBDaGFuZ2UgdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuPC9wPlxuICAgICAgICA8cD48ZW0+cHdkPC9lbT4gICAgUHJpbnQgbmFtZSBvZiBjdXJyZW50L3dvcmtpbmcgZGlyZWN0b3J5LjwvcD5cbiAgICAgICAgPHA+PGVtPmNhdDwvZW0+ICAgIFNob3cgdGhlIGNvbnRlbnRzIG9mIGEgZmlsZS48L3A+XG4gICAgICAgIDxwPjxlbT5zdWRvPC9lbT4gICBFeGVjdXRlIGEgY29tbWFuZCBhcyBhbm90aGVyIHVzZXIuPC9wPlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuICBcImNkXCI6IGZ1bmN0aW9uKGRlc3RpbmF0aW9uKSB7XG4gICAgaWYgKGRlc3RpbmF0aW9uID09PSAnLicpIHtcbiAgICAgIHJldHVybiAoPGRpdj5UaGVyZSBhbmQgYmFjayBhZ2Fpbi48L2Rpdj4pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gKDxkaXY+Tm9uZSBzaGFsbCBwYXNzITwvZGl2Pik7XG4gICAgfVxuICB9LFxuICBcImxzXCI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2PmRyd3gtLS0tLS0gIDcgdGFsICB0YWwgICA0MDk2IFNlcCA3ICAxNzowOCAuPC9kaXY+XG4gICAgICAgIDxkaXY+ZHJ3eHIteHIteCAgMyByb290IHJvb3QgIDQwOTYgU2VwIDggIDEyOjI5IC4uPC9kaXY+XG4gICAgICAgIDxkaXY+LXJ3LS0tLS0tLSAgMSByb290IHJvb3QgICAzMDQgU2VwIDggIDEzOjIyIDxlbT5wYXNzd29yZHM8L2VtPjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuICBcImxsXCI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBSRVBMY29tbWFuZHNbXCJsc1wiXSgpO1xuICB9LFxuICBcInB3ZFwiOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj4vVXNlcnMvdGFsPC9kaXY+XG4gICAgKVxuICB9LFxuICBcIi4vcGFzc3dvcmRzXCI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBSRVBMY29tbWFuZHNbXCJwYXNzd29yZHNcIl0oKTtcbiAgfSxcbiAgXCJwYXNzd29yZHNcIjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxkaXY+Y29tbWFuZCBub3QgZm91bmQ6IHBhc3N3b3JkczwvZGl2PlxuICAgICAgICA8ZGl2PlRyeSB1c2luZyA8c3Ryb25nPmNhdDwvc3Ryb25nPiB0byB2aWV3IHRoZSBjb250ZW50cyBvZiB0aGlzIGZpbGUuPC9kaXY+XG4gICAgICA8L2Rpdj5cbiAgICApXG4gIH0sXG4gIFwiY2F0XCI6IGZ1bmN0aW9uKGZpbGVuYW1lLCBwZXJtaXNzaW9uKSB7XG4gICAgaWYgKCFmaWxlbmFtZSkge1xuICAgICAgcmV0dXJuICg8ZGl2PmNhdDogUmVxdWlyZXMgYSBmaWxlbmFtZSBhcyBpdHMgZmlyc3QgYXJndW1lbnQ8L2Rpdj4pO1xuICAgIH1cbiAgICBpZiAoZmlsZW5hbWUgIT09ICdwYXNzd29yZHMnKSB7XG4gICAgICByZXR1cm4gKDxkaXY+Y2F0OiB7ZmlsZW5hbWV9OiBObyBzdWNoIGZpbGUgb3IgZGlyZWN0b3J5PC9kaXY+KTtcbiAgICB9XG4gICAgaWYgKHBlcm1pc3Npb24pIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGltZyBzcmM9XCJodHRwczovL2Nkbi5tZW1lLmFtL2luc3RhbmNlcy81MzM3NjA2MC5qcGdcIiAvPlxuICAgICAgICAgIDxkaXY+PGEgaHJlZj1cIi9yZXF1aXJlbWVudHMuaHRtbFwiPkhvdyBkaWQgd2UgZG8/PC9hPjwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAoXG4gICAgICAgIDxkaXY+XG4gICAgICAgICAgPGRpdj5jYXQ6IHtmaWxlbmFtZX06IFBlcm1pc3Npb24gZGVuaWVkPC9kaXY+XG4gICAgICAgICAgPGRpdj5IYXZlIHlvdSB0cmllZCA8c3Ryb25nPnN1ZG8gY2F0IHtmaWxlbmFtZX08L3N0cm9uZz4/PC9kaXY+XG4gICAgICAgIDwvZGl2PlxuICAgICAgKTtcbiAgICB9XG4gIH0sXG4gIFwic3Vkb1wiOiBmdW5jdGlvbihjb21tYW5kLCAuLi5hcmdzKSB7XG4gICAgbGV0IG5ld1N0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICBuZXdTdGF0ZS53aG9hbWkgPSAnW3N1ZG9dIHBhc3N3b3JkIGZvciB0YWw6JztcbiAgICAvLyBzYXZlIHRoZSBjb21tYW5kIHdlIGFyZSB0cnlpbmcgdG8gc3VkbyBmb3IgbGF0ZXJcbiAgICBuZXdTdGF0ZS5zdWRvID0ge2NvbW1hbmQ6IGNvbW1hbmQsIGFyZ3M6IGFyZ3N9O1xuICAgIHRoaXMuc2V0U3RhdGUobmV3U3RhdGUpO1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICBZb3UgbmVlZCB0byBiZSBcImxvZ2dlZCBpblwiIGFzIHJvb3QuXG4gICAgICA8L2Rpdj5cbiAgICApO1xuICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJFUExjb21tYW5kcztcbiJdfQ==

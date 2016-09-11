(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.REPLogin = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

var REPLcommands = require('./repl.commands.react.js');

/*************************/
/* REPL's Little Helpers */
/*************************/

// Places cursor on the text input.
var focusOnInput = function focusOnInput() {
  document.getElementById('repl-text-input').focus();
};

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvYXBwLnJlYWN0LmpzIiwic3JjL3JlcGwuY29tbWFuZHMucmVhY3QuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7Ozs7O0FDQUEsSUFBSSxlQUFlLFFBQVEsMEJBQVIsQ0FBbkI7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0EsSUFBSSxlQUFlLFNBQWYsWUFBZSxHQUFNO0FBQ3ZCLFdBQVMsY0FBVCxDQUF3QixpQkFBeEIsRUFBMkMsS0FBM0M7QUFDRCxDQUZEOztBQUtBO0FBQ0E7QUFDQTs7QUFFQSxJQUFJLE9BQU8sTUFBTSxXQUFOLENBQWtCO0FBQUE7OztBQUUzQixtQkFBaUIsMkJBQVc7QUFDMUIsV0FBTztBQUNMLG9CQUFjLENBQ1osRUFBQyxLQUFLLENBQU4sRUFBUyxNQUFNLHFCQUFmLEVBRFksRUFFWixFQUFDLEtBQUssQ0FBTixFQUFTLE1BQU0sb0VBQWYsRUFGWSxFQUdaLEVBQUMsS0FBSyxDQUFOLEVBQVMsTUFBTSxrQ0FBZixFQUhZLEVBSVosRUFBQyxLQUFLLENBQU4sRUFBUyxNQUFNLG1EQUFmLEVBSlksQ0FEVDtBQU9MLGNBQVE7QUFQSCxLQUFQO0FBU0QsR0FaMEI7O0FBYzNCO0FBQ0EsUUFBTSxjQUFTLEtBQVQsRUFBZ0I7QUFDcEIsVUFBTSxjQUFOO0FBQ0EsUUFBSSxRQUFRLFNBQVMsY0FBVCxDQUF3QixpQkFBeEIsRUFBMkMsS0FBM0MsQ0FBaUQsV0FBakQsRUFBWjtBQUNBLFNBQUssUUFBTCxDQUFjLEtBQWQ7QUFDRCxHQW5CMEI7O0FBcUIzQjtBQUNBLFlBQVUsa0JBQVMsS0FBVCxFQUFnQjtBQUN4QjtBQUNBLFFBQUksS0FBSyxLQUFMLENBQVcsSUFBZixFQUFxQjtBQUNuQixVQUFJLFVBQVUsT0FBZCxFQUF1QjtBQUNyQixZQUFJLHFCQUFxQixJQUF6QjtBQUNBLGFBQUssVUFBTCxDQUFnQixLQUFLLEtBQUwsQ0FBVyxJQUFYLENB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QjtBQWtEakIsU0FBTyxhQUFTLFFBQVQsRUFBbUIsVUFBbkIsRUFBK0I7QUFDcEMsUUFBSSxDQUFDLFFBQUwsRUFBZTtBQUNiLGFBQVE7QUFBQTtBQUFBO0FBQUE7QUFBQSxPQUFSO0FBQ0Q7QUFDRCxRQUFJLGFBQWEsV0FBakIsRUFBOEI7QUFDNUIsYUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFXLGdCQUFYO0FBQUE7QUFBQSxPQUFSO0FBQ0Q7QUFDRCxRQUFJLFVBQUosRUFBZ0I7QUFDZCxhQUNFO0FBQUE7QUFBQTtBQUNFLHFDQUFLLEtBQUksNENBQVQsR0FERjtBQUVFO0FBQUE7QUFBQTtBQUFLO0FBQUE7QUFBQSxjQUFHLE1BQUssb0JBQVI7QUFBQTtBQUFBO0FBQUw7QUFGRixPQURGO0FBTUQsS0FQRCxNQU9PO0FBQ0wsYUFDRTtBQUFBO0FBQUE7QUFDRTtBQUFBO0FBQUE7QUFBQTtBQUFXLGtCQUFYO0FBQUE7QUFBQSxTQURGO0FBRUU7QUFBQTtBQUFBO0FBQUE7QUFBb0I7QUFBQTtBQUFBO0FBQUE7QUFBa0I7QUFBbEIsV0FBcEI7QUFBQTtBQUFBO0FBRkYsT0FERjtBQU1EO0FBQ0YsR0F4RWdCO0FBeUVqQixVQUFRLGNBQVMsT0FBVCxFQUEyQjtBQUFBLHNDQUFOLElBQU07QUFBTixVQUFNO0FBQUE7O0FBQ2pDLFFBQUksV0FBVyxLQUFLLEtBQXBCO0FBQ0EsYUFBUyxNQUFULEdBQWtCLDBCQUFsQjtBQUNBO0FBQ0EsYUFBUyxJQUFULEdBQWdCLEVBQUMsU0FBUyxPQUFWLEVBQW1CLE1BQU0sSUFBekIsRUFBaEI7QUFDQSxTQUFLLFFBQUwsQ0FBYyxRQUFkO0FBQ0EsV0FDRTtBQUFBO0FBQUE7QUFBQTtBQUFBLEtBREY7QUFLRDtBQXBGZ0IsQ0FBbkI7O0FBdUZBLE9BQU8sT0FBUCxHQUFpQixZQUFqQiIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUkVQTGNvbW1hbmRzID0gcmVxdWlyZSgnLi9yZXBsLmNvbW1hbmRzLnJlYWN0LmpzJyk7XG5cbi8qKioqKioqKioqKioqKioqKioqKioqKioqL1xuLyogUkVQTCdzIExpdHRsZSBIZWxwZXJzICovXG4vKioqKioqKioqKioqKioqKioqKioqKioqKi9cblxuLy8gUGxhY2VzIGN1cnNvciBvbiB0aGUgdGV4dCBpbnB1dC5cbnZhciBmb2N1c09uSW5wdXQgPSAoKSA9PiB7XG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXBsLXRleHQtaW5wdXQnKS5mb2N1cygpO1xufTtcblxuXG4vKioqKioqKioqKioqKioqKioqKiovXG4vKiBSZWFjdCBjb21wb25lbnRzICovXG4vKioqKioqKioqKioqKioqKioqKiovXG5cbnZhciBSRVBMID0gUmVhY3QuY3JlYXRlQ2xhc3Moe1xuXG4gIGdldEluaXRpYWxTdGF0ZTogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIG91dHB1dEJ1ZmZlcjogW1xuICAgICAgICB7a2V5OiAwLCB0ZXh0OiAnV2VsY29tZSB0byBSRVBMb2dpbid9LFxuICAgICAgICB7a2V5OiAxLCB0ZXh0OiAnTGFzdCBsb2dpbjogVGh1IFNlcCA4IDA2OjA1OjE1IDIwMTYgZnJvbSA0Ni4xMjAuNS4yMDUgKG5vdCByZWFsbHkpJ30sXG4gICAgICAgIHtrZXk6IDIsIHRleHQ6ICctYmFzaDogd2FybmluZzogVGhpcyBpcyBub3QgYmFzaCd9LFxuICAgICAgICB7a2V5OiAzLCB0ZXh0OiAnRm9yIGEgbGlzdCBvZiBhdmFpbGFibGUgY29tbWFuZHMsIHRyeSB0eXBpbmcgaGVscCd9XG4gICAgICBdLFxuICAgICAgd2hvYW1pOiAnW3RhbEBhdGVyIH5dICQnXG4gICAgfTtcbiAgfSxcblxuICAvLyBSZWFkcyBhIGNvbW1hbmQgdGhhdCB3YXMganVzdCBzdWJtaXR0ZWQgYW5kIHBhc3NlcyBpdCB0byBFVkFMVUFURVxuICBSRUFEOiBmdW5jdGlvbihldmVudCkge1xuICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlcGwtdGV4dC1pbnB1dCcpLnZhbHVlLnRvTG93ZXJDYXNlKCk7XG4gICAgdGhpcy5FVkFMVUFURShpbnB1dCk7XG4gIH0sXG5cbiAgLy8gRXZhbHVhdGUgYSBjb21tYW5kIGFuZCBwYXNzZXMgaXQgYW5kIGl0cyByZXN1bHQgdG8gUFJJTlQsIHRoZW4gbG9vcHNcbiAgRVZBTFVBVEU6IGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgLy8gQXJlIHdlIGRvaW5nIGEgcGFzc3dvcmQgY2hlY2sgcmlnaHQgbm93P1xuICAgIGlmICh0aGlzLnN0YXRlLnN1ZG8pIHtcbiAgICAgIGlmIChpbnB1dCA9PT0gJzEyMzQ1Jykge1xuICAgICAgICBsZXQgUEVSTUlTU0lPTl9HUkFOVEVEID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5ydW5Db21tYW5kKHRoaXMuc3RhdGUuc3Vkby5jb21tYW5kLCB0aGlzLnN0YXRlLnN1ZG8uYXJncy5jb25jYXQoUEVSTUlTU0lPTl9HUkFOVEVEKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLlBSSU5UKCdzdWRvOiBpbmNvcnJlY3QgcGFzc3dvcmQnKTtcbiAgICAgIH1cbiAgICAgIGxldCBuZXdTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgICBuZXdTdGF0ZS5zdWRvID0gdW5kZWZpbmVkO1xuICAgICAgbmV3U3RhdGUud2hvYW1pID0gJ1t0YWxAYXRlciB+XSAkJztcbiAgICAgIHRoaXMuc2V0U3RhdGUobmV3U3RhdGUpO1xuICAgICAgdGhpcy5MT09QKCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgLy8gT3V0cHV0IHRoZSBpbnB1dCBhcyBvbmUgZG9lcyBmcm9tIHRpbWUgdG8gdGltZVxuICAgIHRoaXMuUFJJTlQoXG4gICAgICB0aGlzLnN0YXRlLndob2FtaSsnICcgKyBpbnB1dFxuICAgICk7XG5cbiAgICBsZXQgY29tbWFuZCwgYXJncztcbiAgICAvLyBEZXN0cnVjdHVyaW5nIGFuZCByZXN0IGZvciB0aGUgd2luIVxuICAgIFtjb21tYW5kLCAuLi5hcmdzXSA9IGlucHV0LnNwbGl0KCcgJyk7XG4gICAgLy8gQ2hlY2sgaWYgY29tbWFuZCBleGlzdHNcbiAgICB0aGlzLnJ1bkNvbW1hbmQoY29tbWFuZCwgYXJncyk7XG4gICAgdGhpcy5MT09QKCk7XG4gIH0sXG5cbiAgLy8gUHJpbnRzIG91dHB1dCBmcm9tIGEgY29tbWFuZFxuICBQUklOVDogZnVuY3Rpb24ob3V0cHV0KSB7XG4gICAgbGV0IG5ld1N0YXRlID0gdGhpcy5zdGF0ZTtcbiAgICBuZXdTdGF0ZS5vdXRwdXRCdWZmZXIucHVzaCh7a2V5OiBuZXdTdGF0ZS5vdXRwdXRCdWZmZXIubGVuZ3RoKzEsIHRleHQ6IG91dHB1dH0pO1xuICAgIHRoaXMuc2V0U3RhdGUobmV3U3RhdGUpO1xuICB9LFxuXG4gIC8vIENsZWFycyBhbmQgZm9jdXNlcyBpbnB1dCBhZ2FpblxuICBMT09QOiBmdW5jdGlvbigpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVwbC10ZXh0LWlucHV0JykudmFsdWU9Jyc7XG4gICAgZm9jdXNPbklucHV0KCk7XG4gIH0sXG5cbiAgLy8gTWFrZSBzdXJlIGEgY29tbWFuZCBleGlzdHMsIHRoZW4gcnVuIGl0IHdpdGggaXRzIGFyZ3VtZW50c1xuICBydW5Db21tYW5kOiBmdW5jdGlvbihjb21tYW5kLCBhcmdzKSB7XG4gICAgaWYgKFJFUExjb21tYW5kc1tjb21tYW5kXSkge1xuICAgICAgdGhpcy5QUklOVChcbiAgICAgICAgUkVQTGNvbW1hbmRzW2NvbW1hbmRdLmFwcGx5KHRoaXMsIGFyZ3MpXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLlBSSU5UKCdjb21tYW5kIG5vdCBmb3VuZDogJytjb21tYW5kKTtcbiAgICB9XG4gIH0sXG5cbiAgY29tcG9uZW50RGlkTW91bnQ6IGZvY3VzT25JbnB1dCxcblxuICByZW5kZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBvdXRwdXRMaW5lcyA9IHRoaXMuc3RhdGUub3V0cHV0QnVmZmVyLm1hcChcbiAgICAgIChsaW5lKSA9PiAoIDxkaXYga2V5PXtsaW5lLmtleX0+e2xpbmUudGV4dH08L2Rpdj4gKVxuICAgICk7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVwbC1jb250YWluZXJcIj5cbiAgICAgICAgPGRpdiBjbGFzc05hbWU9XCJyZXBsLW91dHB1dFwiPlxuICAgICAgICAgIHtvdXRwdXRMaW5lc31cbiAgICAgICAgPC9kaXY+XG4gICAgICAgIDxkaXYgY2xhc3NOYW1lPVwicmVwbC1pbnB1dFwiPlxuICAgICAgICAgIDxzcGFuIGNsYXNzTmFtZT1cIndob2FtaVwiPnt0aGlzLnN0YXRlLndob2FtaX08L3NwYW4+XG4gICAgICAgICAgPGZvcm0gb25TdWJtaXQ9e3RoaXMuUkVBRH0+XG4gICAgICAgICAgICA8aW5wdXQgb25CbHVyPXtmb2N1c09uSW5wdXR9IGlkPVwicmVwbC10ZXh0LWlucHV0XCI+PC9pbnB1dD5cbiAgICAgICAgICA8L2Zvcm0+XG4gICAgICAgIDwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxuXG59KTtcblxuXG4vKioqKioqKioqKioqKioqL1xuLyogVlJPT00gVlJPT00gKi9cbi8qKioqKioqKioqKioqKiovXG5cblJlYWN0RE9NLnJlbmRlcihcbiAgPFJFUEwgLz4sXG4gIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXBsJylcbik7XG4iLCJ2YXIgUkVQTGNvbW1hbmRzID0ge1xuICBcImhlbHBcIjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+XG4gICAgICAgIDxiciAvPlxuICAgICAgICA8cD48c3Ryb25nPldlbGNvbWUgdG8gUkVQTG9naW4uPC9zdHJvbmc+PC9wPlxuICAgICAgICA8cD5IZXJlIGFyZSBzb21lIGNvbW1hbmRzIHlvdSBjYW4gdHJ5OjwvcD5cbiAgICAgICAgPHA+PGVtPmxzPC9lbT4gICAgIExpc3QgZGlyZWN0b3J5IGNvbnRlbnRzPC9wPlxuICAgICAgICA8cD48ZW0+Y2Q8L2VtPiAgICAgQ2hhbmdlIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5LjwvcD5cbiAgICAgICAgPHA+PGVtPnB3ZDwvZW0+ICAgIFByaW50IG5hbWUgb2YgY3VycmVudC93b3JraW5nIGRpcmVjdG9yeS48L3A+XG4gICAgICAgIDxwPjxlbT5jYXQ8L2VtPiAgICBTaG93IHRoZSBjb250ZW50cyBvZiBhIGZpbGUuPC9wPlxuICAgICAgICA8cD48ZW0+c3VkbzwvZW0+ICAgRXhlY3V0ZSBhIGNvbW1hbmQgYXMgYW5vdGhlciB1c2VyLjwvcD5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfSxcbiAgXCJjZFwiOiBmdW5jdGlvbihkZXN0aW5hdGlvbikge1xuICAgIGlmIChkZXN0aW5hdGlvbiA9PT0gJy4nKSB7XG4gICAgICByZXR1cm4gKDxkaXY+VGhlcmUgYW5kIGJhY2sgYWdhaW4uPC9kaXY+KTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuICg8ZGl2Pk5vbmUgc2hhbGwgcGFzcyE8L2Rpdj4pO1xuICAgIH1cbiAgfSxcbiAgXCJsc1wiOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgPGRpdj5kcnd4LS0tLS0tICA3IHRhbCAgdGFsICAgNDA5NiBTZXAgNyAgMTc6MDggLjwvZGl2PlxuICAgICAgICA8ZGl2PmRyd3hyLXhyLXggIDMgcm9vdCByb290ICA0MDk2IFNlcCA4ICAxMjoyOSAuLjwvZGl2PlxuICAgICAgICA8ZGl2Pi1ydy0tLS0tLS0gIDEgcm9vdCByb290ICAgMzA0IFNlcCA4ICAxMzoyMiA8ZW0+cGFzc3dvcmRzPC9lbT48L2Rpdj5cbiAgICAgIDwvZGl2PlxuICAgIClcbiAgfSxcbiAgXCJsbFwiOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUkVQTGNvbW1hbmRzW1wibHNcIl0oKTtcbiAgfSxcbiAgXCJwd2RcIjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIChcbiAgICAgIDxkaXY+L1VzZXJzL3RhbDwvZGl2PlxuICAgIClcbiAgfSxcbiAgXCIuL3Bhc3N3b3Jkc1wiOiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gUkVQTGNvbW1hbmRzW1wicGFzc3dvcmRzXCJdKCk7XG4gIH0sXG4gIFwicGFzc3dvcmRzXCI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiAoXG4gICAgICA8ZGl2PlxuICAgICAgICA8ZGl2PmNvbW1hbmQgbm90IGZvdW5kOiBwYXNzd29yZHM8L2Rpdj5cbiAgICAgICAgPGRpdj5UcnkgdXNpbmcgPHN0cm9uZz5jYXQ8L3N0cm9uZz4gdG8gdmlldyB0aGUgY29udGVudHMgb2YgdGhpcyBmaWxlLjwvZGl2PlxuICAgICAgPC9kaXY+XG4gICAgKVxuICB9LFxuICBcImNhdFwiOiBmdW5jdGlvbihmaWxlbmFtZSwgcGVybWlzc2lvbikge1xuICAgIGlmICghZmlsZW5hbWUpIHtcbiAgICAgIHJldHVybiAoPGRpdj5jYXQ6IFJlcXVpcmVzIGEgZmlsZW5hbWUgYXMgaXRzIGZpcnN0IGFyZ3VtZW50PC9kaXY+KTtcbiAgICB9XG4gICAgaWYgKGZpbGVuYW1lICE9PSAncGFzc3dvcmRzJykge1xuICAgICAgcmV0dXJuICg8ZGl2PmNhdDoge2ZpbGVuYW1lfTogTm8gc3VjaCBmaWxlIG9yIGRpcmVjdG9yeTwvZGl2Pik7XG4gICAgfVxuICAgIGlmIChwZXJtaXNzaW9uKSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxpbWcgc3JjPVwiaHR0cHM6Ly9jZG4ubWVtZS5hbS9pbnN0YW5jZXMvNTMzNzYwNjAuanBnXCIgLz5cbiAgICAgICAgICA8ZGl2PjxhIGhyZWY9XCIvcmVxdWlyZW1lbnRzLmh0bWxcIj5Ib3cgZGlkIHdlIGRvPzwvYT48L2Rpdj5cbiAgICAgICAgPC9kaXY+XG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gKFxuICAgICAgICA8ZGl2PlxuICAgICAgICAgIDxkaXY+Y2F0OiB7ZmlsZW5hbWV9OiBQZXJtaXNzaW9uIGRlbmllZDwvZGl2PlxuICAgICAgICAgIDxkaXY+SGF2ZSB5b3UgdHJpZWQgPHN0cm9uZz5zdWRvIGNhdCB7ZmlsZW5hbWV9PC9zdHJvbmc+PzwvZGl2PlxuICAgICAgICA8L2Rpdj5cbiAgICAgICk7XG4gICAgfVxuICB9LFxuICBcInN1ZG9cIjogZnVuY3Rpb24oY29tbWFuZCwgLi4uYXJncykge1xuICAgIGxldCBuZXdTdGF0ZSA9IHRoaXMuc3RhdGU7XG4gICAgbmV3U3RhdGUud2hvYW1pID0gJ1tzdWRvXSBwYXNzd29yZCBmb3IgdGFsOic7XG4gICAgLy8gc2F2ZSB0aGUgY29tbWFuZCB3ZSBhcmUgdHJ5aW5nIHRvIHN1ZG8gZm9yIGxhdGVyXG4gICAgbmV3U3RhdGUuc3VkbyA9IHtjb21tYW5kOiBjb21tYW5kLCBhcmdzOiBhcmdzfTtcbiAgICB0aGlzLnNldFN0YXRlKG5ld1N0YXRlKTtcbiAgICByZXR1cm4gKFxuICAgICAgPGRpdj5cbiAgICAgICAgWW91IG5lZWQgdG8gYmUgXCJsb2dnZWQgaW5cIiBhcyByb290LlxuICAgICAgPC9kaXY+XG4gICAgKTtcbiAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSBSRVBMY29tbWFuZHM7XG4iXX0=

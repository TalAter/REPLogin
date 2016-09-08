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
  // Reads a command that was just submitted and passes it to EVALUATE
  READ: function(event) {
    event.preventDefault();
    var input = document.getElementById('repl-text-input').value;
    this.EVALUATE(input);
  },
  // Evaluate a command and passes it and its result to PRINT, then loops
  EVALUATE: function(input) {
    this.PRINT(this.state.whoami+' $ ' + input);
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
        {key: 2, text: '-bash: warning: This is not bash'}
      ],
      whoami: '[tal@ater ~]'
    };
  },
  componentDidMount: focusOnInput,
  render: function() {
    var outputLines = this.state.outputBuffer.map(
      (line) => ( <p key={line.key}>{line.text}</p> )
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

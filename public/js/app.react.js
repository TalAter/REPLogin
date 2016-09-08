var focusOnInput = () => {
  document.getElementById('repl-text-input').focus();
};

var REPLoutput = React.createClass({
  getInitialState: function() {
    return {
      outputBuffer: [
        {key: 0, text: 'Line 1'},
        {key: 1, text: 'Line 2'}
      ]
    };
  },
  render: function() {
    return (
      <div className="repl-output">
        {this.state.outputBuffer.map(
          function(line) {
            return ( <p key={line.key}>{line.text}</p> );
          }
        )}
      </div>
    )
  }
});

var REPLinput = React.createClass({
  render: () => {
    return (
      <div className="repl-input">
        <span className="whoami">[tal@ater ~] $</span>
        <input onBlur={focusOnInput} id="repl-text-input"></input>
      </div>
    )
  }
});

var REPL = React.createClass({
  componentDidMount: focusOnInput,
  render: () => {
    return (
      <div className="repl-container">
        <REPLoutput />
        <REPLinput />
      </div>
    );
  }
});

ReactDOM.render(
  <REPL />,
  document.getElementById('repl')
);

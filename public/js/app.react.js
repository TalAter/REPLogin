var focusOnInput = () => {
  document.getElementById('repl-text-input').focus();
};

var REPLoutput = React.createClass({
  getInitialState: function() {
    return {
      outputBuffer: [
        {key: 0, text: 'Welcome to REPLogin'},
        {key: 1, text: 'Last login: Thu Sep 8 06:05:15 2016 from 46.120.5.205 (not really)'},
        {key: 2, text: '-bash: warning: This is not bash'}
      ]
    };
  },
  render: function() {
    var outputLines = this.state.outputBuffer.map(
      (line) => ( <p key={line.key}>{line.text}</p> )
    );
    return (
      <div className="repl-output">
        {outputLines}
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

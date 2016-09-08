var focusOnInput = () => {
  document.getElementById('repl-text-input').focus();
};

var REPLoutput = React.createClass({
  render: () => {
    return (
      <div className="repl-output">
        NAME
        ls - list directory contents
        SYNOPSIS
        ls [OPTION]... [FILE]...
        DESCRIPTION
        List  information  about the FILEs (the current directory by default).  Sort entries alpha-
        betically if none of -cftuvSUX nor --sort is specified.
        Mandatory arguments to long options are mandatory for short options too.
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

var REPL = React.createClass({
  render: function() {
    return (
      <div className="repl-container">
        Hello, world!
      </div>
    );
  }
});
ReactDOM.render(
  <REPL />,
  document.getElementById('repl')
);

var REPLActions =  require('./actions/REPLActions.js');

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
        <div>drwxr-xr-x  3 root root  4096 Sep 8  12:29 ..</div>
        <div>-rw-------  1 root root   304 Sep 8  13:22 <em>passwords</em></div>
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
        <div>
          <img src="https://cdn.meme.am/instances/53376060.jpg" />
          <div><a href="/requirements.html">How did we do?</a></div>
        </div>
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
    REPLActions.setSudo(command, args);
    return (
      <div>
        You need to be "logged in" as root.
      </div>
    );
  }
};

module.exports = REPLcommands;

var AppDispatcher = require('../dispatcher/AppDispatcher');
var EventEmitter = require('events').EventEmitter;
var assign = require('object-assign');

const CHANGE_EVENT = 'change';

var _outputBuffer = [
  {key: 0, text: 'Welcome to REPLogin'},
  {key: 1, text: 'Last login: Thu Sep 8 06:05:15 2016 from 46.120.5.205 (not really)'},
  {key: 2, text: '-bash: warning: This is not bash'},
  {key: 3, text: 'For a list of available commands, try typing help'}
];

var OutputBufferStore = assign({}, EventEmitter.prototype, {
  getAll: function() {
    return _outputBuffer;
  },
  emitChange: function() {
    this.emit(CHANGE_EVENT);
  },
  addChangeListener: function(callback) {
    this.on(CHANGE_EVENT, callback);
  },
  removeChangeListener: function(callback) {
    this.removeListener(CHANGE_EVENT, callback);
  }
});

AppDispatcher.register(function(action) {
  switch(action.actionType) {
    case 'add-to-output-buffer':
      _outputBuffer.push({key: _outputBuffer.length+1, text: action.output});
      OutputBufferStore.emitChange();
      break;
  }
});

module.exports = OutputBufferStore;

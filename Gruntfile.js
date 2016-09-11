module.exports = function(grunt) {
  "use strict";

  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: [
        'public/*.js',
        'public/js/*.js',
        'server/*.js',
        'Gruntfile.js',
        'package.json'
      ],
      options: {
        jshintrc: true
      }
    },
    watch: {
      files: ['public/**/*', 'server/**/*', '!**/node_modules/**'],
      tasks: ['default', 'express'],
      options: {
        spawn: false
      }
    },
    express: {
      web: {
        options: {
          script: 'server/index.js',
          port: 8443
        }
      }
    }
  });

  // Register task(s).
  grunt.registerTask('default', ['jshint']);
  grunt.registerTask('serve', ['default', 'express', 'watch']);
};

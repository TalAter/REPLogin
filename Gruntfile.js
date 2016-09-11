module.exports = function(grunt) {
  "use strict";

  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: [
        'src/*.js',
        'src/**/*.js',
        'server/*.js',
        'Gruntfile.js',
        'package.json'
      ],
      options: {
        jshintrc: true
      }
    },
    browserify: {
      standalone: {
        src: ['src/app.react.js'],
        dest: 'public/js/app.js'
      },
      options: {
        transform: [
          [ "babelify", {presets: ["es2015", "react"]} ]
        ],
        browserifyOptions: {
          standalone: 'REPLogin',
          debug: true
        }
      }
    },
    watch: {
      files: ['src/*.js', 'src/**/*.js', 'public/**/*', 'server/**/*', '!**/node_modules/**'],
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
  grunt.registerTask('default', ['jshint', 'browserify']);
  grunt.registerTask('serve', ['default', 'express', 'watch']);
};

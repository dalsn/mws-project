# Restaurant Review Mobile Web App
---

## Project Overview

The **Restaurant Reviews** app is a mobile-ready web application. It is responsive and thus can be viewed on different sized displays. It was designed with accessibility in mind and accessible for screen reader use. It's offline capability means when offline, you can view pages previously visited while online.

### How do I run it?

1. Clone the repository.
2. Run `npm install`
3. Run `gulp dist`

4. In the dist folder of the repository, start up a simple HTTP server to serve up the site files on your local computer. Python has a simple tool to do this, and you don't even need to know Python. For most people, it's already installed on your computer.

In a terminal, check the version of Python you have: `python -V`. If you have Python 2.x, spin up the server with `python -m SimpleHTTPServer 8000`. For Python 3.x, you can use `python3 -m http.server 8000`. If you don't have Python installed, navigate to Python's [website](https://www.python.org/) to download and install the software.

If you however have PHP (LAMP/WAMP/XAMPP) installed instead, spin up the server with `php -S localhost:8000`.

5. With your server running, visit the site: `http://localhost:8000`. Viola!

Live site: https://dalsn.github.io/mws
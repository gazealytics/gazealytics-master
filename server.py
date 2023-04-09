print('begin')

import math
import multiprocessing
import os, sys
import http.server
import socketserver
import io
import random
import ujson as json  # moved away from a true json representation, so probably don't need this one
import ast
import py

#try:
import bundle
#except Exception as e:
#    print(e)
#    import bundle2 as bundle
import time
# attaching this files path and importing the main module
sys.path.append(os.getcwd())
DIRECTORY = str(os.path.realpath(__file__).split('server')[0])

def page(): return open(DIRECTORY + 'page.html', 'rb').read()

# The Handler for the HTTP requests. This object handles all requests
class Handler(http.server.SimpleHTTPRequestHandler):
    def _set_headers(self, code=200):
        self.send_response(code)
        self.send_header('Content-type', 'text/html')
        self.end_headers()

    # GET requests: returns either the webpage of the favicon
    def do_GET(self):
        print('GET', self.path)
        if self.path == '/':
            self.path = '/index.html'
        elif self.path == '/killthisserver':
            os._exit(4)
        elif self.path == '/favicon.ico':
            self.send_response(200)
            self.send_header('Content-type', 'image/png')
            self.end_headers()
            self.wfile.write(open(DIRECTORY + 'favicon.png', 'rb').read())
            return
        if '.' in self.path and self.path.split('.')[-1] in ['js', 'css', 'html', 'png', 'ttf']:
            self.send_response(200)
            c = {'js': 'text/javascript', 'css': 'text/css', 'html': 'text/html', 'png':'image/png', 'ttf':'text/ttf'}[self.path.split('.')[-1]]
            self.send_header('Content-type', c)
            self.end_headers()
            self.wfile.write(open(DIRECTORY + self.path[1:], 'rb').read())
            return
        self._set_headers()
        # write out the edited webpage file
        self.wfile.write(bytes("nothing found :(", "utf8"))
        return

    # Handles all POST requests: client instructions, data
    def do_POST(self):
        try:  # big safety try-except for the whole thing!
            target = self.path
            data_length = int([x for x in str(self.headers).split('\n') if x[:14] == 'Content-Length'] \
                              [-1].split(': ')[-1])
            print('POST', target, data_length)
            if target == '/bundle':
                start = time.time();
                # acquire the data structure
                req = bytes.decode(self.rfile.read(data_length), "utf8")
                Q = ast.literal_eval(req)
                OUTPUT = []
                # DO BUNDLING COMPUTATION HERE ON L,X,Y
                for v, direction, K,H, L,X,Y in Q:
                    X, Y = bundle.bundle(L, X, Y, K, H, dir=(direction == 1))
                    OUTPUT.append([v, X, Y])
                # return the result
                self._set_headers(200)
                self.send_header('Content-type', 'text/json')
                res = str(OUTPUT)
                self.wfile.write(bytes(res, "utf8"))
                print('bundle proc. completed', 'nan' in res, v, K, len(L), "time:", time.time() - start)
                return
        except Exception as e:
            print(e)
            pass
        self._set_headers(200)
        self.wfile.write(bytes('failed', "utf8"))
        return


# Begin the server on port 80 (standard), or 17364 (a random, large choice)
port = 8080
print('Server listening on port ' + str(port) + '...')
httpd = http.server.HTTPServer(('', port), Handler)
httpd.serve_forever()  # this function should hopefully never end

# will only run in unusual closing circumstances
print('DONE')
input('exit')
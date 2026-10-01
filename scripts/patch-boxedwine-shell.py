#!/usr/bin/env python3
from pathlib import Path
import re
import sys

if len(sys.argv) != 2:
    raise SystemExit("usage: patch-boxedwine-shell.py <boxedwine-shell.js>")

path = Path(sys.argv[1])
source = path.read_text()
replacement = r'''        function getFileSize(p)
        {
            return new Promise(function(resolve, reject) {
                const url = Config.locateRootBaseUrl + p;

                function rangeProbe() {
                    const req = new XMLHttpRequest();
                    req.open('GET', url);
                    req.setRequestHeader('Range', 'bytes=0-0');
                    req.onreadystatechange = function() {
                        if (req.readyState !== 4) return;
                        if (req.status === 200 || req.status === 206) {
                            const contentRange = req.getResponseHeader('Content-Range') || '';
                            const match = contentRange.match(/\/(\d+)\s*$/);
                            if (match) {
                                resolve(parseInt(match[1], 10));
                                return;
                            }
                            const contentLength = parseInt(req.getResponseHeader('Content-Length') || '-1', 10);
                            if (req.status === 200 && contentLength > 0) {
                                resolve(contentLength);
                                return;
                            }
                        }
                        reject(new Error('Unable to get file size (range status ' + req.status + ')'));
                    };
                    req.onerror = function() {
                        reject(new Error('Network Error while range-probing file size'));
                    };
                    req.send();
                }

                const head = new XMLHttpRequest();
                head.open('HEAD', url);
                head.onreadystatechange = function() {
                    if (head.readyState !== 4) return;
                    const contentLength = parseInt(head.getResponseHeader('Content-Length') || '-1', 10);
                    if ((head.status === 200 || head.status === 206) && contentLength > 0) {
                        resolve(contentLength);
                    } else {
                        rangeProbe();
                    }
                };
                head.onerror = rangeProbe;
                head.send();
            });
        }
        function getCentralOffset(buffer)'''

patched, count = re.subn(
    r'        function getFileSize\(p\s*\).*?        function getCentralOffset\(buffer\)',
    replacement,
    source,
    count=1,
    flags=re.S,
)
if count != 1:
    raise SystemExit("Could not patch BoxedWine getFileSize")

path.write_text(patched)
print(f"Patched remote ZIP size probing in {path}")
